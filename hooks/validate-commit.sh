#!/usr/bin/env bash
set +e

main() {
  local INPUT
  INPUT=$(cat 2>/dev/null) || true

  local COMMAND
  COMMAND=$(echo "$INPUT" | grep -oE '"command"\s*:\s*"[^"]*"' | head -1 | sed 's/.*"command"\s*:\s*"//;s/"$//') || true

  [[ -z "$COMMAND" || "$COMMAND" != *"git commit"* ]] && return 0

  if [[ "$COMMAND" == *"--no-verify"* ]]; then
    echo "BLOCK: --no-verify is not allowed. Fix the underlying issue instead of bypassing hooks." >&2
    exit 2
  fi

  if [[ "$COMMAND" == *"-m \"\""* ]]; then
    echo "BLOCK: empty commit message not allowed." >&2
    exit 2
  fi

  validate_3d_exports
}

# Gate de exports 3D. No-op salvo que el perfil blender este instalado y haya
# .glb/.gltf staged: bloquea solo fallas inequivocas (contenedor roto, sin UVs,
# escala de conversion sin aplicar, texturas fuera del .glb). El presupuesto de
# tris es por proyecto, asi que aca no se pasa y queda como aviso, no como block.
validate_3d_exports() {
  local VALIDATOR=".claude/skills/blender-export/scripts/validate_gltf.py"
  [[ -f "$VALIDATOR" ]] || return 0

  local STAGED
  STAGED=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null | grep -iE '\.(glb|gltf)$') || true
  [[ -z "$STAGED" ]] && return 0

  local PY
  PY=$(command -v python3 2>/dev/null || command -v python 2>/dev/null) || return 0
  [[ -z "$PY" ]] && return 0

  local FAILED="" OUT
  while IFS= read -r FILE; do
    [[ -n "$FILE" && -f "$FILE" ]] || continue
    if ! OUT=$("$PY" "$VALIDATOR" "$FILE" 2>&1); then
      FAILED+="$OUT"$'
'
    fi
  done <<< "$STAGED"

  if [[ -n "$FAILED" ]]; then
    echo "BLOCK: hay exports 3D staged que no pasan la validacion." >&2
    echo "$FAILED" >&2
    echo "Corregir en Blender y volver a exportar (ver /blender-export), o sacar el archivo del stage." >&2
    exit 2
  fi
}

main
exit 0
