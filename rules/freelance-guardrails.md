# Freelance Guardrails (Upwork y marketplaces)

Buscar empleo es gratis: aplicás a 40 puestos y solo perdés tiempo. Freelancear no. Cada propuesta cuesta Connects, cada contrato malo toca tu reputación, y cada "¿me agregás esto rapidito?" sin cobrar sale de tu bolsillo.

Estas cuatro reglas existen porque los tres recursos que se gastan (plata, reputación, tiempo no facturado) no se recuperan.

Las rutas son relativas al career workspace (`./career-workspace/` o env `CAREER_WORKSPACE`).

## 1. Los Connects son plata: no se gastan sin screen

Nunca redactar una propuesta para una oferta cuyo cliente no pasó `/client-screen`, ni para una que quedó bajo el umbral de score.

Si el usuario quiere postularse igual a una que falló el screen, se puede - **pero se le dice qué falló y se registra en la nota**. Un `payment method: unverified` que nadie nombró es un Connect tirado, y peor: es la propuesta que sí te contestan y termina en disputa.

## 2. La reputación se protege rechazando

Ganar un contrato no siempre es bueno. En Upwork el Job Success Score se calcula sobre contratos cerrados, y un cliente insatisfecho pesa más que dos contentos. Un contrato con alcance difuso, presupuesto irrealista o cliente sin historial es **riesgo de JSS**, no una oportunidad.

Cuando el screen marca riesgo alto, la recomendación por defecto es no postularse. Decir "no" es una acción del pipeline, no una ausencia de acción.

## 3. Nada se cotiza abajo del piso

Todo bid pasa por el piso declarado en `01-Perfiles/` (tarifa mínima aceptable). El piso es **neto**, después de la comisión de Upwork: si la plataforma se queda un 10%, un piso de 40 USD/h exige bidear 45.

Alcance nuevo, precio nuevo. Ninguna propuesta ni contrato se amplía sin cotizarlo: si el trabajo extra no entra en un change order con número, no entra.

## 4. El envío siempre lo hace el usuario

Ninguna skill de este perfil envía una propuesta, acepta un contrato ni gasta Connects. Se redacta, se revisa, se muestra, y el usuario copia y manda.

Esto no es prudencia nuestra: **la API de Upwork no tiene mutation para postularse ni para gastar Connects**, justamente para frenar bots de auto-bidding. Ninguna skill debe pretender lo contrario, y una que lo intentara estaría violando los ToS de la plataforma además de esta regla.

## La estructura no la sostiene este archivo

Una regla sin columna derecha es una intención.

| Regla | Qué la hace cumplir |
|---|---|
| Screen antes de gastar Connects | `/upwork-proposal` exige la nota de screen; sin ella, pregunta y no redacta |
| Rechazar por riesgo de JSS | `/client-screen` emite veredicto explícito; el agente `client-screener` es adversarial por diseño |
| Piso de tarifa | `/upwork-proposal` lee el piso del perfil y falla ruidoso si el bid queda abajo |
| Alcance nuevo, precio nuevo | `/freelance-pipeline` detecta drift de alcance en contratos activos y pide change order |
| Envío manual | Ninguna skill del perfil declara permisos de red hacia Upwork; no hay script que postule |

## Registro

Toda decisión de no postularse se registra igual que una postulación: nota en `03-Aplicaciones/` con `estado: descartado` y el motivo en `## Notas`. Los descartes son la mitad de los datos que `/freelance-pipeline` necesita para decirte si tu criterio de selección funciona.
