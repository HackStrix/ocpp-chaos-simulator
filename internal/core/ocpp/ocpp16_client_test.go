package ocpp

import (
    "testing"
    
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestOCPP16Client_Creation(t *testing.T) {
    client := NewOCCP16Client("TEST001", "ws://localhost:8080/ocpp")
    require.NotNil(t, client)
    
    assert.False(t, client.IsConnected())
}

func TestOCPP16Client_ConfigCreation(t *testing.T) {
    config := ClientConfig{
        ChargerID:     "TEST001",
        Endpoint:      "ws://localhost:8080/ocpp",
        BasicAuthUser: "admin",
        BasicAuthPass: "password",
    }
    
    client := NewOCCP16ClientWithConfig(config)
    require.NotNil(t, client)
    
    assert.False(t, client.IsConnected())
}

func TestOCPP16Client_MessageParsing(t *testing.T) {
    client := NewOCCP16ClientWithConfig(ClientConfig{
        ChargerID: "TEST001",
        Endpoint:  "ws://localhost:8080/ocpp",
    })
    
    ocppClient := client.(*OCPP16Client)
    
    // Test Call message parsing
    callData := `[2, "12345", "BootNotification", {"chargePointModel": "test"}]`
    msg, err := ocppClient.parseOCPPMessage([]byte(callData))
    require.NoError(t, err)
    assert.Equal(t, "Call", msg.MessageType)
    assert.Equal(t, "12345", msg.MessageID)
    assert.Equal(t, "BootNotification", msg.Action)
    
    // Test CallResult message parsing
    resultData := `[3, "12345", {"status": "Accepted"}]`
    msg, err = ocppClient.parseOCPPMessage([]byte(resultData))
    require.NoError(t, err)
    assert.Equal(t, "CallResult", msg.MessageType)
    assert.Equal(t, "12345", msg.MessageID)
    
    // Test CallError message parsing
    errorData := `[4, "12345", "GenericError", "Something went wrong", {}]`
    msg, err = ocppClient.parseOCPPMessage([]byte(errorData))
    require.NoError(t, err)
    assert.Equal(t, "CallError", msg.MessageType)
    assert.Equal(t, "12345", msg.MessageID)
}

func TestBasicAuth(t *testing.T) {
    result := basicAuth("admin", "password")
    expected := "YWRtaW46cGFzc3dvcmQ=" // base64 of "admin:password"
    assert.Equal(t, expected, result)
}
