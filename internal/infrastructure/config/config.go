package config

import (
	"log"

	"github.com/spf13/viper"
)

// Config holds the application configuration
type Config struct {
	Server   ServerConfig   `mapstructure:"server"`
	Database DatabaseConfig `mapstructure:"database"`
	OCPP     OCPPConfig     `mapstructure:"ocpp"`
	Logging  LoggingConfig  `mapstructure:"logging"`
}

type ServerConfig struct {
	Host string `mapstructure:"host"`
	Port int    `mapstructure:"port"`
}

type DatabaseConfig struct {
	Type string `mapstructure:"type"`
	Path string `mapstructure:"path"`
}

type OCPPConfig struct {
	DefaultVersion   string `mapstructure:"default_version"`
	Timeout          int    `mapstructure:"timeout"`
	DefaultAuthUser  string `mapstructure:"default_auth_user"`
	DefaultAuthPass  string `mapstructure:"default_auth_pass"`
	DefaultEndpoint  string `mapstructure:"default_endpoint"`
}

type LoggingConfig struct {
	Level  string `mapstructure:"level"`
	Format string `mapstructure:"format"`
}

// Load loads configuration from file or environment variables
func Load() *Config {
	viper.SetDefault("server.host", "localhost")
	viper.SetDefault("server.port", 8080)
	viper.SetDefault("database.type", "sqlite")
	viper.SetDefault("database.path", "./data/simulator.db")
	viper.SetDefault("ocpp.default_version", "1.6")
	viper.SetDefault("ocpp.timeout", 30)
	viper.SetDefault("logging.level", "info")
	viper.SetDefault("logging.format", "json")

	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./configs")

	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err != nil {
		log.Printf("Warning: Could not read config file: %v. Using defaults.", err)
	}

	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		log.Fatalf("Unable to decode configuration: %v", err)
	}

	return &config
}
