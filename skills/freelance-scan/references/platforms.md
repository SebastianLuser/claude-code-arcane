# Plataformas freelance: qué se puede consumir y qué no

Estado verificado en agosto de 2026, corriendo las requests, no leyendo la documentación. Antes de agregar una fuente, verificar de nuevo: las plataformas cambian sin avisar.

## El criterio, y por qué es estricto

Este repo es público y lo instala cualquiera. Una fuente entra a la corrida automática solo si cumple **las tres**:

1. **Sin API key ni registro.** Si cada usuario tiene que pedir credenciales, el skill funciona para uno y está roto para el resto.
2. **Términos que permiten consumirla desde una herramienta local.** No alcanza con que técnicamente responda.
3. **Tiene trabajo freelance de verdad**, no solo empleo remoto full-time.

Que una API devuelva 200 no la habilita. Dos de las candidatas más recomendadas en internet fallan el punto 2 y quedaron afuera.

## Incluidas

### GetOnBrd (LatAm y remoto)

`https://www.getonbrd.com/api/v0` · sin key · comparte API con `/job-scrape`

- `/modalities` devuelve `1 Full time`, `2 Part time`, **`3 Freelance`**, `4 Internship`.
- **El filtro de modalidad no existe del lado del servidor.** Se probaron `modality`, `modality_id`, `modalities`, `modality[]`, `filter[modality]`, `modality=freelance` y `job_modality`: las siete devuelven 200 y el mismo resultado sin filtrar (48 de 50 full-time). Hay que filtrar en el cliente.
- **Usar `expand[]=company&expand[]=tags&expand[]=modality`.** Sin eso esos campos vienen como `{"data":{"id":...}}` y no hay nombre que mostrar. Lo aprendimos de `job-scrape/scripts/getonbrd_search.py`, que ya lo hacía.
- **Trampa:** con `expand[]` el id de la modalidad llega como string `"3"`; sin expand, como int `3`. Comparar el id se rompe en silencio al cambiar los parámetros. Filtrar por `attributes.locale_key == "freelance"`.
- Rendimiento medido: ~10 freelance cada 200 escaneados con `query=developer`.

### Himalayas (remoto global)

`https://himalayas.app/jobs/api` · sin key

- `employmentType` toma los valores `Full Time` y **`Contractor`**.
- **Tampoco filtra del lado del servidor:** se probaron `employmentType=Contractor`, en minúscula, `employment_type` y `type`. Las cuatro devuelven el mismo set mezclado y `totalCount` sin cambios (97.323).
- **`limit` se topea en 20** aunque pidas más. Paginar con `offset`.
- Rendimiento medido: ~28 contractor cada 120 escaneados. Sesgo a tener en cuenta: la cabeza del feed la domina una sola empresa de BPO con puestos no técnicos (transcripción, documentos, peritaje). Con filtro de query se acomoda, pero ese pool no es homogéneo y el usuario tiene que saberlo.

## Solo para inteligencia de mercado, no para buscar trabajo

### Hacker News: "Ask HN: Freelancer? Seeking freelancer?"

`https://hn.algolia.com/api/v1` · sin key · 10.000 requests por hora

El nombre engaña. Se midieron 6 hilos mensuales (marzo a agosto de 2026):

| Categoría | Comentarios |
|---|---|
| Freelancers ofreciéndose (`SEEKING WORK`) | 113 |
| Clientes buscando (`SEEKING FREELANCER`) | **2** |
| Sin seguir la convención | 6 |

Reproducible: `freelance_search.py market --months 6` devuelve ese conteo en `composition`.

Como cola de trabajo no sirve. Como muestra de **cómo se posiciona y cuánto cobra gente con tu perfil**, es lo mejor que hay gratis. Por eso vive en el subcomando `market` y no en `search`.

Rendimiento de la extracción de tarifas: **3 tarifas sobre 119 perfiles** (~3%), mediana 100 USD/hora. Poco, pero es dato real y con la cita textual al lado.

Detalles de implementación: los comentarios vienen con HTML escapado (`github&#x2F;user`), y los que no siguen la convención se clasifican como `unknown` a propósito - adivinar de qué lado están mete ofertas falsas en la cola, que es peor que omitirlas.

## Excluidas, con motivo

### RemoteOK

Sus términos, que vienen **en el propio payload de la API**, exigen un backlink do-follow desde tu sitio mencionando RemoteOK como fuente, o suspenden el acceso.

Un CLI local no tiene sitio web. No podemos cumplirlo, y usarlo igual haría que le suspendan la IP al usuario. Además, de 100 ofertas revisadas **ninguna** tenía tag `contract`, `freelance` ni `part-time`. Falla el punto 2 y el punto 3.

### Remotive

Mismo problema y más restricciones: backlink do-follow obligatorio, **máximo 4 requests por día**, datos con **24 horas de retraso** deliberado, y prohibición explícita de usar los datos para captar emails. Ofrecen una API privada de pago desde 5.000 USD al mes.

