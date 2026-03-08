package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/charliebowman/gump/internal/middleware"
	"github.com/charliebowman/gump/internal/models"
)

type ReviewHandler struct {
	db *sql.DB
}

func NewReviewHandler(db *sql.DB) *ReviewHandler {
	return &ReviewHandler{db: db}
}

func (h *ReviewHandler) CreateOrUpdate(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req struct {
		MediaID int      `json:"media_id" binding:"required"`
		Rating  *float64 `json:"rating"`
		Body    string   `json:"body"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "media_id is required"})
		return
	}

	if req.Rating != nil && (*req.Rating < 0 || *req.Rating > 10) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "rating must be between 0 and 10"})
		return
	}

	var r models.Review
	err := h.db.QueryRow(`
		INSERT INTO reviews (user_id, media_id, rating, body)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (user_id, media_id) DO UPDATE
		SET rating = EXCLUDED.rating, body = EXCLUDED.body
		RETURNING id, user_id, media_id, rating, body, created_at`,
		userID, req.MediaID, req.Rating, req.Body,
	).Scan(&r.ID, &r.UserID, &r.MediaID, &r.Rating, &r.Body, &r.CreatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save review"})
		return
	}

	c.JSON(http.StatusCreated, r)
}

func (h *ReviewHandler) Get(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid review id"})
		return
	}

	var r models.Review
	err = h.db.QueryRow(`
		SELECT r.id, r.user_id, r.media_id, r.rating, r.body, r.created_at,
			u.username, m.title, m.media_type
		FROM reviews r
		JOIN users u ON u.id = r.user_id
		JOIN media m ON m.id = r.media_id
		WHERE r.id = $1`, id,
	).Scan(&r.ID, &r.UserID, &r.MediaID, &r.Rating, &r.Body, &r.CreatedAt,
		&r.Username, &r.MediaTitle, &r.MediaType)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "review not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch review"})
		return
	}

	c.JSON(http.StatusOK, r)
}

func (h *ReviewHandler) Delete(c *gin.Context) {
	userID := middleware.GetUserID(c)
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid review id"})
		return
	}

	res, err := h.db.Exec(`DELETE FROM reviews WHERE id = $1 AND user_id = $2`, id, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete review"})
		return
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "review not found or not owned by you"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "review deleted"})
}
