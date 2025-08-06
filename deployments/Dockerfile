FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o simulator ./cmd/simulator

FROM alpine:latest

RUN apk --no-cache add ca-certificates sqlite
WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /app/simulator .
COPY --from=builder /app/configs ./configs

# Create data directory
RUN mkdir -p ./data

EXPOSE 8080

CMD ["./simulator"]