Tiene `job_type` con valores `freelance` y `contract` reales, así que el punto 3 lo cumple. Los otros dos no.

### Upwork

- **API GraphQL** en `api.upwork.com/graphql` con OAuth 2.0. La key se pide desde el API Center de la cuenta (cualquier freelancer o cliente, cualquier plan - **no** hace falta cuenta de empresa) y según el propio soporte de Upwork **responden por mail en aproximadamente una semana**. El rechazo más común es data de cuenta incompleta.
- **Sí tiene búsqueda de ofertas** (`marketplaceJobPostingsSearch`) entre las operaciones de lectura, junto con perfiles y contratos. Lo que no tiene es escritura de propuestas.
- Límites si te la aprueban: 40.000 requests por día, 10 por segundo por IP.
- **No hay mutation para enviar una propuesta ni para gastar Connects.** Está cerrado a propósito para frenar auto-bidding.
- **Los RSS feeds murieron el 20 de agosto de 2024**, por la misma razón. Cualquier tutorial que los mencione está viejo.
- Scrapear viola los ToS y es exactamente lo que la plataforma cerró.

Por la aprobación manual por usuario **no entra a la corrida automática**: rompería el skill para todos menos quien tenga key. Si un usuario la consigue, puede escribir su propio adaptador siguiendo el patrón del script; el camino soportado es pegar la oferta a mano.

### Freelancer.com

API con OAuth 2.0 y credenciales por usuario (`Freelancer-Developer-OAuth-Client-Id`). No hay endpoint público de búsqueda de proyectos. Mismo problema estructural que Upwork.

Hay wrappers de terceros en RapidAPI que dicen exponer la búsqueda sin credenciales. No los usamos: son intermediarios no oficiales, se caen sin aviso y su forma de obtener los datos no es auditable.

### El resto de los marketplaces tipo Upwork

Distinción que importa: GetOnBrd y Himalayas son **job boards** con una modalidad freelance. Upwork es un **marketplace**: el cliente publica, vos ofertás, hay Connects y escrow. Ninguna de las fuentes incluidas es un marketplace, y no es por falta de ganas.

Probado en agosto de 2026, códigos reales:

| Plataforma | Endpoint probado | Resultado |
|---|---|---|
| Workana (LatAm) | `/jobs.rss`, `/jobs.rss?language=es`, `/api/v1/projects` | 404 en las tres. No hay feed público |
| Guru | `/rss/jobs/`, `api.guru.com` | 404 y DNS inexistente. Su `robots.txt` tiene `Disallow: /api/` explícito |
| PeoplePerHour | `/freelance-jobs.rss` | 404. Su `robots.txt` tiene `Disallow: /*?`, o sea que las URLs de búsqueda con filtros están prohibidas |
| Truelancer | `/api/projects` | 429 desde la primera request |
| Freelancermap (DACH) | `/project-rss.xml`, `/api/v1/projects` | 404 y **401**: la API existe pero pide credenciales |
| Malt (Europa) | `/api/missions` | **401**: misma historia |
| Codeable, Twine | `/api/projects`, `/api/jobs` | 404 |

Los dos 401 son el mismo problema estructural que Upwork: API real, credencial por usuario. No entran por el punto 1.

El resto no expone nada, y donde el `robots.txt` habla, habla en contra: PeoplePerHour prohíbe justo las URLs con filtros y Guru prohíbe `/api/`. Sacar los proyectos de ahí sería scrapear contra la política declarada del sitio.

**Conclusión para el diseño del perfil:** los marketplaces se usan a mano, en el navegador. El skill no busca ahí; ayuda con lo que pasa después de encontrar el posteo, que es donde se pierde la plata. Pegar la oferta a mano es el camino soportado, no un parche.

Nota lateral útil: Lemon.io y Proxify (marketplaces con screening) publican sus búsquedas en Working Nomads, 21 de 50 avisos entre las dos. No se puede filtrar por modalidad ahí, pero dice algo sobre estrategia: pasar el screening de una de esas una vez rinde más que ofertar de a una.

### Fiverr

Modelo invertido: no te postulás a trabajos, publicás gigs y el comprador te encuentra. Los "Buyer Requests" ya no existen como los conocía la gente. No hay cola que scorear.

Queda fuera del scanner por eso, no porque no valga la pena: el lado de la oferta lo cubre `/fiverr-gig` (título, packages, gallery, FAQ y precio derivado del piso).

### Toptal, Gun.io, Braintrust, Arc, Lemon.io

Verticales con screening previo. No hay board público consumible; el acceso se gana pasando su proceso de admisión. Fuera del alcance de un scanner.

### We Work Remotely

