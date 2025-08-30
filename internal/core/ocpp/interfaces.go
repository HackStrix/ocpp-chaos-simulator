package ocpp

import (
	"context"
)

// Client defines the interface for OCPP client implementations
type Client interface {
	// Connection management
	Connect(ctx context.Context) error
	Disconnect(ctx context.Context) error
	IsConnected() bool

	// Message handling
	SendMessage(ctx context.Context, message Message) error
	SetMessageHandler(handler MessageHandler)

	// Lifecycle
	Start(ctx context.Context) error
	Stop(ctx context.Context) error
}

// Message represents a generic OCPP message
type Message interface {
	GetMessageType() string
	GetMessageID() string
	Validate() error
}

// MessageHandler handles incoming OCPP messages
type MessageHandler interface {
	HandleMessage(ctx context.Context, message Message) error
}

// Protocol defines the OCPP protocol interface
type Protocol interface {
	Version() string
	CreateClient(chargerID, endpoint string) Client
	ParseMessage(data []byte) (Message, error)
	SerializeMessage(message Message) ([]byte, error)
}

// ClientConfig holds configuration for OCPP client
type ClientConfig struct {
	ChargerID     string
	Endpoint      string
	BasicAuthUser string
	BasicAuthPass string
}
