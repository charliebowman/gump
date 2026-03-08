package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/charliebowman/gump/internal/middleware"
	"github.com/charliebowman/gump/internal/models"
)

type MessageHandler struct {
	db *sql.DB
}

func NewMessageHandler(db *sql.DB) *MessageHandler {
	return &MessageHandler{db: db}
}

func (h *MessageHandler) Send(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req struct {
		ReceiverID int    `json:"receiver_id" binding:"required"`
		Body       string `json:"body" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "receiver_id and body are required"})
		return
	}

	if userID == req.ReceiverID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot message yourself"})
		return
	}

	var m models.Message
	err := h.db.QueryRow(`
		INSERT INTO messages (sender_id, receiver_id, body)
		VALUES ($1, $2, $3)
		RETURNING id, sender_id, receiver_id, body, read, created_at`,
		userID, req.ReceiverID, req.Body,
	).Scan(&m.ID, &m.SenderID, &m.ReceiverID, &m.Body, &m.Read, &m.CreatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to send message"})
		return
	}

	c.JSON(http.StatusCreated, m)
}

func (h *MessageHandler) GetConversations(c *gin.Context) {
	userID := middleware.GetUserID(c)

	rows, err := h.db.Query(`
		SELECT DISTINCT ON (other_id) other_id, u.username, u.display_name, body, msg_at, unread
		FROM (
			SELECT
				CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END AS other_id,
				body, created_at AS msg_at,
				CASE WHEN receiver_id = $1 AND read = FALSE THEN 1 ELSE 0 END AS unread
			FROM messages
			WHERE sender_id = $1 OR receiver_id = $1
			ORDER BY created_at DESC
		) sub
		JOIN users u ON u.id = sub.other_id
		ORDER BY other_id, msg_at DESC`, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch conversations"})
		return
	}
	defer rows.Close()

	convos := []models.Conversation{}
	for rows.Next() {
		var conv models.Conversation
		if err := rows.Scan(&conv.UserID, &conv.Username, &conv.DisplayName,
			&conv.LastMessage, &conv.LastAt, &conv.UnreadCount); err != nil {
			continue
		}
		convos = append(convos, conv)
	}

	c.JSON(http.StatusOK, convos)
}

func (h *MessageHandler) GetThread(c *gin.Context) {
	userID := middleware.GetUserID(c)
	otherID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	rows, err := h.db.Query(`
		SELECT m.id, m.sender_id, m.receiver_id, m.body, m.read, m.created_at,
			u.username AS sender_name
		FROM messages m
		JOIN users u ON u.id = m.sender_id
		WHERE (m.sender_id = $1 AND m.receiver_id = $2)
		   OR (m.sender_id = $2 AND m.receiver_id = $1)
		ORDER BY m.created_at ASC`, userID, otherID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch messages"})
		return
	}
	defer rows.Close()

	messages := []models.Message{}
	for rows.Next() {
		var m models.Message
		if err := rows.Scan(&m.ID, &m.SenderID, &m.ReceiverID, &m.Body, &m.Read, &m.CreatedAt,
			&m.SenderName); err != nil {
			continue
		}
		messages = append(messages, m)
	}

	// Mark messages as read
	h.db.Exec(`UPDATE messages SET read = TRUE WHERE sender_id = $1 AND receiver_id = $2 AND read = FALSE`,
		otherID, userID)

	c.JSON(http.StatusOK, messages)
}

func (h *MessageHandler) MarkRead(c *gin.Context) {
	userID := middleware.GetUserID(c)
	otherID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	h.db.Exec(`UPDATE messages SET read = TRUE WHERE sender_id = $1 AND receiver_id = $2 AND read = FALSE`,
		otherID, userID)

	c.JSON(http.StatusOK, gin.H{"message": "messages marked as read"})
}
