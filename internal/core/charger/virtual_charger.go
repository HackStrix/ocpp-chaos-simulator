package charger

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/HackStrix/ocpp-chaos-simulator/internal/core/ocpp"
	"github.com/HackStrix/ocpp-chaos-simulator/pkg/event-bus"
	"github.com/sirupsen/logrus"
)

// VirtualCharger represents a single virtual charger instance
type VirtualCharger struct {
	id           string
	config       ChargerConfig
	ocppClient   ocpp.Client
	eventBus     eventbus.EventBus
	status       ChargerStatus
	connectors   []*Connector
	transactions map[int]*Transaction
	mu           sync.RWMutex
	logger       *logrus.Entry
	ctx          context.Context
	cancel       context.CancelFunc
}

// ChargerConfig holds configuration for a virtual charger
type ChargerConfig struct {
	Identifier     string            `json:"identifier"`
	Model          string            `json:"model"`
	Vendor         string            `json:"vendor"`
	SerialNumber   string            `json:"serial_number"`
	ConnectorCount int               `json:"connector_count"`
	Features       []string          `json:"features"`
	CSMSEndpoint   string            `json:"csms_endpoint"`
	OCPPVersion    string            `json:"ocpp_version"`
	BasicAuthUser  string            `json:"basic_auth_user,omitempty"`
	BasicAuthPass  string            `json:"basic_auth_pass,omitempty"`
	CustomData     map[string]string `json:"custom_data"`
}

// ChargerStatus represents the current status of a charger
type ChargerStatus string

const (
	StatusOffline    ChargerStatus = "offline"
	StatusConnecting ChargerStatus = "connecting"
	StatusConnected  ChargerStatus = "connected"
	StatusError      ChargerStatus = "error"
)

// NewVirtualCharger creates a new virtual charger instance
func NewVirtualCharger(config ChargerConfig, eventBus eventbus.EventBus) *VirtualCharger {
	ctx, cancel := context.WithCancel(context.Background())
	
	logger := logrus.WithFields(logrus.Fields{
		"component":  "charger",
		"charger_id": config.Identifier,
	})

	// Create OCPP client based on version
	var ocppClient ocpp.Client
	switch config.OCPPVersion {
	case "1.6":
		ocppClient = ocpp.NewOCCP16ClientWithConfig(ocpp.ClientConfig{
			ChargerID:     config.Identifier,
			Endpoint:      config.CSMSEndpoint,
			BasicAuthUser: config.BasicAuthUser,
			BasicAuthPass: config.BasicAuthPass,
		})
	default:
		logger.Warnf("Unsupported OCPP version %s, defaulting to 1.6", config.OCPPVersion)
		ocppClient = ocpp.NewOCCP16ClientWithConfig(ocpp.ClientConfig{
			ChargerID:     config.Identifier,
			Endpoint:      config.CSMSEndpoint,
			BasicAuthUser: config.BasicAuthUser,
			BasicAuthPass: config.BasicAuthPass,
		})
	}

	charger := &VirtualCharger{
		id:           config.Identifier,
		config:       config,
		ocppClient:   ocppClient,
		eventBus:     eventBus,
		status:       StatusOffline,
		connectors:   make([]*Connector, config.ConnectorCount),
		transactions: make(map[int]*Transaction),
		logger:       logger,
		ctx:          ctx,
		cancel:       cancel,
	}

	// Initialize connectors
	for i := 0; i < config.ConnectorCount; i++ {
		charger.connectors[i] = NewConnector(i+1, ConnectorStatusAvailable)
	}

	return charger
}

// Start starts the virtual charger
func (vc *VirtualCharger) Start(ctx context.Context) error {
	vc.logger.Info("Starting virtual charger")

	vc.mu.Lock()
	vc.status = StatusConnecting
	vc.mu.Unlock()

	// TODO: Implement charger startup logic
	// - Connect to CSMS via OCPP
	// - Send BootNotification
	// - Start heartbeat
	// - Register message handlers

	if err := vc.connect(); err != nil {
		vc.setStatus(StatusError)
		return fmt.Errorf("failed to connect: %w", err)
	}

	vc.setStatus(StatusConnected)
	vc.logger.Info("Virtual charger started successfully")

	// Start background routines
	go vc.heartbeatLoop()
	go vc.statusLoop()

	return nil
}

