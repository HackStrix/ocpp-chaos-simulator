package eventbus

import (
	"context"
	"sync"
)

// Event represents a system event
type Event interface {
	Type() string
	Data() interface{}
	Timestamp() int64
}

// EventHandler handles events
type EventHandler func(ctx context.Context, event Event) error

// EventBus defines the event bus interface
type EventBus interface {
	Publish(ctx context.Context, event Event) error
	Subscribe(eventType string, handler EventHandler) error
	Unsubscribe(eventType string, handler EventHandler) error
	Close() error
}

// InMemoryBus implements an in-memory event bus
type InMemoryBus struct {
	handlers map[string][]EventHandler
	mu       sync.RWMutex
}

// NewInMemoryBus creates a new in-memory event bus
func NewInMemoryBus() EventBus {
	return &InMemoryBus{
		handlers: make(map[string][]EventHandler),
	}
}

// Publish publishes an event to all subscribers
func (bus *InMemoryBus) Publish(ctx context.Context, event Event) error {
	bus.mu.RLock()
	handlers, exists := bus.handlers[event.Type()]
	bus.mu.RUnlock()

	if !exists {
		return nil // No handlers for this event type
	}

	// Execute handlers concurrently
	var wg sync.WaitGroup
	for _, handler := range handlers {
		wg.Add(1)
		go func(h EventHandler) {
			defer wg.Done()
			// TODO: Add error handling and logging
			h(ctx, event)
		}(handler)
	}

	wg.Wait()
	return nil
}

// Subscribe adds a handler for a specific event type
func (bus *InMemoryBus) Subscribe(eventType string, handler EventHandler) error {
	bus.mu.Lock()
	defer bus.mu.Unlock()

	bus.handlers[eventType] = append(bus.handlers[eventType], handler)
	return nil
}

// Unsubscribe removes a handler for a specific event type
func (bus *InMemoryBus) Unsubscribe(eventType string, handler EventHandler) error {
	bus.mu.Lock()
	defer bus.mu.Unlock()

	handlers, exists := bus.handlers[eventType]
	if !exists {
		return nil
	}

	// TODO: Implement handler removal logic
	// This requires comparing function pointers which is tricky in Go
	// For now, we'll keep this as a placeholder
	bus.handlers[eventType] = handlers

	return nil
}

// Close closes the event bus
func (bus *InMemoryBus) Close() error {
	bus.mu.Lock()
	defer bus.mu.Unlock()

	// Clear all handlers
	bus.handlers = make(map[string][]EventHandler)
	return nil
}
