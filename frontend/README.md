# OCPP Chaos Simulator Frontend

A modern TypeScript + Next.js dashboard for monitoring and controlling the OCPP Chaos Simulator.

## Features

- 🔄 **Real-time Dashboard** - Live charger status and event monitoring
- ⚡ **Virtual Charger Grid** - Visual representation of all simulated chargers  
- 🎮 **Scenario Controls** - Run and manage YAML test scenarios
- 📊 **System Statistics** - Connection health and performance metrics
- 📝 **Event Log** - Filterable real-time event stream with search
- 🎨 **Modern UI** - Clean, responsive design with Tailwind CSS
- 🔍 **TypeScript** - Full type safety for better development experience

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Real-time**: WebSocket connection to Go backend

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`.

### Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## Architecture

### Component Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Dashboard page
├── components/            # React components
│   ├── ChargerGrid.tsx    # Virtual charger display
│   ├── EventLog.tsx       # Real-time event log
│   ├── ScenarioControls.tsx # Scenario management
│   └── SystemStats.tsx    # System overview
├── types/                 # TypeScript definitions
│   ├── ocpp.ts           # OCPP-related types
│   └── events.ts         # Event system types
└── lib/                   # Utility functions
    └── utils.ts          # Helper functions
```

### Key Features

#### Real-time Communication
- WebSocket connection to Go backend on `/ws`
- Event-driven updates for chargers, transactions, and system events
- Automatic reconnection handling

#### Type-Safe API Integration  
- Complete TypeScript types for all OCPP entities
- Type-safe event handling and filtering
- API proxy configuration for development

#### Responsive Design
- Mobile-first responsive layout
- Component-based design system
- Consistent color scheme and spacing

## Backend Integration

The frontend connects to the Go backend via:

- **HTTP API**: `/api/*` endpoints for REST operations
- **WebSocket**: `/ws` endpoint for real-time events
- **Proxy**: Next.js dev server proxies requests to `localhost:8080`

### API Endpoints (Planned)

```typescript
// Charger management
GET    /api/chargers          // List all chargers
POST   /api/chargers          // Create test charger
GET    /api/chargers/:id      // Get charger details

// Scenario management  
GET    /api/scenarios         // List available scenarios
POST   /api/scenarios/:name/run // Run scenario
POST   /api/scenarios/:name/stop // Stop scenario

// System status
GET    /api/status            // System overview
```

## Event System

The frontend listens to real-time events from the backend:

### Event Types

```typescript
// Charger events
'charger.boot_notification.sent'
'charger.transaction.started'
'charger.transaction.stopped'
'charger.status.changed'

// Simulation events
'simulation.started'
'simulation.stopped'
'simulation.completed'

// OCPP message events
'ocpp.message.received'
'ocpp.message.sent'

// Chaos engineering events
'chaos.injected'
'chaos.recovered'
```

## Development Workflow

### Adding New Components

1. Create component in `src/components/`
2. Export from component file
3. Add to page or parent component
4. Update types if needed

### Adding New Event Types

1. Add event type to `src/types/events.ts`
2. Update event filtering logic in `EventLog.tsx`
3. Add display names in `src/lib/utils.ts`

### Styling Guidelines

- Use Tailwind CSS utility classes
- Follow consistent color scheme (primary, success, warning, danger)
- Use semantic color variables for status indicators
- Maintain responsive design principles

## Next Steps

- [ ] Implement WebSocket connection
- [ ] Add API integration
- [ ] Implement scenario upload
- [ ] Add charger detail modals
- [ ] Add metrics charts
- [ ] Add dark mode support
- [ ] Add export functionality

## Contributing

1. Follow TypeScript best practices
2. Use consistent component patterns
3. Add proper error handling
4. Write meaningful commit messages
5. Test responsive design
