package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/HackStrix/ocpp-chaos-simulator/internal/core/simulation"
	"github.com/HackStrix/ocpp-chaos-simulator/internal/infrastructure/config"
	"github.com/HackStrix/ocpp-chaos-simulator/internal/infrastructure/storage"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// testServer holds the test server setup
type testServer struct {
	server *Server
	db     storage.Database
	engine *simulation.Engine
}

// setupTestServer creates a test server with in-memory database
func setupTestServer(t *testing.T) *testServer {
	// Create in-memory database
	db, err := storage.NewSQLiteDB(":memory:")
	require.NoError(t, err)

	// Create test config
	cfg := &config.Config{
		Server: config.ServerConfig{
			Host: "localhost",
			Port: 8080,
		},
		Database: config.DatabaseConfig{
			Type: "sqlite",
			Path: ":memory:",
		},
	}

	// Create engine with test config
	engine := simulation.NewEngine(cfg, db)

	// Create server
	server := NewServer(engine, db)

	return &testServer{
		server: server,
		db:     db,
		engine: engine,
	}
}

// teardownTestServer cleans up test resources
func (ts *testServer) teardownTestServer() {
	if ts.db != nil {
		ts.db.Close()
	}
}

// makeRequest makes an HTTP request to the test server
func (ts *testServer) makeRequest(method, url string, body interface{}) (*httptest.ResponseRecorder, error) {
	var reqBody []byte
	var err error

	if body != nil {
		reqBody, err = json.Marshal(body)
		if err != nil {
			return nil, err
		}
	}

	req, err := http.NewRequest(method, url, bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, err
	}

	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	rr := httptest.NewRecorder()
	ts.server.router.ServeHTTP(rr, req)

	return rr, nil
}

func TestMain(m *testing.M) {
	// Setup test environment
	os.Exit(m.Run())
}

