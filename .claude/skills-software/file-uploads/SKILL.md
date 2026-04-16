---
name: file-uploads
description: Implementación segura de uploads de archivos en stack Educabot (Go+TS backends, React+Vite+TS, React Native). Cubre signed URLs directas a GCS/S3, multipart/resumable, validación MIME real, virus scanning async con ClamAV, thumbnails, y schema de tracking. Usar cuando se mencione upload, subir archivo, attachment, file storage, avatar, imagen, documento, adjunto, GCS, S3, presigned.
---

# File Uploads — Skill Educabot

Guía práctica para implementar uploads de archivos en proyectos Educabot. Default: **GCS** (stack corporativo). Si el proyecto usa AWS, adaptá a S3 (la lógica es idéntica).

## Cuándo usar

- Avatares, imágenes de producto, assets de juego, documentos PDF, tareas subidas por alumnos.
- Cualquier flujo donde el cliente (web o mobile) envía bytes al servidor.
- Integraciones con CMS, exports, importers.

## NO usar cuando

- El archivo es chico (<100KB) y transaccional (ej: CSV de 50 filas que se parsea inline). Ahí va directo al endpoint.
- Es binario generado por el backend (reports, PDFs server-side). No aplica flujo de upload.
- Se suben secrets/credenciales. Esos van por otro canal (secret manager).

---

## 1. Arquitectura recomendada (signed URLs directas)

Flujo estándar **cliente → GCS directo**, el backend nunca toca los bytes:

```
[Cliente] --(1) POST /uploads/sign--> [Backend]
[Cliente] <--(2) {uploadUrl, fileId}-- [Backend]   // inserta row status=pending
[Cliente] --(3) PUT bytes-------------> [GCS bucket: uploads-pending/]
[GCS] --(4) Event (Pub/Sub)-----------> [Worker]
[Worker] --(5) ClamAV scan-------------> [Worker]
[Worker] --(6) move + update status----> [GCS bucket: uploads-clean/] + DB
```

Beneficios: no gastás ancho de banda ni RAM del backend, escala trivial, el backend solo firma URLs.

---

## 2. Backend Go — Generar signed URL (GCS)

```go
package uploads

import (
	"context"
	"fmt"
	"time"

	"cloud.google.com/go/storage"
	"github.com/google/uuid"
)

type SignRequest struct {
	Filename    string `json:"filename"`     // solo para logging/UX, NO se usa como key
	ContentType string `json:"contentType"`  // hint, se re-valida post-upload
	Size        int64  `json:"size"`
}

type SignResponse struct {
	FileID    string `json:"fileId"`
	UploadURL string `json:"uploadUrl"`
	Key       string `json:"key"`
}

const (
	MaxSize       = 100 * 1024 * 1024 // 100MB para PUT simple
	PendingBucket = "educabot-uploads-pending"
)

var allowedMIME = map[string]bool{
	"image/jpeg":      true,
	"image/png":       true,
	"image/webp":      true,
	"application/pdf": true,
}

func (s *Service) Sign(ctx context.Context, userID, tenantID string, req SignRequest) (*SignResponse, error) {
	if req.Size > MaxSize {
		return nil, ErrFileTooLarge
	}
	if !allowedMIME[req.ContentType] {
		return nil, ErrMimeNotAllowed
	}

	fileID := uuid.NewString()
	key := fmt.Sprintf("t/%s/u/%s/%s", tenantID, userID, fileID) // UUID, NO filename del cliente

	url, err := s.gcs.Bucket(PendingBucket).SignedURL(key, &storage.SignedURLOptions{
		Method:      "PUT",
		Expires:     time.Now().Add(15 * time.Minute),
		ContentType: req.ContentType,
		Scheme:      storage.SigningSchemeV4,
	})
	if err != nil {
		return nil, err
	}

	// insert row status=pending
	if err := s.repo.CreatePending(ctx, File{
		ID: fileID, OwnerID: userID, TenantID: tenantID,
		Bucket: PendingBucket, Key: key,
		MIME: req.ContentType, Size: req.Size, Status: StatusPending,
	}); err != nil {
		return nil, err
	}

	return &SignResponse{FileID: fileID, UploadURL: url, Key: key}, nil
}
```

## 3. Backend TS (Node) — Alternativa

