package storage

import (
	"os"
	"path/filepath"

	"github.com/glebarez/sqlite" // Pure-Go SQLite driver
	"gorm.io/gorm"
)

// Database interface defines the storage contract
type Database interface {
	GetDB() *gorm.DB
	Close() error
	Migrate() error
}

// SQLiteDB implements Database interface for SQLite
type SQLiteDB struct {
	db *gorm.DB
}

// NewSQLiteDB creates a new SQLite database connection
func NewSQLiteDB(path string) (Database, error) {
	// Ensure the directory exists before creating the database file
	if err := ensureDirectoryExists(path); err != nil {
		return nil, err
	}

	db, err := gorm.Open(sqlite.Open(path), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	sqliteDB := &SQLiteDB{db: db}

	// Auto-migrate tables
	if err := sqliteDB.Migrate(); err != nil {
		return nil, err
	}

	return sqliteDB, nil
}

// ensureDirectoryExists creates the directory for the database file if it doesn't exist
func ensureDirectoryExists(dbPath string) error {
	// Skip directory creation for special SQLite paths
	if dbPath == ":memory:" || dbPath == "" {
		return nil
	}

	// Get the directory from the database file path
	dir := filepath.Dir(dbPath)

	// Create directory with proper permissions (0755)
	// This will work even if the directory already exists
	return os.MkdirAll(dir, 0755)
}

// GetDB returns the GORM database instance
func (s *SQLiteDB) GetDB() *gorm.DB {
	return s.db
}

// Close closes the database connection
func (s *SQLiteDB) Close() error {
	sqlDB, err := s.db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// Migrate runs database migrations
func (s *SQLiteDB) Migrate() error {
	// Auto-migrate all models
	return s.db.AutoMigrate(
		&Simulation{},
		&Charger{},
		&OCPPMessage{},
		&Event{},
	)
}
