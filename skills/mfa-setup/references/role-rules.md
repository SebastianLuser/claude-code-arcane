# Rules per Role — MFA

| Role | MFA | Methods | Step-up maxAge |
|-----|-----|---------|----------------|
| Super-admin | Mandatory | Passkey + TOTP (2 factors) | 2 min |
| Institution admin | Mandatory | Passkey or TOTP | 5 min |
| Teacher | Mandatory | Passkey/TOTP; SMS recovery only | 10 min |
| Adult student (16+) | Optional | TOTP or Passkey | 15 min |
| Underage student | Not mandatory | TOTP (via guardian); NEVER SMS | N/A |
