# Schema DB — MFA

- **`user_mfa`**: id, user_id, type (totp/webauthn/sms), secret_encrypted (TOTP), credential_id+public_key+counter+transports+device_name (WebAuthn), phone_encrypted (SMS), created_at, last_used_at, verified_at
- **`mfa_backup_codes`**: id, user_id, code_hash (Argon2id), used_at, created_at. Indice parcial: `user_id WHERE used_at IS NULL`
- **`mfa_events`**: id, user_id, event_type (enrolled/verified/failed/recovery/disabled), mfa_type, ip, user_agent, created_at
