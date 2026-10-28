#!/usr/bin/env python3
"""Generate MCP scaffold files from an OpenAPI specification.

Input sources:
- --input <file>
- stdin (JSON or YAML when PyYAML is available)

Output:
- tool_manifest.json
- server.py or server.ts scaffold
- summary in text/json
"""

import argparse
import json
import keyword
import re
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any, Dict, List, Optional


HTTP_METHODS = {"get", "post", "put", "patch", "delete"}


class CLIError(Exception):
    """Raised for expected CLI failures."""


@dataclass
class GenerationSummary:
    server_name: str
    language: str
    operations_total: int
    tools_generated: int
    output_dir: str
    manifest_path: str
    scaffold_path: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate MCP server scaffold from OpenAPI.")
    parser.add_argument("--input", help="OpenAPI file path (JSON or YAML). If omitted, reads from stdin.")
    parser.add_argument("--server-name", required=True, help="MCP server name.")
    parser.add_argument("--language", choices=["python", "typescript"], default="python", help="Scaffold language.")
    parser.add_argument("--output-dir", default=".", help="Directory to write generated files.")
    parser.add_argument("--format", choices=["text", "json"], default="text", help="Output format.")
    parser.add_argument("--force", action="store_true", help="Overwrite generated files that already exist.")
    return parser.parse_args()


def load_raw_input(input_path: Optional[str]) -> str:
    if input_path:
        try:
            return Path(input_path).read_text(encoding="utf-8")
        except Exception as exc:
            raise CLIError(f"Failed to read --input file: {exc}") from exc

    if sys.stdin.isatty():
        raise CLIError("No input provided. Use --input <spec-file> or pipe OpenAPI via stdin.")

    data = sys.stdin.read().strip()
    if not data:
        raise CLIError("Stdin was provided but empty.")
    return data


def parse_openapi(raw: str) -> Dict[str, Any]:
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        try:
            import yaml  # type: ignore

            parsed = yaml.safe_load(raw)
            if not isinstance(parsed, dict):
                raise CLIError("YAML OpenAPI did not parse into an object.")
            return parsed
        except ImportError as exc:
            raise CLIError("Input is not valid JSON and PyYAML is unavailable for YAML parsing.") from exc
        except Exception as exc:
            raise CLIError(f"Failed to parse OpenAPI input: {exc}") from exc


def sanitize_tool_name(name: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9_]+", "_", name).strip("_")
    cleaned = re.sub(r"_+", "_", cleaned)
    return cleaned.lower() or "unnamed_tool"


def python_identifier(name: str) -> str:
    """A tool name that is a keyword or starts with a digit is not a valid function name."""
    return f"op_{name}" if keyword.iskeyword(name) or name[0].isdigit() else name


def schema_from_parameter(param: Dict[str, Any]) -> Dict[str, Any]:
    schema = param.get("schema", {})
    if not isinstance(schema, dict):
        schema = {}
    out = {
        "type": schema.get("type", "string"),
        "description": param.get("description", ""),
    }
    if "enum" in schema:
        out["enum"] = schema["enum"]
    return out


def extract_tools(spec: Dict[str, Any]) -> List[Dict[str, Any]]:
    paths = spec.get("paths", {})
    if not isinstance(paths, dict):
        raise CLIError("OpenAPI spec missing valid 'paths' object.")

    tools = []
    for path, methods in paths.items():
        if not isinstance(methods, dict):
            continue
        for method, operation in methods.items():
            method_l = str(method).lower()
            if method_l not in HTTP_METHODS or not isinstance(operation, dict):
                continue

            op_id = operation.get("operationId")
            if op_id:
                name = sanitize_tool_name(str(op_id))
            else:
                name = sanitize_tool_name(f"{method_l}_{path}")

            description = str(operation.get("summary") or operation.get("description") or f"{method_l.upper()} {path}")
            properties: Dict[str, Any] = {}
            required: List[str] = []

            for param in operation.get("parameters", []):
                if not isinstance(param, dict):
                    continue
                pname = str(param.get("name", "")).strip()
                if not pname:
                    continue
                properties[pname] = schema_from_parameter(param)
                if bool(param.get("required")):
                    required.append(pname)

            request_body = operation.get("requestBody", {})
            if isinstance(request_body, dict):
                content = request_body.get("content", {})
                if isinstance(content, dict):
                    app_json = content.get("application/json", {})
                    if isinstance(app_json, dict):
                        schema = app_json.get("schema", {})
                        if isinstance(schema, dict) and schema.get("type") == "object":
                            rb_props = schema.get("properties", {})
                            if isinstance(rb_props, dict):
                                for key, val in rb_props.items():
                                    if isinstance(val, dict):
                                        properties[key] = val
                            rb_required = schema.get("required", [])
                            if isinstance(rb_required, list):
                                required.extend([str(x) for x in rb_required])

            tool = {
                "name": name,
                "description": description,
                "inputSchema": {
                    "type": "object",
                    "properties": properties,
                    "required": sorted(set(required)),
                },
                "x-openapi": {"path": path, "method": method_l},
            }
            tools.append(tool)

    return tools


