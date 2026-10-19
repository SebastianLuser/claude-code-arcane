# Operate: S3

## Secure by default

- **Block Public Access** on at the account level; serve public content through CloudFront with Origin Access Control instead of public buckets (`/cdn-setup`).
- **Object Ownership: bucket owner enforced** (ACLs disabled); access is decided by IAM and bucket policies only.
- Encryption at rest is on by default (SSE-S3); use SSE-KMS when you need key-level access control or audit, and enable S3 Bucket Keys to cut KMS costs.
- A bucket policy that denies requests without TLS (`aws:SecureTransport = false`).
- **Versioning** on buckets with user data; **Object Lock** for backups that must survive deletion or ransomware (`/backup-strategy`).

## Uploads from the app

Give clients **presigned URLs** for upload and download instead of proxying files through the API or opening the bucket. Short expiry (minutes for uploads), a fixed key chosen by the server, and a content-type and size check after upload (`/file-uploads`).

## Lifecycle and cost

```json
{
  "Rules": [{
    "ID": "uploads",
    "Filter": { "Prefix": "uploads/" },
    "Status": "Enabled",
    "Transitions": [{ "Days": 30, "StorageClass": "STANDARD_IA" }],
    "NoncurrentVersionExpiration": { "NoncurrentDays": 30 },
    "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 7 }
  }]
}
```

- Expire noncurrent versions, or versioning grows the bill forever.
- Abort incomplete multipart uploads: they are billed and invisible in a normal listing.
- Intelligent-Tiering for data with unknown access patterns; Glacier classes only for data you rarely restore (retrieval has a cost and a delay).
- S3 Storage Lens shows which buckets and prefixes grow.

## Debug

| Symptom | Check |
|---|---|
| `AccessDenied` | The caller's IAM policy, the bucket policy, Block Public Access, the KMS key policy (SSE-KMS objects need `kms:Decrypt`), and the object owner |
| `SignatureDoesNotMatch` on a presigned URL | Expired, wrong region, or the client sent a different content-type than the one signed |
| CORS errors in the browser | The bucket's CORS configuration must allow the origin and method |
| A large, unexplained bill | Request costs (many small objects), data transfer out, noncurrent versions |
