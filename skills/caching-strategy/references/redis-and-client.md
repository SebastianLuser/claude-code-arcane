# Redis & Client-Side Caching

## Redis

- Cluster managed (Memorystore/ElastiCache), separar por proposito: cache (allkeys-lru) / session (noeviction) / queue
- Key naming: `<domain>:<entity>:<id>:<variant>` — pattern-based purge
- Serializacion: JSON default, MessagePack si latencia importa

## Cliente (React/RN)

- TanStack Query: `staleTime`, `gcTime`, `invalidateQueries` on mutation
- RN: AsyncStorage persister para offline-first
- PWA: Service Worker — assets CacheFirst, API NetworkFirst
