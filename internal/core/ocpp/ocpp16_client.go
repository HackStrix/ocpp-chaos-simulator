package ocpp

import (
	"context"
	"fmt"
	"net/url"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/sirupsen/logrus"
)

// OCPP16Client implements the OCPP 1.6 client
type OCPP16Client struct {
	chargerID    string
	endpoint     string
	conn         *websocket.Conn
	messageHandler MessageHandler
	connected    bool
	mu           sync.RWMutex
	logger       *logrus.Entry
	ctx          context.Context
	cancel       context.CancelFunc
}

// NewOCCP16Client creates a new OCPP 1.6 client
func NewOCCP16Client(chargerID, endpoint string) Client {
	ctx, cancel := context.WithCancel(context.Background())
	
	logger := logrus.WithFields(logrus.Fields{
		"component":  "ocpp16",
		"charger_id": chargerID,
	})

	return &OCPP16Client{
		chargerID: chargerID,
		endpoint:  endpoint,
		connected: false,
		logger:    logger,
		ctx:       ctx,
		cancel:    cancel,
	}
}

// Connect establishes WebSocket connection to CSMS
func (c *OCPP16Client) Connect(ctx context.Context) error {
	c.logger.Info("Connecting to CSMS")

	// Parse and validate endpoint URL
	u, err := url.Parse(c.endpoint)
	if err != nil {
		return fmt.Errorf("invalid endpoint URL: %w", err)
	}

	// Add charger ID to path
	u.Path = fmt.Sprintf("%s/%s", u.Path, c.chargerID)

	// TODO: Implement actual WebSocket connection
	// Add OCPP subprotocol headers when implementing
	// headers := map[string][]string{
	//     "Sec-WebSocket-Protocol": {"ocpp1.6"},
	// }
	// dialer := websocket.Dialer{
	//     HandshakeTimeout: 10 * time.Second,
	// }
	// conn, _, err := dialer.Dial(u.String(), headers)

	c.mu.Lock()
	c.connected = true // TODO: Set based on actual connection
	c.mu.Unlock()

	c.logger.Info("Connected to CSMS successfully")

	// Start message reading goroutine
	go c.readMessages()

	return nil
}

// Disconnect closes the WebSocket connection
func (c *OCPP16Client) Disconnect(ctx context.Context) error {
	c.logger.Info("Disconnecting from CSMS")

	c.cancel() // Cancel context to stop background routines

	c.mu.Lock()
	defer c.mu.Unlock()

	if c.conn != nil {
		// TODO: Implement graceful close
		// c.conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
		// c.conn.Close()
		c.conn = nil
	}

	c.connected = false
	c.logger.Info("Disconnected from CSMS")
	return nil
}

// IsConnected returns the connection status
func (c *OCPP16Client) IsConnected() bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.connected
}

// SendMessage sends an OCPP message to the CSMS
func (c *OCPP16Client) SendMessage(ctx context.Context, message Message) error {
	if !c.IsConnected() {
		return fmt.Errorf("not connected to CSMS")
	}

	c.logger.WithFields(logrus.Fields{
		"message_type": message.GetMessageType(),
		"message_id":   message.GetMessageID(),
	}).Debug("Sending OCPP message")

	// TODO: Implement message serialization and sending
	// - Serialize message to JSON
	// - Send via WebSocket
	// - Handle response/confirmation

	return fmt.Errorf("not implemented")
}

// SetMessageHandler sets the message handler for incoming messages
func (c *OCPP16Client) SetMessageHandler(handler MessageHandler) {
	c.messageHandler = handler
}

// Start starts the client
func (c *OCPP16Client) Start(ctx context.Context) error {
	return c.Connect(ctx)
}

// Stop stops the client
func (c *OCPP16Client) Stop(ctx context.Context) error {
	return c.Disconnect(ctx)
}

// readMessages reads incoming messages from WebSocket
func (c *OCPP16Client) readMessages() {
	defer func() {
		if r := recover(); r != nil {
			c.logger.Errorf("Panic in readMessages: %v", r)
		}
	}()

	for {
		select {
		case <-c.ctx.Done():
			return
		default:
			// TODO: Implement message reading
			// - Read from WebSocket
			// - Parse OCPP message
			// - Handle with messageHandler
			time.Sleep(100 * time.Millisecond) // Prevent busy loop
		}
	}
}
