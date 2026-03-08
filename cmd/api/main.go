package main

import (
	"log"

	"github.com/charliebowman/gump/internal/config"
	"github.com/charliebowman/gump/internal/database"
	"github.com/charliebowman/gump/internal/middleware"
	"github.com/charliebowman/gump/internal/router"
)

func main() {
	cfg := config.Load()

	middleware.SetJWTSecret(cfg.JWTSecret)

	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := database.Migrate(db); err != nil {
		log.Fatalf("failed to migrate database: %v", err)
	}

	r := router.Setup(db, cfg)

	log.Printf("gump server starting on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
