---
name: freelance-scan
description: "Find and score freelance projects across public keyless sources with dedup between runs, plus market intel on what other freelancers charge. Triggers: buscar proyectos freelance, scan de ofertas, scorear ofertas freelance, corrida de busqueda freelance, que ofertas me convienen, cuanto cobran otros freelancers, tarifa de mercado."
argument-hint: "[search | web | market | keys | sources | post pegado]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, WebFetch, WebSearch
---

# Freelance Scan - Encontrar y scorear proyectos

Producís una **cola triageada** de proyectos: scoreados contra el perfil y el piso de tarifa, sin repetir lo que ya viste. No postulás nada acá - el objetivo es decidir dónde gastar el screen y el dinero de postularse.

Rutas relativas al career workspace (`--workspace`, env `CAREER_WORKSPACE`, o `./career-workspace/`).

Modo o búsqueda: `$ARGUMENTS`

## De dónde salen las ofertas

El script `scripts/freelance_search.py` (stdlib, sin dependencias) trae proyectos de fuentes **públicas y sin API key**. Eso es un requisito, no una casualidad: este skillset lo instala cualquiera, y una fuente que exige credenciales propias de cada usuario deja el skill roto para todos menos uno.

```bash
python .claude/skills/freelance-scan/scripts/freelance_search.py sources
python .claude/skills/freelance-scan/scripts/freelance_search.py search --query "unity developer" --pages 4
python .claude/skills/freelance-scan/scripts/freelance_search.py market --months 3
```

| Fuente | Alcance | Filtro freelance |
|---|---|---|
| **GetOnBrd** | LatAm y remoto | `modality` Freelance, filtrado del lado del cliente |
| **Himalayas** | Remoto global | `employmentType` Contractor, filtrado del lado del cliente |

**Las dos aceptan un parámetro de modalidad y lo ignoran.** Devuelven 200 y mandan full-time igual (se probaron 7 variantes de nombre en GetOnBrd y 4 en Himalayas). Y **la búsqueda de GetOnBrd ordena por relevancia, no filtra**: `query=unity` devuelve 21 páginas donde el fondo es SAP y COBOL. Por eso el filtro de modalidad *y* el de relevancia son del lado del cliente.

El script reporta `yield_by_source` en cada corrida, y hay que mostrárselo al usuario:

```
{'getonbrd': {'scanned': 103, 'freelance': 0, 'freelance_pero_irrelevante': 9}}
```

Eso se lee así: se leyeron 103 ofertas, 9 eran freelance, ninguna tenía que ver con lo buscado. **`freelance_pero_irrelevante` alto con `freelance: 0` significa que ese nicho no existe hoy en esa fuente** - no que la corrida falló. Decirlo explícitamente evita que el usuario repita la búsqueda pensando que se rompió algo.

Rendimiento medido: GetOnBrd ~10 freelance cada 200 escaneados antes del filtro de relevancia; Himalayas ~28 cada 120.

El match es por **límite de palabra**, no substring: en este dominio `go`, `ux`, `ai` y `qa` son búsquedas legítimas, y por substring `ux` matchearía dentro de "Linux" y `go` dentro de "Django". Costo aceptado y testeado: buscar `script` ya no encuentra "JavaScript". Los términos con símbolos (`c#`, `.net`, `node.js`, `react native`) caen a substring.

### Expansión por sinónimos

**Nadie titula una oferta "ecommerce".** La titula "Shopify". Buscar por categoría escondía trabajo real, medido sobre el pool completo:

| Buscás | Sin expansión | Con expansión |
|---|---|---|
| `website` | 0 | 7 |
| `backend` | 1 | 6 |
| `ecommerce` | 0 | 1 (el Shopify que estaba ahí) |
| `frontend` | 1 | 2 |
| `go` | 0 | 1 (la oferta dice "Golang") |

El mapa está en `SYNONYMS` dentro del script. Dos decisiones de diseño que importan:

- **La expansión es unidireccional**: `ecommerce → shopify`, nunca al revés. Quien ya busca preciso no quiere que le infles los resultados.
- **Se consulta el server una vez por término**, no solo se filtra distinto. El ranking de GetOnBrd depende de `query`, así que buscar "ecommerce" nunca trae el pool donde vive el de Shopify. El término del usuario se pagina hondo; cada sinónimo, una página. Tope de 6 términos extra, porque cada uno es una request.

El output trae `terms_searched` y `synonyms_applied`: **mostráselos al usuario**, si no no entiende por qué una búsqueda de "ecommerce" le trajo Shopify. Con `--no-expand` se apaga.

Si un nicho del usuario no está en el mapa, agregarlo es una línea - y conviene, porque el vocabulario de cada rubro es distinto.

## Modo `web` - llegar a los marketplaces sin credencial

