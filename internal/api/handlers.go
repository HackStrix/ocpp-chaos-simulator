package api

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/HackStrix/ocpp-chaos-simulator/internal/core/charger"
	"github.com/HackStrix/ocpp-chaos-simulator/internal/infrastructure/storage"
	"github.com/gin-gonic/gin"
)

// healthCheck returns server health status
func (s *Server) healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"timestamp": time.Now(),
		"service":   "ocpp-chaos-simulator",
	})
}

// ChargerResponse represents the API response format for chargers
type ChargerResponse struct {
	ID           uint                   `json:"id"`
	Identifier   string                 `json:"identifier"`
	Status       string                 `json:"status"`
	Model        string                 `json:"model,omitempty"`
	Vendor       string                 `json:"vendor,omitempty"`
	SerialNumber string                 `json:"serial_number,omitempty"`
	Connectors   int                    `json:"connector_count"`
	LastSeen     *time.Time             `json:"last_seen,omitempty"`
	Config       *charger.ChargerConfig `json:"config,omitempty"`
	CreatedAt    time.Time              `json:"created_at"`
	UpdatedAt    time.Time              `json:"updated_at"`
}

// CreateChargerRequest represents the request to create a new charger
type CreateChargerRequest struct {
	Identifier     string            `json:"identifier" binding:"required"`
	Model          string            `json:"model"`
	Vendor         string            `json:"vendor"`
	SerialNumber   string            `json:"serial_number"`
	ConnectorCount int               `json:"connector_count"`
	CSMSEndpoint   string            `json:"csms_endpoint"`
	OCPPVersion    string            `json:"ocpp_version"`
	BasicAuthUser  string            `json:"basic_auth_user"`
	BasicAuthPass  string            `json:"basic_auth_pass"`
	CustomData     map[string]string `json:"custom_data"`
}

// getChargers returns a list of all chargers
func (s *Server) getChargers(c *gin.Context) {
	var chargers []storage.Charger

	db := s.db.GetDB()
	if err := db.Find(&chargers).Error; err != nil {
		s.respondError(c, http.StatusInternalServerError, err, "Failed to fetch chargers")
		return
	}

	// Convert to response format
	var response []ChargerResponse
	for _, charger := range chargers {
		response = append(response, ChargerResponse{
			ID:         charger.ID,
			Identifier: charger.Identifier,
			Status:     charger.Status,
			CreatedAt:  charger.CreatedAt,
			UpdatedAt:  charger.UpdatedAt,
		})
	}

	s.respondSuccess(c, response)
}

// getCharger returns a specific charger by ID
func (s *Server) getCharger(c *gin.Context) {
	id := c.Param("id")
	chargerID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		s.respondError(c, http.StatusBadRequest, err, "Invalid charger ID")
		return
	}

	var charger storage.Charger
	db := s.db.GetDB()
	if err := db.First(&charger, chargerID).Error; err != nil {
		s.respondError(c, http.StatusNotFound, err, "Charger not found")
		return
	}

	response := ChargerResponse{
		ID:         charger.ID,
		Identifier: charger.Identifier,
		Status:     charger.Status,
		CreatedAt:  charger.CreatedAt,
		UpdatedAt:  charger.UpdatedAt,
	}

	s.respondSuccess(c, response)
}

// createCharger creates a new virtual charger
func (s *Server) createCharger(c *gin.Context) {
	var req CreateChargerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		s.respondError(c, http.StatusBadRequest, err, "Invalid request body")
		return
	}

	// Create charger in database
	charger := storage.Charger{
		Identifier: req.Identifier,
		Status:     "offline",
		// Config will be JSON-encoded charger config
	}

	db := s.db.GetDB()
	if err := db.Create(&charger).Error; err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			s.respondError(c, http.StatusConflict, err, "Charger with this identifier already exists")
			return
		}
		s.respondError(c, http.StatusInternalServerError, err, "Failed to create charger")
		return
	}

	// TODO: Create actual virtual charger instance in the engine
	// For now, just return the database record

	response := ChargerResponse{
		ID:         charger.ID,
		Identifier: charger.Identifier,
		Status:     charger.Status,
		CreatedAt:  charger.CreatedAt,
		UpdatedAt:  charger.UpdatedAt,
	}

	s.respondSuccess(c, response, "Charger created successfully")
}

// deleteCharger removes a charger
func (s *Server) deleteCharger(c *gin.Context) {
	id := c.Param("id")
	chargerID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		s.respondError(c, http.StatusBadRequest, err, "Invalid charger ID")
		return
	}

	db := s.db.GetDB()
	if err := db.Delete(&storage.Charger{}, chargerID).Error; err != nil {
		s.respondError(c, http.StatusInternalServerError, err, "Failed to delete charger")
		return
	}

	s.respondSuccess(c, nil, "Charger deleted successfully")
}

// ScenarioResponse represents the API response format for scenarios
type ScenarioResponse struct {
	Name         string   `json:"name"`
	Description  string   `json:"description,omitempty"`
	Version      string   `json:"version,omitempty"`
	Duration     int      `json:"duration"`
	Tags         []string `json:"tags,omitempty"`
	ChargerCount int      `json:"charger_count"`
	CSMSEndpoint string   `json:"csms_endpoint"`
	Status       string   `json:"status,omitempty"` // running, stopped, completed
}

