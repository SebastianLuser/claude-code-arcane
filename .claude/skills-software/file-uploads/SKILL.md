---
name: file-uploads
description: "File upload decision guide: signed URLs, validation, storage, virus scanning, image processing, UX. Use for: upload, file storage, attachment, avatar, image, document, GCS, S3, presigned."
argument-hint: "[stack: go|ts|react|rn]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# file-uploads — Decision Guide

Default storage: **GCS**. Logic identical for S3/R2 — adapt provider SDK.

## Upload Strategy Decision

| Strategy | When | Trade-off |
|---|---|---|
| **Signed URL (direct)** | Default for all uploads | Backend never touches bytes; scales trivially |
| **Server proxy** | <100KB parsed inline (small CSV) | Simple but consumes backend RAM; no scale |
| **Resumable/multipart** | >100MB (videos, datasets) | 8-32MB chunks; resume on failure |
| **tus protocol** | Vendor-neutral resumable | Requires tusd server |

## Signed URL Flow

```
Client → POST /uploads/sign → Backend (validate, create pending row, return signed URL)
Client → PUT bytes → Storage (uploads-pending/)
Storage → Event (Pub/Sub) → Worker (MIME sniff + virus scan)
Worker → if clean: move to uploads-clean/, update DB status
```

Key decisions:
- Backend **never touches bytes** — only signs and tracks
- **Two buckets**: uploads-pending (quarantine) + uploads-clean (served)
- Key is **UUID**, never client filename (PII, collisions, path traversal)
- Signed URL expiry: **<=15min**; include content-length constraint in signature
- Multi-tenant: `t/{tenant}/u/{user}/{uuid}` key path

## Validation Checklist

| Check | Where | Detail |
|---|---|---|
| MIME whitelist | Sign + Worker (sniff) | Whitelist only; sniff first 512 bytes server-side |
| Size limit | Sign + URL constraint | Enforce per use case (10MB avatar, 100MB doc) |
| Virus scan | Worker (async) | ClamAV / Cloudmersive / VirusTotal; never serve status != clean |
| Content-Type match | Worker | Sniffed vs declared; reject on mismatch |
| Checksum | Worker (post-scan) | SHA-256 stored for integrity |

Never trust client Content-Type or file extension alone.

## Storage Decision

| Provider | When | Notes |
|---|---|---|
| **GCS** | Default (GCP) | V4 signed URLs, Pub/Sub, Cloud CDN |
| **S3** | AWS stack | Presigned URLs, EventBridge, CloudFront |
| **R2** | Egress-sensitive | S3-compatible, zero egress fees |

## Image Processing

- **On upload** (worker): predictable sizes — avatars, thumbnails
- **On demand** (CDN): many sizes — Cloudflare Images or imgproxy
- Always WebP/AVIF for delivery; generate thumbnails async, never in request

## Status Machine

`pending` → `scanning` → `clean` | `infected` (deleted) | `rejected` (deleted)

DB columns: id, owner_id, tenant_id, bucket, key, mime, size, checksum_sha256, status, scanned_at, created_at.

## UX Patterns

- Progress (web): XHR `upload.onprogress` — fetch lacks upload progress
- Progress (RN): expo-file-system `uploadAsync`
- >100MB: switch to resumable with per-chunk retry + exponential backoff
- Show placeholder until `status=clean`; poll or WebSocket for completion

## Anti-Patterns

- Proxying bytes through backend — wastes RAM, crashes pods
- Trusting extension or client Content-Type without server sniff
- Client filename as key — PII, collisions, traversal
- Serving pending/scanning files; sync virus scan in request
- Signed URLs >15min; no size limit; any-MIME allowed
- Public buckets; missing CORS; no rate limit on /uploads/sign

## Review Checklist

- [ ] Signed URL <=15min; content-length in signature
- [ ] MIME whitelist at sign AND worker (real sniff)
- [ ] UUID key, never client filename
- [ ] Separate pending/clean buckets; virus scan before serving
- [ ] DB status machine (pending→scanning→clean)
- [ ] SHA-256 checksum post-scan; CORS on bucket
- [ ] Rate limit on /uploads/sign; tenant_id in path
- [ ] Thumbnails async; CDN for clean files; structured logs
