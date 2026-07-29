---
name: second-brain
description: "Entry point del segundo cerebro en Obsidian. Crea o adopta un vault (PARA + Zettelkasten + hub files), escribe su CLAUDE.md, detecta que plugins hay instalados y rutea al skill correcto. Triggers: second brain, segundo cerebro, setup vault obsidian, organizar mi vault, empezar vault, adoptar mi vault."
argument-hint: "[setup | adopt | status | next]"
category: "pkm"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Second Brain - Vault Orchestrator

Sos el punto de entrada del segundo cerebro. Tu trabajo es: ubicar (o crear) el vault, entender en que estado esta, y rutear al skill correcto. No hacés todo vos, orquestás.

Aplica la rule `vault-conventions` en toda escritura.

## Idioma

Comunicación con el usuario en **español**. Las notas del vault van en el idioma en que el usuario escribe sus dumps: detectalo del contenido existente y no lo cambies.

## Ubicar el vault

En este orden: flag `--vault <path>`, env `OBSIDIAN_VAULT`, o el directorio actual si contiene `.obsidian/`. Si no hay ninguno, preguntar antes de asumir. Un directorio sin `.obsidian/` no es un vault: es una carpeta con markdown, y hay que avisarlo.

## El vault

```
CLAUDE.md              contrato del vault: estructura, frontmatter, reglas de link
_inbox/                captura cruda, un archivo por dia (YYYY-MM-DD.md)
Reflect/
  Daily/               sintesis del dia, la crea /review-dump
  Weekly/              retrospectiva semanal
  Monthly/             patrones y balance del mes
01_Projects/           con deadline o resultado definido            [PARA]
02_Areas/              responsabilidades continuas                  [PARA]
03_Resources/          notas atomicas, plano, sin subcarpetas       [Zettelkasten]
04_Archive/            cerrado, nunca borrado                       [PARA]
Hubs/                  una nota por entidad que importa
Bases/                 vistas .base
Templates/             plantillas del usuario
```

Ese árbol es el **default del `setup`**, no una imposición: el `## Rutas` del `CLAUDE.md` del vault mapea cada rol (`inbox`, `daily`, `hubs`...) a la carpeta que lo cumple, y los skills leen ese mapeo. Un vault adoptado conserva sus nombres y todo sigue funcionando.

Dos frameworks, dos capas: **PARA es la capa de navegación** (toda nota tiene una casa) y **Zettelkasten es la capa de conocimiento** (las notas atómicas viven planas en `03_Resources/` y se conectan por links). Los **hub files** son el tejido entre las dos: una nota por entidad que importa (persona, herramienta, concepto, empresa) que acumula conocimiento con el tiempo.

Las carpetas agrupan por propósito, los links agrupan por significado: una nota vive en una carpeta y linkea a muchas.

## Detección de capacidades

Antes de generar cualquier vista o sintaxis que dependa de un plugin, leer `.obsidian/core-plugins.json` y `.obsidian/community-plugins.json` y adaptar:

| Si está | Usar para | Si no está |
|---|---|---|
| `bases` (core, Obsidian 1.9+) | dashboards y vistas agregadas (`.base`) | tabla markdown estática en el dashboard |
| `dataview` | campos inline y texto computado que Bases no expresa | reformular la vista para que la exprese Bases |
| `obsidian-tasks-plugin` | sintaxis de fechas y prioridad en tareas | checkboxes markdown planos |
| `templater-obsidian` | templates de alta frecuencia (daily) | los skills escriben el archivo directo |
| `omnisearch` | ofrecerlo para búsqueda difusa desde la UI de Obsidian | `/vault-recall`, que rankea sin depender de plugins |

Nunca mencionar en una nota una sintaxis de un plugin que el usuario no tiene instalado: queda como texto roto en la vista de lectura. Registrar el resultado de la detección en el `CLAUDE.md` del vault para no repetirla cada sesión.

## Modos

### `setup` - Crear el vault
1. Confirmar el path del vault y si ya existe `.obsidian/` (si no existe, avisar que Obsidian tiene que abrirlo una vez para inicializarse).
2. Correr la detección de capacidades.
3. Crear el árbol de carpetas.
4. Copiar los templates de `references/templates/` a `Templates/` del vault.
5. Escribir el `CLAUDE.md` del vault desde `references/templates/vault-CLAUDE.md`, completando **el `## Rutas`** (rol a carpeta), el contrato de frontmatter y los plugins detectados. El `## Rutas` no es decorativo: es de donde todos los demás skills sacan dónde escribir.
6. Si hay `bases`, crear `Bases/Dashboard.base` con las vistas de tareas abiertas y notas recientes (delegar la sintaxis a `/obsidian-bases`).
7. **Construir el índice** para que la primera búsqueda y el primer review no paguen la indexación completa:
   ```bash
   python .claude/skills/vault-recall/scripts/vault_index.py "<vault>" refresh
   ```
8. **Ofrecer el hook de validación** (opcional, ver abajo).
9. Verificar que el vault sea un repo git; si no lo es, recomendarlo y explicar por qué (es el undo de cualquier corrida).

Pedir approval antes de escribir. Verdict: vault READY cuando existen el árbol, los templates y el `CLAUDE.md` con su `## Rutas`.

### `adopt` - Adoptar un vault existente
Para un vault ya armado, con o sin estructura coherente. No migra nada por su cuenta.

