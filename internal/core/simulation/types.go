package simulation

import "github.com/HackStrix/ocpp-chaos-simulator/internal/core/charger"

// ScenarioConfig represents a complete YAML scenario configuration
type ScenarioConfig struct {
	Name        string            `json:"name" yaml:"name"`
	Description string            `json:"description" yaml:"description"`
	Version     string            `json:"version" yaml:"version"`
	Duration    int               `json:"duration" yaml:"duration"` // in seconds
	Tags        []string          `json:"tags" yaml:"tags"`
	Chargers    ChargerTemplate   `json:"chargers" yaml:"chargers"`
	CSMS        CSMSConfig        `json:"csms" yaml:"csms"`
	Timeline    []TimelineEvent   `json:"timeline" yaml:"timeline"`
	Chaos       []ChaosStrategy   `json:"chaos_strategies,omitempty" yaml:"chaos_strategies,omitempty"`
	Expectations ScenarioExpectations `json:"expectations,omitempty" yaml:"expectations,omitempty"`
	Results     ResultsConfig     `json:"results,omitempty" yaml:"results,omitempty"`
	Monitoring  MonitoringConfig  `json:"monitoring,omitempty" yaml:"monitoring,omitempty"`
	LoadProfile LoadProfileConfig `json:"load_profile,omitempty" yaml:"load_profile,omitempty"`
}

// ChargerTemplate defines the template for creating chargers
type ChargerTemplate struct {
	Count    int                      `json:"count" yaml:"count"`
	Template ChargerTemplateConfig    `json:"template" yaml:"template"`
}

// ChargerTemplateConfig defines the template configuration for chargers in YAML scenarios
type ChargerTemplateConfig struct {
	Model          string            `json:"model" yaml:"model"`
	Vendor         string            `json:"vendor" yaml:"vendor"`
	Connectors     int               `json:"connectors" yaml:"connectors"` // YAML field name
	OCPPVersion    string            `json:"ocpp_version" yaml:"ocpp_version"`
	Features       []string          `json:"features,omitempty" yaml:"features,omitempty"`
	CustomData     map[string]string `json:"custom_data,omitempty" yaml:"custom_data,omitempty"`
}

// CSMSConfig defines CSMS connection parameters
type CSMSConfig struct {
	Endpoint      string `json:"endpoint" yaml:"endpoint"`
	Protocol      string `json:"protocol" yaml:"protocol"`
	BasicAuthUser string `json:"basic_auth_user,omitempty" yaml:"basic_auth_user,omitempty"`
	BasicAuthPass string `json:"basic_auth_pass,omitempty" yaml:"basic_auth_pass,omitempty"`
}

// TimelineEvent represents an action at a specific time
type TimelineEvent struct {
	At      int               `json:"at" yaml:"at"` // seconds from start
	Action  string            `json:"action" yaml:"action"`
	Targets interface{}       `json:"targets,omitempty" yaml:"targets,omitempty"` // "all", range, specific IDs
	Params  map[string]interface{} `json:"params,omitempty" yaml:"params,omitempty"`
	Flow    []MessageStep     `json:"flow,omitempty" yaml:"flow,omitempty"`
	Strategy string           `json:"strategy,omitempty" yaml:"strategy,omitempty"`
}

// MessageStep represents a single step in a message flow
type MessageStep struct {
	Send      string            `json:"send,omitempty" yaml:"send,omitempty"`
	WaitFor   string            `json:"wait_for,omitempty" yaml:"wait_for,omitempty"`
	Delay     interface{}       `json:"delay,omitempty" yaml:"delay,omitempty"` // int or string like "random(1,5)"
	Repeat    *RepeatConfig     `json:"repeat,omitempty" yaml:"repeat,omitempty"`
	Params    map[string]interface{} `json:"params,omitempty" yaml:"params,omitempty"`
	Expect    map[string]interface{} `json:"expect,omitempty" yaml:"expect,omitempty"`
	Timeout   int               `json:"timeout,omitempty" yaml:"timeout,omitempty"`
}

// RepeatConfig defines how to repeat a message or action
type RepeatConfig struct {
	Count    interface{} `json:"count,omitempty" yaml:"count,omitempty"`     // int or string like "random(5,10)"
	Interval interface{} `json:"interval,omitempty" yaml:"interval,omitempty"` // int or string
	Duration int         `json:"duration,omitempty" yaml:"duration,omitempty"`
}

// ChaosStrategy defines a chaos engineering strategy
type ChaosStrategy struct {
	Name           string   `json:"name" yaml:"name"`
	Description    string   `json:"description" yaml:"description"`
	Implementation string   `json:"implementation" yaml:"implementation"`
	Configurable   []string `json:"configurable" yaml:"configurable"`
}

