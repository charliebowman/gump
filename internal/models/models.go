package models

import (
	"encoding/json"
	"time"
)

type User struct {
	ID          int       `json:"id"`
	Username    string    `json:"username"`
	Email       string    `json:"email,omitempty"`
	Password    string    `json:"-"`
	DisplayName string    `json:"display_name"`
	Bio         string    `json:"bio"`
	AvatarURL   string    `json:"avatar_url"`
	CreatedAt   time.Time `json:"created_at"`
}

type UserProfile struct {
	User
	FollowerCount  int `json:"follower_count"`
	FollowingCount int `json:"following_count"`
	ReviewCount    int `json:"review_count"`
}

type Media struct {
	ID         int              `json:"id"`
	MediaType  string           `json:"media_type"`
	ExternalID string           `json:"external_id"`
	Title      string           `json:"title"`
	Metadata   json.RawMessage  `json:"metadata"`
	CreatedAt  time.Time        `json:"created_at"`
}

type Review struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	MediaID   int       `json:"media_id"`
	Rating    float64   `json:"rating"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"created_at"`
	Username  string    `json:"username,omitempty"`
	MediaTitle string   `json:"media_title,omitempty"`
	MediaType  string   `json:"media_type,omitempty"`
}

type WatchStatus struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	MediaID   int       `json:"media_id"`
	Status    string    `json:"status"`
	UpdatedAt time.Time `json:"updated_at"`
	MediaTitle string   `json:"media_title,omitempty"`
	MediaType  string   `json:"media_type,omitempty"`
}

type Follow struct {
	ID          int       `json:"id"`
	FollowerID  int       `json:"follower_id"`
	FollowingID int       `json:"following_id"`
	CreatedAt   time.Time `json:"created_at"`
}

type WallPost struct {
	ID          int       `json:"id"`
	AuthorID    int       `json:"author_id"`
	WallOwnerID int       `json:"wall_owner_id"`
	Body        string    `json:"body"`
	CreatedAt   time.Time `json:"created_at"`
	AuthorName  string    `json:"author_name,omitempty"`
}

type Message struct {
	ID         int       `json:"id"`
	SenderID   int       `json:"sender_id"`
	ReceiverID int       `json:"receiver_id"`
	Body       string    `json:"body"`
	Read       bool      `json:"read"`
	CreatedAt  time.Time `json:"created_at"`
	SenderName string    `json:"sender_name,omitempty"`
}

type Conversation struct {
	UserID      int       `json:"user_id"`
	Username    string    `json:"username"`
	DisplayName string    `json:"display_name"`
	LastMessage string    `json:"last_message"`
	LastAt      time.Time `json:"last_at"`
	UnreadCount int       `json:"unread_count"`
}

type FeedItem struct {
	Type      string          `json:"type"`
	ID        int             `json:"id"`
	UserID    int             `json:"user_id"`
	Username  string          `json:"username"`
	MediaID   int             `json:"media_id"`
	MediaTitle string         `json:"media_title"`
	MediaType  string         `json:"media_type"`
	Rating    *float64        `json:"rating,omitempty"`
	Body      *string         `json:"body,omitempty"`
	Status    *string         `json:"status,omitempty"`
	CreatedAt time.Time       `json:"created_at"`
}

type SearchResult struct {
	ExternalID string          `json:"external_id"`
	Title      string          `json:"title"`
	MediaType  string          `json:"media_type"`
	Metadata   json.RawMessage `json:"metadata"`
}
