package ocpp

import (
	"encoding/json"
	"fmt"
	"time"
)

// OCPP 1.6 Message Types
const (
	// Core Profile
	MessageTypeAuthorize          = "Authorize"
	MessageTypeBootNotification   = "BootNotification"
	MessageTypeDataTransfer       = "DataTransfer"
	MessageTypeHeartbeat          = "Heartbeat"
	MessageTypeMeterValues        = "MeterValues"
	MessageTypeStartTransaction   = "StartTransaction"
	MessageTypeStatusNotification = "StatusNotification"
	MessageTypeStopTransaction    = "StopTransaction"
)

// OCPP16Message represents a generic OCPP 1.6 message
type OCPP16Message struct {
	MessageType string      `json:"message_type"`
	MessageID   string      `json:"message_id"`
	Action      string      `json:"action"`
	Payload     interface{} `json:"payload"`
}

// GetMessageType returns the message type
func (m *OCPP16Message) GetMessageType() string {
	return m.MessageType
}

// GetMessageID returns the message ID
func (m *OCPP16Message) GetMessageID() string {
	return m.MessageID
}

// Validate validates the message
func (m *OCPP16Message) Validate() error {
	if m.MessageID == "" {
		return fmt.Errorf("message ID is required")
	}
	if m.Action == "" {
		return fmt.Errorf("action is required")
	}
	return nil
}

// BootNotificationRequest represents OCPP 1.6 BootNotification request
type BootNotificationRequest struct {
	ChargePointModel         string  `json:"chargePointModel"`
	ChargePointVendor        string  `json:"chargePointVendor"`
	ChargePointSerialNumber  *string `json:"chargePointSerialNumber,omitempty"`
	FirmwareVersion          *string `json:"firmwareVersion,omitempty"`
	Iccid                    *string `json:"iccid,omitempty"`
	Imsi                     *string `json:"imsi,omitempty"`
	MeterSerialNumber        *string `json:"meterSerialNumber,omitempty"`
	MeterType                *string `json:"meterType,omitempty"`
}

// BootNotificationResponse represents OCPP 1.6 BootNotification response
type BootNotificationResponse struct {
	CurrentTime time.Time `json:"currentTime"`
	Interval    int       `json:"interval"`
	Status      string    `json:"status"`
}

// HeartbeatRequest represents OCPP 1.6 Heartbeat request
type HeartbeatRequest struct{}

// HeartbeatResponse represents OCPP 1.6 Heartbeat response
type HeartbeatResponse struct {
	CurrentTime time.Time `json:"currentTime"`
}

// StatusNotificationRequest represents OCPP 1.6 StatusNotification request
type StatusNotificationRequest struct {
	ConnectorId     int       `json:"connectorId"`
	ErrorCode       string    `json:"errorCode"`
	Status          string    `json:"status"`
	Info            *string   `json:"info,omitempty"`
	Timestamp       time.Time `json:"timestamp"`
	VendorId        *string   `json:"vendorId,omitempty"`
	VendorErrorCode *string   `json:"vendorErrorCode,omitempty"`
}

// StatusNotificationResponse represents OCPP 1.6 StatusNotification response
type StatusNotificationResponse struct{}

// StartTransactionRequest represents OCPP 1.6 StartTransaction request
type StartTransactionRequest struct {
	ConnectorId   int    `json:"connectorId"`
	IdTag         string `json:"idTag"`
	MeterStart    int    `json:"meterStart"`
	ReservationId *int   `json:"reservationId,omitempty"`
	Timestamp     time.Time `json:"timestamp"`
}

// StartTransactionResponse represents OCPP 1.6 StartTransaction response
type StartTransactionResponse struct {
	IdTagInfo     IdTagInfo `json:"idTagInfo"`
	TransactionId int       `json:"transactionId"`
}

// StopTransactionRequest represents OCPP 1.6 StopTransaction request
type StopTransactionRequest struct {
	IdTag         *string       `json:"idTag,omitempty"`
	MeterStop     int           `json:"meterStop"`
	Timestamp     time.Time     `json:"timestamp"`
	TransactionId int           `json:"transactionId"`
	Reason        *string       `json:"reason,omitempty"`
	TransactionData []MeterValue `json:"transactionData,omitempty"`
}

// StopTransactionResponse represents OCPP 1.6 StopTransaction response
type StopTransactionResponse struct {
	IdTagInfo *IdTagInfo `json:"idTagInfo,omitempty"`
}

// IdTagInfo represents OCPP 1.6 IdTagInfo
type IdTagInfo struct {
	ExpiryDate  *time.Time `json:"expiryDate,omitempty"`
	ParentIdTag *string    `json:"parentIdTag,omitempty"`
	Status      string     `json:"status"`
}

// MeterValue represents OCPP 1.6 MeterValue
type MeterValue struct {
	Timestamp    time.Time           `json:"timestamp"`
	SampledValue []SampledValue      `json:"sampledValue"`
}

// SampledValue represents OCPP 1.6 SampledValue
type SampledValue struct {
	Value     string  `json:"value"`
	Context   *string `json:"context,omitempty"`
	Format    *string `json:"format,omitempty"`
	Measurand *string `json:"measurand,omitempty"`
	Phase     *string `json:"phase,omitempty"`
	Location  *string `json:"location,omitempty"`
	Unit      *string `json:"unit,omitempty"`
}

// NewBootNotificationRequest creates a new BootNotification request
func NewBootNotificationRequest(model, vendor string) *BootNotificationRequest {
	return &BootNotificationRequest{
		ChargePointModel:  model,
		ChargePointVendor: vendor,
	}
}

// NewHeartbeatRequest creates a new Heartbeat request
func NewHeartbeatRequest() *HeartbeatRequest {
	return &HeartbeatRequest{}
}

// NewStatusNotificationRequest creates a new StatusNotification request
func NewStatusNotificationRequest(connectorID int, errorCode, status string) *StatusNotificationRequest {
	return &StatusNotificationRequest{
		ConnectorId: connectorID,
		ErrorCode:   errorCode,
		Status:      status,
		Timestamp:   time.Now(),
	}
}

// ToJSON converts message to JSON
func (m *OCPP16Message) ToJSON() ([]byte, error) {
	return json.Marshal(m)
}

// FromJSON creates message from JSON
func FromJSON(data []byte) (*OCPP16Message, error) {
	var msg OCPP16Message
	if err := json.Unmarshal(data, &msg); err != nil {
		return nil, err
	}
	return &msg, nil
}
