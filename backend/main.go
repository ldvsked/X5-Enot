package main

import (
	"sort"
	"strconv"
	"sync"
	"fmt"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

var (
	candidates []Candidate
	idCounter  = 1
	mu         sync.Mutex
)

func main() {
	r := gin.Default()
	r.Use(cors.Default())
	r.Static("/static", "./static")

	v1 := r.Group("/api/v1")
	{
		v1.GET("/ping", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok"}) })
		v1.GET("/quiz", func(c *gin.Context) { c.JSON(200, gin.H{"steps": GetQuizSteps()}) })
		
		v1.POST("/submit", func(c *gin.Context) {
			var sub Submission
			if err := c.ShouldBindJSON(&sub); err != nil {
				c.JSON(400, gin.H{"error": "bad request"})
				return
			}
			score, analysis := CalculateScore(sub)
			mu.Lock()
			candidates = append(candidates, Candidate{
				ID: idCounter, Name: fmt.Sprintf("%v", sub.Answers["fio"]),
				EnotID: sub.EnotID, TotalScore: score,
				Analysis: analysis, FullAnswers: sub.Answers,
			})
			idCounter++
			mu.Unlock()
			c.JSON(200, gin.H{"score": score})
		})

		hr := v1.Group("/hr")
		{
			hr.GET("/candidates", func(c *gin.Context) {
				sort.Slice(candidates, func(i, j int) bool { return candidates[i].TotalScore > candidates[j].TotalScore })
				c.JSON(200, candidates)
			})
			hr.GET("/candidates/:id", func(c *gin.Context) {
				id, _ := strconv.Atoi(c.Param("id"))
				for _, cand := range candidates {
					if cand.ID == id { c.JSON(200, cand); return }
				}
				c.JSON(404, gin.H{"error": "not found"})
			})
		}
	}
	r.Run("0.0.0.0:8080")
}