1. Mapear lo que hay: `Glob` de carpetas de primer nivel, conteo de notas por carpeta, campos de frontmatter en uso (`Grep`), convención de nombres de las notas periódicas, tags más usados.
2. **Mapear rol a carpeta**, que es el entregable central de este modo. Para cada rol (`inbox`, `daily`, `weekly`, `monthly`, `atomic`, `hubs`, `projects`, `areas`, `archive`, `templates`), proponer qué carpeta del vault lo cumple hoy, y marcar `(no usa)` los que no existen. Confirmar el mapeo con el usuario item por item: es la traducción de la que dependen todos los demás skills, y un rol mal mapeado hace que escriban en la carpeta equivocada sin error visible.
3. Correr `/vault-audit` con los flags que salen de ese mapeo (`--exempt` para `templates` y `archive`, `--require` con los campos de frontmatter que el vault ya usa) para tener métricas reales y no hallazgos falsos.
4. Reportar el mapeo y proponer **una de dos** rutas, con el costo de cada una:
   - **Adoptar la estructura existente:** escribir el `CLAUDE.md` con el `## Rutas` que acabás de mapear. Cero movimiento de archivos, cero links roto. Es la opción por default.
   - **Migrar a la estructura de `setup`:** plan explícito de qué carpeta va a dónde, ejecutado por `/vault-tidy` con approval item por item, en un repo git limpio.
5. Escribir el `CLAUDE.md` de la ruta elegida, con el `## Rutas` completo. Nunca mover archivos en este modo.
6. Construir el índice (`vault_index.py refresh`) pasando el mapeo: `--role hubs=<carpeta> --role atomic=<carpeta> ...`.

Verdict: vault READY cuando el `CLAUDE.md` describe las convenciones reales del vault, no las ideales, y su `## Rutas` cubre los diez roles o los marca como no usados.

### `status` - Dónde estoy
1. Leer el `CLAUDE.md` del vault para resolver los roles.
2. Correr `vault_index.py "<vault>" inventory --format text`: ya devuelve los dumps sin daily, el último weekly y monthly, y los hubs con sus alias. Es una llamada en vez de varios `Glob`, y no crece con el vault.
3. Reportar eso más las tareas abiertas y los proyectos sin actividad reciente.
4. Recomendar la acción de mayor impacto.

### `next` - Qué hago ahora
Según el estado, recomendar el skill siguiente (ver routing).

## Hook de validación (opcional)

El profile trae un `PostToolUse` que revisa cada nota escrita en el vault: frontmatter presente, `created` y `type` declarados, y al menos un `[[wikilink]]` salvo en los dumps. Avisa por stderr y **nunca bloquea la escritura**.

Sirve para lo que los skills no cubren: las notas que escribís a mano o desde otra sesión. Para activarlo, agregar a `.claude/settings.json` **del vault** el contenido de `.claude/skills/second-brain/hooks/hooks.json`:

```json
"PostToolUse": [
  {
    "matcher": "Write|Edit",
    "hooks": [
      { "type": "command", "command": "bash .claude/skills/second-brain/hooks/validate-note.sh", "timeout": 5 }
    ]
  }
]
```

Es opt-in a propósito y va en el settings del vault, no en el del repo: un hook que corre en cada `Write` de cualquier proyecto es peso que nadie pidió. Ofrecelo en el `setup`, explicá que es solo un warning, y respetá el no.

## Routing

| Situación | Skill |
|---|---|
| No hay vault | `/second-brain setup` |
| Vault existente sin `CLAUDE.md` | `/second-brain adopt` |
| Capturar algo ahora, sin pensar dónde va | `/brain-dump` |
| Procesar el dump del día y crear el daily | `/review-dump` |
| Cerrar la semana | `/review-weekly` |
| Cerrar el mes | `/review-monthly` |
| Una idea del dump merece nota propia | `/zettel` |
| Una entidad se repite en varios dumps | `/hub-note` |
| Guardar un artículo o página web | `/vault-clip` |
| Encontrar algo que ya escribiste | `/vault-recall` |
| Saber qué tan sano está el vault | `/vault-audit` |
| Aplicar los arreglos que propuso el audit | `/vault-tidy` |
| Dudas de sintaxis Obsidian, Bases o Canvas | `/obsidian-markdown`, `/obsidian-bases`, `/obsidian-canvas` |

## Ciclo estándar

Durante el día: `/brain-dump` cuantas veces haga falta (o escribir directo en `_inbox/YYYY-MM-DD.md`).
A la noche: `/review-dump` clasifica, actualiza hubs y crea el daily.
Fin de semana: `/review-weekly`. Fin de mes: `/review-monthly`.
Cada tanto: `/vault-audit` y, si hace falta, `/vault-tidy`.

## Reglas

- Nunca reorganizar carpetas ni renombrar notas sin approval: rompe `[[wikilinks]]` en silencio.
- La captura tiene que quedar sin fricción. Si el usuario tiene que decidir dónde va algo mientras lo escribe, el sistema ya falló.
- No apilar frameworks. PARA + Zettelkasten + hub files es el techo; agregar GTD o CODE encima es la causa número uno de que estos sistemas se abandonen.
- Un plugin de más es deuda: no recomendar ninguno que el vault no necesite para lo que el usuario efectivamente hace.
- Máximo accionable: el usuario siempre termina sabiendo qué skill correr next.

## Handoff

Pedí approval antes de escribir o sobrescribir archivos del vault. Cuando el vault queda READY, el siguiente paso es `/brain-dump` para la primera captura, y `/review-dump` a la noche para cerrar el ciclo completo por primera vez.
