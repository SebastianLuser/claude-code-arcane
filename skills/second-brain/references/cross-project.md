# Un vault, todos los proyectos

El vault no sirve solo cuando estás sentado en él. Sirve cuando estás en otro repo y necesitás algo que ya pensaste. Esta es la receta para que cualquier proyecto lea el mismo segundo cerebro, sin duplicar nada.

Adaptado del patrón de `AgriciDaniel/claude-obsidian` (MIT), con la cascada de lectura y la regla de exclusión que son la parte que importa.

## El snippet

Pegar esto en el `CLAUDE.md` **del otro proyecto**, con el path real:

```markdown
## Segundo cerebro

Vault: `~/ruta/al/vault`

Cuando necesites contexto que no está en este repo, en este orden y parando en
cuanto alcance:

1. `hot.md` del vault: caché de contexto reciente, corto por diseño.
2. `python <vault>/.claude/skills/vault-recall/scripts/vault_index.py "<vault>" search "<consulta>"`
   para encontrar las notas relevantes por relevancia, no por keyword.
3. El hub del tema en `Hubs/`, y de ahí a las notas que linkea.
4. Solo entonces, la nota específica.

NO leas el vault para preguntas generales de programación. Es memoria personal,
no documentación técnica: si la respuesta está en los docs del lenguaje o en este
repo, el vault no aporta y solo gasta contexto.

Nunca escribas en el vault desde este proyecto sin que yo lo pida explícitamente.
```

## Por qué la cascada, y por qué en ese orden

Cada escalón es más caro que el anterior. `hot.md` son 40 líneas y cubre "qué estaba haciendo". La búsqueda cuesta una llamada y devuelve rutas, no contenido. El hub cuesta una lectura y te da el mapa del tema. La nota específica es lo único que trae texto completo.

Sin la cascada, un agente con acceso al vault hace lo que haría cualquiera sin instrucciones: `Glob` de todo y leer lo que parezca relacionado. En un vault de mil notas eso es la sesión entera gastada antes de empezar.

## Por qué la regla de exclusión es la línea más importante

`NO leas el vault para preguntas generales de programación`.

Sin eso, el vault se convierte en un lugar más donde buscar antes de responder cualquier cosa, y cada consulta paga el costo sin recibir nada. El vault aporta cuando la respuesta depende de **tu** historia: una decisión que tomaste, una persona con la que hablaste, algo que ya te pasó. Para saber cómo funciona un `Promise.all`, no.

## Escritura desde otro proyecto

Por default, **solo lectura**. Un proyecto que escribe en el vault sin que se lo pidas mete notas sin frontmatter, sin links y sin que nadie las revise, que es exactamente el material del que están hechas las huérfanas.

Cuando quieras capturar algo al vault desde otro repo, hay dos caminos:

- **Recomendado:** `/brain-dump` con `--vault <path>`. Va al dump del día, sin clasificar, y lo procesa el review a la noche como cualquier otra captura.
- **Si te molesta pasar el path:** un servidor MCP de Obsidian (por ejemplo `@bitbonsai/mcpvault`) te deja tocar el vault desde cualquier sesión. Cuesta una dependencia y latencia, y hay que aclarar en el `CLAUDE.md` del proyecto que solo se usa para capturar, no para reorganizar.

## Lo que no hay que hacer

- **No copiar notas del vault al repo.** Dos copias divergen y ninguna gana.
- **No apuntar el proyecto a una subcarpeta del vault** para "acotar". Rompe la resolución de `[[wikilinks]]`, que es global al vault.
- **No dejar que un proyecto corra `/vault-tidy` ni `/review-dump`.** Esos escriben en volumen y necesitan al usuario mirando. Desde otro repo, el vault se lee.
