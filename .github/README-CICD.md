# CI/CD Quick Start

## 🌐 **Live Application**
- **Frontend**: https://ocpp.sankalpnarula.com (Cloudflare Workers)
- **Backend**: Pull from GHCR for your orchestration

## 📦 **Pull Production Images**

```bash
# Backend (for your orchestration)
docker pull ghcr.io/hackstrix/ocpp-chaos-simulator:latest

# Frontend (deployed to Cloudflare Workers automatically)
# No manual deployment needed - handled by GitHub Actions
```

## 🚀 **Deployment Architecture**

- **Frontend**: Auto-deployed to Cloudflare Workers on push to main
- **Backend**: Docker image pushed to GHCR, use with your orchestration

```bash
# Backend deployment with Docker Compose
docker-compose -f deployments/docker-compose.prod.yml up -d
```

## 📊 **Pipeline Status**

- ✅ **Build & Test**: Runs on all pushes and PRs
- 🚀 **Deploy**: 
  - Frontend → Cloudflare Workers (automatic)
  - Backend → GHCR (for your orchestration)

## 📚 **Documentation**

- [CI/CD Pipeline Details](../docs/ci-cd-pipeline.md)
- [Cloudflare Workers Migration](../docs/cloudflare-workers-migration.md)  
- [Custom Domain Setup](../docs/custom-domain-setup.md)

