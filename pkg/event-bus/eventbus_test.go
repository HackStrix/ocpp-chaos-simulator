package eventbus

import (
    "context"
    "sync"
    "testing"
    "time"
    
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestInMemoryBus_PublishSubscribe(t *testing.T) {
    bus := NewInMemoryBus()
    defer bus.Close()
    
    // Test data
    eventType := "test.event"
    eventData := map[string]interface{}{"key": "value"}
    
    // Set up subscriber
    received := make(chan Event, 1)
    handler := func(ctx context.Context, event Event) error {
        received <- event
        return nil
    }
    
    err := bus.Subscribe(eventType, handler)
    require.NoError(t, err)
    
    // Publish event
    testEvent := NewEvent(eventType, eventData)
    err = bus.Publish(context.Background(), testEvent)
    require.NoError(t, err)
    
    // Verify event received
    select {
    case receivedEvent := <-received:
        assert.Equal(t, eventType, receivedEvent.Type())
        assert.Equal(t, eventData, receivedEvent.Data())
    case <-time.After(1 * time.Second):
        t.Fatal("Event not received within timeout")
    }
}

func TestInMemoryBus_MultipleSubscribers(t *testing.T) {
    bus := NewInMemoryBus()
    defer bus.Close()
    
    eventType := "test.broadcast"
    var wg sync.WaitGroup
    receivedCount := 0
    var mu sync.Mutex
    
    // Add multiple subscribers
    for i := 0; i < 3; i++ {
        wg.Add(1)
        bus.Subscribe(eventType, func(ctx context.Context, event Event) error {
            defer wg.Done()
            mu.Lock()
            receivedCount++
            mu.Unlock()
            return nil
        })
    }
    
    // Publish single event
    bus.Publish(context.Background(), NewEvent(eventType, "data"))
    
    // Wait for all handlers
    wg.Wait()
    
    assert.Equal(t, 3, receivedCount)
}
