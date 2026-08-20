---
name: fiverr-gig
description: "Construye el gig de Fiverr: titulo I will, tags de busqueda, los tres packages con precio derivado del piso neto, gallery, FAQ y requirements. Triggers: gig de fiverr, fiverr, packages basic standard premium, precio del gig, tags de fiverr, vender en fiverr."
argument-hint: "[audit | title | packages | gallery | faq | price]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, WebFetch
---

# Fiverr Gig - El lado de la oferta

Fiverr funciona al revés que Upwork: **no te postulás, publicás.** El gig queda parado y el
comprador te encuentra buscando. Los Buyer Requests ya no existen, así que no hay cola de ofertas
que scorear - por eso `/freelance-scan` excluye Fiverr a propósito, y este skill es el que cubre lo
que ahí falta.

Consecuencia práctica: un gig es un **activo**, no una postulación. Se escribe una vez bien y se
itera con datos (impresiones → clicks → órdenes), no se reescribe por cada cliente.

Rutas relativas al career workspace (`--workspace`, env `CAREER_WORKSPACE`, o `./career-workspace/`).

Modo: `$ARGUMENTS`

## Inputs

- **El perfil maestro** de `01-Perfiles/` - la fuente de verdad del nicho, el stack y los números.
  Si no existe, correr `/master-profile` primero.
- **El piso de tarifa neto** definido en `/freelance-hunt`. Sin piso no se puede fijar precio: se
  estaría adivinando.
- **El gig actual**, si ya existe: URL pública → WebFetch, o pegado.

## Modos

### `audit` - Revisar el gig actual

Recorrer los cinco elementos de abajo y reportar qué falta, priorizado por impacto. Empezar siempre
por **título, primera imagen de la gallery y precio del Basic**: son los únicos tres que se ven en
los resultados de búsqueda, antes de que alguien haga click.

### `title` - El título

Arranca con `I will` por convención de la plataforma, y es lo que indexa la búsqueda.

- **Nicho concreto, no rol.** "I will develop your Unity game" compite con todo el mundo. "I will
  build multiplayer gameplay for your Unity mobile game" compite con pocos y aparece en la búsqueda
  que importa.
- Las palabras que usa el comprador, no las tuyas. El comprador no busca "gameplay architecture",
  busca "multiplayer".
- Sin superlativos ni "professional": no aportan y ocupan caracteres que sí indexan.
- **Los tags (hasta 5) son parte del título, funcionalmente.** Elegirlos del mismo vocabulario, sin
  repetir la misma palabra cinco veces.

Proponer siempre **2 variantes** para elegir.

### `packages` - Los tres niveles

El error clásico es hacer tres versiones del mismo trabajo con distinto precio. Los packages tienen
que separarse por **alcance**, no por velocidad ni por ganas.

| | Basic | Standard | Premium |
|---|---|---|---|
| Qué es | La unidad mínima entregable y útil | **El que se quiere vender** | El techo, para el comprador que ya decidió |
| Alcance | Una cosa, definida | Lo del Basic más lo que casi todos terminan pidiendo | Alcance completo, con lo que consume tiempo real |
| Rol | Filtro de entrada y precio de referencia | Ancla: se compara contra los otros dos y gana | Sube el promedio y hace que el Standard parezca razonable |

Reglas duras:

- **El alcance va escrito en el package.** Lo que no está escrito es scope creep sin change order
  posible: en Fiverr no hay renegociación a mitad de camino, hay una orden con un alcance.
- **Revisiones con número.** "Unlimited revisions" es una promesa que destruye el margen y no se
  puede retirar sin cancelar la orden.
- **Delivery time realista, no competitivo.** Entregar tarde pega en el nivel de la cuenta, que no
  se edita. Un día extra en el gig cuesta menos que una entrega tarde.
- Los **gig extras** son para lo que es genuinamente opcional (fuente editable, licencia comercial,
  entrega express), no para partir en pedazos algo que el package ya prometió.

### `gallery` - Lo que se ve

- **La primera imagen es el gig en la búsqueda.** Tiene que leerse en miniatura: una idea, texto
  grande, cero decoración.
