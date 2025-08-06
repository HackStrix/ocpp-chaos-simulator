package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/HackStrix/ocpp-chaos-simulator/internal/core/simulation"
	"github.com/HackStrix/ocpp-chaos-simulator/internal/infrastructure/config"
	"github.com/HackStrix/ocpp-chaos-simulator/internal/infrastructure/storage"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize storage
	db, err := storage.NewSQLiteDB(cfg.Database.Path)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Create simulation engine
	engine := simulation.NewEngine(cfg, db)

	// Setup graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		<-sigChan
		log.Println("Shutting down simulator...")
		cancel()
	}()

	// Start the simulation engine
	if err := engine.Start(ctx); err != nil {
		log.Fatalf("Failed to start simulation engine: %v", err)
	}

	log.Println("OCPP Chaos Simulator started successfully")
	<-ctx.Done()
	log.Println("OCPP Chaos Simulator stopped")
}
