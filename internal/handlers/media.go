package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/charliebowman/gump/internal/models"
	"github.com/charliebowman/gump/internal/services/openlibrary"
	"github.com/charliebowman/gump/internal/services/tmdb"
)

type MediaHandler struct {
	db   *sql.DB
	tmdb *tmdb.Client
	ol   *openlibrary.Client
}

func NewMediaHandler(db *sql.DB, tmdbClient *tmdb.Client, olClient *openlibrary.Client) *MediaHandler {
	return &MediaHandler{db: db, tmdb: tmdbClient, ol: olClient}
}

func (h *MediaHandler) Search(c *gin.Context) {
	mediaType := c.Query("type")
	query := c.Query("q")

	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "query parameter 'q' is required"})
		return
	}

	var results []models.SearchResult
	var err error

	switch mediaType {
	case "movie":
		results, err = h.tmdb.SearchMovies(query)
	case "tv":
		results, err = h.tmdb.SearchTV(query)
	case "book":
		results, err = h.ol.SearchBooks(query)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "type must be movie, tv, or book"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "search failed: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, results)
}

func (h *MediaHandler) GetMedia(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid media id"})
		return
	}

	var m models.Media
	err = h.db.QueryRow(`
		SELECT id, media_type, external_id, title, metadata, created_at
		FROM media WHERE id = $1`, id,
	).Scan(&m.ID, &m.MediaType, &m.ExternalID, &m.Title, &m.Metadata, &m.CreatedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "media not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch media"})
		return
	}

	c.JSON(http.StatusOK, m)
}

func (h *MediaHandler) CreateMedia(c *gin.Context) {
	var req struct {
		MediaType  string          `json:"media_type" binding:"required"`
		ExternalID string          `json:"external_id" binding:"required"`
		Title      string          `json:"title" binding:"required"`
		Metadata   json.RawMessage `json:"metadata"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "media_type, external_id and title are required"})
		return
	}

	if req.Metadata == nil {
		req.Metadata = json.RawMessage(`{}`)
	}

	var m models.Media
	err := h.db.QueryRow(`
		INSERT INTO media (media_type, external_id, title, metadata)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (media_type, external_id) DO UPDATE SET title = EXCLUDED.title
		RETURNING id, media_type, external_id, title, metadata, created_at`,
		req.MediaType, req.ExternalID, req.Title, req.Metadata,
	).Scan(&m.ID, &m.MediaType, &m.ExternalID, &m.Title, &m.Metadata, &m.CreatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create media"})
		return
	}

	c.JSON(http.StatusCreated, m)
}