// getScenarios returns a list of available scenarios
func (s *Server) getScenarios(c *gin.Context) {
	scenarios, err := s.engine.GetScenarioLoader().ListAvailableScenarios()
	if err != nil {
		s.respondError(c, http.StatusInternalServerError, err, "Failed to list scenarios")
		return
	}

	var response []ScenarioResponse
	for _, scenarioFile := range scenarios {
		// Load scenario details
		scenario, err := s.engine.GetScenarioLoader().LoadScenario(scenarioFile)
		if err != nil {
			s.logger.WithError(err).WithField("file", scenarioFile).Warn("Failed to load scenario details")
			// Add basic info anyway
			response = append(response, ScenarioResponse{
				Name:   scenarioFile,
				Status: "available",
			})
			continue
		}

		response = append(response, ScenarioResponse{
			Name:         scenario.Name,
			Description:  scenario.Description,
			Version:      scenario.Version,
			Duration:     scenario.Duration,
			Tags:         scenario.Tags,
			ChargerCount: scenario.Chargers.Count,
			CSMSEndpoint: scenario.CSMS.Endpoint,
			Status:       "available",
		})
	}

	s.respondSuccess(c, response)
}

// getScenario returns details of a specific scenario
func (s *Server) getScenario(c *gin.Context) {
	name := c.Param("name")

	scenario, err := s.engine.GetScenarioLoader().LoadScenario(name)
	if err != nil {
		s.respondError(c, http.StatusNotFound, err, "Scenario not found")
		return
	}

	response := ScenarioResponse{
		Name:         scenario.Name,
		Description:  scenario.Description,
		Version:      scenario.Version,
		Duration:     scenario.Duration,
		Tags:         scenario.Tags,
		ChargerCount: scenario.Chargers.Count,
		CSMSEndpoint: scenario.CSMS.Endpoint,
		Status:       "available",
	}

	s.respondSuccess(c, response)
}

// runScenario starts execution of a scenario
func (s *Server) runScenario(c *gin.Context) {
	name := c.Param("name")

	// TODO: Implement actual scenario execution in the engine
	// For now, just validate the scenario exists
	_, err := s.engine.GetScenarioLoader().LoadScenario(name)
	if err != nil {
		s.respondError(c, http.StatusNotFound, err, "Scenario not found")
		return
	}

	// TODO: Call engine.RunScenario(ctx, name)
	s.logger.WithField("scenario", name).Info("Starting scenario execution")

	s.respondSuccess(c, gin.H{
		"scenario": name,
		"status":   "starting",
		"message":  "Scenario execution initiated",
	})
}

// stopScenario stops execution of a running scenario
func (s *Server) stopScenario(c *gin.Context) {
	name := c.Param("name")

	// TODO: Implement actual scenario stopping in the engine
	s.logger.WithField("scenario", name).Info("Stopping scenario execution")

	s.respondSuccess(c, gin.H{
		"scenario": name,
		"status":   "stopping",
		"message":  "Scenario execution stopping",
	})
}

// SystemStatusResponse represents system status information
type SystemStatusResponse struct {
	Status           string    `json:"status"`
	Uptime           string    `json:"uptime"`
	TotalChargers    int       `json:"total_chargers"`
	ActiveChargers   int       `json:"active_chargers"`
	RunningScenarios int       `json:"running_scenarios"`
	TotalMessages    int64     `json:"total_messages"`
	DatabaseStatus   string    `json:"database_status"`
	Timestamp        time.Time `json:"timestamp"`
}

// getSystemStatus returns current system status
func (s *Server) getSystemStatus(c *gin.Context) {
	db := s.db.GetDB()

	// Count chargers
	var totalChargers int64
	var activeChargers int64

	db.Model(&storage.Charger{}).Count(&totalChargers)
	db.Model(&storage.Charger{}).Where("status != ?", "offline").Count(&activeChargers)

	// Count messages
	var totalMessages int64
	db.Model(&storage.OCPPMessage{}).Count(&totalMessages)

	// Check database status
	dbStatus := "healthy"
	if sqlDB, err := db.DB(); err != nil || sqlDB.Ping() != nil {
		dbStatus = "unhealthy"
	}

	response := SystemStatusResponse{
		Status:           "running",
		Uptime:           "0h 0m", // TODO: Calculate actual uptime
		TotalChargers:    int(totalChargers),
		ActiveChargers:   int(activeChargers),
		RunningScenarios: 0, // TODO: Get from engine
		TotalMessages:    totalMessages,
		DatabaseStatus:   dbStatus,
		Timestamp:        time.Now(),
	}

	s.respondSuccess(c, response)
}

// EventResponse represents an event log entry
type EventResponse struct {
	ID        uint      `json:"id"`
	Type      string    `json:"type"`
	EntityID  uint      `json:"entity_id,omitempty"`
	Level     string    `json:"level"`
	Data      string    `json:"data,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

// getEvents returns recent system events
func (s *Server) getEvents(c *gin.Context) {
	// Parse query parameters
	limitStr := c.DefaultQuery("limit", "100")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 || limit > 1000 {
		limit = 100
	}

	levelFilter := c.Query("level")
	typeFilter := c.Query("type")

	db := s.db.GetDB()
	query := db.Model(&storage.Event{}).Order("created_at DESC").Limit(limit)

	if levelFilter != "" {
		query = query.Where("level = ?", levelFilter)
	}
	if typeFilter != "" {
		query = query.Where("type = ?", typeFilter)
	}

	var events []storage.Event
	if err := query.Find(&events).Error; err != nil {
		s.respondError(c, http.StatusInternalServerError, err, "Failed to fetch events")
		return
	}

	var response []EventResponse
	for _, event := range events {
		response = append(response, EventResponse{
			ID:        event.ID,
			Type:      event.Type,
			EntityID:  event.EntityID,
			Level:     event.Level,
			Data:      event.Data,
			CreatedAt: event.CreatedAt,
		})
	}

	s.respondSuccess(c, response)
}
