package database

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"

	"github.com/charliebowman/gump/internal/config"
)

func Connect(cfg *config.Config) (*sql.DB, error) {
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)

	return db, nil
}

func Migrate(db *sql.DB) error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			username VARCHAR(50) UNIQUE NOT NULL,
			email VARCHAR(255) UNIQUE NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			display_name VARCHAR(100) DEFAULT '',
			bio TEXT DEFAULT '',
			avatar_url TEXT DEFAULT '',
			created_at TIMESTAMPTZ DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS media (
			id SERIAL PRIMARY KEY,
			media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('movie', 'tv', 'book', 'youtube')),
			external_id VARCHAR(255),
			title VARCHAR(500) NOT NULL,
			metadata JSONB DEFAULT '{}',
			created_at TIMESTAMPTZ DEFAULT NOW(),
			UNIQUE(media_type, external_id)
		)`,
		`CREATE TABLE IF NOT EXISTS reviews (
			id SERIAL PRIMARY KEY,
			user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			media_id INT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
			rating NUMERIC(3,1) CHECK (rating >= 0 AND rating <= 10),
			body TEXT DEFAULT '',
			created_at TIMESTAMPTZ DEFAULT NOW(),
			UNIQUE(user_id, media_id)
		)`,
		`CREATE TABLE IF NOT EXISTS watch_status (
			id SERIAL PRIMARY KEY,
			user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			media_id INT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
			status VARCHAR(20) NOT NULL CHECK (status IN ('want', 'watching', 'finished', 'dropped')),
			updated_at TIMESTAMPTZ DEFAULT NOW(),
			UNIQUE(user_id, media_id)
		)`,
		`CREATE TABLE IF NOT EXISTS follows (
			id SERIAL PRIMARY KEY,
			follower_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			following_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			created_at TIMESTAMPTZ DEFAULT NOW(),
			UNIQUE(follower_id, following_id),
			CHECK (follower_id != following_id)
		)`,
		`CREATE TABLE IF NOT EXISTS wall_posts (
			id SERIAL PRIMARY KEY,
			author_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			wall_owner_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			body TEXT NOT NULL,
			created_at TIMESTAMPTZ DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS messages (
			id SERIAL PRIMARY KEY,
			sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			receiver_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			body TEXT NOT NULL,
			read BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMPTZ DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_reviews_media_id ON reviews(media_id)`,
		`CREATE INDEX IF NOT EXISTS idx_watch_status_user_id ON watch_status(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id)`,
		`CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id)`,
		`CREATE INDEX IF NOT EXISTS idx_wall_posts_wall_owner_id ON wall_posts(wall_owner_id)`,
		`CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)`,
		`CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id)`,
	}

	for _, q := range queries {
		if _, err := db.Exec(q); err != nil {
			return fmt.Errorf("migration failed: %w\nQuery: %s", err, q)
		}
	}

	log.Println("database migration complete")
	return nil
}