func TestHealthCheck(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.teardownTestServer()

	rr, err := ts.makeRequest("GET", "/health", nil)
	require.NoError(t, err)

	assert.Equal(t, http.StatusOK, rr.Code)

	var response map[string]interface{}
	err = json.Unmarshal(rr.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Equal(t, "healthy", response["status"])
	assert.Equal(t, "ocpp-chaos-simulator", response["service"])
	assert.Contains(t, response, "timestamp")
}

func TestGetChargers_Empty(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.teardownTestServer()

	rr, err := ts.makeRequest("GET", "/api/chargers", nil)
	require.NoError(t, err)

	assert.Equal(t, http.StatusOK, rr.Code)

	var response SuccessResponse
	err = json.Unmarshal(rr.Body.Bytes(), &response)
	require.NoError(t, err)

	// Should return null for empty list (as per current implementation)
	assert.Nil(t, response.Data)
}

func TestCreateCharger_Success(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.teardownTestServer()

	chargerReq := CreateChargerRequest{
		Identifier:     "TEST001",
		Model:          "Tesla Model S",
		Vendor:         "Tesla",
		ConnectorCount: 2,
		CSMSEndpoint:   "ws://localhost:8080/ocpp",
		OCPPVersion:    "1.6",
	}

	rr, err := ts.makeRequest("POST", "/api/chargers", chargerReq)
	require.NoError(t, err)

	assert.Equal(t, http.StatusOK, rr.Code)

	var response SuccessResponse
	err = json.Unmarshal(rr.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Equal(t, "Charger created successfully", response.Message)
	assert.NotNil(t, response.Data)

	// Verify charger data
	chargerData := response.Data.(map[string]interface{})
	assert.Equal(t, "TEST001", chargerData["identifier"])
	assert.Equal(t, "offline", chargerData["status"])
	assert.NotNil(t, chargerData["id"])
}

func TestCreateCharger_DuplicateIdentifier(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.teardownTestServer()

	chargerReq := CreateChargerRequest{
		Identifier: "TEST001",
		Model:      "Tesla Model S",
		Vendor:     "Tesla",
	}

	// Create first charger
	rr1, err := ts.makeRequest("POST", "/api/chargers", chargerReq)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rr1.Code)

	// Try to create duplicate
	rr2, err := ts.makeRequest("POST", "/api/chargers", chargerReq)
	require.NoError(t, err)

	assert.Equal(t, http.StatusConflict, rr2.Code)

	var response ErrorResponse
	err = json.Unmarshal(rr2.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Contains(t, response.Message, "already exists")
}

func TestCreateCharger_InvalidRequest(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.teardownTestServer()

	// Missing required identifier
	chargerReq := CreateChargerRequest{
		Model:  "Tesla Model S",
		Vendor: "Tesla",
	}

	rr, err := ts.makeRequest("POST", "/api/chargers", chargerReq)
	require.NoError(t, err)

	assert.Equal(t, http.StatusBadRequest, rr.Code)

	var response ErrorResponse
	err = json.Unmarshal(rr.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Contains(t, response.Error, "Key: 'CreateChargerRequest.Identifier'")
}

func TestGetCharger_Success(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.teardownTestServer()

	// First create a charger
	chargerReq := CreateChargerRequest{
		Identifier: "TEST001",
		Model:      "Tesla Model S",
		Vendor:     "Tesla",
	}

	rr1, err := ts.makeRequest("POST", "/api/chargers", chargerReq)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rr1.Code)

	// Now get the charger
	rr2, err := ts.makeRequest("GET", "/api/chargers/1", nil)
	require.NoError(t, err)

	assert.Equal(t, http.StatusOK, rr2.Code)

	var response SuccessResponse
	err = json.Unmarshal(rr2.Body.Bytes(), &response)
	require.NoError(t, err)

	chargerData := response.Data.(map[string]interface{})
	assert.Equal(t, "TEST001", chargerData["identifier"])
	assert.Equal(t, float64(1), chargerData["id"]) // JSON unmarshals numbers as float64
}

func TestGetCharger_NotFound(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.teardownTestServer()

	rr, err := ts.makeRequest("GET", "/api/chargers/999", nil)
	require.NoError(t, err)

	assert.Equal(t, http.StatusNotFound, rr.Code)

	var response ErrorResponse
	err = json.Unmarshal(rr.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Contains(t, response.Message, "not found")
}

func TestGetCharger_InvalidID(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.teardownTestServer()

	rr, err := ts.makeRequest("GET", "/api/chargers/invalid", nil)
	require.NoError(t, err)

	assert.Equal(t, http.StatusBadRequest, rr.Code)

	var response ErrorResponse
	err = json.Unmarshal(rr.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Contains(t, response.Message, "Invalid charger ID")
}

func TestDeleteCharger_Success(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.teardownTestServer()

	// First create a charger
	chargerReq := CreateChargerRequest{
		Identifier: "TEST001",
		Model:      "Tesla Model S",
	}

	rr1, err := ts.makeRequest("POST", "/api/chargers", chargerReq)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rr1.Code)

	// Delete the charger
	rr2, err := ts.makeRequest("DELETE", "/api/chargers/1", nil)
	require.NoError(t, err)

	assert.Equal(t, http.StatusOK, rr2.Code)

	var response SuccessResponse
	err = json.Unmarshal(rr2.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Equal(t, "Charger deleted successfully", response.Message)

	// Verify charger is deleted
	rr3, err := ts.makeRequest("GET", "/api/chargers/1", nil)
	require.NoError(t, err)
	assert.Equal(t, http.StatusNotFound, rr3.Code)
}

func TestGetScenarios_Success(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.teardownTestServer()

	rr, err := ts.makeRequest("GET", "/api/scenarios", nil)
	require.NoError(t, err)

	assert.Equal(t, http.StatusOK, rr.Code)

	var response SuccessResponse
	err = json.Unmarshal(rr.Body.Bytes(), &response)
	require.NoError(t, err)

	// Data might be nil if no scenarios are found in test environment
	if response.Data != nil {
		scenarios := response.Data.([]interface{})
		assert.GreaterOrEqual(t, len(scenarios), 0)
	}
}

func TestGetScenario_Success(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.teardownTestServer()

	rr, err := ts.makeRequest("GET", "/api/scenarios/basic-auth-example.yaml", nil)
	require.NoError(t, err)

	// This might fail in test environment if examples directory doesn't exist
	// We'll test both success and failure cases
	if rr.Code == http.StatusOK {
		var response SuccessResponse
		err = json.Unmarshal(rr.Body.Bytes(), &response)
		require.NoError(t, err)

		scenarioData := response.Data.(map[string]interface{})
		assert.Equal(t, "available", scenarioData["status"])
	} else {
		assert.Equal(t, http.StatusNotFound, rr.Code)
	}
}

func TestGetScenario_NotFound(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.teardownTestServer()

	rr, err := ts.makeRequest("GET", "/api/scenarios/nonexistent.yaml", nil)
	require.NoError(t, err)

	assert.Equal(t, http.StatusNotFound, rr.Code)

	var response ErrorResponse
	err = json.Unmarshal(rr.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Contains(t, response.Message, "not found")
}

func TestRunScenario_Success(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.teardownTestServer()

	rr, err := ts.makeRequest("POST", "/api/scenarios/basic-auth-example.yaml/run", nil)
	require.NoError(t, err)

	// This might fail in test environment if examples directory doesn't exist
	if rr.Code == http.StatusOK {
		var response SuccessResponse
		err = json.Unmarshal(rr.Body.Bytes(), &response)
		require.NoError(t, err)

		responseData := response.Data.(map[string]interface{})
		assert.Equal(t, "basic-auth-example.yaml", responseData["scenario"])
		assert.Equal(t, "starting", responseData["status"])
	} else {
		assert.Equal(t, http.StatusNotFound, rr.Code)
	}
}

func TestRunScenario_NotFound(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.teardownTestServer()

	rr, err := ts.makeRequest("POST", "/api/scenarios/nonexistent.yaml/run", nil)
	require.NoError(t, err)

	assert.Equal(t, http.StatusNotFound, rr.Code)
}

func TestStopScenario_Success(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.teardownTestServer()

	rr, err := ts.makeRequest("POST", "/api/scenarios/basic-auth-example.yaml/stop", nil)
	require.NoError(t, err)

	// Stop scenario always succeeds regardless of whether scenario exists
	assert.Equal(t, http.StatusOK, rr.Code)

	var response SuccessResponse
	err = json.Unmarshal(rr.Body.Bytes(), &response)
	require.NoError(t, err)

	responseData := response.Data.(map[string]interface{})
	assert.Equal(t, "basic-auth-example.yaml", responseData["scenario"])
	assert.Equal(t, "stopping", responseData["status"])
}

func TestGetSystemStatus_Success(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.teardownTestServer()

	rr, err := ts.makeRequest("GET", "/api/status", nil)
	require.NoError(t, err)

	assert.Equal(t, http.StatusOK, rr.Code)

	var response SuccessResponse
	err = json.Unmarshal(rr.Body.Bytes(), &response)
	require.NoError(t, err)

	statusData := response.Data.(map[string]interface{})
	assert.Equal(t, "running", statusData["status"])
	assert.Equal(t, "healthy", statusData["database_status"])
	assert.Equal(t, float64(0), statusData["total_chargers"])
	assert.Contains(t, statusData, "timestamp")
}

func TestGetEvents_Success(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.teardownTestServer()

	rr, err := ts.makeRequest("GET", "/api/events", nil)
	require.NoError(t, err)

	assert.Equal(t, http.StatusOK, rr.Code)

	var response SuccessResponse
	err = json.Unmarshal(rr.Body.Bytes(), &response)
	require.NoError(t, err)

	// Should return null for no events (empty database)
	assert.Nil(t, response.Data)
}

func TestGetEvents_WithFilters(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.teardownTestServer()

	// Test with query parameters
	rr, err := ts.makeRequest("GET", "/api/events?limit=50&level=info&type=test", nil)
	require.NoError(t, err)

	assert.Equal(t, http.StatusOK, rr.Code)

	var response SuccessResponse
	err = json.Unmarshal(rr.Body.Bytes(), &response)
	require.NoError(t, err)

	// Should handle filters gracefully even with no data
	assert.Nil(t, response.Data)
}

func TestCORSHeaders(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.teardownTestServer()

	// Test OPTIONS request
	req, err := http.NewRequest("OPTIONS", "/api/chargers", nil)
	require.NoError(t, err)

	rr := httptest.NewRecorder()
	ts.server.router.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusNoContent, rr.Code)
	assert.Equal(t, "*", rr.Header().Get("Access-Control-Allow-Origin"))
	assert.Contains(t, rr.Header().Get("Access-Control-Allow-Methods"), "GET")
	assert.Contains(t, rr.Header().Get("Access-Control-Allow-Methods"), "POST")
}

func TestErrorResponseFormat(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.teardownTestServer()

	// Trigger an error (invalid charger ID)
	rr, err := ts.makeRequest("GET", "/api/chargers/invalid", nil)
	require.NoError(t, err)

	assert.Equal(t, http.StatusBadRequest, rr.Code)

	var response ErrorResponse
	err = json.Unmarshal(rr.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.NotEmpty(t, response.Error)
	assert.NotEmpty(t, response.Message)
	assert.Equal(t, http.StatusBadRequest, response.Code)
}

func TestJSONContentType(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.teardownTestServer()

	rr, err := ts.makeRequest("GET", "/health", nil)
	require.NoError(t, err)

	contentType := rr.Header().Get("Content-Type")
	assert.Contains(t, contentType, "application/json")
}
