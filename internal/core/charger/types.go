package charger

import (
	"time"
)

// Connector represents a charging connector
type Connector struct {
	ID     int             `json:"id"`
	Status ConnectorStatus `json:"status"`
}

// ConnectorStatus represents the status of a connector
type ConnectorStatus string

const (
	ConnectorStatusAvailable     ConnectorStatus = "Available"
	ConnectorStatusPreparing     ConnectorStatus = "Preparing"
	ConnectorStatusCharging      ConnectorStatus = "Charging"
	ConnectorStatusSuspendedEVSE ConnectorStatus = "SuspendedEVSE"
	ConnectorStatusSuspendedEV   ConnectorStatus = "SuspendedEV"
	ConnectorStatusFinishing     ConnectorStatus = "Finishing"
	ConnectorStatusReserved      ConnectorStatus = "Reserved"
	ConnectorStatusUnavailable   ConnectorStatus = "Unavailable"
	ConnectorStatusFaulted       ConnectorStatus = "Faulted"
)

// Transaction represents a charging transaction
type Transaction struct {
	ID          int       `json:"id"`
	ConnectorID int       `json:"connector_id"`
	IDTag       string    `json:"id_tag"`
	StartTime   time.Time `json:"start_time"`
	EndTime     *time.Time `json:"end_time,omitempty"`
	MeterStart  int       `json:"meter_start"`
	MeterStop   *int      `json:"meter_stop,omitempty"`
	Reason      string    `json:"reason,omitempty"`
	Status      TransactionStatus `json:"status"`
}

// TransactionStatus represents the status of a transaction
type TransactionStatus string

const (
	TransactionStatusActive    TransactionStatus = "active"
	TransactionStatusCompleted TransactionStatus = "completed"
	TransactionStatusFailed    TransactionStatus = "failed"
)

// NewConnector creates a new connector
func NewConnector(id int, status ConnectorStatus) *Connector {
	return &Connector{
		ID:     id,
		Status: status,
	}
}

// SetStatus updates the connector status
func (c *Connector) SetStatus(status ConnectorStatus) {
	c.Status = status
}

// IsAvailable returns true if the connector is available for charging
func (c *Connector) IsAvailable() bool {
	return c.Status == ConnectorStatusAvailable
}

// NewTransaction creates a new transaction
func NewTransaction(id, connectorID int, idTag string, meterStart int) *Transaction {
	return &Transaction{
		ID:          id,
		ConnectorID: connectorID,
		IDTag:       idTag,
		StartTime:   time.Now(),
		MeterStart:  meterStart,
		Status:      TransactionStatusActive,
	}
}

// Complete completes the transaction
func (t *Transaction) Complete(meterStop int, reason string) {
	now := time.Now()
	t.EndTime = &now
	t.MeterStop = &meterStop
	t.Reason = reason
	t.Status = TransactionStatusCompleted
}

// Fail marks the transaction as failed
func (t *Transaction) Fail(reason string) {
	now := time.Now()
	t.EndTime = &now
	t.Reason = reason
	t.Status = TransactionStatusFailed
}

// IsActive returns true if the transaction is active
func (t *Transaction) IsActive() bool {
	return t.Status == TransactionStatusActive
}
