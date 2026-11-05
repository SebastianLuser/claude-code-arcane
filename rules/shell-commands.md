# Shell Commands Rule

A foreground command blocks the session until it exits or hits its `timeout`. One slow build costs minutes; an interactive command never exits on its own.

- **Long commands run in the background.** Builds, full test suites, project-wide type checks (`tsc -b`), `go build ./...`, `go vet ./...`, `go test ./...`, linters over the whole repo, code-graph generators (`graphify`), `swag init` and dependency installs go through the Bash tool with `run_in_background`, not in the foreground with a long `timeout`.
- **Wait for the notification, do not poll.** A background command reports when it exits. Do not read its output in a loop or `sleep` until it finishes: work on something else or end the turn, and the notification brings you back.
- **No interactive sessions in the foreground.** `ssh`, `railway ssh`, `psql`, `docker exec -it` and REPLs wait for input that never comes. Use the one-shot form (`ssh host 'cmd'`, `psql -c '...'`, `docker exec` without `-it`) or do not run it.
- **Long-lived processes go to the background.** A dev server, a `--watch` command or a tunnel runs with `run_in_background`, and you stop it as soon as you no longer need it.
- **One heavy command at a time.** Do not start a second build or test run while one is still running in the background: they compete for the same CPU and both get slower.
- **Clean up before you finish.** Before ending a task, stop every background command you started that is still running (`TaskStop`).
