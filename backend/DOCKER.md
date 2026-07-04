# Docker

Local Postgres and Redis are defined at the **monorepo root**:

```bash
# From repo root (not this folder)
docker compose up -d db redis
```

To run the API in Docker as well:

```bash
docker compose --profile full up -d
```

See the root [README](../README.md) for full setup.
