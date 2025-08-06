package storage

import (
	"gorm.io/driver/sqlite"
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

// GetDB returns the GORM database instance
func (s *SQLiteDB) GetDB() *gorm.DB {
	return s.db
}

// Close closes the database connection
func (s *SQLiteDB) Close() error {
	// TODO: Implement database connection closing
	return nil
}

// Migrate runs database migrations
func (s *SQLiteDB) Migrate() error {
	// TODO: Implement auto-migration for all models
	return nil
}
