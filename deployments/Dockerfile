# Multi-stage Dockerfile for OCPP Chaos Simulator Backend
FROM golang:1.21 AS builder

WORKDIR /app

# Copy go mod files first for better caching
COPY go.mod go.sum ./
RUN go mod download && go mod verify

# Copy source code
COPY . .

# Build pure-Go binaries (no CGO needed!)
RUN --mount=type=cache,target=/root/.cache/go-build \
    --mount=type=cache,target=/go/pkg/mod \
    CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o simulator ./cmd/simulator

RUN --mount=type=cache,target=/root/.cache/go-build \
    --mount=type=cache,target=/go/pkg/mod \
    CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o test-charger ./cmd/test-charger

# Create data directory with proper permissions
RUN mkdir -p /app/data && chmod 755 /app/data

# Use distroless for minimal, secure image
FROM gcr.io/distroless/static-debian12:nonroot

# Add labels for better container management
LABEL org.opencontainers.image.source="https://github.com/HackStrix/ocpp-chaos-simulator"
LABEL org.opencontainers.image.description="OCPP Chaos Simulator Backend"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app

# Copy binaries and configs
COPY --from=builder --chown=nonroot:nonroot /app/simulator /app/test-charger ./
COPY --from=builder --chown=nonroot:nonroot /app/configs ./configs

# Copy data directory with proper ownership
COPY --from=builder --chown=nonroot:nonroot /app/data ./data

EXPOSE 8080

CMD ["./simulator"]
