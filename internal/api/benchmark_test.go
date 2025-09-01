package api

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/require"
)

func BenchmarkHealthCheck(b *testing.B) {
	ts := setupTestServer(&testing.T{})
	defer ts.teardownTestServer()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		rr, err := ts.makeRequest("GET", "/health", nil)
		require.NoError(b, err)
		require.Equal(b, 200, rr.Code)
	}
}

func BenchmarkGetChargers(b *testing.B) {
	ts := setupTestServer(&testing.T{})
	defer ts.teardownTestServer()

	// Create some test data first
	for i := 0; i < 10; i++ {
		chargerReq := CreateChargerRequest{
			Identifier: "BENCH" + string(rune('A'+i)),
			Model:      "Test Model",
			Vendor:     "Test Vendor",
		}
		_, err := ts.makeRequest("POST", "/api/chargers", chargerReq)
		require.NoError(b, err)
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		rr, err := ts.makeRequest("GET", "/api/chargers", nil)
		require.NoError(b, err)
		require.Equal(b, 200, rr.Code)
	}
}

func BenchmarkCreateCharger(b *testing.B) {
	ts := setupTestServer(&testing.T{})
	defer ts.teardownTestServer()

	chargerReq := CreateChargerRequest{
		Model:          "Test Model",
		Vendor:         "Test Vendor",
		ConnectorCount: 2,
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		chargerReq.Identifier = "BENCH" + string(rune(i))
		rr, err := ts.makeRequest("POST", "/api/chargers", chargerReq)
		require.NoError(b, err)
		require.Equal(b, 200, rr.Code)
	}
}

func BenchmarkGetScenarios(b *testing.B) {
	ts := setupTestServer(&testing.T{})
	defer ts.teardownTestServer()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		rr, err := ts.makeRequest("GET", "/api/scenarios", nil)
		require.NoError(b, err)
		require.Equal(b, 200, rr.Code)
	}
}

func BenchmarkGetSystemStatus(b *testing.B) {
	ts := setupTestServer(&testing.T{})
	defer ts.teardownTestServer()

	// Create some test data to make the benchmark more realistic
	for i := 0; i < 5; i++ {
		chargerReq := CreateChargerRequest{
			Identifier: "STATUS" + string(rune('A'+i)),
			Model:      "Test Model",
		}
		_, err := ts.makeRequest("POST", "/api/chargers", chargerReq)
		require.NoError(b, err)
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		rr, err := ts.makeRequest("GET", "/api/status", nil)
		require.NoError(b, err)
		require.Equal(b, 200, rr.Code)
	}
}

func BenchmarkJSONSerialization(b *testing.B) {
	response := SuccessResponse{
		Data: ChargerResponse{
			ID:         1,
			Identifier: "TEST001",
			Status:     "offline",
			Model:      "Tesla Model S",
			Vendor:     "Tesla",
			Connectors: 2,
		},
		Message: "Success",
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := json.Marshal(response)
		require.NoError(b, err)
	}
}
