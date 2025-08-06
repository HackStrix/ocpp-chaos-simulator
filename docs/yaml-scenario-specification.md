# OCPP Chaos Simulator - YAML Scenario Specification

This document provides the complete specification for YAML scenario files used by the OCPP Chaos Simulator.

## Overview

The YAML scenario format allows you to define comprehensive test scenarios for OCPP charge point simulators, including:
- Multiple virtual chargers with configurable properties
- Timeline-based event execution 
- Chaos engineering strategies
- Performance expectations and monitoring
- Results export configuration

## Schema Structure

### Root Level Properties

```yaml
name: string              # Required: Scenario name
description: string       # Optional: Scenario description
version: string           # Optional: Scenario version (e.g., "1.0")
duration: integer         # Required: Total scenario duration in seconds
tags: [string]           # Optional: Tags for categorization
chargers: ChargerTemplate # Required: Charger configuration
csms: CSMSConfig         # Required: CSMS connection details
timeline: [TimelineEvent] # Required: Sequence of timed events
chaos_strategies: [ChaosStrategy] # Optional: Chaos engineering definitions
expectations: ScenarioExpectations # Optional: Expected behaviors
results: ResultsConfig    # Optional: Results export configuration
monitoring: MonitoringConfig # Optional: Monitoring configuration
load_profile: LoadProfile # Optional: Load testing configuration
```

### ChargerTemplate

Defines the template for creating virtual chargers:

```yaml
chargers:
  count: integer          # Required: Number of chargers to create
  template:               # Required: Template configuration
    model: string         # Required: Charger model name
    vendor: string        # Required: Charger vendor name
    connectors: integer   # Required: Number of connectors per charger (1-2)
    ocpp_version: string  # Required: OCPP version ("1.6", "2.0")
    features: [string]    # Optional: Supported OCPP features
```

**Supported OCPP Features:**
- `"Core"` - Basic OCPP functionality
- `"FirmwareManagement"` - Firmware update capabilities  
- `"RemoteTrigger"` - Remote triggering of messages
- `"Reservation"` - Connector reservation
- `"LocalAuthListManagement"` - Local authorization lists

### CSMSConfig

Central System Management System connection configuration:

```yaml
csms:
  endpoint: string        # Required: WebSocket endpoint (e.g., "ws://localhost:8080/ocpp")
  protocol: string        # Optional: Protocol version (default: "ocpp1.6")
```

### TimelineEvent

Events executed at specific times during the scenario:

```yaml
timeline:
  - at: integer           # Required: Time in seconds from scenario start
    action: string        # Required: Action type (see Action Types below)
    targets: Targets      # Optional: Which chargers to target
    params: object        # Optional: Action-specific parameters
    flow: [MessageStep]   # Optional: Message flow for complex actions
    strategy: string      # Optional: Chaos strategy name
```

#### Action Types

1. **`create_chargers`** - Create virtual chargers
   ```yaml
   - at: 0
     action: "create_chargers"
     params:
       count: 10
       prefix: "CP"        # Charger ID prefix (results in CP001, CP002, etc.)
   ```

2. **`start_normal_flow`** - Start normal OCPP message flow
   ```yaml
   - at: 5
     action: "start_normal_flow"
     targets: "all"        # or specific targeting
     flow: [MessageStep]   # Define the message sequence
   ```

3. **`inject_chaos`** - Apply chaos engineering strategy
   ```yaml
   - at: 30
     action: "inject_chaos"
     strategy: "network_loss"
     targets:
       range: [10, 19]     # Target chargers CP010-CP019
     params:
       duration: 45
       reconnect: true
   ```

4. **`start_flow`** - Execute custom message flow
   ```yaml
   - at: 10
     action: "start_flow"
     targets: "all"
     flow: [MessageStep]
   ```

#### Targeting Options

```yaml
targets: "all"                    # All chargers
targets:
  range: [start, end]            # Range of charger numbers
targets:
  specific: ["CP001", "CP005"]   # Specific charger IDs
targets:
  count: 50                      # Random selection of N chargers
```

### MessageStep

Individual steps in a message flow:

```yaml
flow:
  - send: string          # OCPP message type to send
    wait_for: string      # Expected response message type
    delay: DelayValue     # Wait time before/after
    repeat: RepeatConfig  # Repetition configuration
    params: object        # Message-specific parameters
    expect: object        # Expected response content
    timeout: integer      # Response timeout in seconds
```

#### Delay Values
```yaml
delay: 5                 # Fixed delay in seconds
delay: "random(1,10)"    # Random delay between 1-10 seconds
delay: "auto_increment_from_1000"  # Auto-incrementing values
```

#### Repeat Configuration
```yaml
repeat:
  count: integer         # Number of repetitions
  interval: integer      # Seconds between repetitions
  duration: integer      # Total duration for repetitions
```

### Common OCPP Messages

#### BootNotification
```yaml
- send: "BootNotification"
  params:
    charge_point_model: "ModelName"
    charge_point_vendor: "VendorName"
  wait_for: "BootNotificationResponse"
  expect:
    status: "Accepted"
```

#### StatusNotification
```yaml
- send: "StatusNotification"
  params:
    connector_id: 1
    status: "Available"     # Available, Charging, Unavailable, etc.
    error_code: "NoError"
```

#### StartTransaction
```yaml
- send: "StartTransaction"
  params:
    connector_id: 1
    id_tag: "USER123"
    meter_start: 1000
  wait_for: "StartTransactionResponse"
  expect:
    id_tag_info:
      status: "Accepted"
```