// ScenarioExpectations defines what should happen during the scenario
type ScenarioExpectations struct {
	CSMSShould      map[string]bool `json:"csms_should,omitempty" yaml:"csms_should,omitempty"`
	ChargersShould  map[string]bool `json:"chargers_should,omitempty" yaml:"chargers_should,omitempty"`
	Performance     *PerformanceExpectations `json:"performance,omitempty" yaml:"performance,omitempty"`
}

// PerformanceExpectations defines performance criteria
type PerformanceExpectations struct {
	MaxResponseTime       int     `json:"max_response_time" yaml:"max_response_time"` // milliseconds
	MaxMemoryUsage        string  `json:"max_memory_usage" yaml:"max_memory_usage"`
	MinSuccessRate        float64 `json:"min_success_rate" yaml:"min_success_rate"`
	MaxConcurrentConnections int  `json:"max_concurrent_connections" yaml:"max_concurrent_connections"`
}

// ResultsConfig defines how to export results
type ResultsConfig struct {
	Format      []string `json:"format" yaml:"format"`
	Include     []string `json:"include" yaml:"include"`
	ExportPath  string   `json:"export_path,omitempty" yaml:"export_path,omitempty"`
	Metrics     *MetricsConfig `json:"metrics,omitempty" yaml:"metrics,omitempty"`
}

// MetricsConfig defines what metrics to collect
type MetricsConfig struct {
	Timeline    string   `json:"timeline,omitempty" yaml:"timeline,omitempty"`
	Aggregated  string   `json:"aggregated,omitempty" yaml:"aggregated,omitempty"`
	Percentiles []int    `json:"percentiles,omitempty" yaml:"percentiles,omitempty"`
}

// SimulationConfig represents the configuration for a simulation (legacy)
type SimulationConfig struct {
	Name         string                     `json:"name" yaml:"name"`
	ChargerCount int                        `json:"charger_count" yaml:"charger_count"`
	OCPPVersion  string                     `json:"ocpp_version" yaml:"ocpp_version"`
	CSMSEndpoint string                     `json:"csms_endpoint" yaml:"csms_endpoint"`
	Chargers     []charger.ChargerConfig    `json:"chargers" yaml:"chargers"`
	Duration     int                        `json:"duration" yaml:"duration"` // in seconds, 0 for unlimited
}

// ChargerConfig represents the configuration for a single charger
type ChargerConfig struct {
	Identifier   string            `json:"identifier" yaml:"identifier"`
	Model        string            `json:"model" yaml:"model"`
	Vendor       string            `json:"vendor" yaml:"vendor"`
	SerialNumber string            `json:"serial_number" yaml:"serial_number"`
	Connectors   int               `json:"connectors" yaml:"connectors"`
	Features     []string          `json:"features" yaml:"features"`
	CustomData   map[string]string `json:"custom_data" yaml:"custom_data"`
}

// SimulationStatus represents the status of a simulation
type SimulationStatus string

const (
	StatusCreated   SimulationStatus = "created"
	StatusRunning   SimulationStatus = "running"
	StatusStopped   SimulationStatus = "stopped"
	StatusCompleted SimulationStatus = "completed"
	StatusError     SimulationStatus = "error"
)

// ChargerStatus represents the status of a charger
type ChargerStatus string

const (
	ChargerStatusOffline    ChargerStatus = "offline"
	ChargerStatusConnecting ChargerStatus = "connecting"
	ChargerStatusConnected  ChargerStatus = "connected"
	ChargerStatusCharging   ChargerStatus = "charging"
	ChargerStatusError      ChargerStatus = "error"
)

// MonitoringConfig defines monitoring and alerting configuration
type MonitoringConfig struct {
	Metrics []string      `json:"metrics,omitempty" yaml:"metrics,omitempty"`
	Alerts  []AlertConfig `json:"alerts,omitempty" yaml:"alerts,omitempty"`
}

// AlertConfig defines an alert trigger and action
type AlertConfig struct {
	Trigger string `json:"trigger" yaml:"trigger"`
	Action  string `json:"action" yaml:"action"`
}

// LoadProfileConfig defines load testing parameters
type LoadProfileConfig struct {
	RampUp     RampConfig `json:"ramp_up,omitempty" yaml:"ramp_up,omitempty"`
	SteadyState StateConfig `json:"steady_state,omitempty" yaml:"steady_state,omitempty"`
	RampDown   RampConfig `json:"ramp_down,omitempty" yaml:"ramp_down,omitempty"`
}

// RampConfig defines ramp-up or ramp-down parameters
type RampConfig struct {
	ChargersPerSecond int `json:"chargers_per_second" yaml:"chargers_per_second"`
	TotalDuration     int `json:"total_duration" yaml:"total_duration"`
}

// StateConfig defines steady state parameters
type StateConfig struct {
	Duration int `json:"duration" yaml:"duration"`
}
