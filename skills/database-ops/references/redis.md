# Redis operations

Applies to Redis, Valkey and managed services (Memorystore, ElastiCache, Upstash). Some commands (`CONFIG`, `DEBUG`) are blocked on managed services: use the provider's console or parameter groups instead.

## What it is used for decides the settings

| Use | `maxmemory-policy` | Persistence | Losing data means |
|---|---|---|---|
| Cache only | `allkeys-lru` (or `allkeys-lfu`) | Not needed | Cache misses, a slower app |
| Sessions, queues, rate limits, locks | `noeviction` (writes fail instead of silently losing data) | RDB + AOF, see `/backup-strategy` | Logged-out users, lost jobs |

Mixing both in one instance makes neither safe: split them, or at least use separate databases on separate instances.

## Memory

```text
INFO memory
```

- `used_memory` vs `maxmemory`: alert above 80%.
- `mem_fragmentation_ratio` well above 1.5: memory is wasted in fragments; well below 1: the instance is swapping, which is an incident.
- `INFO stats` → `evicted_keys` growing on an instance with `noeviction` data is a bug; on a cache it is normal, but a high rate means the cache is too small.

Find big keys without blocking the server: `redis-cli --bigkeys` or `redis-cli --memkeys` (they use `SCAN`). Never run `KEYS *` in production: it blocks every other client while it runs.

## Latency and slow commands

```text
SLOWLOG GET 10        # slowest recent commands with their arguments
INFO commandstats     # calls and time per command
LATENCY DOCTOR        # where self-hosted, a summary of latency events
```

Usual causes: `KEYS`, large `SMEMBERS`/`HGETALL`/`LRANGE 0 -1` on big structures, Lua scripts that run long, and fork pauses for RDB snapshots on large instances.

## Hit ratio and clients

```text
INFO stats      # keyspace_hits / (keyspace_hits + keyspace_misses)
INFO clients    # connected_clients, blocked_clients
```

A falling hit ratio after a deploy usually means a changed key format or TTL. `connected_clients` climbing without traffic growth is a connection leak in the app.

## Replication

`INFO replication`: on the primary, `connected_slaves` and each replica's offset; on a replica, `master_link_status:up` and `master_last_io_seconds_ago`. Replication is asynchronous: a failover can lose the last writes, which matters for queues and locks.

Destructive commands (`FLUSHALL`, `FLUSHDB`, `DEL` on patterns, `CONFIG SET maxmemory-policy`) need explicit approval; Arcane's guard asks before `FLUSHALL`.
