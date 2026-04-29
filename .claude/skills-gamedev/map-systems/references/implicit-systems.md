# Implicit System Inference Patterns

Cada sistema mencionado implica sistemas ocultos. Heurísticas:

| Mencionado | Implica |
|-----------|---------|
| Inventory | Item DB, equipment slots, capacity, inventory UI, serialización save/load |
| Combat | Damage calc, health, hit detection, status effects, enemy AI, combat UI, death/respawn |
| Open world | Streaming/chunking, LOD, fast travel, minimap, world state persistence |
| Multiplayer | Networking, lobby/matchmaking, state sync, anti-cheat, network UI |
| Crafting | Recipe DB, gathering, crafting UI, success/failure, recipe discovery |
| Dialogue | Dialogue trees, dialogue UI, choice tracking, NPC state, localization hooks |
| Progression | XP, level-up, skill tree, unlock tracking, progression UI, save data |