// Stop stops the virtual charger
func (vc *VirtualCharger) Stop(ctx context.Context) error {
	vc.logger.Info("Stopping virtual charger")

	// Stop all active transactions
	vc.mu.RLock()
	activeTransactions := make([]*Transaction, 0)
	for _, tx := range vc.transactions {
		if tx.IsActive() {
			activeTransactions = append(activeTransactions, tx)
		}
	}
	vc.mu.RUnlock()

	// Stop each active transaction
	for _, tx := range activeTransactions {
		if err := vc.StopTransaction(tx.ID, "ChargerShutdown"); err != nil {
			vc.logger.WithError(err).WithField("transaction_id", tx.ID).Error("Failed to stop transaction")
		}
	}

	// Disconnect from CSMS
	if vc.IsConnected() {
		if err := vc.ocppClient.Disconnect(ctx); err != nil {
			vc.logger.WithError(err).Error("Failed to disconnect from CSMS")
		}
	}

	// Cancel context to stop background routines
	vc.cancel()

	// Update status
	vc.setStatus(StatusOffline)
	
	// Publish shutdown event
	vc.eventBus.Publish(ctx, eventbus.NewChargerEvent(
		"charger.stopped",
		vc.id,
		map[string]interface{}{
			"active_transactions": len(activeTransactions),
		},
	))

	vc.logger.Info("Virtual charger stopped")
	return nil
}

// GetStatus returns the current status of the charger
func (vc *VirtualCharger) GetStatus() ChargerStatus {
	vc.mu.RLock()
	defer vc.mu.RUnlock()
	return vc.status
}

// GetConnectors returns all connectors
func (vc *VirtualCharger) GetConnectors() []*Connector {
	vc.mu.RLock()
	defer vc.mu.RUnlock()
	return vc.connectors
}

// IsConnected returns true if charger is connected to CSMS
func (vc *VirtualCharger) IsConnected() bool {
	return vc.ocppClient.IsConnected()
}

// StartTransaction starts a charging transaction on a connector
func (vc *VirtualCharger) StartTransaction(connectorID int, idTag string) (*Transaction, error) {
	vc.logger.WithFields(logrus.Fields{
		"connector_id": connectorID,
		"id_tag":       idTag,
	}).Info("Starting transaction")

	vc.mu.Lock()
	defer vc.mu.Unlock()

	// Validate connector ID
	if connectorID < 1 || connectorID > len(vc.connectors) {
		return nil, fmt.Errorf("invalid connector ID: %d", connectorID)
	}

	connector := vc.connectors[connectorID-1]
	
	// Check if connector is available
	if !connector.IsAvailable() {
		return nil, fmt.Errorf("connector %d not available: %s", connectorID, connector.Status)
	}

	// Update connector status
	connector.SetStatus(ConnectorStatusPreparing)

	// Create local transaction record
	transactionID := len(vc.transactions) + 1 // Simple ID generation
	meterValue := 0 // Starting meter value
	transaction := NewTransaction(transactionID, connectorID, idTag, meterValue)
	
	// Send StartTransaction to CSMS
	startReq := &ocpp.StartTransactionRequest{
		ConnectorId: connectorID,
		IdTag:       idTag,
		MeterStart:  meterValue,
		Timestamp:   time.Now(),
	}
	
	msg := &ocpp.OCPP16Message{
		MessageType: "Call",
		MessageID:   fmt.Sprintf("start-%s-%d", vc.id, transactionID),
		Action:      ocpp.MessageTypeStartTransaction,
		Payload:     startReq,
	}
	
	if err := vc.ocppClient.SendMessage(vc.ctx, msg); err != nil {
		connector.SetStatus(ConnectorStatusAvailable)
		return nil, fmt.Errorf("failed to send start transaction: %w", err)
	}
	
	// Store transaction
	vc.transactions[transactionID] = transaction
	
	// Update connector status to charging
	connector.SetStatus(ConnectorStatusCharging)
	
	// Publish event
	vc.eventBus.Publish(vc.ctx, eventbus.NewChargerEvent(
		"charger.transaction.started",
		vc.id,
		map[string]interface{}{
			"transaction_id": transactionID,
			"connector_id":   connectorID,
			"id_tag":         idTag,
		},
	))

	return transaction, nil
}

