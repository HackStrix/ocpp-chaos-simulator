package eventbus

import (
	"time"
)

// BaseEvent provides a basic implementation of Event interface
type BaseEvent struct {
	EventType string      `json:"type"`
	EventData interface{} `json:"data"`
	EventTime int64       `json:"timestamp"`
}

// Type returns the event type
func (e *BaseEvent) Type() string {
	return e.EventType
}

// Data returns the event data
func (e *BaseEvent) Data() interface{} {
	return e.EventData
}

// Timestamp returns the event timestamp
func (e *BaseEvent) Timestamp() int64 {
	return e.EventTime
}

// NewEvent creates a new base event
func NewEvent(eventType string, data interface{}) Event {
	return &BaseEvent{
		EventType: eventType,
		EventData: data,
		EventTime: time.Now().Unix(),
	}
}

// Event type constants
const (
	EventTypeChargerStatusChanged    = "charger.status.changed"
	EventTypeSimulationStarted       = "simulation.started"
	EventTypeSimulationStopped       = "simulation.stopped"
	EventTypeTransactionStarted      = "transaction.started"
	EventTypeTransactionStopped      = "transaction.stopped"
	EventTypeOCPPMessageReceived     = "ocpp.message.received"
	EventTypeOCPPMessageSent         = "ocpp.message.sent"
	EventTypeChaosInjected           = "chaos.injected"
	EventTypeChaosRecovered          = "chaos.recovered"
)

// ChargerStatusChangedData represents data for charger status change event
type ChargerStatusChangedData struct {
	ChargerID string `json:"charger_id"`
	OldStatus string `json:"old_status"`
	NewStatus string `json:"new_status"`
}

// SimulationEventData represents data for simulation events
type SimulationEventData struct {
	SimulationID uint   `json:"simulation_id"`
	Name         string `json:"name"`
}

// TransactionEventData represents data for transaction events
type TransactionEventData struct {
	TransactionID int    `json:"transaction_id"`
	ChargerID     string `json:"charger_id"`
	ConnectorID   int    `json:"connector_id"`
	IDTag         string `json:"id_tag"`
}

// OCPPMessageEventData represents data for OCPP message events
type OCPPMessageEventData struct {
	ChargerID   string `json:"charger_id"`
	MessageType string `json:"message_type"`
	MessageID   string `json:"message_id"`
	Direction   string `json:"direction"` // "incoming" or "outgoing"
}

// ChaosEventData represents data for chaos events
type ChaosEventData struct {
	StrategyName string `json:"strategy_name"`
	Target       string `json:"target"`
	Description  string `json:"description"`
}

// ChargerEvent represents a generic charger event
type ChargerEvent struct {
	ChargerID string                 `json:"charger_id"`
	Data      map[string]interface{} `json:"data"`
}

// NewChargerEvent creates a new charger event
func NewChargerEvent(eventType string, chargerID string, data map[string]interface{}) Event {
	return NewEvent(eventType, ChargerEvent{
		ChargerID: chargerID,
		Data:      data,
	})
}
