#!/bin/bash
set -e

echo "🧪 Running OCPP Chaos Simulator Test Suite"
echo "=========================================="

# Install test dependencies if not present
go mod tidy

# Run tests with coverage
echo "📊 Running tests with coverage..."
go test -v -race -coverprofile=coverage.out ./...

# Show coverage report
echo "📈 Coverage Report:"
go tool cover -func=coverage.out

# Optional: Generate HTML coverage report
echo "🌐 Generating HTML coverage report..."
go tool cover -html=coverage.out -o coverage.html

echo "✅ Tests completed! Check coverage.html for detailed report"
