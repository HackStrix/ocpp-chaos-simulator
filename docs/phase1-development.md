# OCPP Chaos Simulator - Phase 1 Development Guide

This document outlines the development approach for Phase 1 of the OCPP Chaos Simulator.

## Architecture Overview

The project follows a modular, domain-driven architecture with clear separation of concerns:

```
cmd/                    # Application entry points
internal/               # Private application code
├── core/              # Business logic
├── infrastructure/    # External dependencies
├── interfaces/        # API definitions
└── shared/           # Shared utilities
pkg/                   # Public reusable libraries
```

## Phase 1 Components

### 1. Core Engine (`internal/core/simulation/`)
- **Engine**: Main orchestrator for simulations
- **Types**: Configuration and status definitions
- **Lifecycle**: Managing simulation state

### 2. Virtual Charger (`internal/core/charger/`)
- **VirtualCharger**: Individual charger simulation
- **Types**: Connector and transaction models
- **State Management**: Charger status and lifecycle

### 3. OCPP Implementation (`internal/core/ocpp/`)
- **Interfaces**: Protocol-agnostic definitions
- **OCPP 1.6 Client**: WebSocket-based implementation
- **Messages**: OCPP 1.6 message types and validation

### 4. Infrastructure (`internal/infrastructure/`)
- **Config**: Application configuration management
- **Storage**: Database models and operations
- **Event Bus**: In-memory event system

### 5. Public Libraries (`pkg/`)
- **OCPP Client**: Reusable OCPP client library
- **Event Bus**: Event system for loose coupling

## Key Design Patterns

### 1. Interface-Based Design
All core components are defined by interfaces, enabling:
- Easy testing with mocks
- Future implementation swapping
- Clean dependency injection

### 2. Event-Driven Architecture
Components communicate via events:
- Loose coupling between modules
- Easy addition of new features
- Real-time updates for UI

### 3. Plugin Architecture
OCPP versions are implemented as plugins:
- Easy addition of new OCPP versions
- Version-specific optimizations
- Backward compatibility

## Development Workflow

### 1. Current State
✅ Project structure created
✅ Core interfaces defined
✅ Placeholder implementations
✅ Configuration system
✅ Database models

### 2. Next Steps
1. **Implement OCPP 1.6 WebSocket communication**
2. **Add basic charger lifecycle management**
3. **Create simulation engine logic**
4. **Add database operations**
5. **Implement event publishing**

### 3. Testing Strategy
- Unit tests for each module
- Integration tests for OCPP communication
- End-to-end simulation tests

## Build and Run

```bash
# Build the application
go build -o bin/simulator ./cmd/simulator

# Run with default config
./bin/simulator

# Or use Docker
docker-compose -f deployments/docker-compose.yml up
```

## Configuration

The application uses YAML configuration with environment variable override support. See `configs/config.yaml` for defaults.

## Next Phase Preparation

Phase 1 establishes the foundation. Phase 2 will add:
- Scenario-based testing
- YAML scenario definitions
- Advanced simulation controls
- Web API endpoints

The modular architecture ensures easy expansion while maintaining code quality and testability.
