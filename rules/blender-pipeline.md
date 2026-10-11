# Blender Pipeline

Reglas que tienen que estar presentes antes de operar Blender, por MCP o headless, aunque todavia no se haya tocado un `.blend`. Ejes, topologia, materiales, animacion y Git estan en `.claude/rules/blender-files.md`, que se carga al tocar un `.blend` o un archivo exportado.

## El MCP es opcional, el headless no

Hay dos formas de operar Blender desde Claude, y no son equivalentes:

| | MCP | Headless (`--background`) |
|---|---|---|
| Necesita Blender abierto | Si, con el addon conectado | No |
| Reproducible en CI | No | Si |
| Ve el estado de la escena | Si | Solo lo que el script consulta |
| Deja rastro en el repo | No | Si — el script queda versionado |

**Default: headless.** Un `.py` versionado que corre con `blender --background --python` es
auditable, repetible y no depende de que alguien tenga la ventana abierta. El MCP sirve para
explorar una escena que ya existe y para iterar visualmente, no para el paso automatizable.

Los dos MCP recomendados estan en `/blender-context`. **Ninguno de los dos se instala desde este
repo**: son addons de la instalacion de Blender del usuario.

## Ejecuta Python sin sandbox

Tanto el MCP de la comunidad como el oficial corren el Python que genera el LLM **sin ninguna
barrera**. Consecuencias que no son negociables:

1. **Nunca correrlo con cambios sin commitear** en el repo del proyecto. Si algo se rompe, la
   unica marcha atras es git.
2. Guardar el `.blend` antes de la primera operacion de la sesion.
3. No apuntarlo a una maquina con material sensible ni a credenciales.
4. Un script que borra (`bpy.data.*.remove`, `object.delete`) se muestra al usuario **antes** de
   correrlo, siempre, incluso si lo pidio.
