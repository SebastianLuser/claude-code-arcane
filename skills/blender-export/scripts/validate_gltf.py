#!/usr/bin/env python3
"""Validate a .glb / .gltf exported from Blender against the project budget.

Checks what always breaks and goes unseen until the asset is already in the engine:
triangles over budget, missing UVs, missing lightmap UV1, unapplied scales,
textures that are not a power of two, external images inside a .glb,
and surplus materials.

Stdlib only: runs in the user's project without installing anything.

    python validate_gltf.py export/prop.glb --budget-tris 2000 --target unity
    python validate_gltf.py export/hero.glb --budget-tris 40000 --require-uv1 --json
"""

import argparse
import json
import os
import struct
import sys

GLB_MAGIC = 0x46546C67  # 'glTF'
CHUNK_JSON = 0x4E4F534A  # 'JSON'
CHUNK_BIN = 0x004E4942  # 'BIN\0'
MODE_TRIANGLES = 4

# Scales that betray an unapplied unit conversion rather than a
# design decision.
SUSPICIOUS_SCALES = (100.0, 0.01)
SCALE_TOLERANCE = 0.001


class Report:
    def __init__(self):
        self.checks = []

    def add(self, level, check, message):
        self.checks.append({"level": level, "check": check, "message": message})

    def ok(self, check, message):
        self.add("PASS", check, message)

    def warn(self, check, message):
        self.add("WARN", check, message)

    def fail(self, check, message):
        self.add("FAIL", check, message)

    @property
    def verdict(self):
        levels = {c["level"] for c in self.checks}
        if "FAIL" in levels:
            return "FAIL"
        if "WARN" in levels:
            return "CONCERNS"
        return "PASS"


def load_gltf(path):
    """Return (json_dict, bin_chunk_or_None). Accepts .glb and .gltf."""
    with open(path, "rb") as handle:
        head = handle.read(4)
        handle.seek(0)
        if len(head) == 4 and struct.unpack("<I", head)[0] == GLB_MAGIC:
            return _load_glb(handle)
        return json.load(handle), None


def _load_glb(handle):
    magic, version, total = struct.unpack("<III", handle.read(12))
    if magic != GLB_MAGIC:
        raise ValueError("not a GLB: the 'glTF' magic is missing")
    if version != 2:
        raise ValueError("unsupported GLB version: %d (expected 2)" % version)

    doc = None
    binary = None
    while handle.tell() < total:
        header = handle.read(8)
        if len(header) < 8:
            break
        length, kind = struct.unpack("<II", header)
        payload = handle.read(length)
        if kind == CHUNK_JSON:
            doc = json.loads(payload.decode("utf-8"))
        elif kind == CHUNK_BIN:
            binary = payload
    if doc is None:
        raise ValueError("the GLB has no JSON chunk")
    return doc, binary


def image_size(blob):
    """Dimensions of a PNG or JPEG given as bytes, or None if unrecognized."""
    if blob[:8] == b"\x89PNG\r\n\x1a\n" and len(blob) >= 24:
        width, height = struct.unpack(">II", blob[16:24])
        return width, height
    if blob[:2] == b"\xff\xd8":
        offset = 2
        while offset + 9 < len(blob):
            if blob[offset] != 0xFF:
                offset += 1
                continue
            marker = blob[offset + 1]
            # SOF0-3, SOF5-7, SOF9-11, SOF13-15 carry the dimensions.
            if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7,
                          0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                height, width = struct.unpack(">HH", blob[offset + 5:offset + 9])
                return width, height
            if marker in (0xD8, 0xD9) or 0xD0 <= marker <= 0xD7:
                offset += 2
                continue
            segment = struct.unpack(">H", blob[offset + 2:offset + 4])[0]
            offset += 2 + segment
    return None


def is_power_of_two(value):
    return value > 0 and (value & (value - 1)) == 0


def count_triangles(doc):
    """(tris, non_triangle_primitives) summed over every mesh in the document."""
    accessors = doc.get("accessors", [])
    tris = 0
    non_triangles = 0
    for mesh in doc.get("meshes", []):
        for prim in mesh.get("primitives", []):
            if prim.get("mode", MODE_TRIANGLES) != MODE_TRIANGLES:
                non_triangles += 1
                continue
            if "indices" in prim:
                count = accessors[prim["indices"]].get("count", 0)
            else:
                position = prim.get("attributes", {}).get("POSITION")
                count = accessors[position].get("count", 0) if position is not None else 0
            tris += count // 3
    return tris, non_triangles