def python_scaffold(server_name: str, tools: List[Dict[str, Any]]) -> str:
    handlers = []
    for tool in tools:
        fname = python_identifier(sanitize_tool_name(tool["name"]))
        # repr() makes the spec's text a literal: a quote or backslash in a summary cannot end it.
        handlers.append(
            f"@mcp.tool(name={tool['name']!r})\ndef {fname}(input: dict) -> dict:\n"
            f"    {tool['description']!r}\n"
            f"    return {{'tool': {tool['name']!r}, 'status': 'todo', 'input': input}}\n"
        )

    return "\n".join(
        [
            "#!/usr/bin/env python3",
            '"""Generated MCP server scaffold."""',
            "",
            "from fastmcp import FastMCP",
            "",
            f"mcp = FastMCP(name={server_name!r})",
            "",
            *handlers,
            "",
            "if __name__ == '__main__':",
            "    mcp.run()",
            "",
        ]
    )


def typescript_scaffold(server_name: str, tools: List[Dict[str, Any]]) -> str:
    registrations = []
    for tool in tools:
        # JSON strings are valid JS string literals, whatever quotes the spec's text holds.
        name = json.dumps(tool["name"])
        registrations.append(
            "server.tool(\n"
            f"  {name},\n"
            f"  {json.dumps(tool['description'])},\n"
            "  async (input) => ({\n"
            f"    content: [{{ type: 'text', text: JSON.stringify({{ tool: {name}, status: 'todo', input }}) }}],\n"
            "  })\n"
            ");"
        )

    return "\n".join(
        [
            "// Generated MCP server scaffold",
            "import { FastMCP } from 'fastmcp';",
            "",
            f"const server = new FastMCP({{ name: {json.dumps(server_name)} }});",
            "",
            *registrations,
            "",
            "server.run();",
            "",
        ]
    )


def write_outputs(
    server_name: str, language: str, output_dir: Path, tools: List[Dict[str, Any]], force: bool = False
) -> GenerationSummary:
    manifest_path = output_dir / "tool_manifest.json"
    scaffold_path = output_dir / ("server.py" if language == "python" else "server.ts")
    existing = [str(p) for p in (manifest_path, scaffold_path) if p.exists()]
    if existing and not force:
        raise CLIError(f"Would overwrite {', '.join(existing)}. Pass --force, or choose another --output-dir.")

    output_dir.mkdir(parents=True, exist_ok=True)
    manifest = {"server": server_name, "tools": tools}
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    scaffold = python_scaffold if language == "python" else typescript_scaffold
    scaffold_path.write_text(scaffold(server_name, tools), encoding="utf-8")

    return GenerationSummary(
        server_name=server_name,
        language=language,
        operations_total=len(tools),
        tools_generated=len(tools),
        output_dir=str(output_dir.resolve()),
        manifest_path=str(manifest_path.resolve()),
        scaffold_path=str(scaffold_path.resolve()),
    )


def main() -> int:
    args = parse_args()
    raw = load_raw_input(args.input)
    spec = parse_openapi(raw)
    tools = extract_tools(spec)
    if not tools:
        raise CLIError("No operations discovered in OpenAPI paths.")

    summary = write_outputs(
        server_name=args.server_name,
        language=args.language,
        output_dir=Path(args.output_dir),
        tools=tools,
        force=args.force,
    )

    if args.format == "json":
        print(json.dumps(asdict(summary), indent=2))
    else:
        print("MCP scaffold generated")
        print(f"- server: {summary.server_name}")
        print(f"- language: {summary.language}")
        print(f"- tools: {summary.tools_generated}")
        print(f"- manifest: {summary.manifest_path}")
        print(f"- scaffold: {summary.scaffold_path}")

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except CLIError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(2)