```ts
import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";

const storage = new Storage();
const bucket = storage.bucket("educabot-uploads-pending");

export async function signUpload(opts: {
  userId: string; tenantId: string;
  contentType: string; size: number;
}) {
  if (opts.size > 100 * 1024 * 1024) throw new Error("file_too_large");
  if (!ALLOWED_MIME.has(opts.contentType)) throw new Error("mime_not_allowed");

  const fileId = randomUUID();
  const key = `t/${opts.tenantId}/u/${opts.userId}/${fileId}`;

  const [uploadUrl] = await bucket.file(key).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000,
    contentType: opts.contentType,
  });

  await db.files.insert({ id: fileId, ownerId: opts.userId, tenantId: opts.tenantId,
    bucket: bucket.name, key, mime: opts.contentType, size: opts.size, status: "pending" });

  return { fileId, uploadUrl, key };
}
```

---

## 4. Validación MIME real (sniffing, post-upload)

**Nunca** confíes en `Content-Type` ni extensión. En el worker, descargá los primeros bytes y sniffeá:

```go
import "net/http"

func detectMIME(r io.Reader) (string, error) {
	buf := make([]byte, 512)
	n, err := r.Read(buf)
	if err != nil && err != io.EOF { return "", err }
	return http.DetectContentType(buf[:n]), nil
}
```

En Node: `file-type` npm package (`await fileTypeFromBuffer(buf)`).

Si el MIME sniffed no matchea el declarado → marcar `status=rejected` y borrar.

---

## 5. Virus scanning async (ClamAV)

Worker post-upload, triggered por evento GCS (Pub/Sub → Cloud Run/Worker):

```go
func (w *Worker) HandleUploadEvent(ctx context.Context, ev GCSEvent) error {
	// 1. update status=scanning
	if err := w.repo.SetStatus(ctx, ev.FileID, StatusScanning); err != nil { return err }

	// 2. stream desde GCS a ClamAV (clamd INSTREAM)
	rc, err := w.gcs.Bucket(ev.Bucket).Object(ev.Key).NewReader(ctx)
	if err != nil { return err }
	defer rc.Close()

	result, err := w.clamav.ScanStream(rc)
	if err != nil { return err }

	if result.Infected {
		w.gcs.Bucket(ev.Bucket).Object(ev.Key).Delete(ctx)
		return w.repo.SetStatus(ctx, ev.FileID, StatusInfected)
	}

	// 3. mover a bucket clean
	src := w.gcs.Bucket(ev.Bucket).Object(ev.Key)
	dst := w.gcs.Bucket(CleanBucket).Object(ev.Key)
	if _, err := dst.CopierFrom(src).Run(ctx); err != nil { return err }
	src.Delete(ctx)

	// 4. checksum + status=clean
	checksum := computeSHA256(ctx, dst)
	return w.repo.MarkClean(ctx, ev.FileID, checksum)
}
```

Alternativa managed: **Cloudmersive** o **VirusTotal API** si no querés operar ClamAV.

**Regla de oro**: no servir archivos con `status != clean`.

---

## 6. Schema DB

```sql
CREATE TABLE files (
  id              UUID PRIMARY KEY,
  owner_id        UUID NOT NULL,
  tenant_id       UUID NOT NULL,
  bucket          TEXT NOT NULL,
  key             TEXT NOT NULL,
  mime            TEXT NOT NULL,
  size            BIGINT NOT NULL,
  checksum_sha256 TEXT,
  status          TEXT NOT NULL CHECK (status IN
                    ('pending','scanning','clean','infected','rejected')),
  scanned_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (bucket, key)
);
CREATE INDEX idx_files_owner ON files(owner_id);
CREATE INDEX idx_files_status ON files(status) WHERE status != 'clean';
```

---

## 7. Cliente React (Vite+TS) con progress

```tsx
export async function uploadFile(file: File) {
  // 1. pedir signed URL
  const { fileId, uploadUrl } = await api.post("/uploads/sign", {
    filename: file.name, contentType: file.type, size: file.size,
  });

  // 2. PUT directo a GCS con progress (XHR porque fetch no expone upload progress)
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress((e.loaded / e.total) * 100);
    };
    xhr.onload = () => xhr.status < 300 ? resolve(fileId) : reject(xhr.statusText);
    xhr.onerror = () => reject(xhr.statusText);
    xhr.send(file);
  });
}
```

## 8. Cliente React Native (Expo)

```ts
import * as FileSystem from "expo-file-system";

export async function uploadFile(localUri: string, mime: string, size: number) {
  const { fileId, uploadUrl } = await api.post("/uploads/sign", {
    filename: "upload", contentType: mime, size,
  });

  const res = await FileSystem.uploadAsync(uploadUrl, localUri, {
    httpMethod: "PUT",
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: { "Content-Type": mime },
  });

  if (res.status >= 300) throw new Error("upload_failed");
  return fileId;
}
```

