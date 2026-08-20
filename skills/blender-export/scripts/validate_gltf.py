#!/usr/bin/env python3
"""Valida un .glb / .gltf exportado desde Blender contra el presupuesto del proyecto.

Chequea lo que se rompe siempre y no se ve hasta que el asset ya esta en el engine:
triangulos fuera de presupuesto, UVs ausentes, lightmap UV1 faltante, escalas sin
aplicar, texturas que no son potencia de dos, imagenes externas dentro de un .glb,
y materiales de sobra.

Solo stdlib: corre en el proyecto del usuario sin instalar nada.

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

# Escalas que delatan una conversion de unidades sin aplicar en lugar de una
# decision de diseno.
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
    """Devuelve (json_dict, bin_chunk_or_None). Acepta .glb y .gltf."""
    with open(path, "rb") as handle:
        head = handle.read(4)
        handle.seek(0)
        if len(head) == 4 and struct.unpack("<I", head)[0] == GLB_MAGIC:
            return _load_glb(handle)
        return json.load(handle), None


def _load_glb(handle):
    magic, version, total = struct.unpack("<III", handle.read(12))
    if magic != GLB_MAGIC:
        raise ValueError("no es un GLB: falta el magic 'glTF'")
    if version != 2:
        raise ValueError("version de GLB no soportada: %d (se espera 2)" % version)

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
        raise ValueError("el GLB no tiene chunk JSON")
    return doc, binary


def image_size(blob):
    """Dimensiones de un PNG o JPEG en bytes, o None si no se reconoce."""
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
            # SOF0-3, SOF5-7, SOF9-11, SOF13-15 llevan las dimensiones.
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
    """(tris, primitivas_no_triangulo) sumando todas las meshes del documento."""
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
    """Escala de un nodo, venga como 'scale' o dentro de 'matrix'."""
    if "scale" in node:
        return [float(v) for v in node["scale"]]
    matrix = node.get("matrix")
    if not matrix:
        return [1.0, 1.0, 1.0]
    # glTF guarda la matriz por columnas; la norma de las 3 primeras es la escala.
    return [
        (matrix[i] ** 2 + matrix[i + 1] ** 2 + matrix[i + 2] ** 2) ** 0.5
        for i in (0, 4, 8)
    ]


def check_geometry(doc, report, budget):
    tris, non_triangles = count_triangles(doc)
    if budget is None:
        report.warn("presupuesto", "%d tris, sin presupuesto declarado (--budget-tris)" % tris)
    elif tris > budget:
        report.fail("presupuesto", "%d tris contra un presupuesto de %d (+%d)" % (tris, budget, tris - budget))
    else:
        report.ok("presupuesto", "%d tris dentro del presupuesto de %d" % (tris, budget))

    if non_triangles:
        report.warn("primitivas", "%d primitivas no triangulares (lines/points) - el engine puede ignorarlas" % non_triangles)

    if not doc.get("meshes"):
        report.fail("meshes", "el archivo no tiene ninguna mesh")


def check_uvs(doc, report, require_uv1):
    missing_uv0 = []
    missing_uv1 = []
    for mesh in doc.get("meshes", []):
        name = mesh.get("name", "<sin nombre>")
        for prim in mesh.get("primitives", []):
            attrs = prim.get("attributes", {})
            if "TEXCOORD_0" not in attrs:
                missing_uv0.append(name)
            if "TEXCOORD_1" not in attrs:
                missing_uv1.append(name)

    if missing_uv0:
        report.fail("uv0", "sin UV0, no se puede texturizar: %s" % ", ".join(sorted(set(missing_uv0))[:5]))
    else:
        report.ok("uv0", "todas las primitivas tienen UV0")

    if require_uv1:
        if missing_uv1:
            report.fail("uv1", "sin UV1 para lightmap: %s" % ", ".join(sorted(set(missing_uv1))[:5]))
        else:
            report.ok("uv1", "todas las primitivas tienen UV1")


def check_scales(doc, report):
    offenders = []
    for node in doc.get("nodes", []):
        scale = node_scale(node)
        for value in scale:
            if any(abs(value - s) < SCALE_TOLERANCE for s in SUSPICIOUS_SCALES):
                offenders.append((node.get("name", "<sin nombre>"), scale))
                break
    if offenders:
        detail = ", ".join("%s=%s" % (name, [round(v, 4) for v in scale]) for name, scale in offenders[:5])
        report.fail("escala", "escala sin aplicar (conversion de unidades): %s" % detail)
    else:
        report.ok("escala", "sin escalas de conversion sin aplicar")


def check_materials(doc, report, max_materials):
    materials = doc.get("materials", [])
    unnamed = [i for i, m in enumerate(materials) if not m.get("name")]
    autogen = [m["name"] for m in materials if m.get("name", "").split(".")[-1].isdigit()]

    if max_materials is not None and len(materials) > max_materials:
        report.fail("materiales", "%d materiales contra un maximo de %d (= draw calls)" % (len(materials), max_materials))
    else:
        report.ok("materiales", "%d materiales" % len(materials))

    if unnamed:
        report.warn("materiales", "%d materiales sin nombre" % len(unnamed))
    if autogen:
        report.warn("materiales", "nombres autogenerados sin renombrar: %s" % ", ".join(autogen[:5]))


def check_images(doc, binary, report, base_dir, is_glb):
    images = doc.get("images", [])
    if not images:
        report.warn("texturas", "el archivo no trae texturas")
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
                external.append("%s (no existe)" % label)
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
        level("texturas", "imagenes fuera del archivo: %s" % ", ".join(external[:5]))
    if not_pot:
        report.warn("texturas", "no son potencia de dos: %s" % ", ".join(not_pot[:5]))
    if unreadable:
        report.warn("texturas", "%d imagenes cuyo tamano no se pudo leer (formato no PNG/JPEG)" % unreadable)
    if not external and not not_pot and not unreadable:
        report.ok("texturas", "%d texturas, todas embebidas y potencia de dos" % len(images))


def check_animations(doc, report):
    animations = doc.get("animations", [])
    if not animations:
        return
    autogen = [a.get("name", "") for a in animations if a.get("name", "").split(".")[-1].isdigit()]
    unnamed = sum(1 for a in animations if not a.get("name"))
    report.ok("animaciones", "%d clips: %s" % (
        len(animations),
        ", ".join(a.get("name") or "<sin nombre>" for a in animations[:8]),
    ))
    if unnamed:
        report.warn("animaciones", "%d clips sin nombre - llegan al engine como Animation_N" % unnamed)
    if autogen:
        report.warn("animaciones", "nombres autogenerados: %s" % ", ".join(autogen[:5]))


def check_target(doc, report, target):
    if target == "ue5":
        if doc.get("materials"):
            report.warn(
                "target ue5",
                "glTF trae normal maps OpenGL (+Y) y UE5 espera DirectX (-Y): invertir el canal "
                "verde o marcarlo en el import",
            )
        report.warn("target ue5", "UE5 usa centimetros: verificar el factor de escala en el import")
    elif target == "web":
        report.warn("target web", "para web, correr draco/meshopt sobre el .glb antes de publicar")


def main():
    parser = argparse.ArgumentParser(description="Valida un .glb/.gltf exportado desde Blender.")
    parser.add_argument("path", help="archivo .glb o .gltf")
    parser.add_argument("--budget-tris", type=int, default=None, help="presupuesto de triangulos")
    parser.add_argument("--max-materials", type=int, default=None, help="maximo de materiales (= draw calls)")
    parser.add_argument("--require-uv1", action="store_true", help="exigir UV1 para lightmap")
    parser.add_argument("--target", choices=("unity", "ue5", "web"), default=None)
    parser.add_argument("--json", action="store_true", help="salida JSON en lugar de texto")
    args = parser.parse_args()

    if not os.path.exists(args.path):
        print("no existe: %s" % args.path, file=sys.stderr)
        return 2

    report = Report()
    try:
        doc, binary = load_gltf(args.path)
    except (ValueError, KeyError, struct.error, json.JSONDecodeError) as error:
        report.fail("contenedor", "no se pudo leer: %s" % error)
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
    generator = (doc or {}).get("asset", {}).get("generator", "desconocido")
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
