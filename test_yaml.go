package main

import (
	"fmt"
	"log"

	"github.com/HackStrix/ocpp-chaos-simulator/internal/core/simulation"
)

func main() {
	loader := simulation.NewScenarioLoader("./examples")
	
	// Test loading each scenario
	scenarios := []string{
		"basic-charge-cycle.yaml",
		"chaos-network-test.yaml", 
		"load-test-scenario.yaml",
	}
	
	for _, scenarioFile := range scenarios {
		fmt.Printf("Testing %s...\n", scenarioFile)
		scenario, err := loader.LoadScenario(scenarioFile)
		if err != nil {
			log.Printf("Error loading %s: %v\n", scenarioFile, err)
		} else {
			fmt.Printf("✓ Successfully loaded '%s' with %d chargers, duration %ds\n", 
				scenario.Name, scenario.Chargers.Count, scenario.Duration)
			
			// Test conversion to simulation config
			simConfig := loader.ConvertToSimulationConfig(scenario)
			fmt.Printf("  - Converted to simulation config with %d chargers\n", len(simConfig.Chargers))
		}
		fmt.Println()
	}
}