- Después: el resultado real, no el proceso. Un before/after gana a cualquier mockup.
- Video corto si el trabajo se entiende mejor en movimiento (animación, gameplay, motion).
- Nunca material de un cliente sin permiso ni bajo NDA. Si no se puede mostrar, se reconstruye un
  ejemplo propio equivalente y **se dice que es un ejemplo**.

### `faq` - Las objeciones, adelantadas

Cada FAQ existe para sacar una objeción del camino antes de que alguien escriba un mensaje. Las que
casi siempre hacen falta: qué necesitás para arrancar, qué pasa si no gusta, si el precio incluye
la fuente editable, si se puede usar comercialmente, qué **no** incluye el gig.

Decir qué no hacés filtra al comprador equivocado, que es el que después califica mal.

### `price` - El precio

- Se deriva del **piso neto** de `01-Perfiles/` más la comisión de la plataforma. Fiverr retiene un
  porcentaje del valor de la orden (históricamente 20%): verificar el vigente antes de fijar, y
  cargarlo sobre el piso, no descontarlo del precio pensado.
- El precio del Basic es el que aparece en la búsqueda: es filtro de tráfico, no la venta esperada.
- **Arrancar barato para conseguir las primeras reviews es una trampa conocida**: atrae compradores
  de precio, que son los que más piden y peor califican, y las reviews que dejan son las que
  después determinan el nivel de la cuenta. Si falta historial, la palanca es **acotar el nicho**,
  no bajar el precio.
- Un gig con precio arriba del mercado y nicho angosto convierte peor en volumen y mejor en plata.
  Esa es la elección, y la hace el usuario, no el skill.

## Lo que el gig no controla

El **nivel de la cuenta** (New Seller → Level 1 → Level 2 → Top Rated) y la métrica de respuesta no
se editan: salen de órdenes completadas, calificaciones, entregas a tiempo y tiempo de respuesta.
Es el mismo problema que el Job Success Score en Upwork, y se protege igual - eligiendo qué órdenes
se aceptan y qué alcance se promete, no escribiendo mejor el gig.

Las **impresiones** tampoco: dependen del algoritmo de búsqueda. Lo que el gig sí controla es la
conversión de impresión a click (título y primera imagen) y de click a orden (packages y FAQ). Si
las impresiones son bajas, el problema es el nicho o los tags; si son altas y no hay órdenes, el
problema son los packages o el precio.

## Proceso

1. Leer el perfil maestro y el piso de tarifa. Si falta el piso, parar y mandar a `/freelance-hunt`.
2. Correr el modo pedido (o `audit` si no se indicó ninguno).
3. Proponer los textos como borradores en el chat, con 2 variantes de título y la tabla de los tres
   packages completa, incluyendo delivery time y revisiones.
4. Con approval, guardar en `01-Perfiles/Fiverr-<slug-del-gig>.md` (derivado del maestro, no
   reemplazo). El usuario copia y pega en la plataforma - **este skill nunca toca la cuenta.**
5. Anotar la fecha de publicación o del último ajuste, para poder correlacionarla después con
   impresiones y órdenes.

Un gig por nicho. Dos gigs que compiten por la misma búsqueda se canibalizan las impresiones.

## Reglas

- Nunca inventar experiencia, clientes ni números.
- Nunca prometer en el package algo que no está en el alcance escrito.
- Nunca "unlimited" nada.
- El precio se deriva del piso, nunca de la competencia.
- Sin guiones largos en los textos generados.

## Handoff

Pedí aprobación (approval) antes de escribir en `01-Perfiles/`. Gig **READY** cuando título, los
tres packages con alcance y delivery, primera imagen definida y al menos tres FAQ están completos.

Después: `/freelance-pipeline` para medir el gig con las órdenes que entren (el embudo de Fiverr es
impresiones → clicks → órdenes, no propuestas enviadas), `/freelance-profile` si además va a
trabajar en Upwork, y `/portfolio-site` si quiere un portfolio propio fuera de las plataformas.
