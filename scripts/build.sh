/bin/bash

# Build script for OCPP Chaos Simulator

set -e

echo "Building OCPP Chaos Simulator..."

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf ./bin

# Create bin directory
mkdir -p ./bin

# Build for current platform
echo "Building for current platform..."
go build -o ./bin/simulator ./cmd/simulator

# Build for multiple platforms (optional)
if [ "$1" = "all" ]; then
    echo "Building for multiple platforms..."
    
    # Linux AMD64
    GOOS=linux GOARCH=amd64 go build -o ./bin/simulator-linux-amd64 ./cmd/simulator
    
    # Windows AMD64
    GOOS=windows GOARCH=amd64 go build -o ./bin/simulator-windows-amd64.exe ./cmd/simulator
    
    # macOS AMD64
    GOOS=darwin GOARCH=amd64 go build -o ./bin/simulator-darwin-amd64 ./cmd/simulator
    
    # macOS ARM64
    GOOS=darwin GOARCH=arm64 go build -o ./bin/simulator-darwin-arm64 ./cmd/simulator
fi

echo "Build completed successfully!"
echo "Binaries available in ./bin/"
