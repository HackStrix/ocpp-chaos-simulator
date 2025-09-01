# Multi-stage Dockerfile for OCPP Chaos Simulator Backend
FROM golang:1.21 AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y gcc libc6-dev libsqlite3-dev build-essential

WORKDIR /app

# Copy go mod files first for better caching
COPY go.mod go.sum ./
RUN go mod download && go mod verify

# Copy source code
COPY . .

# Build both applications with optimizations
RUN CGO_ENABLED=1 GOOS=linux go build -ldflags="-w -s" -a -installsuffix cgo -o simulator ./cmd/simulator
RUN CGO_ENABLED=1 GOOS=linux go build -ldflags="-w -s" -a -installsuffix cgo -o test-charger ./cmd/test-charger

FROM debian:bookworm-slim

# Add labels for better container management
LABEL org.opencontainers.image.source="https://github.com/HackStrix/ocpp-chaos-simulator"
LABEL org.opencontainers.image.description="OCPP Chaos Simulator Backend"
LABEL org.opencontainers.image.licenses="MIT"

# Install runtime dependencies and create non-root user
RUN apt-get update && apt-get install -y ca-certificates sqlite3 tzdata && \
    groupadd -g 1001 appgroup && \
    useradd -u 1001 -g appgroup -s /bin/sh appuser && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy binaries and configs
COPY --from=builder --chown=appuser:appgroup /app/simulator /app/test-charger ./
COPY --from=builder --chown=appuser:appgroup /app/configs ./configs

# Create data directory with proper permissions
RUN mkdir -p ./data && chown -R appuser:appgroup ./data

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["./simulator"]