Upwork, Workana, Freelancer.com, PeoplePerHour y Guru no tienen API pública. Pero **WebSearch sí los alcanza**, y la credencial es Claude Code, que ya tiene todo el que instaló el perfil.

### Cómo se corre

Disparar **varias `WebSearch` en un solo turno** (en paralelo, no una tras otra), combinando plataforma y término del stack del usuario:

```
WebSearch  allowed_domains: ["upwork.com"]     query: "<stack> freelance project hourly contract"
WebSearch  allowed_domains: ["workana.com"]    query: "proyecto <stack> desarrollo freelance"
WebSearch  allowed_domains: ["freelancer.com", "peopleperhour.com", "guru.com"]
```

Después pasar **todas** las URLs por el triage, que es la parte determinista:

```bash
python .claude/skills/freelance-scan/scripts/freelance_search.py triage \
  --url "https://..." --url "https://..."
```

Devuelve `postings` (lo único que vale abrir), `descartados_landing` y `sin_clasificar`.

### Por qué el triage no es opcional

Medido sobre una corrida real: **de 13 URLs, 3 eran ofertas.** Las otras 10 eran landings de "Hire Golang developers", tablas de tarifas, gigs del Project Catalog y páginas de búsqueda. Sin filtrar, la cola es mitad basura y el usuario deja de mirarla.

### Los tres límites, y hay que decirlos

1. **La fecha no está verificada.** El índice no filtra por recencia: en la prueba real apareció una oferta de Upwork **posteada en 2021**. Siempre avisar que hay que mirar la fecha al abrir.
2. **No se puede leer la oferta.** `WebFetch` devuelve **403 en todas** estas plataformas, incluso en páginas de proyecto individuales. Presupuesto, cantidad de propuestas y reputación del cliente requieren que el usuario abra el link.
3. **El resumen de la búsqueda no es dato.** Es un modelo leyendo varias páginas; puede mezclar detalles de dos ofertas.

Por eso este modo entrega **links para abrir**, no filas para el registro. Nunca guardar en `seen_jobs.json` una oferta que vino de acá con fecha o presupuesto sin confirmar: un dato inventado en el registro contamina todas las decisiones que se apoyan en él.

## Modo `keys` - las fuentes que piden credencial propia

```bash
python .claude/skills/freelance-scan/scripts/freelance_search.py keys
```

Lista qué fuentes necesitan API key, **cómo conseguir cada una**, y si está configurada en esta máquina.

**Upwork** tiene adaptador escrito. Se pide la key desde el API Center de la cuenta (freelancer o cliente, cualquier plan, sin cuenta de empresa) y contestan por mail en ~1 semana. Con `UPWORK_ACCESS_TOKEN` en el entorno, `search` la suma sola a la corrida y trae presupuesto, tarifa horaria y reputación del cliente, que es justo lo que el modo `web` no puede ver.

Sin la variable puesta **no se intenta y se avisa**, en vez de fallar en cada corrida hasta que el usuario aprenda a ignorar los errores.

Lo que ni con key se puede: **enviar propuestas**. Upwork no expone mutation para postularse ni para gastar Connects, a propósito, contra el auto-bidding. Postularse sigue siendo a mano siempre.

**Nunca scrapear ninguna plataforma ni sugerir herramientas que lo hagan.** Donde el `robots.txt` opina, opina en contra: PeoplePerHour prohíbe las URLs con filtros y Guru prohíbe `/api/`. Detalle por plataforma con los códigos medidos: `references/platforms.md`.

## Scoring

Cada oferta recibe un `match_score` 0-100. Tres componentes, y el tercero es el que la mayoría ignora:

### 1. Fit técnico (0-40)

Cuánto de lo que piden cubrís con evidencia real del perfil. Must-haves cubiertos pesan; nice-to-haves suman poco. Un must-have que no cubrís no se compensa con tres nice-to-haves.

### 2. Viabilidad económica (0-40)

El presupuesto contra tu piso neto, estimando el esfuerzo real del alcance descrito.

- Presupuesto que no llega al piso → **máximo 10 en este componente**, sin importar lo lindo que sea el proyecto.
- Presupuesto sin especificar → no asumas que es bueno. Puntuá con la incertidumbre y marcalo.

### 3. Probabilidad de que exista de verdad (0-20)

Una parte importante de las ofertas de marketplace no termina contratando a nadie. Señales de que esta sí:

- Cliente con pago verificado y contrataciones previas
- Oferta reciente y con pocas propuestas todavía
- Post específico, escrito por alguien que sabe lo que pide
- Cliente que respondió preguntas en el propio post

Señales contrarias: hire rate bajo con muchos posts, oferta vieja con decenas de propuestas, post genérico reutilizado.

### Umbrales

