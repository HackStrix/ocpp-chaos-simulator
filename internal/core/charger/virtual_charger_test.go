package charger

import (
    "context"
    "testing"
    
    "github.com/HackStrix/ocpp-chaos-simulator/pkg/event-bus"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestVirtualCharger_Creation(t *testing.T) {
    eventBus := eventbus.NewInMemoryBus()
    
    config := ChargerConfig{
        Identifier:     "TEST001",
        Model:          "TestCharger",
        Vendor:         "TestVendor",
        ConnectorCount: 2,
        OCPPVersion:    "1.6",
        CSMSEndpoint:   "ws://localhost:8080/ocpp",
    }
    
    charger := NewVirtualCharger(config, eventBus)
    require.NotNil(t, charger)
    
    assert.Equal(t, "TEST001", charger.id)
    assert.Equal(t, StatusOffline, charger.GetStatus())
    assert.Len(t, charger.GetConnectors(), 2)
    assert.False(t, charger.IsConnected())
}

func TestVirtualCharger_ConnectorManagement(t *testing.T) {
    eventBus := eventbus.NewInMemoryBus()
    config := ChargerConfig{
        Identifier:     "TEST001",
        ConnectorCount: 2,
        OCPPVersion:    "1.6",
        CSMSEndpoint:   "ws://localhost:8080/ocpp",
    }
    
    charger := NewVirtualCharger(config, eventBus)
    connectors := charger.GetConnectors()
    
    assert.Len(t, connectors, 2)
    assert.Equal(t, 1, connectors[0].ID)
    assert.Equal(t, 2, connectors[1].ID)
    assert.True(t, connectors[0].IsAvailable())
    assert.True(t, connectors[1].IsAvailable())
}

func TestVirtualCharger_TransactionValidation(t *testing.T) {
    eventBus := eventbus.NewInMemoryBus()
    config := ChargerConfig{
        Identifier:     "TEST001",
        ConnectorCount: 1,
        OCPPVersion:    "1.6",
        CSMSEndpoint:   "ws://localhost:8080/ocpp",
    }
    
    charger := NewVirtualCharger(config, eventBus)
    
    // Test invalid connector ID
    _, err := charger.StartTransaction(5, "USER123") // Connector 5 doesn't exist
    assert.Error(t, err)
    assert.Contains(t, err.Error(), "invalid connector ID")
    
    // Test valid connector but not connected (should fail)
    _, err = charger.StartTransaction(1, "USER123")
    assert.Error(t, err) // Should fail because not connected to CSMS
}

func TestVirtualCharger_EventPublishing(t *testing.T) {
    eventBus := eventbus.NewInMemoryBus()
    
    // Set up event capture
    events := make(chan eventbus.Event, 10)
    eventBus.Subscribe("charger.boot_notification.sent", func(ctx context.Context, event eventbus.Event) error {
        events <- event
        return nil
    })
    
    config := ChargerConfig{
        Identifier:   "TEST001",
        Model:        "TestModel",
        Vendor:       "TestVendor",
        OCPPVersion:  "1.6",
        CSMSEndpoint: "ws://localhost:8080/ocpp",
    }
    
    charger := NewVirtualCharger(config, eventBus)
    
    // This should eventually publish events (when connected)
    // For now, just verify the charger is created with event bus
    assert.NotNil(t, charger)
}
