package main

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/HackStrix/ocpp-chaos-simulator/internal/core/charger"
	"github.com/HackStrix/ocpp-chaos-simulator/pkg/event-bus"
	"github.com/sirupsen/logrus"
)

func main() {
	// Set up logging
	logrus.SetLevel(logrus.DebugLevel)
	logrus.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
	})

	// Create event bus
	eventBus := eventbus.NewInMemoryBus()

	// Subscribe to charger events
	eventBus.Subscribe("charger.boot_notification.sent", func(ctx context.Context, event eventbus.Event) error {
		log.Printf("Event: %s - Data: %+v", event.Type(), event.Data())
		return nil
	})

	eventBus.Subscribe("charger.transaction.started", func(ctx context.Context, event eventbus.Event) error {
		log.Printf("Event: %s - Data: %+v", event.Type(), event.Data())
		return nil
	})

	// Create charger configuration
	config := charger.ChargerConfig{
		Identifier:     getEnvOrDefault("CHARGER_ID", "CHAOS_TEST"),
		Model:          "TestCharger",
		Vendor:         "TestVendor",
		SerialNumber:   "SN123456",
		ConnectorCount: 2,
		Features:       []string{"Core"},
		CSMSEndpoint:   getEnvOrDefault("CSMS_ENDPOINT", "ws://api.voltra.sh/csms/connect/C7PNRUQ7/ocpp/"),
		OCPPVersion:    "1.6",
		BasicAuthUser:  getEnvOrDefault("CSMS_BASIC_AUTH_USER", "CHAOS_TEST"),
		BasicAuthPass:  getEnvOrDefault("CSMS_BASIC_AUTH_PASS", "ycSoVRUmitaGgG0RK6+vrurXGn6fkpfO"),
	}

	// Create virtual charger
	virtualCharger := charger.NewVirtualCharger(config, eventBus)

	// Create context for the test
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	// Start the charger
	log.Println("Starting virtual charger...")
	if err := virtualCharger.Start(ctx); err != nil {
		log.Fatalf("Failed to start charger: %v", err)
	}

	// Wait for charger to connect and initialize
	time.Sleep(5 * time.Second)

	// Check charger status
	status := virtualCharger.GetStatus()
	log.Printf("Charger status: %s", status)

	// Check if connected
	if !virtualCharger.IsConnected() {
		log.Println("Warning: Charger is not connected to CSMS")
		log.Println("Make sure a CSMS is running on ws://localhost:8080/ocpp")
		log.Println("Continuing with demo anyway...")
	}

	// Start a transaction
	log.Println("Starting a charging transaction...")
	transaction, err := virtualCharger.StartTransaction(1, "USER123")
	if err != nil {
		log.Printf("Failed to start transaction: %v", err)
	} else {
		log.Printf("Transaction started: ID=%d", transaction.ID)

		// Simulate charging for 30 seconds
		log.Println("Simulating charging for 30 seconds...")
		chargingCtx, chargingCancel := context.WithTimeout(ctx, 30*time.Second)
		defer chargingCancel()

		// Start charging simulation in background
		go func() {
			if err := virtualCharger.SimulateCharging(chargingCtx, transaction.ID, 30*time.Second, 7.4); err != nil {
				log.Printf("Charging simulation error: %v", err)
			}
		}()

		// Wait for charging to complete
		<-chargingCtx.Done()

		// Stop the transaction
		log.Println("Stopping transaction...")
		if err := virtualCharger.StopTransaction(transaction.ID, "Local"); err != nil {
			log.Printf("Failed to stop transaction: %v", err)
		} else {
			log.Println("Transaction stopped successfully")
		}
	}

	// Wait a bit before stopping
	time.Sleep(60 * time.Second)

	// Stop the charger
	log.Println("Stopping virtual charger...")
	if err := virtualCharger.Stop(ctx); err != nil {
		log.Printf("Failed to stop charger: %v", err)
	}

	log.Println("Test completed")
}

// getEnvOrDefault gets an environment variable or returns a default value
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
