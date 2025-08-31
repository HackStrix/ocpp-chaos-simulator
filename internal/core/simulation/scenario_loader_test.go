package simulation

import (
    "testing"
    
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestScenarioLoader_LoadValidScenario(t *testing.T) {
    loader := NewScenarioLoader("../../../examples")
    
    scenario, err := loader.LoadScenario("basic-auth-example.yaml")
    require.NoError(t, err)
    require.NotNil(t, scenario)
    
    // Verify scenario structure
    assert.Equal(t, "Basic Auth Test", scenario.Name)
    assert.Equal(t, 60, scenario.Duration)
    assert.Equal(t, 2, scenario.Chargers.Count)
    assert.Equal(t, "AuthTestCharger", scenario.Chargers.Template.Model)
    assert.Equal(t, "ws://localhost:8080/ocpp", scenario.CSMS.Endpoint)
    assert.Len(t, scenario.Timeline, 2)
}

func TestScenarioLoader_LoadScenarioFromString(t *testing.T) {
    loader := NewScenarioLoader("./examples")
    
    yamlContent := `
name: "Test Scenario"
description: "Simple test"
version: "1.0"
duration: 30
chargers:
  count: 1
  template:
    model: "TestCharger"
    vendor: "TestVendor"
    connectors: 1
    ocpp_version: "1.6"
csms:
  endpoint: "ws://test:8080/ocpp"
  protocol: "ocpp1.6"
timeline:
  - at: 0
    action: "create_chargers"
`
    
    scenario, err := loader.LoadScenarioFromString(yamlContent)
    require.NoError(t, err)
    assert.Equal(t, "Test Scenario", scenario.Name)
    assert.Equal(t, 1, scenario.Chargers.Count)
}

func TestScenarioLoader_ConvertToSimulationConfig(t *testing.T) {
    loader := NewScenarioLoader("../../../examples")
    scenario, err := loader.LoadScenario("basic-auth-example.yaml")
    require.NoError(t, err)
    
    simConfig := loader.ConvertToSimulationConfig(scenario)
    require.NotNil(t, simConfig)
    
    assert.Equal(t, scenario.Name, simConfig.Name)
    assert.Equal(t, scenario.Chargers.Count, simConfig.ChargerCount)
    assert.Len(t, simConfig.Chargers, scenario.Chargers.Count)
    
    // Verify charger ID generation
    assert.Equal(t, "CP001", simConfig.Chargers[0].Identifier)
    assert.Equal(t, "CP002", simConfig.Chargers[1].Identifier)
}

func TestScenarioLoader_ValidationErrors(t *testing.T) {
    loader := NewScenarioLoader("./examples")
    
    testCases := []struct {
        name     string
        yaml     string
        errorMsg string
    }{
        {
            name: "missing name",
            yaml: `duration: 30
chargers:
  count: 1
csms:
  endpoint: "ws://test:8080"`,
            errorMsg: "scenario name is required",
        },
        {
            name: "zero chargers",
            yaml: `name: "test"
duration: 30
chargers:
  count: 0
csms:
  endpoint: "ws://test:8080"`,
            errorMsg: "charger count must be greater than 0",
        },
        {
            name: "missing endpoint",
            yaml: `name: "test"
duration: 30
chargers:
  count: 1`,
            errorMsg: "CSMS endpoint is required",
        },
    }
    
    for _, tc := range testCases {
        t.Run(tc.name, func(t *testing.T) {
            _, err := loader.LoadScenarioFromString(tc.yaml)
            require.Error(t, err)
            assert.Contains(t, err.Error(), tc.errorMsg)
        })
    }
}
