# terraform-init — Anti-patterns

- Local state committed to repo
- Single monolithic state across all environments
- `terraform apply` from laptop to production
- Providers without version pin — silent breaking changes
- Secrets in variable defaults or unmasked outputs
- `count` where `for_each` should be used
- Hardcoded resource IDs instead of data source lookups
- No locking on state — concurrent applies corrupt state
- Monolithic config files — split by resource type as they grow
