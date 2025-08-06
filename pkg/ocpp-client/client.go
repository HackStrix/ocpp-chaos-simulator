package ocppclient

import (
	"context"

	"github.com/HackStrix/ocpp-chaos-simulator/internal/core/ocpp"
)

// Client provides a public interface to OCPP client functionality
type Client interface {
	// Connection management
	Connect(ctx context.Context) error
	Disconnect(ctx context.Context) error
	IsConnected() bool

	// Message operations
	SendMessage(ctx context.Context, message ocpp.Message) error
	SetMessageHandler(handler ocpp.MessageHandler)

	// Lifecycle
	Start(ctx context.Context) error
	Stop(ctx context.Context) error
}

// Config holds client configuration
type Config struct {
	ChargerID    string `json:"charger_id"`
	Endpoint     string `json:"endpoint"`
	OCPPVersion  string `json:"ocpp_version"`
	Timeout      int    `json:"timeout"`
	RetryAttempts int   `json:"retry_attempts"`
}

// NewClient creates a new OCPP client based on configuration
func NewClient(config Config) Client {
	switch config.OCPPVersion {
	case "1.6":
		return ocpp.NewOCCP16Client(config.ChargerID, config.Endpoint)
	default:
		// Default to OCPP 1.6
		return ocpp.NewOCCP16Client(config.ChargerID, config.Endpoint)
	}
}
