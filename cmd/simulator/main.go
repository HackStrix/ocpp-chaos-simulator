package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"sync"
	"syscall"

	"github.com/HackStrix/ocpp-chaos-simulator/internal/api"
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

	// Create API server
	apiServer := api.NewServer(engine, db)

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

	// Start services concurrently
	var wg sync.WaitGroup
	wg.Add(2)

	// Start the simulation engine
	go func() {
		defer wg.Done()
		if err := engine.Start(ctx); err != nil {
			log.Printf("Simulation engine error: %v", err)
		}
	}()

	// Start the API server
	go func() {
		defer wg.Done()
		port := 8080
		if cfg.Server.Port > 0 {
			port = cfg.Server.Port
		}
		if err := apiServer.Start(ctx, port); err != nil {
			log.Printf("API server error: %v", err)
		}
	}()

	log.Println("OCPP Chaos Simulator started successfully")
	log.Printf("API server running on http://localhost:8080")

	// Wait for shutdown signal
	<-ctx.Done()
	log.Println("Shutting down...")

	// Wait for services to stop
	wg.Wait()
	log.Println("OCPP Chaos Simulator stopped")
}
