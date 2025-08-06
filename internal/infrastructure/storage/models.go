package storage

import (
	"time"

	"gorm.io/gorm"
)

// BaseModel provides common fields for all models
type BaseModel struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// Simulation represents a simulation session
type Simulation struct {
	BaseModel
	Name        string `gorm:"not null" json:"name"`
	Status      string `gorm:"not null;default:'created'" json:"status"` // created, running, stopped, completed
	Config      string `gorm:"type:text" json:"config"`                  // JSON configuration
	ChargerCount int   `gorm:"default:0" json:"charger_count"`
	Chargers    []Charger `gorm:"foreignKey:SimulationID" json:"chargers,omitempty"`
}

// Charger represents a virtual charger instance
type Charger struct {
	BaseModel
	SimulationID uint   `gorm:"not null" json:"simulation_id"`
	Identifier   string `gorm:"not null" json:"identifier"`
	Status       string `gorm:"not null;default:'offline'" json:"status"` // offline, connecting, connected, charging, error
	Config       string `gorm:"type:text" json:"config"`                   // JSON configuration
	Simulation   Simulation `gorm:"foreignKey:SimulationID" json:"simulation,omitempty"`
}

// OCPPMessage represents OCPP message logs
type OCPPMessage struct {
	BaseModel
	ChargerID   uint   `gorm:"not null" json:"charger_id"`
	Direction   string `gorm:"not null" json:"direction"`    // incoming, outgoing
	MessageType string `gorm:"not null" json:"message_type"` // OCPP message type
	Payload     string `gorm:"type:text" json:"payload"`     // JSON payload
	Charger     Charger `gorm:"foreignKey:ChargerID" json:"charger,omitempty"`
}

// Event represents system events
type Event struct {
	BaseModel
	Type     string `gorm:"not null" json:"type"`      // event type
	EntityID uint   `json:"entity_id"`                 // related entity ID
	Data     string `gorm:"type:text" json:"data"`     // JSON event data
	Level    string `gorm:"not null" json:"level"`     // info, warning, error
}