// StopTransaction stops a charging transaction
func (vc *VirtualCharger) StopTransaction(transactionID int, reason string) error {
	vc.logger.WithFields(logrus.Fields{
		"transaction_id": transactionID,
		"reason":         reason,
	}).Info("Stopping transaction")

	vc.mu.Lock()
	defer vc.mu.Unlock()

	// Find transaction
	transaction, exists := vc.transactions[transactionID]
	if !exists {
		return fmt.Errorf("transaction %d not found", transactionID)
	}

	// Check if already stopped
	if !transaction.IsActive() {
		return fmt.Errorf("transaction %d already stopped", transactionID)
	}

	// Get connector
	if transaction.ConnectorID < 1 || transaction.ConnectorID > len(vc.connectors) {
		return fmt.Errorf("invalid connector ID in transaction: %d", transaction.ConnectorID)
	}
	connector := vc.connectors[transaction.ConnectorID-1]

	// Calculate final meter value (simulate energy usage)
	meterStop := transaction.MeterStart + 5000 // Simulated 5kWh usage
	
	// Send StopTransaction to CSMS
	stopReq := &ocpp.StopTransactionRequest{
		TransactionId: transactionID,
		MeterStop:     meterStop,
		Timestamp:     time.Now(),
		Reason:        &reason,
	}
	
	msg := &ocpp.OCPP16Message{
		MessageType: "Call",
		MessageID:   fmt.Sprintf("stop-%s-%d", vc.id, transactionID),
		Action:      ocpp.MessageTypeStopTransaction,
		Payload:     stopReq,
	}
	
	if err := vc.ocppClient.SendMessage(vc.ctx, msg); err != nil {
		return fmt.Errorf("failed to send stop transaction: %w", err)
	}
	
	// Update transaction
	transaction.Complete(meterStop, reason)
	
	// Update connector status
	connector.SetStatus(ConnectorStatusFinishing)
	
	// Schedule connector to become available after a delay
	go func() {
		time.Sleep(2 * time.Second)
		vc.mu.Lock()
		connector.SetStatus(ConnectorStatusAvailable)
		vc.mu.Unlock()
	}()
	
	// Publish event
	vc.eventBus.Publish(vc.ctx, eventbus.NewChargerEvent(
		"charger.transaction.stopped",
		vc.id,
		map[string]interface{}{
			"transaction_id": transactionID,
			"connector_id":   transaction.ConnectorID,
			"meter_stop":     meterStop,
			"reason":         reason,
		},
	))

	return nil
}

// connect establishes connection to CSMS
func (vc *VirtualCharger) connect() error {
	vc.logger.Debug("Establishing connection to CSMS")
	
	// Connect via OCPP client
	if err := vc.ocppClient.Connect(vc.ctx); err != nil {
		return fmt.Errorf("failed to connect to CSMS: %w", err)
	}
	
	// Set message handler
	vc.ocppClient.SetMessageHandler(vc)
	
	// Send BootNotification
	if err := vc.sendBootNotification(); err != nil {
		vc.ocppClient.Disconnect(vc.ctx)
		return fmt.Errorf("failed to send boot notification: %w", err)
	}
	
	return nil
}

// setStatus updates the charger status and publishes event
func (vc *VirtualCharger) setStatus(status ChargerStatus) {
	vc.mu.Lock()
	oldStatus := vc.status
	vc.status = status
	vc.mu.Unlock()

	// TODO: Publish status change event
	vc.logger.WithFields(logrus.Fields{
		"old_status": oldStatus,
		"new_status": status,
	}).Info("Charger status changed")
}

// heartbeatLoop sends periodic heartbeat messages
func (vc *VirtualCharger) heartbeatLoop() {
	ticker := time.NewTicker(30 * time.Second) // TODO: Make configurable
	defer ticker.Stop()

	for {
		select {
		case <-vc.ctx.Done():
			return
		case <-ticker.C:
			if vc.IsConnected() {
				if err := vc.sendHeartbeat(); err != nil {
					vc.logger.WithError(err).Error("Failed to send heartbeat")
				}
			}
		}
	}
}

