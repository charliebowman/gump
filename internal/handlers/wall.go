package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/charliebowman/gump/internal/middleware"
	"github.com/charliebowman/gump/internal/models"
)

type WallHandler struct {
	db *sql.DB
}

func NewWallHandler(db *sql.DB) *WallHandler {
	return &WallHandler{db: db}
}

func (h *WallHandler) Post(c *gin.Context) {
	userID := middleware.GetUserID(c)
	ownerID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	var req struct {
		Body string `json:"body" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "body is required"})
		return
	}

	var wp models.WallPost
	err = h.db.QueryRow(`
		INSERT INTO wall_posts (author_id, wall_owner_id, body)
		VALUES ($1, $2, $3)
		RETURNING id, author_id, wall_owner_id, body, created_at`,
		userID, ownerID, req.Body,
	).Scan(&wp.ID, &wp.AuthorID, &wp.WallOwnerID, &wp.Body, &wp.CreatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create wall post"})
		return
	}

	c.JSON(http.StatusCreated, wp)
}

func (h *WallHandler) Get(c *gin.Context) {
	ownerID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	rows, err := h.db.Query(`
		SELECT wp.id, wp.author_id, wp.wall_owner_id, wp.body, wp.created_at,
			u.username AS author_name
		FROM wall_posts wp
		JOIN users u ON u.id = wp.author_id
		WHERE wp.wall_owner_id = $1
		ORDER BY wp.created_at DESC`, ownerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch wall posts"})
		return
	}
	defer rows.Close()

	posts := []models.WallPost{}
	for rows.Next() {
		var wp models.WallPost
		if err := rows.Scan(&wp.ID, &wp.AuthorID, &wp.WallOwnerID, &wp.Body, &wp.CreatedAt,
			&wp.AuthorName); err != nil {
			continue
		}
		posts = append(posts, wp)
	}

	c.JSON(http.StatusOK, posts)
}
