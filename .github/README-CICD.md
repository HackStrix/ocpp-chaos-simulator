# CI/CD Quick Start

## Pull Production Images

```bash
# Backend
docker pull ghcr.io/hackstrix/ocpp-chaos-simulator:latest

# Frontend  
docker pull ghcr.io/hackstrix/ocpp-chaos-simulator-frontend:latest
```

## Deploy with Docker Compose

```bash
# Use production compose file
docker-compose -f deployments/docker-compose.prod.yml up -d
```

## Pipeline Status

- ✅ **Build & Test**: Runs on all pushes and PRs
- 🚀 **Deploy**: Runs on main branch merges
- 📦 **Registry**: Images pushed to GHCR automatically

For detailed documentation, see [docs/ci-cd-pipeline.md](../docs/ci-cd-pipeline.md)