// statusLoop periodically updates charger status
func (vc *VirtualCharger) statusLoop() {
	ticker := time.NewTicker(10 * time.Second) // TODO: Make configurable
	defer ticker.Stop()

	for {
		select {
		case <-vc.ctx.Done():
			return
		case <-ticker.C:
			// Send StatusNotification for each connector
			for _, connector := range vc.connectors {
				if err := vc.sendStatusNotification(connector.ID, string(connector.Status)); err != nil {
					vc.logger.WithError(err).Error("Failed to send status notification")
				}
			}
		}
	}
}

// sendBootNotification sends boot notification to CSMS
func (vc *VirtualCharger) sendBootNotification() error {
	bootReq := ocpp.NewBootNotificationRequest(vc.config.Model, vc.config.Vendor)
	if vc.config.SerialNumber != "" {
		bootReq.ChargePointSerialNumber = &vc.config.SerialNumber
	}
	
	msg := &ocpp.OCPP16Message{
		MessageType: "Call",
		MessageID:   fmt.Sprintf("boot-%s-%d", vc.id, time.Now().Unix()),
		Action:      ocpp.MessageTypeBootNotification,
		Payload:     bootReq,
	}
	
	if err := vc.ocppClient.SendMessage(vc.ctx, msg); err != nil {
		return fmt.Errorf("failed to send boot notification: %w", err)
	}
	
	// Publish event
	vc.eventBus.Publish(vc.ctx, eventbus.NewChargerEvent(
		"charger.boot_notification.sent",
		vc.id,
		map[string]interface{}{
			"model":  vc.config.Model,
			"vendor": vc.config.Vendor,
		},
	))
	
	return nil
}

// sendHeartbeat sends heartbeat to CSMS
func (vc *VirtualCharger) sendHeartbeat() error {
	msg := &ocpp.OCPP16Message{
		MessageType: "Call",
		MessageID:   fmt.Sprintf("hb-%s-%d", vc.id, time.Now().Unix()),
		Action:      ocpp.MessageTypeHeartbeat,
		Payload:     ocpp.NewHeartbeatRequest(),
	}
	
	if err := vc.ocppClient.SendMessage(vc.ctx, msg); err != nil {
		return fmt.Errorf("failed to send heartbeat: %w", err)
	}
	
	return nil
}

// sendStatusNotification sends status notification for a connector
func (vc *VirtualCharger) sendStatusNotification(connectorID int, status string) error {
	msg := &ocpp.OCPP16Message{
		MessageType: "Call",
		MessageID:   fmt.Sprintf("status-%s-%d-%d", vc.id, connectorID, time.Now().Unix()),
		Action:      ocpp.MessageTypeStatusNotification,
		Payload:     ocpp.NewStatusNotificationRequest(connectorID, "NoError", status),
	}
	
	if err := vc.ocppClient.SendMessage(vc.ctx, msg); err != nil {
		return fmt.Errorf("failed to send status notification: %w", err)
	}
	
	return nil
}

// HandleMessage implements MessageHandler interface
func (vc *VirtualCharger) HandleMessage(ctx context.Context, message ocpp.Message) error {
	vc.logger.WithFields(logrus.Fields{
		"message_type": message.GetMessageType(),
		"message_id":   message.GetMessageID(),
	}).Debug("Handling OCPP message")
	
	// Type assert to OCPP16Message
	msg, ok := message.(*ocpp.OCPP16Message)
	if !ok {
		return fmt.Errorf("unsupported message type")
	}
	
	// Handle different message types
	switch msg.MessageType {
	case "CallResult":
		return vc.handleCallResult(ctx, msg)
	case "CallError":
		return vc.handleCallError(ctx, msg)
	case "Call":
		return vc.handleCall(ctx, msg)
	default:
		return fmt.Errorf("unknown message type: %s", msg.MessageType)
	}
}

// handleCallResult handles OCPP CallResult messages
func (vc *VirtualCharger) handleCallResult(ctx context.Context, msg *ocpp.OCPP16Message) error {
	vc.logger.WithField("action", msg.Action).Debug("Handling CallResult")
	
	switch msg.Action {
	case ocpp.MessageTypeBootNotification:
		// Handle boot notification response
		resp, ok := msg.Payload.(*ocpp.BootNotificationResponse)
		if !ok {
			return fmt.Errorf("invalid boot notification response")
		}
		
		if resp.Status == "Accepted" {
			vc.logger.Info("Boot notification accepted by CSMS")
			// Update heartbeat interval if needed
		} else {
			vc.logger.WithField("status", resp.Status).Warn("Boot notification not accepted")
		}
		
	case ocpp.MessageTypeStartTransaction:
		// Handle start transaction response
		resp, ok := msg.Payload.(*ocpp.StartTransactionResponse)
		if !ok {
			return fmt.Errorf("invalid start transaction response")
		}
		
		vc.logger.WithField("transaction_id", resp.TransactionId).Info("Transaction started")
		// Update transaction with CSMS transaction ID
		
	case ocpp.MessageTypeStopTransaction:
		// Handle stop transaction response
		vc.logger.Info("Transaction stopped")
	}
	
	return nil
}

