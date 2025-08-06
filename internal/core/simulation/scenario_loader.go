package simulation

import (
	"fmt"
	"io/ioutil"
	"path/filepath"

	"github.com/HackStrix/ocpp-chaos-simulator/internal/core/charger"
	"gopkg.in/yaml.v3"
)

// ScenarioLoader handles loading and parsing YAML scenario files
type ScenarioLoader struct {
	scenarioPath string
}

// NewScenarioLoader creates a new scenario loader
func NewScenarioLoader(scenarioPath string) *ScenarioLoader {
	return &ScenarioLoader{
		scenarioPath: scenarioPath,
	}
}

// LoadScenario loads a scenario from a YAML file
func (sl *ScenarioLoader) LoadScenario(filename string) (*ScenarioConfig, error) {
	fullPath := filepath.Join(sl.scenarioPath, filename)
	
	data, err := ioutil.ReadFile(fullPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read scenario file %s: %w", fullPath, err)
	}

	var scenario ScenarioConfig
	if err := yaml.Unmarshal(data, &scenario); err != nil {
		return nil, fmt.Errorf("failed to parse scenario YAML: %w", err)
	}

	// Validate the scenario
	if err := sl.validateScenario(&scenario); err != nil {
		return nil, fmt.Errorf("scenario validation failed: %w", err)
	}

	return &scenario, nil
}

// LoadScenarioFromString loads a scenario from a YAML string
func (sl *ScenarioLoader) LoadScenarioFromString(yamlContent string) (*ScenarioConfig, error) {
	var scenario ScenarioConfig
	if err := yaml.Unmarshal([]byte(yamlContent), &scenario); err != nil {
		return nil, fmt.Errorf("failed to parse scenario YAML: %w", err)
	}

	if err := sl.validateScenario(&scenario); err != nil {
		return nil, fmt.Errorf("scenario validation failed: %w", err)
	}

	return &scenario, nil
}

// ListAvailableScenarios returns a list of available scenario files
func (sl *ScenarioLoader) ListAvailableScenarios() ([]string, error) {
	files, err := filepath.Glob(filepath.Join(sl.scenarioPath, "*.yaml"))
	if err != nil {
		return nil, err
	}

	// Also check for .yml files
	ymlFiles, err := filepath.Glob(filepath.Join(sl.scenarioPath, "*.yml"))
	if err != nil {
		return nil, err
	}

	files = append(files, ymlFiles...)

	// Extract just the filenames
	var scenarios []string
	for _, file := range files {
		scenarios = append(scenarios, filepath.Base(file))
	}

	return scenarios, nil
}

// validateScenario performs basic validation on a scenario
func (sl *ScenarioLoader) validateScenario(scenario *ScenarioConfig) error {
	if scenario.Name == "" {
		return fmt.Errorf("scenario name is required")
	}

	if scenario.Chargers.Count <= 0 {
		return fmt.Errorf("charger count must be greater than 0")
	}

	if scenario.CSMS.Endpoint == "" {
		return fmt.Errorf("CSMS endpoint is required")
	}

	if scenario.Duration <= 0 {
		return fmt.Errorf("scenario duration must be greater than 0")
	}

	// Validate timeline events
	for i, event := range scenario.Timeline {
		if event.Action == "" {
			return fmt.Errorf("timeline event %d: action is required", i)
		}
		
		if event.At < 0 {
			return fmt.Errorf("timeline event %d: 'at' time cannot be negative", i)
		}
	}

	return nil
}

// ConvertToSimulationConfig converts a ScenarioConfig to legacy SimulationConfig
func (sl *ScenarioLoader) ConvertToSimulationConfig(scenario *ScenarioConfig) *SimulationConfig {
	chargers := make([]charger.ChargerConfig, scenario.Chargers.Count)
	
	for i := 0; i < scenario.Chargers.Count; i++ {
		chargers[i] = charger.ChargerConfig{
			Identifier:     fmt.Sprintf("%s%03d", "CP", i+1), // CP001, CP002, etc.
			Model:          scenario.Chargers.Template.Model,
			Vendor:         scenario.Chargers.Template.Vendor,
			SerialNumber:   fmt.Sprintf("SN%06d", i+1),
			ConnectorCount: scenario.Chargers.Template.Connectors, // Map from YAML field
			Features:       scenario.Chargers.Template.Features,
			CSMSEndpoint:   scenario.CSMS.Endpoint,
			OCPPVersion:    scenario.Chargers.Template.OCPPVersion,
			CustomData:     scenario.Chargers.Template.CustomData,
		}
	}

	return &SimulationConfig{
		Name:         scenario.Name,
		ChargerCount: scenario.Chargers.Count,
		OCPPVersion:  scenario.Chargers.Template.OCPPVersion,
		CSMSEndpoint: scenario.CSMS.Endpoint,
		Chargers:     chargers,
		Duration:     scenario.Duration,
	}
}
