package ocpp

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/sirupsen/logrus"
)

// OCPP16Client implements the OCPP 1.6 client
type OCPP16Client struct {
	config         ClientConfig
	conn           *websocket.Conn
	messageHandler MessageHandler
	connected      bool
	mu             sync.RWMutex
	logger         *logrus.Entry
	ctx            context.Context
	cancel         context.CancelFunc
	pendingCalls   map[string]chan *OCPP16Message // For tracking call responses
	messageQueue   chan []byte
}

// NewOCCP16Client creates a new OCPP 1.6 client
func NewOCCP16Client(chargerID, endpoint string) Client {
	return NewOCCP16ClientWithConfig(ClientConfig{
		ChargerID: chargerID,
		Endpoint:  endpoint,
	})
}

// NewOCCP16ClientWithConfig creates a new OCPP 1.6 client with full config
func NewOCCP16ClientWithConfig(config ClientConfig) Client {
	ctx, cancel := context.WithCancel(context.Background())
	
	logger := logrus.WithFields(logrus.Fields{
		"component":  "ocpp16",
		"charger_id": config.ChargerID,
	})

	return &OCPP16Client{
		config:       config,
		connected:    false,
		logger:       logger,
		ctx:          ctx,
		cancel:       cancel,
		pendingCalls: make(map[string]chan *OCPP16Message),
		messageQueue: make(chan []byte, 100),
	}
}

// Connect establishes WebSocket connection to CSMS
func (c *OCPP16Client) Connect(ctx context.Context) error {
	c.logger.Info("Connecting to CSMS")

	// Parse and validate endpoint URL
	u, err := url.Parse(c.config.Endpoint)
	if err != nil {
		return fmt.Errorf("invalid endpoint URL: %w", err)
	}

	// Add charger ID to path
	u.Path = fmt.Sprintf("%s/%s", u.Path, c.config.ChargerID)

	// Set up WebSocket headers with OCPP subprotocol
	headers := http.Header{
		"Sec-WebSocket-Protocol": []string{"ocpp1.6"},
	}
	
	// Add basic auth if credentials provided
	if c.config.BasicAuthUser != "" && c.config.BasicAuthPass != "" {
		headers.Set("Authorization", "Basic "+basicAuth(c.config.BasicAuthUser, c.config.BasicAuthPass))
	}

	// Create WebSocket dialer with timeout
	dialer := websocket.Dialer{
		HandshakeTimeout: 10 * time.Second,
	}

	// Connect to CSMS
	c.logger.WithField("url", u.String()).Debug("Connecting to CSMS")
	conn, resp, err := dialer.Dial(u.String(), headers)
	if err != nil {
		return fmt.Errorf("failed to dial websocket: %w", err)
	}
	defer resp.Body.Close()

	// Verify OCPP subprotocol was accepted
	if resp.Header.Get("Sec-WebSocket-Protocol") != "ocpp1.6" {
		conn.Close()
		return fmt.Errorf("server did not accept OCPP 1.6 subprotocol")
	}

	c.mu.Lock()
	c.conn = conn
	c.connected = true
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
		// Send close message
		deadline := time.Now().Add(5 * time.Second)
		c.conn.SetWriteDeadline(deadline)
		c.conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, "charger disconnecting"))
		
		// Close connection
		c.conn.Close()
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

	// Ensure message is OCPP16Message
	ocppMsg, ok := message.(*OCPP16Message)
	if !ok {
		return fmt.Errorf("invalid message type, expected OCPP16Message")
	}

	// Create OCPP 1.6 Call array format: [MessageTypeId, MessageId, Action, Payload]
	callArray := []interface{}{
		2, // MessageTypeId for Call
		ocppMsg.MessageID,
		ocppMsg.Action,
		ocppMsg.Payload,
	}

	// Marshal to JSON
	data, err := json.Marshal(callArray)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}

	c.logger.WithFields(logrus.Fields{
		"data": string(data),
	}).Debug("Sending OCPP message")

	// Send message
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.conn == nil {
		return fmt.Errorf("websocket connection is nil")
	}

	if err := c.conn.WriteMessage(websocket.TextMessage, data); err != nil {
		return fmt.Errorf("failed to write message: %w", err)
	}

	return nil
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
		// Mark as disconnected on exit
		c.mu.Lock()
		c.connected = false
		c.mu.Unlock()
	}()

	for {
		select {
		case <-c.ctx.Done():
			return
		default:
			// Set read deadline
			c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
			
			// Read message from WebSocket
			messageType, data, err := c.conn.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					c.logger.WithError(err).Error("WebSocket connection closed unexpectedly")
				}
				return
			}

			if messageType != websocket.TextMessage {
				c.logger.WithField("type", messageType).Warn("Received non-text message")
				continue
			}

			// Parse OCPP message
			c.logger.WithField("data", string(data)).Debug("Received raw message")
			
			msg, err := c.parseOCPPMessage(data)
			if err != nil {
				c.logger.WithError(err).Error("Failed to parse OCPP message")
				continue
			}

			// Handle message
			if c.messageHandler != nil {
				go func(m *OCPP16Message) {
					if err := c.messageHandler.HandleMessage(c.ctx, m); err != nil {
						c.logger.WithError(err).Error("Failed to handle message")
					}
				}(msg)
			}
		}
	}
}

