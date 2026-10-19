# Compose workflows and container debugging

## Several compose files

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d   # later files override earlier ones
docker compose -f docker-compose.yml -f docker-compose.prod.yml config  # print the merged result before running it
```

`docker-compose.override.yml` is applied automatically when no `-f` is given: keep dev-only settings there. Lists such as `ports` are merged, not replaced; use `!reset` (Compose 2.24+) to clear an inherited value.

## Profiles

Services that run only on demand (admin UIs, seeders, a mail catcher) get a profile, so a plain `up` skips them:

```yaml
services:
  pgadmin:
    image: dpage/pgadmin4:<version>
    profiles: [tools]
```

```bash
docker compose --profile tools up -d
```

## Watch mode

Instead of bind-mounting the whole source (slow on macOS and Windows), sync only what changes:

```yaml
services:
  api:
    develop:
      watch:
        - action: sync           # copy changed files into the container
          path: ./src
          target: /app/src
        - action: rebuild        # rebuild the image when dependencies change
          path: package-lock.json
```

Run with `docker compose watch` (Compose 2.22+).

## Multi-platform images

An image built on an ARM laptop (Apple Silicon) does not run on an amd64 server unless built for it:

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t <registry>/app:$GIT_SHA --push .
```

In CI, build only the platform the target runs on; multi-arch doubles build time.

## Debugging

| Symptom | First checks |
|---|---|
| **Exits right away** | `docker logs <c>`; `docker inspect <c> --format '{{.State.ExitCode}}'`. 137 = killed (often out of memory, see `OOMKilled` in `.State`), 139 = segfault, 143 = SIGTERM, 1 = the app's own error |
| **Unhealthy** | `docker inspect <c> --format '{{json .State.Health}}'` shows the last healthcheck outputs |
| **Cannot reach another service** | Both on the same compose network; use the **service name** as host, not `localhost` |
| **Port already in use** | Another container or a host process holds it: change the host side of the mapping |
| **Permission denied on a volume** | The container user's UID differs from the files' owner: set `user:` or fix ownership in the image |
| **Changes not reflected** | Stale image (`up --build`), or a named volume hiding the new files |
| **Disk full** | `docker system df`; then `docker builder prune` and `docker image prune` (the guard asks before `docker system prune` and volume removal, since volumes hold data) |

Shell into an image without a shell (distroless): `docker debug <c>` on Docker Desktop, or attach a throwaway container to its namespaces:

```bash
docker run --rm -it --pid=container:<c> --network=container:<c> busybox sh
```