def node_scale(node):
    """Scale of a node, whether it comes as 'scale' or inside 'matrix'."""
    if "scale" in node:
        return [float(v) for v in node["scale"]]
    matrix = node.get("matrix")
    if not matrix:
        return [1.0, 1.0, 1.0]
    # glTF stores the matrix column-major; the norm of the first 3 columns is the scale.
    return [
        (matrix[i] ** 2 + matrix[i + 1] ** 2 + matrix[i + 2] ** 2) ** 0.5
        for i in (0, 4, 8)
    ]


def check_geometry(doc, report, budget):
    tris, non_triangles = count_triangles(doc)
    if budget is None:
        report.warn("budget", "%d tris, no budget declared (--budget-tris)" % tris)
    elif tris > budget:
        report.fail("budget", "%d tris against a budget of %d (+%d)" % (tris, budget, tris - budget))
    else:
        report.ok("budget", "%d tris within the budget of %d" % (tris, budget))

    if non_triangles:
        report.warn("primitives", "%d non-triangle primitives (lines/points) - the engine may ignore them" % non_triangles)

    if not doc.get("meshes"):
        report.fail("meshes", "the file has no mesh")


def check_uvs(doc, report, require_uv1):
    missing_uv0 = []
    missing_uv1 = []
    for mesh in doc.get("meshes", []):
        name = mesh.get("name", "<unnamed>")
        for prim in mesh.get("primitives", []):
            attrs = prim.get("attributes", {})
            if "TEXCOORD_0" not in attrs:
                missing_uv0.append(name)
            if "TEXCOORD_1" not in attrs:
                missing_uv1.append(name)

    if missing_uv0:
        report.fail("uv0", "no UV0, cannot be textured: %s" % ", ".join(sorted(set(missing_uv0))[:5]))
    else:
        report.ok("uv0", "every primitive has UV0")

    if require_uv1:
        if missing_uv1:
            report.fail("uv1", "no UV1 for the lightmap: %s" % ", ".join(sorted(set(missing_uv1))[:5]))
        else:
            report.ok("uv1", "every primitive has UV1")


def check_scales(doc, report):
    offenders = []
    for node in doc.get("nodes", []):
        scale = node_scale(node)
        for value in scale:
            if any(abs(value - s) < SCALE_TOLERANCE for s in SUSPICIOUS_SCALES):
                offenders.append((node.get("name", "<unnamed>"), scale))
                break
    if offenders:
        detail = ", ".join("%s=%s" % (name, [round(v, 4) for v in scale]) for name, scale in offenders[:5])
        report.fail("scale", "unapplied scale (unit conversion): %s" % detail)
    else:
        report.ok("scale", "no unapplied conversion scales")


def check_materials(doc, report, max_materials):
    materials = doc.get("materials", [])
    unnamed = [i for i, m in enumerate(materials) if not m.get("name")]
    autogen = [m["name"] for m in materials if m.get("name", "").split(".")[-1].isdigit()]

    if max_materials is not None and len(materials) > max_materials:
        report.fail("materials", "%d materials against a maximum of %d (= draw calls)" % (len(materials), max_materials))
    else:
        report.ok("materials", "%d materials" % len(materials))

    if unnamed:
        report.warn("materials", "%d unnamed materials" % len(unnamed))
    if autogen:
        report.warn("materials", "autogenerated names not renamed: %s" % ", ".join(autogen[:5]))