// handleCallError handles OCPP CallError messages
func (vc *VirtualCharger) handleCallError(ctx context.Context, msg *ocpp.OCPP16Message) error {
	vc.logger.WithFields(logrus.Fields{
		"action": msg.Action,
		"error":  msg.Payload,
	}).Error("Received CallError from CSMS")
	
	return nil
}

// handleCall handles incoming OCPP Call messages from CSMS
func (vc *VirtualCharger) handleCall(ctx context.Context, msg *ocpp.OCPP16Message) error {
	vc.logger.WithField("action", msg.Action).Debug("Handling Call from CSMS")
	
	// TODO: Implement handlers for CSMS-initiated messages
	// For now, return not implemented error
	return fmt.Errorf("handler not implemented for action: %s", msg.Action)
}

// SendMeterValues sends meter values for an active transaction
func (vc *VirtualCharger) SendMeterValues(transactionID int, meterValue int) error {
	vc.mu.RLock()
	transaction, exists := vc.transactions[transactionID]
	vc.mu.RUnlock()
	
	if !exists {
		return fmt.Errorf("transaction %d not found", transactionID)
	}
	
	if !transaction.IsActive() {
		return fmt.Errorf("transaction %d is not active", transactionID)
	}
	
	// Create meter value
	sampledValue := ocpp.SampledValue{
		Value: fmt.Sprintf("%d", meterValue),
	}
	measurand := "Energy.Active.Import.Register"
	unit := "Wh"
	sampledValue.Measurand = &measurand
	sampledValue.Unit = &unit
	
	meterValueReq := &ocpp.MeterValuesRequest{
		ConnectorId:   transaction.ConnectorID,
		TransactionId: &transactionID,
		MeterValue: []ocpp.MeterValue{
			{
				Timestamp:    time.Now(),
				SampledValue: []ocpp.SampledValue{sampledValue},
			},
		},
	}
	
	msg := &ocpp.OCPP16Message{
		MessageType: "Call",
		MessageID:   fmt.Sprintf("mv-%s-%d-%d", vc.id, transactionID, time.Now().Unix()),
		Action:      ocpp.MessageTypeMeterValues,
		Payload:     meterValueReq,
	}
	
	if err := vc.ocppClient.SendMessage(vc.ctx, msg); err != nil {
		return fmt.Errorf("failed to send meter values: %w", err)
	}
	
	vc.logger.WithFields(logrus.Fields{
		"transaction_id": transactionID,
		"meter_value":    meterValue,
	}).Debug("Sent meter values")
	
	return nil
}

// SimulateCharging simulates a charging session with periodic meter updates
func (vc *VirtualCharger) SimulateCharging(ctx context.Context, transactionID int, duration time.Duration, powerKW float64) error {
	ticker := time.NewTicker(30 * time.Second) // Send meter values every 30 seconds
	defer ticker.Stop()
	
	startTime := time.Now()
	initialMeter := 0
	
	vc.mu.RLock()
	transaction, exists := vc.transactions[transactionID]
	if exists {
		initialMeter = transaction.MeterStart
	}
	vc.mu.RUnlock()
	
	if !exists {
		return fmt.Errorf("transaction %d not found", transactionID)
	}
	
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
			elapsed := time.Since(startTime)
			if elapsed >= duration {
				return nil
			}
			
			// Calculate energy consumed (kWh to Wh)
			energyWh := int(powerKW * elapsed.Hours() * 1000)
			currentMeter := initialMeter + energyWh
			
			if err := vc.SendMeterValues(transactionID, currentMeter); err != nil {
				vc.logger.WithError(err).Error("Failed to send meter values")
			}
		}
	}
}