| Score | Acción |
|---|---|
| 70+ | Cola de screen: correr `/client-screen` |
| 50-69 | Segunda vuelta: solo si la cola alta está vacía |
| < 50 | Descartar y registrar el motivo en el estado de dedup |

Los umbrales se documentan en la corrida. Si el usuario los quiere mover, se mueven - explícitamente, no por acomodo.

## Modo `market` - qué cobran los demás

El hilo mensual de Hacker News "Ask HN: Freelancer? Seeking freelancer?" **no es una fuente de trabajo**: medido sobre 6 meses hay 113 freelancers ofreciéndose contra 2 ofertas. Pero eso mismo lo vuelve la mejor fuente gratuita de otra cosa: **cómo se posiciona y cuánto cobra gente con tu perfil**.

`market` devuelve los perfiles, las tarifas que mencionan (con la cita textual, sin inventar números), y un resumen con **n, mínimo, mediana y máximo por unidad**.

**Solo ~3% de los perfiles declara una tarifa parseable**: en la corrida de 6 meses fueron 3 tarifas sobre 119 perfiles (mediana 100 USD/hora). Siempre reportar el `n` al usuario - una mediana sobre 3 datos orienta, no decide. Los precios por paquete ("75-150 USD un diagnóstico") no entran al resumen a propósito: no son tarifa horaria y mezclarlos ensucia la mediana.

Sirve para dos decisiones concretas: el piso de tarifa que fija `/freelance-hunt setup` y usa `/freelance-profile`, y el bid de `/freelance-proposal`. Un tercer uso, menos obvio y bastante útil: leer cómo escriben su one-liner los que cobran más.

## Dedup entre corridas

Mismo mecanismo y mismo archivo que `/job-scrape`: `<workspace>/tools/job_scraper/seen_jobs.json`. Si `+job-hunt` está instalado, el estado es compartido y no hay dos archivos.

Claves: URL canónica sin parámetros de tracking, y `job_key` = `slug(cliente)|slug(titulo)`. Matching blando (mismo cliente + títulos parecidos) es **warning**, nunca dedup automático.

Flujo unidireccional: `seen_jobs` → nota → dashboard, nunca de vuelta. Playbook completo: `../job-scrape/references/dedup-playbook.md` si está instalado, o `references/dedup.md`.

Reposteos: es común que un cliente cierre y republique la misma oferta. Si el `job_key` matchea una entrada `descartado`, avisar que ya se descartó antes y por qué, en vez de volver a triagearla de cero. Un cliente que republica cinco veces sin cambiar el presupuesto es en sí una señal para `/client-screen`.

## Proceso

1. **Cargar el estado de dedup.** Validar que las entradas `nota_creada` apunten a notas existentes; reportar las rotas.
2. **Obtener las ofertas**: corrida del script, y/o las que el usuario pegue de plataformas cerradas.
3. **Dedupear.** Reportar cuántas se filtraron, para que se vea que el mecanismo trabaja.
4. **Scorear** las nuevas con los tres componentes. Mostrar la tabla en el chat: título, cliente, presupuesto, score y los tres subscores. Mostrar también el `yield_by_source` de la corrida.
5. **Triagear** con approval del usuario: qué pasa a screen, qué queda en segunda vuelta, qué se descarta y por qué.
6. **Registrar** en `seen_jobs.json`. Crear nota en `03-Aplicaciones/` (template `Propuesta`, `tipo: freelance`, `estado: interesado`) solo para las que pasan a screen - el motivo de descarte vive en el estado de dedup, no en una nota.

## Reglas

- **Nunca inventar ofertas, presupuestos ni datos de clientes.** Todo sale del post real o del script.
- **Nunca scrapear** Upwork, Freelancer.com, Fiverr ni ninguna plataforma cuyos términos lo prohíban, ni sugerir herramientas que lo hagan.
- **Nunca prender por defecto una fuente que exija credenciales por usuario.** Rompe el skill para todos los que instalen el perfil menos uno. Va en `KEYED_SOURCES`: se activa sola si la variable de entorno está, y si no, `keys` explica cómo conseguirla.
- **Nunca guardar en el registro un dato que vino del modo `web` sin confirmar.** Fecha y presupuesto ahí no están verificados; escribirlos como si lo estuvieran envenena todas las decisiones posteriores.
- Un presupuesto abajo del piso no se "compensa" con entusiasmo por el proyecto.
- En `market`, nunca reportar una mediana sin su `n`.
- Sin guiones largos en las notas. No crear notas para ofertas que no pasan el umbral.

## Handoff

Corrida COMPLETE cuando la cola quedó triageada y el estado de dedup actualizado. El siguiente paso es `/client-screen` sobre la primera de la cola alta. Si la corrida trajo poco o nada usable varias veces seguidas, el problema es el targeting: corré `/freelance-pipeline`.
