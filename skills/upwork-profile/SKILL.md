---
name: upwork-profile
description: "Build the Upwork profile that decides whether clients ever open your proposal: title, the first 250 visible characters of the overview, specialized profiles, portfolio items and rate. Triggers: perfil de upwork, optimizar perfil freelance, titulo de upwork, overview upwork, specialized profile, que tarifa pongo en upwork."
argument-hint: "[audit | title | overview | portfolio | rate]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, WebFetch
---

# Upwork Profile - El perfil de la plataforma

Construís el perfil de Upwork desde el perfil maestro. No es un CV: el CV lo lee alguien que ya decidió considerarte, el perfil de Upwork lo lee alguien que está barriendo una lista de 40 freelancers o revisando propuestas.

Rutas relativas al career workspace (`--workspace`, env `CAREER_WORKSPACE`, o `./career-workspace/`).

Modo: `$ARGUMENTS`

## Inputs

- **El perfil maestro** de `01-Perfiles/` - la fuente de verdad. Si no existe, correr `/master-profile` primero.
- **El perfil actual de Upwork**, si ya existe: URL pública → WebFetch, o pegado.
- **Contratos cerrados** de `08-Contratos/` para los portfolio items con resultados reales.

## Modos

### `audit` - Revisar el perfil actual

Recorrer los cinco elementos de abajo y reportar qué falta o qué está flojo, priorizado por impacto. Empezar siempre por título y las primeras 250 caracteres del overview: son los únicos que se ven sin hacer click.

### `title` - El título

Lo primero y a veces lo único que se lee. Reglas:

- **Nicho específico, no rol genérico.** "Full Stack Developer" compite con 200 mil personas. "Unity Developer - Gameplay & Multiplayer for Mobile" compite con pocas y aparece en las búsquedas que importan.
- Incluir la tecnología o el resultado que el cliente busca en sus palabras, no en las tuyas.
- Sin "Ninja", "Rockstar", "Guru".
- Sin declaraciones de disponibilidad ("Available now") - ocupan lugar y caducan.

### `overview` - Los primeros 250 caracteres

El overview se corta en la vista previa. Todo lo que importa va en el primer bloque.

Estructura:

1. **Primera línea**: a quién ayudás y con qué resultado. No "I am a developer with 5 years of experience" - eso describe tu currículum, no el problema del cliente.
2. **Segundo bloque**: la prueba más fuerte, con número.
3. **Después del corte**: stack, cómo trabajás, tipos de proyecto que tomás, y qué **no** tomás. Decir qué no hacés filtra clientes malos y sube la tasa de respuesta de los buenos.
4. **Cierre**: un CTA simple.

Escribir en primera persona y en el idioma de tu mercado objetivo. Si apuntás a clientes de EEUU, en inglés.

### `portfolio` - Los items

- Cada item es **un problema, lo que hiciste y el resultado con número**. No una captura de pantalla linda sin contexto.
- Priorizar los que se parecen a los trabajos que querés conseguir, no los que más te gustaron.
- Sacar los que no representan el nicho del título: un portfolio disperso comunica "hago cualquier cosa", que es lo contrario de lo que querés.
- Nunca subir trabajo de un cliente sin permiso, ni material bajo NDA. Si no se puede mostrar, se describe el problema y el resultado sin identificar al cliente.

### `rate` - La tarifa publicada

- Se deriva del **piso neto** de `01-Perfiles/` más la comisión de la plataforma, no de lo que cobran otros.
- La tarifa publicada es un filtro, no un compromiso: filtra el tráfico que llega, y podés cotizar distinto por proyecto en cada propuesta.
- Poner una tarifa muy baja para "arrancar" atrae clientes que buscan precio bajo, que son los que más problemas dan y peor califican. Subirla después es más difícil que empezar bien.
- Si el usuario está arrancando sin historial, la palanca correcta es acotar el nicho, no bajar el precio.

## Specialized profiles

Upwork permite perfiles especializados además del general. Sirven cuando el usuario tiene dos nichos con vocabulario distinto (ej. "Unity gameplay" y "backend .NET"): cada uno se presenta a su búsqueda sin diluir al otro.

Si hay un solo nicho, no crear especializados: sumar superficie vacía baja la señal.

## Lo que el perfil no controla

El **Job Success Score** y el badge no se editan: salen de cómo terminaron los contratos. Por eso `freelance-guardrails` dice que rechazar es una acción del pipeline - la protección del JSS se hace eligiendo trabajos, no escribiendo el perfil. Si el usuario está arrancando, no tiene JSS, y ahí el portfolio y el nicho cargan todo el peso.

## Proceso

1. Leer el perfil maestro y el perfil actual de Upwork si existe.
2. Correr el modo pedido (o `audit` si no se indicó ninguno).
3. Proponer los textos como borradores en el chat, con **2 variantes de título** para elegir.
4. Con approval, guardar el resultado en `01-Perfiles/Upwork.md` (derivado del maestro, no reemplazo). El usuario copia y pega en la plataforma - este skill nunca toca la cuenta.
5. Registrar la fecha del último ajuste, para poder correlacionar cambios de perfil con cambios en la tasa de respuesta desde `/freelance-pipeline`.

## Reglas

- Nunca inventar experiencia, clientes ni números.
- Nunca publicar trabajo bajo NDA ni de un cliente sin permiso.
- La tarifa nunca se deriva de la competencia; se deriva del piso.
- Sin guiones largos en los textos generados.

## Handoff

Pedí aprobación (approval) antes de escribir `01-Perfiles/Upwork.md`. Perfil READY cuando título, overview y al menos dos portfolio items están completos. El siguiente paso es `/upwork-scan` para armar la primera cola de ofertas, o `/portfolio-site` si el usuario quiere un portfolio propio fuera de la plataforma.
