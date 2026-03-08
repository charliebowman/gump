package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/charliebowman/gump/internal/middleware"
	"github.com/charliebowman/gump/internal/models"
)

type UserHandler struct {
	db *sql.DB
}

func NewUserHandler(db *sql.DB) *UserHandler {
	return &UserHandler{db: db}
}

func (h *UserHandler) GetProfile(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	var p models.UserProfile
	err = h.db.QueryRow(`
		SELECT u.id, u.username, u.display_name, u.bio, u.avatar_url, u.created_at,
			(SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS follower_count,
			(SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following_count,
			(SELECT COUNT(*) FROM reviews WHERE user_id = u.id) AS review_count
		FROM users u WHERE u.id = $1`, id,
	).Scan(&p.ID, &p.Username, &p.DisplayName, &p.Bio, &p.AvatarURL, &p.CreatedAt,
		&p.FollowerCount, &p.FollowingCount, &p.ReviewCount)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch user"})
		return
	}

	c.JSON(http.StatusOK, p)
}

func (h *UserHandler) GetUserReviews(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	rows, err := h.db.Query(`
		SELECT r.id, r.user_id, r.media_id, r.rating, r.body, r.created_at,
			u.username, m.title, m.media_type
		FROM reviews r
		JOIN users u ON u.id = r.user_id
		JOIN media m ON m.id = r.media_id
		WHERE r.user_id = $1
		ORDER BY r.created_at DESC`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch reviews"})
		return
	}
	defer rows.Close()

	reviews := []models.Review{}
	for rows.Next() {
		var r models.Review
		if err := rows.Scan(&r.ID, &r.UserID, &r.MediaID, &r.Rating, &r.Body, &r.CreatedAt,
			&r.Username, &r.MediaTitle, &r.MediaType); err != nil {
			continue
		}
		reviews = append(reviews, r)
	}

	c.JSON(http.StatusOK, reviews)
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req struct {
		DisplayName *string `json:"display_name"`
		Bio         *string `json:"bio"`
		AvatarURL   *string `json:"avatar_url"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	sets := []string{}
	args := []interface{}{}
	idx := 1

	if req.DisplayName != nil {
		sets = append(sets, "display_name = $"+strconv.Itoa(idx))
		args = append(args, *req.DisplayName)
		idx++
	}
	if req.Bio != nil {
		sets = append(sets, "bio = $"+strconv.Itoa(idx))
		args = append(args, *req.Bio)
		idx++
	}
	if req.AvatarURL != nil {
		sets = append(sets, "avatar_url = $"+strconv.Itoa(idx))
		args = append(args, *req.AvatarURL)
		idx++
	}

	if len(sets) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "nothing to update"})
		return
	}

	args = append(args, userID)
	query := "UPDATE users SET " + strings.Join(sets, ", ") + " WHERE id = $" + strconv.Itoa(idx)

	if _, err := h.db.Exec(query, args...); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "profile updated"})
}
