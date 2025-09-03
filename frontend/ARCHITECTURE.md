# Frontend Architecture Overview

## 🏗️ New Structure

The frontend has been completely revamped with a modern, modular architecture:

```
src/
├── app/                          # Next.js 14 App Router
│   ├── dashboard/               # Main dashboard routes
│   │   ├── layout.tsx          # Dashboard layout with navigation
│   │   ├── page.tsx            # Overview dashboard
│   │   ├── chargers/           # Charger management module
│   │   ├── scenarios/          # Scenario management module
│   │   ├── monitoring/         # Real-time monitoring module
│   │   └── analytics/          # Analytics & reporting module
│   ├── layout.tsx              # Root layout with React Query provider
│   └── page.tsx                # Root page (redirects to dashboard)
├── components/
│   ├── ui/                     # Reusable UI components (shadcn/ui style)
│   ├── charts/                 # Chart components
│   ├── forms/                  # Form components
│   └── layouts/                # Layout components
├── hooks/
│   ├── api/                    # React Query hooks for API calls
│   │   ├── use-chargers.ts    # Charger management hooks
│   │   ├── use-scenarios.ts   # Scenario hooks
│   │   ├── use-events.ts      # Event/monitoring hooks
│   │   └── use-health.ts      # Health check hooks
│   ├── auth/                   # Authentication hooks (future)
│   └── utils/                  # Utility hooks
├── lib/
│   ├── api/                    # API client and types
│   │   └── client.ts          # Enhanced API client with error handling
│   ├── auth/                   # Authentication utilities (future)
│   ├── validation/             # Input validation schemas
│   └── utils.ts               # Utility functions
├── providers/
│   └── query-provider.tsx     # React Query configuration
└── types/                      # TypeScript type definitions
```

## 🚀 Key Improvements

### 1. **React Query Integration**
- ✅ Automatic caching and background updates
- ✅ Built-in loading states and error handling
- ✅ Request deduplication and retries
- ✅ Optimistic updates for mutations
- ✅ Real-time data synchronization

### 2. **Modular Dashboard**
- ✅ **Overview**: System stats and recent activity
- ✅ **Chargers**: Virtual charger management
- ✅ **Scenarios**: Simulation scenario execution
- ✅ **Monitoring**: Real-time events and logs
- ✅ **Analytics**: Performance metrics and insights

### 3. **Enhanced UI Components**
- ✅ Consistent design system with shadcn/ui
- ✅ Responsive layouts for mobile/desktop
- ✅ Loading skeletons and error states
- ✅ Interactive charts and data visualizations

### 4. **Better State Management**
- ✅ React Query for server state
- ✅ Proper error boundaries
- ✅ Type-safe API calls
- ✅ Automatic retry logic

### 5. **Developer Experience**
- ✅ TypeScript throughout
- ✅ Modular architecture
- ✅ Reusable components
- ✅ Clear separation of concerns

## 📊 API Integration

### Query Hooks Pattern
```typescript
// Example: useChargers hook
export function useChargers() {
  return useQuery({
    queryKey: ['chargers'],
    queryFn: () => apiClient.get<BackendCharger[]>('/chargers'),
    refetchInterval: 10000, // Auto-refresh
    staleTime: 5000,
  });
}

// Usage in components
function ChargersPage() {
  const { data: chargers, isLoading, error } = useChargers();
  // Handle loading, error, and data states
}
```

### Mutation Hooks Pattern
```typescript
// Example: useCreateCharger hook
export function useCreateCharger() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => apiClient.post('/chargers', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['chargers']);
    },
  });
}
```

## 🔧 Usage

### Starting the Development Server
```bash
cd frontend
npm run dev
```

### Available Routes
- `/` → Redirects to `/dashboard`
- `/dashboard` → Overview page
- `/dashboard/chargers` → Charger management
- `/dashboard/scenarios` → Scenario management
- `/dashboard/monitoring` → Real-time monitoring
- `/dashboard/analytics` → Analytics dashboard

## 🛡️ Security Features

- ✅ Input validation on all API calls
- ✅ Error boundary for graceful error handling
- ✅ Type-safe API interactions
- ✅ Request timeout handling
- ✅ Proper error logging

## 📈 Performance

- ✅ Automatic request deduplication
- ✅ Smart caching with React Query
- ✅ Background data updates
- ✅ Skeleton loading states
- ✅ Optimized re-renders

## 🔮 Future Enhancements

- 🔄 WebSocket integration for real-time updates
- 🔐 Authentication and authorization
- 📱 Progressive Web App (PWA) support
- 📊 Advanced charting library integration
- 🎨 Theme customization
- 📥 Data export functionality

## 🤝 Contributing

When adding new features:

1. **Create new hooks** in `hooks/api/` for API interactions
2. **Add UI components** in `components/ui/` for reusable elements
3. **Follow the modular pattern** for dashboard pages
4. **Use TypeScript** for all new code
5. **Add proper error handling** and loading states

The architecture is designed to scale and maintain consistency across the application.
