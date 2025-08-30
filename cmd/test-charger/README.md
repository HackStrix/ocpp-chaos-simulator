# Virtual Charger Test

This is a simple test program that demonstrates the virtual charger functionality.

## Features Demonstrated

- Creating and configuring a virtual charger
- Connecting to a CSMS via WebSocket
- Sending OCPP 1.6 messages (BootNotification, Heartbeat, StatusNotification)
- Starting and stopping charging transactions
- Sending meter values during charging
- Event bus integration for monitoring charger events

## Prerequisites

You need a running OCPP 1.6 compatible CSMS (Charging Station Management System) on `ws://localhost:8080/ocpp`.

If you don't have one, you can:
1. Use an open-source CSMS like SteVe or OCPP-JS
2. The charger will still run without a CSMS but won't be able to complete transactions

## Running the Test

```bash
# From the project root
go run cmd/test-charger/main.go

# With environment variables for auth
CSMS_BASIC_AUTH_USER="myuser" CSMS_BASIC_AUTH_PASS="mypass" go run cmd/test-charger/main.go

# With custom endpoint and charger ID
CSMS_ENDPOINT="ws://my-csms:8080/ocpp" CHARGER_ID="MY_CHARGER_001" go run cmd/test-charger/main.go
```

## Expected Output

The test will:
1. Create a virtual charger with ID "TEST-CHARGER-001"
2. Connect to the CSMS (if available)
3. Send BootNotification
4. Start periodic heartbeats and status notifications
5. Start a charging transaction on connector 1
6. Simulate charging for 30 seconds with meter value updates
7. Stop the transaction
8. Gracefully shut down

## Monitoring

The test prints all events to the console, including:
- Connection status
- OCPP messages sent
- Transaction lifecycle events
- Any errors encountered

## Customization

You can modify the test to:
- Change the CSMS endpoint
- Add basic authentication credentials
- Adjust charging duration and power
- Test multiple connectors
- Simulate different scenarios

### Basic Authentication

To use basic authentication with your CSMS:

```go
config := charger.ChargerConfig{
    // ... other config ...
    CSMSEndpoint:  "ws://your-csms:8080/ocpp",
    BasicAuthUser: "your-username",
    BasicAuthPass: "your-password",
}
```

Or in YAML scenarios:

```yaml
csms:
  endpoint: "ws://your-csms:8080/ocpp"
  basic_auth_user: "your-username"
  basic_auth_pass: "your-password"
```