Tiene RSS y funciona (`/remote-jobs.rss`, 100 items), pero **el feed de la categoría contract redirige a sí mismo**: `/categories/remote-contract-jobs.rss` devuelve 301 apuntando a la misma URL. Sin categoría de contract usable, el feed general es empleo full-time y no aporta a este perfil.

### Arbeitnow

Sin key y funciona. Tiene `job_types` con `Contract` (7 de ~100), pero es sobre todo ATS alemán y austríaco con puestos permanentes. Marginal: si en algún momento el usuario apunta al mercado DACH, vale agregarlo.

### Jobicy

`https://jobicy.com/api/v2/remote-jobs` · sin key · responde 200 y pagina bien.

Pasa el punto 1 y, a diferencia de RemoteOK y Remotive, **pasa el punto 2**: su `friendlyNotice` pide crédito con link directo y que el botón de postularse apunte a la URL original del feed. Eso un CLI lo cumple, porque ya imprime fuente y URL, y no hay amenaza de suspensión.

Falla el punto 3, que es el que importa: sobre 100 avisos, `jobType` dio **99 Full-Time y 1 Part-Time, ningún contract ni freelance**. Pedir `jobType=contract` devuelve HTTP 400, o sea que el valor no existe. Además el pool está dominado por Customer Support (25) y Sales (19), con solo 10 de Software Engineering.

### Working Nomads

`https://www.workingnomads.com/api/exposed_jobs/` · sin key · 50 avisos por llamada.

**No tiene campo de tipo de contrato.** Las claves son `category_name`, `company_name`, `location`, `tags`, `title`, `url` y nada más, así que no hay forma de filtrar freelance: habría que adivinar por el título, y sobre 50 avisos solo 1 lo mencionaba.

Detalle que igual vale registrar: la cabeza del feed la dominan Proxify (15 de 50) y Lemon.io (6), que son marketplaces de devs freelance. O sea que buena parte de esos puestos *son* contract en la práctica, pero eso es inferencia nuestra y no dato, y esas dos ya están descartadas por screening previo. Adivinar la modalidad desde el nombre de la empresa mete ruido en la cola, que es peor que no traerla.

## El camino que sí llega a los marketplaces: WebSearch

Medido en agosto de 2026. Es la excepción al problema de credenciales, porque la credencial es Claude Code mismo: todo el que instala el perfil ya la tiene.

**Qué funciona.** `WebSearch` con `allowed_domains` devuelve URLs de proyectos reales en Upwork, Workana, Freelancer.com, PeoplePerHour y Guru. Tres búsquedas en paralelo en un turno traen candidatos de cinco plataformas a la vez, con títulos, y a veces con tarifa y stack en el resumen. Ejemplos que devolvió: `upwork.com/job/Golang-Developer_~0157b3a527d0809956/`, `workana.com/es/job/crear-tienda-shopify-ecommerce`.

**Qué no funciona, y es la mitad importante.** `WebFetch` devuelve **403 en todo**: el listado de Workana, la búsqueda de Upwork y hasta las páginas de proyecto individuales que el buscador ya tenía indexadas. Cloudflare bloquea el fetcher. O sea que se puede descubrir la oferta pero **no leerla**: presupuesto, cantidad de propuestas, país del cliente y si tiene el pago verificado siguen requiriendo abrir el link vos.

**Tres límites que hay que decir de frente:**

1. **Frescura.** El índice no filtra por fecha. Una de las ofertas de Upwork que devolvió estaba **posteada en julio de 2021**. Para un marketplace donde una oferta de tres días ya está fría, es un problema serio.
2. **Ruido de SEO.** Cerca de la mitad de los resultados no son ofertas: son landings de "Hire Golang developers", tablas de tarifas y gigs del Project Catalog. Hay que descartarlos por patrón de URL.
3. **El resumen no es dato.** Lo que devuelve la búsqueda es un modelo resumiendo varias páginas: puede mezclar detalles de dos ofertas. Sirve como pista para abrir, no como campo para guardar.

**Conclusión de diseño.** Da para descubrimiento y triage, no para screening ni para una cola confiable. Un skill que haga esto tiene que entregar links para abrir y decir explícitamente que la fecha no está verificada; guardar esos datos en el registro como si fueran ciertos sería peor que no tenerlos.

## Si querés agregar una fuente

1. **Correr la request y mirar el payload**, no la documentación. Las dos APIs incluidas mienten sobre sus propios filtros.
2. **Leer los términos, incluido lo que venga dentro de la respuesta.** RemoteOK y Remotive ponen ahí las condiciones que las descalifican.
3. **Medir el rendimiento freelance real** sobre una muestra y anotarlo acá. Una fuente con 2 ofertas útiles cada 500 no justifica la request.
4. **Confirmar que no necesita credenciales por usuario.** Si las necesita, va como opt-in documentado, no en `SOURCES`.
5. **Agregar los specs** en `tests/freelance/test_freelance_search.py` con un payload fijo. Nada de tests contra la red.
