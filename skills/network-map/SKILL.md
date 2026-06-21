---
name: network-map
description: "Turn your LinkedIn connections data export into warm-intro intelligence: find your 1st-degree contacts at a target company, identify likely warm-intro paths, and draft a tailored outreach message per contact. Triggers: red de contactos, networking LinkedIn, contactos en una empresa, warm intro, referido, quien conozco en, LinkedIn connections export."
argument-hint: "[company] | import <path-to-Connections.csv>"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Network Map — Inteligencia de contactos para warm intros

Convertís el **export de conexiones de LinkedIn** en inteligencia accionable: dado un target company, quién de tu red 1er-grado trabaja (o trabajó) ahí, quién puede darte un warm intro, y un mensaje custom por contacto. Reemplaza a LinkedIn Premium para esto: solo necesitás tu propio export + Claude.

## Conseguir el export (una vez)

En LinkedIn → **Settings → Data Privacy → Get a copy of your data → Download**. En el ZIP viene `Connections.csv` (tus 1er-grado con nombre, URL, empresa, posición, fecha de conexión). Pasáselo a la skill.

> **Privacidad:** `Connections.csv` es data personal de terceros. Guardalo en `05-Contactos/` del workspace y **nunca** lo commitees a un remoto. Trabajalo localmente.

## Qué produce

Dado un target company:
1. **1er-grado en la empresa** — contactos tuyos que trabajan ahí ahora (match por `Company`).
2. **Paths de warm intro** — contactos 1er-grado que probablemente conozcan gente del target (ej. ex-empleados de la empresa, gente del mismo rubro/rol) y podrían presentarte. *Nota honesta:* el export solo tiene tus 1er-grado; el verdadero 2do-grado (las conexiones de ellos) no está en el archivo. Lo que hacemos es **inferir** buenos candidatos a intro desde tus 1er-grado (empleo actual/pasado en el target, overlap de empresa/rol), no leer la red de cada uno.
3. **Mensaje por contacto** — template custom según historia compartida (misma empresa pasada, mismo rubro, conexión vieja vs reciente).

## El motor

`scripts/network_map.py` parsea `Connections.csv` (maneja el preámbulo del export) y filtra/rankea por empresa.

```bash
# Contactos en una empresa
python scripts/network_map.py --csv "05-Contactos/Connections.csv" --company "Acme"

# Top empresas donde tenés más contactos (descubrir oportunidades)
python scripts/network_map.py --csv "05-Contactos/Connections.csv" --top-companies
```

Devuelve nombre, posición, empresa, URL del perfil y fecha de conexión. Vos (Claude) tomás esa salida y armás los paths de intro y los mensajes.

## Modos

### `import <path>` — Registrar el export
Copiar/referenciar `Connections.csv` en `05-Contactos/`, verificar que parsea (corré el script con `--top-companies`), y reportar tamaño de la red + top empresas.

### `[company]` — Mapear una empresa
1. Correr el script filtrando por la empresa.
2. Clasificar: 1er-grado actuales en la empresa vs candidatos a warm-intro (ex-empleados / mismo rubro).
3. Priorizar por relevancia (seniority/rol vs tu objetivo) y calidez (conexión reciente, historia compartida).
4. Draftear un mensaje por contacto top (apoyate en `/cold-outreach` para el tono y los templates).
5. Guardar contactos relevantes como notas en `05-Contactos/` (template `Contacto`).

## Reglas

- Data de terceros: tratamiento local, nunca a un remoto sin confirmación; respetá privacidad.
- No inventar relaciones ni 2do-grado que el export no soporta — sé explícito sobre qué es dato y qué es inferencia.
- Calidad sobre cantidad: 5 contactos bien elegidos > 50 mensajes genéricos.

## Handoff

Pedí aprobación (approval) antes de escribir notas de contacto o copiar el CSV al workspace. Cuando el mapa está READY, el siguiente paso es `/cold-outreach` para redactar los mensajes y agendar follow-ups.