// parseOCPPMessage parses raw OCPP 1.6 message
func (c *OCPP16Client) parseOCPPMessage(data []byte) (*OCPP16Message, error) {
	// OCPP 1.6 uses array format: [MessageTypeId, MessageId, ...]
	var msgArray []json.RawMessage
	if err := json.Unmarshal(data, &msgArray); err != nil {
		return nil, fmt.Errorf("failed to unmarshal message array: %w", err)
	}

	if len(msgArray) < 2 {
		return nil, fmt.Errorf("invalid message format: too few elements")
	}

	// Parse message type ID
	var messageTypeID int
	if err := json.Unmarshal(msgArray[0], &messageTypeID); err != nil {
		return nil, fmt.Errorf("failed to parse message type ID: %w", err)
	}

	// Parse message ID
	var messageID string
	if err := json.Unmarshal(msgArray[1], &messageID); err != nil {
		return nil, fmt.Errorf("failed to parse message ID: %w", err)
	}

	msg := &OCPP16Message{
		MessageID: messageID,
	}

	switch messageTypeID {
	case 2: // Call
		if len(msgArray) < 4 {
			return nil, fmt.Errorf("invalid Call message format")
		}
		
		var action string
		if err := json.Unmarshal(msgArray[2], &action); err != nil {
			return nil, fmt.Errorf("failed to parse action: %w", err)
		}
		
		msg.MessageType = "Call"
		msg.Action = action
		msg.Payload = msgArray[3] // Keep as raw JSON for now
		
	case 3: // CallResult
		if len(msgArray) < 3 {
			return nil, fmt.Errorf("invalid CallResult message format")
		}
		
		msg.MessageType = "CallResult"
		msg.Payload = msgArray[2] // Keep as raw JSON for now
		
	case 4: // CallError
		if len(msgArray) < 5 {
			return nil, fmt.Errorf("invalid CallError message format")
		}
		
		msg.MessageType = "CallError"
		// Parse error details
		var errorCode string
		var errorDescription string
		json.Unmarshal(msgArray[2], &errorCode)
		json.Unmarshal(msgArray[3], &errorDescription)
		
		msg.Payload = map[string]interface{}{
			"errorCode":        errorCode,
			"errorDescription": errorDescription,
			"errorDetails":     msgArray[4],
		}
		
	default:
		return nil, fmt.Errorf("unknown message type ID: %d", messageTypeID)
	}

	return msg, nil
}

// basicAuth creates a basic auth string from username and password
func basicAuth(username, password string) string {
	auth := username + ":" + password
	return base64.StdEncoding.EncodeToString([]byte(auth))
}
