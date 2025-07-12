package main

import (
	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"log"
	"net/http"
	"time"
)

// ArticleLog represents the structure of the article interaction log in PostgreSQL
type ArticleLog struct {
	ID        uint      `gorm:"primaryKey"`
	UserID    string    `gorm:"not null"`
	ArticleID string    `gorm:"not null"`
	Action    string    `gorm:"not null"` // "click" or "reading"
	CreatedAt time.Time `gorm:"autoCreateTime"`
}

// PostgreSQL setup
func setupPostgres() (*gorm.DB, error) {
	dsn := "host=localhost user=pguser password=S3cret dbname=user-db port=5432 sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}
	// Auto-migrate the schema
	if err := db.AutoMigrate(&ArticleLog{}); err != nil {
		return nil, err
	}
	return db, nil
}

func main() {
	// Initialize PostgreSQL
	db, err := setupPostgres()
	if err != nil {
		log.Fatal("Failed to connect to PostgreSQL:", err)
	}

	// Initialize Gin router
	router := gin.Default()

	// Add CORS middleware to allow all origins
	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*") // Allow all origins
		c.Header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Header("Access-Control-Allow-Credentials", "true")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusOK)
			return
		}
		c.Next()
	})

	// Middleware to add DB to context
	router.Use(func(c *gin.Context) {
		c.Set("postgres", db)
		c.Next()
	})

	// Endpoint for article click
	router.POST("/article/click", func(c *gin.Context) {
		var request struct {
			UserID    string `json:"userId" binding:"required"`
			ArticleID string `json:"articleId" binding:"required"`
		}

		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
			return
		}

		db := c.MustGet("postgres").(*gorm.DB)
		logEntry := ArticleLog{
			UserID:    request.UserID,
			ArticleID: request.ArticleID,
			Action:    "click",
		}
		if err := db.Create(&logEntry).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to log click"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Click logged successfully"})
	})

	// Endpoint for article reading time
	router.POST("/article/reading", func(c *gin.Context) {
		var request struct {
			UserID    string `json:"userId" binding:"required"`
			ArticleID string `json:"articleId" binding:"required"`
		}

		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
			return
		}

		db := c.MustGet("postgres").(*gorm.DB)
		logEntry := ArticleLog{
			UserID:    request.UserID,
			ArticleID: request.ArticleID,
			Action:    "reading",
		}
		if err := db.Create(&logEntry).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to log reading time"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Reading time logged successfully"})
	})

	// Endpoint to get articles by user ID
	router.GET("/articles/user/:userId", func(c *gin.Context) {
		userID := c.Param("userId")
		db := c.MustGet("postgres").(*gorm.DB)

		var logs []ArticleLog
		if err := db.Where("user_id = ?", userID).Find(&logs).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch articles"})
			return
		}

		// Extract unique article IDs
		articleIDs := make(map[string]bool)
		for _, log := range logs {
			articleIDs[log.ArticleID] = true
		}

		var result []string
		for id := range articleIDs {
			result = append(result, id)
		}

		c.JSON(http.StatusOK, gin.H{"articleIds": result})
	})

	// Endpoint to get reading time for an article
	router.GET("/articles/reading-time/:articleId", func(c *gin.Context) {
		articleID := c.Param("articleId")
		db := c.MustGet("postgres").(*gorm.DB)

		var logs []ArticleLog
		if err := db.Where("article_id = ? AND action = ?", articleID, "reading").Find(&logs).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reading time"})
			return
		}

		// Calculate reading time (each "reading" log represents 10 seconds)
		totalReadingTime := len(logs) * 10 // in seconds

		c.JSON(http.StatusOK, gin.H{
			"articleId":       articleID,
			"readingTimeSec":  totalReadingTime,
			"readingTimeMin":  totalReadingTime / 60,
			"interactionCount": len(logs),
		})
	})

	// Basic health check
	router.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "Hello, Gin!")
	})

	// Start server
	if err := router.Run(":3006"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}