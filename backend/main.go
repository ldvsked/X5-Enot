package main

import (
	"fmt"
	"sort"
	"strconv"
	"sync"

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
			name := answerString(sub.Answers, "fio")
			avatar := FindAvatarByID(sub.EnotID)

			mu.Lock()
			candidate := Candidate{
				ID:          idCounter,
				Name:        name,
				EnotID:      sub.EnotID,
				EnotName:    avatar.Name,
				EnotImg:     avatar.Img,
				TotalScore:  score,
				Analysis:    analysis,
				FullAnswers: sub.Answers,
			}
			candidates = append(candidates, candidate)
			idCounter++
			mu.Unlock()

			c.JSON(200, SubmitResponse{
				ID:          candidate.ID,
				CandidateID: candidate.ID,
				Score:       score,
				Status:      scoreStatus(score),
				Message:     scoreMessage(score),
			})
		})

		hr := v1.Group("/hr")
		{
			hr.GET("/candidates", func(c *gin.Context) {
				mu.Lock()
				summaries := make([]CandidateSummary, 0, len(candidates))
				for _, candidate := range candidates {
					summaries = append(summaries, CandidateSummary{
						ID:         candidate.ID,
						Name:       candidate.Name,
						EnotID:     candidate.EnotID,
						EnotName:   candidate.EnotName,
						EnotImg:    candidate.EnotImg,
						TotalScore: candidate.TotalScore,
					})
				}
				mu.Unlock()

				sort.Slice(summaries, func(i, j int) bool { return summaries[i].TotalScore > summaries[j].TotalScore })
				c.JSON(200, summaries)
			})
			hr.GET("/candidates/:id", func(c *gin.Context) {
				id, _ := strconv.Atoi(c.Param("id"))
				mu.Lock()
				for _, cand := range candidates {
					if cand.ID == id {
						mu.Unlock()
						c.JSON(200, cand)
						return
					}
				}
				mu.Unlock()
				c.JSON(404, gin.H{"error": "not found"})
			})
		}
	}
	r.Run("0.0.0.0:8080")
}

func answerString(answers map[string]interface{}, key string) string {
	if value, ok := answers[key]; ok {
		return fmt.Sprintf("%v", value)
	}
	return ""
}

func scoreStatus(score int) string {
	switch {
	case score >= 70:
		return "top"
	case score >= 40:
		return "review"
	default:
		return "delayed_reject"
	}
}

func scoreMessage(score int) string {
	switch scoreStatus(score) {
	case "top":
		return "Анкета сохранена. Кандидат выглядит сильным матчем для быстрого контакта."
	case "review":
		return "Анкета сохранена. Есть хороший потенциал, HR стоит посмотреть детали."
	default:
		return "Анкета сохранена. Пока профиль выглядит слабее целевой вакансии."
	}
}
