# Freelance Guardrails (marketplaces y clientes directos)

Buscar empleo es gratis: aplicás a 40 puestos y solo perdés tiempo. Freelancear no. Cada propuesta cuesta algo, cada contrato malo toca tu reputación, y cada "¿me agregás esto rapidito?" sin cobrar sale de tu bolsillo.

Estas cuatro reglas existen porque los tres recursos que se gastan (plata, reputación, tiempo no facturado) no se recuperan.

**El costo de postularse tiene nombre distinto en cada plataforma** y las reglas valen igual: Connects en Upwork, bids en Freelancer.com, y en outreach directo son las horas que ponés en escribir la propuesta. Donde abajo diga Connects, leé "lo que te cuesta postularte".

Las rutas son relativas al career workspace (`./career-workspace/` o env `CAREER_WORKSPACE`).

## 1. Postularse cuesta plata: no se gasta sin screen

Nunca redactar una propuesta para una oferta cuyo cliente no pasó `/client-screen`, ni para una que quedó bajo el umbral de score.

Si el usuario quiere postularse igual a una que falló el screen, se puede - **pero se le dice qué falló y se registra en la nota**. Un pago sin verificar que nadie nombró es una postulación tirada, y peor: es la propuesta que sí te contestan y termina en disputa.

## 2. La reputación se protege rechazando

Ganar un contrato no siempre es bueno. Casi toda plataforma calcula un puntaje sobre contratos cerrados (en Upwork es el Job Success Score) donde un cliente insatisfecho pesa más que dos contentos, y con clientes directos el equivalente son las referencias que no vas a poder pedir. Un contrato con alcance difuso, presupuesto irrealista o cliente sin historial es **riesgo de reputación**, no una oportunidad.

Cuando el screen marca riesgo alto, la recomendación por defecto es no postularse. Decir "no" es una acción del pipeline, no una ausencia de acción.

## 3. Nada se cotiza abajo del piso

Todo bid pasa por el piso declarado en `01-Perfiles/` (tarifa mínima aceptable). El piso es **neto**, después de la comisión de la plataforma: si se queda un 10%, un piso de 40 USD/h exige bidear 45. Con cliente directo la comisión es cero, pero el piso sigue siendo neto de impuestos y de las horas no facturables.

Si el usuario todavía no fijó un piso, `/freelance-scan market` da la mediana de lo que cobran otros con su perfil. Es un punto de partida, no el piso: el piso lo define su costo de vida, no el mercado.

Alcance nuevo, precio nuevo. Ninguna propuesta ni contrato se amplía sin cotizarlo: si el trabajo extra no entra en un change order con número, no entra.

## 4. El envío siempre lo hace el usuario

Ninguna skill de este perfil envía una propuesta, acepta un contrato ni gasta el presupuesto de postulaciones. Se redacta, se revisa, se muestra, y el usuario copia y manda.

Esto no es prudencia nuestra: **la API de Upwork no tiene mutation para postularse ni para gastar Connects**, justamente para frenar bots de auto-bidding, y las demás plataformas prohíben el envío automatizado en sus términos. Ninguna skill debe pretender lo contrario, y una que lo intentara estaría violando los ToS además de esta regla.

El corolario para las **fuentes**: ninguna skill del perfil puede depender de credenciales que cada usuario tenga que conseguir por su cuenta. Este perfil lo instala cualquiera, y una fuente con API key aprobada a mano funciona para uno y está rota para el resto. Las fuentes automáticas son públicas y sin key (ver `skills/freelance-scan/references/platforms.md`); lo demás se pega a mano.

## La estructura no la sostiene este archivo

Una regla sin columna derecha es una intención.

| Regla | Qué la hace cumplir |
|---|---|
| Screen antes de gastar en postularse | `/freelance-proposal` exige la nota de screen; sin ella, pregunta y no redacta |
| Rechazar por riesgo de reputación | `/client-screen` emite veredicto explícito; el agente `client-screener` es adversarial por diseño |
| Piso de tarifa | `/freelance-proposal` lee el piso del perfil y falla ruidoso si el bid queda abajo; `/freelance-scan market` da la referencia de mercado |
| Alcance nuevo, precio nuevo | `/freelance-pipeline` detecta drift de alcance en contratos activos y pide change order |
| Envío manual | Ningún script del perfil escribe a una plataforma: `freelance_search.py` solo lee, y no hay otro |

## Registro

Toda decisión de no postularse se registra igual que una postulación: nota en `03-Aplicaciones/` con `estado: descartado` y el motivo en `## Notas`. Los descartes son la mitad de los datos que `/freelance-pipeline` necesita para decirte si tu criterio de selección funciona.
