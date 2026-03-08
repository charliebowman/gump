package router

import (
	"database/sql"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"github.com/charliebowman/gump/internal/config"
	"github.com/charliebowman/gump/internal/handlers"
	"github.com/charliebowman/gump/internal/middleware"
	"github.com/charliebowman/gump/internal/services/openlibrary"
	"github.com/charliebowman/gump/internal/services/tmdb"
)

func Setup(db *sql.DB, cfg *config.Config) *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// Serve frontend
	r.StaticFile("/", "./web/index.html")
	r.Static("/web", "./web")

	// Services
	tmdbClient := tmdb.NewClient(cfg.TMDBAPIKey)
	olClient := openlibrary.NewClient()

	// Handlers
	authH := handlers.NewAuthHandler(db)
	userH := handlers.NewUserHandler(db)
	mediaH := handlers.NewMediaHandler(db, tmdbClient, olClient)
	reviewH := handlers.NewReviewHandler(db)
	statusH := handlers.NewStatusHandler(db)
	socialH := handlers.NewSocialHandler(db)
	wallH := handlers.NewWallHandler(db)
	msgH := handlers.NewMessageHandler(db)

	api := r.Group("/api")
	{
		// Auth (public)
		api.POST("/auth/register", authH.Register)
		api.POST("/auth/login", authH.Login)

		// Users (public read)
		api.GET("/users/:id", userH.GetProfile)
		api.GET("/users/:id/reviews", userH.GetUserReviews)
		api.GET("/users/:id/status", statusH.GetUserStatuses)
		api.GET("/wall/:id", wallH.Get)

		// Media (public read)
		api.GET("/media/search", mediaH.Search)
		api.GET("/media/:id", mediaH.GetMedia)

		// Reviews (public read)
		api.GET("/reviews/:id", reviewH.Get)

		// Protected routes
		auth := api.Group("")
		auth.Use(middleware.AuthRequired())
		{
			auth.PUT("/users/me", userH.UpdateProfile)

			auth.POST("/media", mediaH.CreateMedia)

			auth.POST("/reviews", reviewH.CreateOrUpdate)
			auth.DELETE("/reviews/:id", reviewH.Delete)

			auth.POST("/status", statusH.Set)
			auth.DELETE("/status/:id", statusH.Delete)

			auth.POST("/follow/:id", socialH.Follow)
			auth.DELETE("/follow/:id", socialH.Unfollow)
			auth.GET("/feed", socialH.Feed)

			auth.POST("/wall/:id", wallH.Post)

			auth.POST("/messages", msgH.Send)
			auth.GET("/messages", msgH.GetConversations)
			auth.GET("/messages/:id", msgH.GetThread)
			auth.PUT("/messages/:id/read", msgH.MarkRead)
		}
	}

	return r
}
