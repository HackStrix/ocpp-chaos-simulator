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

# Use alpine for directory setup, then copy to distroless
FROM alpine:latest AS setup
RUN addgroup -g 65532 -S nonroot && adduser -u 65532 -S nonroot -G nonroot
RUN mkdir -p /app/data && chown -R nonroot:nonroot /app/data && chmod 755 /app/data

# Use distroless for minimal, secure image
FROM gcr.io/distroless/static-debian12:nonroot

# Add labels for better container management
LABEL org.opencontainers.image.source="https://github.com/HackStrix/ocpp-chaos-simulator"
LABEL org.opencontainers.image.description="OCPP Chaos Simulator Backend"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app

# Copy pre-setup data directory with correct ownership
COPY --from=setup --chown=nonroot:nonroot /app/data ./data

# Copy binaries and configs
COPY --from=builder --chown=nonroot:nonroot /app/simulator /app/test-charger ./
COPY --from=builder --chown=nonroot:nonroot /app/configs ./configs

EXPOSE 8080

CMD ["./simulator"]
