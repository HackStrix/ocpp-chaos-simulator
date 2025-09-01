package api

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/HackStrix/ocpp-chaos-simulator/internal/core/simulation"
	"github.com/HackStrix/ocpp-chaos-simulator/internal/infrastructure/storage"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// Server represents the API server
type Server struct {
	engine *simulation.Engine
	db     storage.Database
	router *gin.Engine
	server *http.Server
	logger *logrus.Logger
}

// NewServer creates a new API server
func NewServer(engine *simulation.Engine, db storage.Database) *Server {
	logger := logrus.New()
	logger.SetLevel(logrus.InfoLevel)

	s := &Server{
		engine: engine,
		db:     db,
		logger: logger,
	}

	s.setupRoutes()
	return s
}

// setupRoutes configures the API routes
func (s *Server) setupRoutes() {
	// Set Gin to release mode in production
	gin.SetMode(gin.ReleaseMode)

	s.router = gin.New()

	// Middleware
	s.router.Use(gin.Logger())
	s.router.Use(gin.Recovery())
	s.router.Use(s.corsMiddleware())

	// Health check
	s.router.GET("/health", s.healthCheck)

	// API routes
	api := s.router.Group("/api")
	{
		// Charger management
		api.GET("/chargers", s.getChargers)
		api.POST("/chargers", s.createCharger)
		api.GET("/chargers/:id", s.getCharger)
		api.DELETE("/chargers/:id", s.deleteCharger)

		// Scenario management
		api.GET("/scenarios", s.getScenarios)
		api.POST("/scenarios/:name/run", s.runScenario)
		api.POST("/scenarios/:name/stop", s.stopScenario)
		api.GET("/scenarios/:name", s.getScenario)

		// System status
		api.GET("/status", s.getSystemStatus)

		// Event logs
		api.GET("/events", s.getEvents)
	}

	// Static files for frontend (if needed)
	s.router.Static("/static", "./frontend/dist")
}

// corsMiddleware handles CORS for frontend development
func (s *Server) corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// Start starts the API server
func (s *Server) Start(ctx context.Context, port int) error {
	s.server = &http.Server{
		Addr:         fmt.Sprintf(":%d", port),
		Handler:      s.router,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	s.logger.WithField("port", port).Info("Starting API server")

	// Start server in goroutine
	go func() {
		if err := s.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			s.logger.WithError(err).Error("Failed to start server")
		}
	}()

	// Wait for shutdown signal
	<-ctx.Done()
	return s.shutdown()
}

// shutdown gracefully shuts down the server
func (s *Server) shutdown() error {
	s.logger.Info("Shutting down API server")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := s.server.Shutdown(ctx); err != nil {
		s.logger.WithError(err).Error("Server forced to shutdown")
		return err
	}

	s.logger.Info("API server stopped")
	return nil
}

// ErrorResponse represents an API error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
	Code    int    `json:"code"`
}

// SuccessResponse represents a successful API response
type SuccessResponse struct {
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
}

// respondError sends an error response
func (s *Server) respondError(c *gin.Context, code int, err error, message ...string) {
	msg := ""
	if len(message) > 0 {
		msg = message[0]
	}

	s.logger.WithError(err).WithField("code", code).Error("API error")

	c.JSON(code, ErrorResponse{
		Error:   err.Error(),
		Message: msg,
		Code:    code,
	})
}

// respondSuccess sends a success response
func (s *Server) respondSuccess(c *gin.Context, data interface{}, message ...string) {
	msg := ""
	if len(message) > 0 {
		msg = message[0]
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Data:    data,
		Message: msg,
	})
}
