# TTL Defaults

| Type | TTL |
|------|-----|
| Versioned assets | 1 year (immutable) |
| Public course list | 5 min |
| Course detail | 1 min |
| User profile | 5 min (invalidate on write) |
| Config/feature flags | 30 sec |
| Rate limit counters | exact window |
| LLM/AI response | hours to days (depending on cost) |
