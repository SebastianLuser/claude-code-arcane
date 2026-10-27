# Redis & Client-Side Caching

## Redis

- Managed cluster (Memorystore/ElastiCache), split by purpose: cache (allkeys-lru) / session (noeviction) / queue
- Key naming: `<domain>:<entity>:<id>:<variant>` — pattern-based purge
- Serialization: JSON by default, MessagePack if latency matters

## Client (React/RN)

- TanStack Query: `staleTime`, `gcTime`, `invalidateQueries` on mutation
- RN: AsyncStorage persister for offline-first
- PWA: Service Worker — assets CacheFirst, API NetworkFirst
