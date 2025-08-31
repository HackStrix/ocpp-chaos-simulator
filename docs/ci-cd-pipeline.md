# CI/CD Pipeline Documentation

## Overview

This project uses a modular GitHub Actions CI/CD pipeline that handles building, testing, and deploying both backend (Go) and frontend (Next.js) components to GitHub Container Registry (GHCR).

## Pipeline Components

### 1. Build and Test Workflow (`.github/workflows/build-test.yml`)

**Triggers:**
- All pushes to any branch
- All pull requests

**Jobs:**

#### test-backend
- Sets up Go 1.21 environment
- Runs `go mod download` for dependencies
- Executes unit tests with coverage (`go test -v -race -coverprofile=coverage.out ./...`)
- Generates HTML coverage reports
- Builds both simulator and test-charger binaries
- Uploads coverage reports and binaries as artifacts

#### test-frontend  
- Sets up Node.js 18 environment
- Installs dependencies with `npm ci`
- Runs ESLint (`npm run lint`)
- Builds the Next.js application (`npm run build`)
- Uploads build artifacts

#### integration-test
- Depends on both backend and frontend test jobs
- Builds Docker image for testing
- Runs integration tests in `./tests/`
- Uses Docker-in-Docker for realistic testing environment

### 2. Deploy Workflow (`.github/workflows/deploy.yml`)

**Triggers:**
- Pushes to `main` branch
- Manual workflow dispatch

**Jobs:**

#### build-and-push (Backend)
- Builds optimized Docker image using multi-stage Dockerfile
- Pushes to `ghcr.io/<your-repo>:latest`
- Supports multi-architecture builds (linux/amd64, linux/arm64)
- Uses GitHub Actions cache for faster builds

#### build-frontend-image (Frontend)
- Builds standalone Next.js Docker image
- Pushes to `ghcr.io/<your-repo>-frontend:latest`
- Optimized for production with minimal attack surface

#### notify-deployment
- Provides deployment summary with pull commands
- Runs after both build jobs complete

## Security & Best Practices

### ✅ Pros
- **Modular Design**: Separate workflows for testing vs deployment
- **Multi-architecture Support**: Supports both AMD64 and ARM64
- **Caching**: Efficient layer caching reduces build times
- **Security**: Non-root users in containers, minimal base images
- **Artifacts**: Build artifacts available for debugging
- **Health Checks**: Container health monitoring
- **Dependency Caching**: NPM and Go module caching

### ⚠️ Security Considerations
- Images are public in GHCR (use private repos for sensitive projects)
- GITHUB_TOKEN has package write permissions (standard for GHCR)
- Integration tests run with Docker privileges (required for testing)
- Health check endpoint `/health` should be implemented in backend

### ❌ Potential Issues
- Docker-in-Docker increases CI resource usage
- Multi-architecture builds take longer
- Frontend requires backend API URL configuration for production

## Container Images

### Backend Image: `ghcr.io/<your-repo>:latest`
- Based on Alpine Linux (minimal attack surface)
- Includes both `simulator` and `test-charger` binaries
- Non-root user (appuser:1001)
- Health check on `/health` endpoint
- SQLite database persistence via volumes

### Frontend Image: `ghcr.io/<your-repo>-frontend:latest`
- Next.js standalone build
- Optimized for production
- Non-root user (nextjs:1001)
- Minimal Node.js footprint

## Usage

### For Development
```bash
# CI automatically runs on all pushes and PRs
git push origin feature-branch
```

### For Deployment
```bash
# Deploy to main branch
git checkout main
git merge feature-branch
git push origin main

# Or trigger manually from GitHub UI
```

### Pull Images for Orchestration
```bash
# Pull latest images
docker pull ghcr.io/hackstrix/ocpp-chaos-simulator:latest
docker pull ghcr.io/hackstrix/ocpp-chaos-simulator-frontend:latest

# Use production compose file
docker-compose -f deployments/docker-compose.prod.yml up -d
```

## Configuration

### Required GitHub Repository Settings
1. **Actions permissions**: Allow GitHub Actions to create and approve pull requests
2. **Package permissions**: Allow Actions to write to packages (enabled by default)

### Environment Variables
- Backend: `LOG_LEVEL`, `DATABASE_PATH`
- Frontend: `NODE_ENV`, `NEXT_PUBLIC_API_URL`

## Monitoring & Troubleshooting

### Build Failures
1. Check "Actions" tab in GitHub repository
2. Review failing job logs
3. Download artifacts for local debugging
4. Common issues:
   - Go test failures → Check test logic
   - Frontend build failures → Check TypeScript errors
   - Docker build failures → Check Dockerfile syntax

### Deployment Issues
1. Verify GHCR image tags are correctly pushed
2. Check container health status
3. Review application logs in deployed containers

### Integration Test Failures
1. Ensure `/health` endpoint is implemented
2. Check Docker service availability
3. Verify integration test assumptions

## Next Steps

1. **Implement Health Endpoint**: Add `/health` route to Go backend
2. **Environment Management**: Consider staging vs production environments  
3. **Secrets Management**: Add secure handling for database credentials
4. **Monitoring**: Integrate with monitoring tools (Prometheus, etc.)
5. **Security Scanning**: Add container vulnerability scanning
6. **Database Migrations**: Add automated database migration handling
