# API de Upwork - lo que se puede y lo que no

Estado al 2026-08. Antes de escribir código contra esto, verificar en la documentación oficial: los cambios de la plataforma no avisan.

## Lo primero: no hay auto-bidding

**La API no tiene mutation para enviar una propuesta ni para gastar Connects.** Las escrituras que consumen Connects están cerradas a la UI de Upwork, a propósito, para frenar bots de auto-bidding.

Esto no es una limitación a rodear: define la forma del perfil. `upwork-scan` lee y scorea; `/upwork-proposal` redacta; **el envío lo hace el usuario a mano**. Cualquier intento de automatizar el envío viola los ToS y arriesga la cuenta del usuario.

## Los RSS feeds están muertos

Discontinuados el **20 de agosto de 2024**, por la misma razón: bots que enviaban propuestas generadas automáticamente segundos después de publicarse una oferta.

Cualquier tutorial, extensión o post que proponga usar RSS para alertas de Upwork está desactualizado. El reemplazo oficial son las búsquedas guardadas dentro de la plataforma.

## Obtener la API key

Desde la cuenta de Upwork, logueado. **No requiere cuenta de empresa**: cualquier freelancer o cliente, en cualquier plan de membresía, puede pedirla.

El formulario pide:

1. Descripción corta de para qué vas a usar la API.
2. Si la exponés a terceros o es uso personal.
3. Si sos cliente, dueño de agencia, o developer pidiendo en nombre de un cliente.
4. Aceptar un volumen de requests razonable.

**Respuesta por mail en hasta 2 semanas**, aprobando o rechazando. El motivo de rechazo más común es data de cuenta incompleta o información mal puesta en el formulario, así que completar el perfil antes de pedirla.

## Forma técnica

- **GraphQL** sobre `api.upwork.com/graphql`, con **OAuth 2.0**.
- Cubre lecturas: búsqueda de ofertas, perfiles, contratos, mensajería, y suscripciones a eventos vía webhooks.
- **Límites**: 40.000 requests por día y hasta 10 por segundo por IP. Pasarse devuelve HTTP 429.

Para este perfil los límites son holgados: una corrida de scan son unidades de requests, no miles.

## Por qué este repo todavía no tiene un script

No hay script de API en `scripts/` por una razón simple: **no se puede verificar sin key**, y este repo no shippea código que no corrió. Escribir un cliente GraphQL a ciegas contra una API que requiere aprobación manual produce exactamente el tipo de código que falla en la primera corrida real del usuario.

Cuando haya key aprobada, el trabajo es:

1. Explorar la query de búsqueda con el GQL Explorer de la consola de Upwork, con la key real.
2. Escribir el script en `scripts/` siguiendo el patrón de `job-scrape` (Python stdlib-only, subcomando `search` y `detail`, salida JSON).
3. Declarar los permisos en `profiles/freelance.yaml`.
4. Verificar contra la salida del modo manual sobre la misma oferta: mismos campos, mismos valores.
5. Guardar el token y el secret **fuera del workspace** (variables de entorno), nunca en una nota ni en un archivo versionado.

Hasta entonces, el modo manual de `/upwork-scan` es el camino, y funciona.

## Fuentes

- Documentación GraphQL: `https://www.upwork.com/developer/documentation/graphql/api/docs/index.html`
- Developer Space y API Center: `https://www.upwork.com/developer`
- Pedir API key: `https://support.upwork.com/hc/en-us/articles/17995842326931--Request-an-API-key`
- Límites de requests: `https://support.upwork.com/hc/en-us/articles/115015933428-What-are-the-API-requests-limits`
- Deprecación de RSS: `https://support.upwork.com/hc/en-us/articles/52052528243731-RSS-deprecation`
