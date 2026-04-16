# Skill: start-service

## Trigger
When the user says "start", "run", "levantar el server", "arrancar", or similar.

## Workflow

1. Detect the project type by checking for config files in the current directory:
   - `Makefile` with `run` target → `make run`
   - `package.json` with `dev` script → `npm run dev` or `yarn dev` or `pnpm dev`
   - `go.mod` → `go run cmd/main.go` or `make run`
   - `docker-compose.yml` → `docker-compose up`

2. Before starting, check if dependencies are installed:
   - Go: `go mod download && go mod verify`
   - Node: check if `node_modules/` exists, if not run install
   - Docker: check if Docker is running

3. Check if required environment files exist:
   - `.env.local`, `.env`, `.env.development`
   - If missing, warn the user

4. Start the service and show the output

## Project-specific commands

### tich-cronos (Go API)
```bash
make run
```
Requires: `.env.local`, PostgreSQL running

### tuni-ai-webapp (Preact widget)
```bash
npm run dev
```