---

## 9. Archivos grandes: resumable / multipart

Para archivos **>100MB** (videos de clases, datasets):

- **GCS resumable upload**: generá session URI con `x-goog-resumable: start`, el cliente sube en chunks de 8–32MB y puede reanudar.
- **tus protocol** (con `tus-js-client` + `tusd` server) si querés vendor-neutral.
- **S3 multipart**: `CreateMultipartUpload` → N× `UploadPart` (signed) → `CompleteMultipartUpload`.

Regla: si `size > 100MB` el endpoint `/uploads/sign` devuelve flujo resumable en vez de PUT simple.

---

## 10. Imágenes: optimización y thumbnails

Worker post-scan (solo si `mime` empieza con `image/`):

**Go** con `github.com/disintegration/imaging`:

```go
img, _ := imaging.Decode(rc)
thumb := imaging.Fit(img, 400, 400, imaging.Lanczos)
imaging.Encode(w, thumb, imaging.WebP)
```

**Node** con `sharp`:

```ts
await sharp(buffer).resize(400, 400, { fit: "inside" }).webp({ quality: 80 }).toBuffer();
```

Servir via CDN con transformaciones on-the-fly (Cloudflare Images, imgproxy, GCS + Cloud CDN).

---

## Anti-patterns

- ❌ Subir bytes al backend y reenviar a GCS (consume ancho de banda, RAM, tumba el pod con archivos grandes).
- ❌ Confiar en extensión del archivo (`.pdf` puede ser un `.exe` renombrado).
- ❌ Confiar en `Content-Type` del cliente sin sniff real.
- ❌ Usar el filename original como key (PII, colisiones, path traversal con `../`).
- ❌ Servir archivos con `status=pending` o `scanning` — esperar a `clean`.
- ❌ Hacer scan sincrónico en el request — timeout garantizado.
- ❌ Signed URLs con expiración larga (>15min). 
- ❌ Permitir cualquier MIME — siempre whitelist, nunca blacklist.
- ❌ No setear límite de tamaño en la signed URL (atacante sube 10GB).
- ❌ Usar `fetch` para upload si necesitás progress bar (usar XHR).

---

## Checklist review

- [ ] Signed URL expira en ≤15min.
- [ ] `Content-Length` o `x-goog-content-length-range` en la firma (limita tamaño server-side).
- [ ] Whitelist de MIMEs, validada en sign Y en worker (sniff real).
- [ ] Key es UUID, nunca filename del cliente.
- [ ] Bucket `uploads-pending` separado de `uploads-clean`.
- [ ] Virus scan async antes de exponer el archivo.
- [ ] Row en DB con `status` transicional (pending→scanning→clean).
- [ ] Checksum SHA-256 guardado post-scan.
- [ ] CORS configurado en el bucket para el dominio del cliente.
- [ ] Rate limit en `/uploads/sign` (evitar abuse).
- [ ] `tenant_id` en el path para aislamiento multi-tenant.
- [ ] Thumbnails generados async, no en request.
- [ ] CDN con cache headers para archivos clean.
- [ ] Logs estructurados: fileId, userId, size, duración scan.

---

## Output final

- ✅ Cliente sube directo a GCS, backend no toca bytes.
- ✅ MIME validado por sniffing real post-upload.
- ✅ ClamAV scan async, quarantine hasta OK.
- ✅ UUIDs como keys, nada de PII en el path.
- ✅ Schema `files` con status machine clara.
- ✅ Resumable/multipart para >100MB.
- ✅ Thumbnails y optimización de imágenes en worker.
- ✅ Progress en cliente React (XHR) y RN (expo-file-system).

---

## Delegación

- **UI del uploader** (drag & drop, previews, estados): delegar a `ui-ux-pro-max`.
- **Schema + migration** de la tabla `files`: delegar a `scaffold-go` o `db-diagram` para visualización.
- **Endpoint Go boilerplate** (`/uploads/sign`, worker): `scaffold-go`.
- **Deps audit** (sharp, imaging, clamav client): `deps-audit`.
- **Documentar API** de `/uploads/*`: `api-docs`.
- **RFC técnico** del flujo completo: `doc-rfc`.
- **Pre-deploy**: `deploy-check` (verificar secrets de GCS, buckets creados, CORS).