#### MeterValues
```yaml
- send: "MeterValues"
  params:
    connector_id: 1
    meter_value:
      timestamp: "now"
      sampled_value:
        - value: "auto_increment_from_1000"
          unit: "Wh"
          measurand: "Energy.Active.Import.Register"
```

#### StopTransaction
```yaml
- send: "StopTransaction"
  params:
    meter_stop: 5000
    timestamp: "now"
    transaction_id: "from_start_response"
  wait_for: "StopTransactionResponse"
```

### Chaos Strategies

Define chaos engineering patterns:

```yaml
chaos_strategies:
  network_loss:
    description: "Simulates 3G/4G signal loss"
    implementation: "disconnect_websocket"
    configurable: ["duration", "reconnect_behavior"]
    
  corrupt_messages:
    description: "Sends malformed OCPP messages"
    implementation: "modify_message_payload"
    configurable: ["corruption_rate", "corruption_methods"]
    
  message_flooding:
    description: "Overwhelm CSMS with high message rate"
    implementation: "rapid_message_sending"
    configurable: ["rate", "duration", "message_type"]
```

### Expectations

Define expected behaviors for validation:

```yaml
expectations:
  csms_should:
    accept_all_transactions: true
    respond_within_timeout: 30
    handle_malformed_messages_gracefully: true
    maintain_connection_during_flooding: true
    
  chargers_should:
    reconnect_after_network_loss: true
    resume_heartbeat_after_reconnection: true
    maintain_transaction_state: true
    
  performance:
    max_response_time: 5000      # milliseconds
    max_memory_usage: "2GB"
    min_success_rate: 99.5       # percentage
    max_concurrent_connections: 500
```

### Monitoring Configuration

Configure metrics collection and alerting:

```yaml
monitoring:
  metrics:
    - connection_success_rate
    - message_response_time
    - error_rate_by_type
    - memory_usage
    - concurrent_connections
    
  alerts:
    - trigger: "error_rate > 5%"
      action: "log_warning"
    - trigger: "memory_usage > 80%"
      action: "alert_admin"
    - trigger: "connection_success_rate < 95%"
      action: "fail_test"
```

### Load Testing Configuration

For load testing scenarios:

```yaml
load_profile:
  ramp_up:
    chargers_per_second: 10     # Rate of charger creation
    total_duration: 50          # Ramp-up duration in seconds
    
  steady_state:
    duration: 400               # Steady load duration
    
  ramp_down:
    chargers_per_second: 20     # Rate of charger shutdown
    total_duration: 25          # Ramp-down duration
```

### Results Configuration

Configure results export:

```yaml
results:
  format: ["json", "csv", "html_report"]
  include:
    - timeline_events
    - error_logs
    - performance_metrics
    - chaos_injection_results
  export_path: "./results/{scenario_name}_{timestamp}"
  metrics:
    timeline: "second_by_second_stats"
    aggregated: "summary_statistics" 
    percentiles: [50, 90, 95, 99]
```

## Example Scenarios

### 1. Basic Charging Session
Simple scenario with standard charging flow:

```yaml
name: "Basic Charge Cycle"
description: "Standard charging session from start to finish"
duration: 180
tags: ["basic", "charging"]

chargers:
  count: 5
  template:
    model: "BasicCharger"
    vendor: "TestCorp"
    connectors: 1
    ocpp_version: "1.6"

csms:
  endpoint: "ws://localhost:8080/ocpp"

timeline:
  - at: 0
    action: "create_chargers"
    params:
      count: 5
      prefix: "BASIC"

  - at: 5
    action: "start_flow"
    targets: "all"
    flow:
      - send: "BootNotification"
        params:
          charge_point_model: "BasicCharger"
          charge_point_vendor: "TestCorp"
        wait_for: "BootNotificationResponse"
        expect:
          status: "Accepted"
```

### 2. Chaos Testing
Network failures and message corruption:

```yaml
name: "Chaos Network Test"
description: "Tests CSMS resilience under network failures"
duration: 300
tags: ["chaos", "network"]

chargers:
  count: 100
  template:
    model: "ChargePoint_Pro"
    vendor: "TestVendor"
    connectors: 2
    ocpp_version: "1.6"

timeline:
  - at: 30
    action: "inject_chaos"
    strategy: "network_loss"
    targets:
      range: [10, 19]
    params:
      duration: 45
      reconnect: true
```

### 3. Load Testing
High concurrent load testing:

```yaml
name: "High Load Test"
description: "Tests CSMS under heavy concurrent load"
duration: 600
tags: ["load", "performance"]

chargers:
  count: 500
  template:
    model: "FastCharger"
    vendor: "LoadTest"
    connectors: 2
    ocpp_version: "1.6"

load_profile:
  ramp_up:
    chargers_per_second: 10
    total_duration: 50
```

## Validation Rules

1. **Required Fields**: `name`, `chargers.count`, `csms.endpoint`, `duration`, `timeline`
2. **Positive Values**: `chargers.count > 0`, `duration > 0`, `timeline[].at >= 0`
3. **Valid Actions**: Must be one of: `create_chargers`, `start_normal_flow`, `inject_chaos`, `start_flow`
4. **Timeline Order**: Events should be ordered by `at` time (recommended)
5. **Connector Count**: Must be 1 or 2 connectors per charger
6. **OCPP Version**: Must be "1.6" or "2.0"

## Schema Inconsistencies Found

During analysis, the following inconsistencies were identified between YAML examples and Go structs:

1. **Connector Field Names**: 
   - YAML uses `connectors` 
   - Go struct expects `ConnectorCount`

2. **Missing Fields in Go Structs**:
   - `monitoring` configuration not defined
   - `load_profile` configuration not defined
   - Some chaos strategy parameters not fully mapped

These should be addressed to ensure proper YAML parsing.
