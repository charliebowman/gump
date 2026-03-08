package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/charliebowman/gump/internal/middleware"
	"github.com/charliebowman/gump/internal/models"
)

type StatusHandler struct {
	db *sql.DB
}

func NewStatusHandler(db *sql.DB) *StatusHandler {
	return &StatusHandler{db: db}
}

func (h *StatusHandler) Set(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req struct {
		MediaID int    `json:"media_id" binding:"required"`
		Status  string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "media_id and status are required"})
		return
	}

	var ws models.WatchStatus
	err := h.db.QueryRow(`
		INSERT INTO watch_status (user_id, media_id, status)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id, media_id) DO UPDATE
		SET status = EXCLUDED.status, updated_at = NOW()
		RETURNING id, user_id, media_id, status, updated_at`,
		userID, req.MediaID, req.Status,
	).Scan(&ws.ID, &ws.UserID, &ws.MediaID, &ws.Status, &ws.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to set status"})
		return
	}

	c.JSON(http.StatusCreated, ws)
}

func (h *StatusHandler) GetUserStatuses(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	statusFilter := c.Query("status")

	query := `
		SELECT ws.id, ws.user_id, ws.media_id, ws.status, ws.updated_at,
			m.title, m.media_type
		FROM watch_status ws
		JOIN media m ON m.id = ws.media_id
		WHERE ws.user_id = $1`
	args := []interface{}{id}

	if statusFilter != "" {
		query += " AND ws.status = $2"
		args = append(args, statusFilter)
	}
	query += " ORDER BY ws.updated_at DESC"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch statuses"})
		return
	}
	defer rows.Close()

	statuses := []models.WatchStatus{}
	for rows.Next() {
		var ws models.WatchStatus
		if err := rows.Scan(&ws.ID, &ws.UserID, &ws.MediaID, &ws.Status, &ws.UpdatedAt,
			&ws.MediaTitle, &ws.MediaType); err != nil {
			continue
		}
		statuses = append(statuses, ws)
	}

	c.JSON(http.StatusOK, statuses)
}

func (h *StatusHandler) Delete(c *gin.Context) {
	userID := middleware.GetUserID(c)
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid status id"})
		return
	}

	res, err := h.db.Exec(`DELETE FROM watch_status WHERE id = $1 AND user_id = $2`, id, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete status"})
		return
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "status not found or not owned by you"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "status deleted"})
}
