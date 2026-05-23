# Versioning & Deprecation - API Design

## Versioning

- **Default:** URL path (`/v1/`) — simple, cacheable, grep-friendly
- **Non-breaking** (no bump): add optional field, new endpoint, new enum value, relax validation
- **Breaking** (requires bump): remove/rename field, change type, change status codes, tighten validation, change date/ID/pagination format

## Deprecation Flow

1. Announce via changelog + docs
2. Response headers: `Deprecation: true`, `Sunset: <date>`, `Link: <migration-guide>`
3. Monitor usage by client_id. Reminders at 1 month and 1 week before sunset
4. Return `410 Gone` after sunset

**Support windows:** Web 6 months min, Mobile 12 months + min-version forcing, max 2 major versions alive.

## Webhooks Outbound

- HMAC signature: `X-Signature: sha256=<hmac(payload, secret)>`
- Timestamp anti-replay: reject if delta > 5 min
- Retry exponential backoff: 1m, 5m, 30m, 2h, 12h
- Minimal payload + URL for detail fetch; dashboard for failed deliveries
