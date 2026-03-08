package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/charliebowman/gump/internal/middleware"
	"github.com/charliebowman/gump/internal/models"
)

type SocialHandler struct {
	db *sql.DB
}

func NewSocialHandler(db *sql.DB) *SocialHandler {
	return &SocialHandler{db: db}
}

func (h *SocialHandler) Follow(c *gin.Context) {
	userID := middleware.GetUserID(c)
	targetID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	if userID == targetID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot follow yourself"})
		return
	}

	_, err = h.db.Exec(`
		INSERT INTO follows (follower_id, following_id)
		VALUES ($1, $2)
		ON CONFLICT DO NOTHING`, userID, targetID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to follow user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "followed"})
}

func (h *SocialHandler) Unfollow(c *gin.Context) {
	userID := middleware.GetUserID(c)
	targetID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	res, err := h.db.Exec(`DELETE FROM follows WHERE follower_id = $1 AND following_id = $2`, userID, targetID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to unfollow"})
		return
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "not following this user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "unfollowed"})
}

func (h *SocialHandler) Feed(c *gin.Context) {
	userID := middleware.GetUserID(c)

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	if limit > 50 {
		limit = 50
	}

	rows, err := h.db.Query(`
		SELECT * FROM (
			SELECT 'review' AS type, r.id, r.user_id, u.username, r.media_id,
				m.title AS media_title, m.media_type, r.rating, r.body, NULL AS status, r.created_at
			FROM reviews r
			JOIN users u ON u.id = r.user_id
			JOIN media m ON m.id = r.media_id
			WHERE r.user_id IN (SELECT following_id FROM follows WHERE follower_id = $1)

			UNION ALL

			SELECT 'status' AS type, ws.id, ws.user_id, u.username, ws.media_id,
				m.title AS media_title, m.media_type, NULL AS rating, NULL AS body, ws.status, ws.updated_at
			FROM watch_status ws
			JOIN users u ON u.id = ws.user_id
			JOIN media m ON m.id = ws.media_id
			WHERE ws.user_id IN (SELECT following_id FROM follows WHERE follower_id = $1)
		) feed
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3`, userID, limit, offset)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch feed"})
		return
	}
	defer rows.Close()

	items := []models.FeedItem{}
	for rows.Next() {
		var f models.FeedItem
		if err := rows.Scan(&f.Type, &f.ID, &f.UserID, &f.Username, &f.MediaID,
			&f.MediaTitle, &f.MediaType, &f.Rating, &f.Body, &f.Status, &f.CreatedAt); err != nil {
			continue
		}
		items = append(items, f)
	}

	c.JSON(http.StatusOK, items)
}
