---
name: cv-ats-export
description: "Export a Markdown CV to an ATS-compliant PDF (single column, selectable text, A4) using headless Chrome/Edge — no Obsidian or design tool needed. Triggers: exportar CV a PDF, generar PDF del CV, CV ATS PDF, convertir CV markdown a PDF, imprimir CV."
argument-hint: "[cv-name | all] [--workspace <path>]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write
---

# CV ATS Export — Markdown → PDF ATS-compliant

Convertís un CV en Markdown a un **PDF que pasa filtros ATS**: una sola columna, texto seleccionable (no imagen), A4, tipografía limpia. Usa Chrome o Edge en modo headless — no requiere Obsidian, LaTeX ni herramienta de diseño.

El motor es `scripts/cv_export.py` + `scripts/verify_pdf.py` (verificación ATS post-export). La primera vez, instalá ambos en el workspace (`tools/`) para que queden versionados con los CVs; o corrélos directo desde el skill (van juntos: `cv_export` importa `verify_pdf` desde su mismo directorio).

## Requisitos

- **Python 3** en el PATH.
- **Google Chrome o Microsoft Edge** instalado (el script autodetecta rutas estándar en Windows/macOS/Linux).
- **`pypdf` (opcional)** para la verificación ATS automática: `pip install pypdf`. Sin pypdf el export funciona igual y reporta `[ATS SKIP]`.
- CVs en Markdown dentro de `02-CVs/` del career workspace, con headers (`# Nombre`, `## Sección`), bullets y `---` como separadores.

## Uso

```bash
# Todos los CVs base (CV - *.md) del workspace
python scripts/cv_export.py

# Uno solo (con o sin .md)
python scripts/cv_export.py "CV - Acme - Backend"

# Workspace explícito
python scripts/cv_export.py --workspace ./career-workspace "CV - Acme - Backend"

# Saltar la verificación ATS
python scripts/cv_export.py --no-verify "CV - Acme - Backend"
```

El script:
1. Localiza el workspace (flag `--workspace`, env `CAREER_WORKSPACE`, o sube directorios buscando una carpeta `02-CVs`, o usa el cwd).
2. Lee el `.md`, separa frontmatter, convierte el cuerpo a HTML con el CSS ATS embebido.
3. Imprime a PDF con Chrome/Edge headless (`--headless=new --print-to-pdf`).
4. Guarda en `02-CVs/exports/`. El nombre sale del frontmatter `archivo_pdf` si existe; si no, del nombre del `.md` (sin el prefijo `CV - `).
5. **Verifica la capa de texto ATS** con `verify_pdf.py` (pypdf): texto extraíble (mínimo 200 chars), que el nombre del H1 y el email sobrevivan al export, y avisa si supera las 2 páginas. Reporta `[ATS OK]` / `[ATS WARN]` / `[ATS SKIP]`; nunca rompe el export. Se salta con `--no-verify`.

`verify_pdf.py` también funciona standalone para chequear cualquier PDF:

```bash
python scripts/verify_pdf.py "02-CVs/exports/Backend.pdf" --min-chars 200 --contains "Jane Doe"
```

## Markdown soportado

`# ## ### títulos` · `**negrita**` · `*itálica*` · `[texto](url)` · `- bullets` · `---` (regla horizontal). Un salto de línea simple dentro de un párrafo se renderiza como `<br>` (comportamiento tipo Obsidian).

## Por qué este pipeline (y no Word/Canva)

- **Texto seleccionable garantizado** → el ATS puede parsearlo (a diferencia de un PDF exportado como imagen).
- **Una columna, sin tablas** → no se rompe el parseo.
- **Reproducible y versionable** → el CV vive en Markdown (diffeable, en git), el PDF es un artefacto generado.
- **Mismo estilo siempre** → el CSS ATS está embebido en el script.

## Personalizar el estilo

El CSS ATS está en la constante `CSS` dentro de `scripts/cv_export.py` (tamaño de fuente, márgenes A4, estilos de h1/h2). Editá ahí si querés ajustar tipografía o espaciado — mantené una sola columna y texto real.

## Reglas

- No metas tablas, columnas ni imágenes en el CV: rompen el parseo ATS.
- Atendé los `[ATS WARN]`: un PDF-imagen o sin el nombre/email extraíbles no pasa filtros ATS. Usá `--no-verify` solo para iterar rápido sobre el layout.
- No commitees PDFs con datos sensibles a un remoto sin confirmación.

## Handoff

Confirmá (approval) antes de instalar `cv_export.py` en el workspace o sobrescribir PDFs. Cuando el PDF está READY y verificado, el siguiente paso suele ser `/cover-letter` para el mensaje de aplicación.