def check_images(doc, binary, report, base_dir, is_glb):
    images = doc.get("images", [])
    if not images:
        report.warn("textures", "the file has no textures")
        return

    buffer_views = doc.get("bufferViews", [])
    external = []
    not_pot = []
    unreadable = 0

    for index, image in enumerate(images):
        label = image.get("name") or image.get("uri") or "image[%d]" % index
        blob = None

        uri = image.get("uri")
        if uri and not uri.startswith("data:"):
            if is_glb:
                external.append(label)
                continue
            path = os.path.join(base_dir, uri)
            if not os.path.exists(path):
                external.append("%s (does not exist)" % label)
                continue
            with open(path, "rb") as handle:
                blob = handle.read(32)
        elif "bufferView" in image and binary is not None:
            view = buffer_views[image["bufferView"]]
            start = view.get("byteOffset", 0)
            blob = binary[start:start + min(view.get("byteLength", 0), 4096)]

        if not blob:
            unreadable += 1
            continue

        size = image_size(blob)
        if size is None:
            unreadable += 1
        elif not (is_power_of_two(size[0]) and is_power_of_two(size[1])):
            not_pot.append("%s (%dx%d)" % (label, size[0], size[1]))

    if external:
        level = report.fail if is_glb else report.warn
        level("textures", "images outside the file: %s" % ", ".join(external[:5]))
    if not_pot:
        report.warn("textures", "not a power of two: %s" % ", ".join(not_pot[:5]))
    if unreadable:
        report.warn("textures", "%d images whose size could not be read (not PNG/JPEG)" % unreadable)
    if not external and not not_pot and not unreadable:
        report.ok("textures", "%d textures, all embedded and power of two" % len(images))


def check_animations(doc, report):
    animations = doc.get("animations", [])
    if not animations:
        return
    autogen = [a.get("name", "") for a in animations if a.get("name", "").split(".")[-1].isdigit()]
    unnamed = sum(1 for a in animations if not a.get("name"))
    report.ok("animations", "%d clips: %s" % (
        len(animations),
        ", ".join(a.get("name") or "<unnamed>" for a in animations[:8]),
    ))
    if unnamed:
        report.warn("animations", "%d unnamed clips - they reach the engine as Animation_N" % unnamed)
    if autogen:
        report.warn("animations", "autogenerated names: %s" % ", ".join(autogen[:5]))


def check_target(doc, report, target):
    if target == "ue5":
        if doc.get("materials"):
            report.warn(
                "target ue5",
                "glTF carries OpenGL normal maps (+Y) and UE5 expects DirectX (-Y): flip the green "
                "channel or flag it on import",
            )
        report.warn("target ue5", "UE5 uses centimeters: check the scale factor on import")
    elif target == "web":
        report.warn("target web", "for web, run draco/meshopt over the .glb before publishing")


def main():
    parser = argparse.ArgumentParser(description="Validate a .glb/.gltf exported from Blender.")
    parser.add_argument("path", help=".glb or .gltf file")
    parser.add_argument("--budget-tris", type=int, default=None, help="triangle budget")
    parser.add_argument("--max-materials", type=int, default=None, help="maximum materials (= draw calls)")
    parser.add_argument("--require-uv1", action="store_true", help="require UV1 for the lightmap")
    parser.add_argument("--target", choices=("unity", "ue5", "web"), default=None)
    parser.add_argument("--json", action="store_true", help="JSON output instead of text")
    args = parser.parse_args()

    if not os.path.exists(args.path):
        print("does not exist: %s" % args.path, file=sys.stderr)
        return 2

    report = Report()
    try:
        doc, binary = load_gltf(args.path)
    except (ValueError, KeyError, struct.error, json.JSONDecodeError) as error:
        report.fail("container", "could not be read: %s" % error)
        emit(report, args, None)
        return 1

    is_glb = args.path.lower().endswith(".glb")
    base_dir = os.path.dirname(os.path.abspath(args.path))

    check_geometry(doc, report, args.budget_tris)
    check_uvs(doc, report, args.require_uv1)
    check_scales(doc, report)
    check_materials(doc, report, args.max_materials)
    check_images(doc, binary, report, base_dir, is_glb)
    check_animations(doc, report)
    if args.target:
        check_target(doc, report, args.target)

    emit(report, args, doc)
    return 1 if report.verdict == "FAIL" else 0


def emit(report, args, doc):
    generator = (doc or {}).get("asset", {}).get("generator", "unknown")
    if args.json:
        print(json.dumps({
            "file": args.path,
            "generator": generator,
            "verdict": report.verdict,
            "checks": report.checks,
        }, indent=2, ensure_ascii=False))
        return

    print("%s  (%s)" % (os.path.basename(args.path), generator))
    for check in report.checks:
        print("  [%s] %-14s %s" % (check["level"], check["check"], check["message"]))
    print("  VERDICT: %s" % report.verdict)


if __name__ == "__main__":
    sys.exit(main())
