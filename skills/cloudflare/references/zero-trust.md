# Zero Trust: Tunnel and Access

Publish an internal tool (admin panel, Grafana, a staging app) without a public IP or an open port, and require a login in front of it.

## Cloudflare Tunnel

`cloudflared` runs next to the origin and opens an outbound-only connection to Cloudflare; the origin's firewall can then block all inbound traffic.

1. Create the tunnel in the Zero Trust dashboard (remotely managed tunnels keep the config in Cloudflare) and copy its token.
2. Run the connector, for example as a container next to the app:

```yaml
services:
  cloudflared:
    image: cloudflare/cloudflared:<version>
    command: tunnel --no-autoupdate run
    environment:
      TUNNEL_TOKEN: ${TUNNEL_TOKEN}     # from a secret store, never committed
    restart: unless-stopped
```

3. Add a **public hostname** to the tunnel (`admin.example.com` → `http://app:3000`).
4. Run at least two replicas of the connector for availability.

## Access policies

Every hostname published for internal use gets an **Access application** before it gets traffic:

- Identity provider: Google Workspace, Microsoft Entra ID, GitHub, or one-time PIN for small teams.
- Policy: **Allow** for an email domain or specific groups, plus requirements such as country or a device posture check where needed. Order matters; a broad Allow above a narrow Block lets everyone in.
- Session duration short enough for the risk (hours for admin tools).
- Machine-to-machine access (CI, cron) with **service tokens** and a separate Service Auth policy, never a shared user login.

The application behind Access should still validate the `Cf-Access-Jwt-Assertion` header (or its cookie) against the team's public keys, so a request that bypasses Cloudflare cannot reach it.

## Checks

- Every internal hostname is behind an Access application: list the tunnel's public hostnames and compare with the Access applications.
- No public DNS record points to the origin's real IP.
- Access audit logs (Zero Trust → Logs) reviewed for denied attempts and unknown users.
