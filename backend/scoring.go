package main

import "fmt"

func CalculateScore(s Submission) (int, ScoreAnalysis) {
	var total int
	var analysis ScoreAnalysis

	// ЭТАЛОН: Те навыки, за которые мы даем баллы в этой вакансии
	// Если вакансия другая - HR просто меняет этот список (в будущем через админку)
	targetSkills := map[string]bool{
		"Go": true, "SQL": true, "Docker": true, "Kubernetes": true, "Linux": true,
	}

	// 1. Хард-скиллы (Релевантность)
	hards, _ := s.Answers["hard_skills"].([]interface{})
	techPoints := 0
	matches := 0
	for _, skill := range hards {
		if targetSkills[fmt.Sprintf("%v", skill)] {
			techPoints += 10
			matches++
		}
	}
	if techPoints > 50 { techPoints = 50 }

	if matches >= 3 {
		analysis.Strengths = append(analysis.Strengths, "Высокая релевантность стека технологий")
	} else if matches > 0 {
		analysis.Strengths = append(analysis.Strengths, "Есть базовое совпадение по ключевым навыкам")
		analysis.Weaknesses = append(analysis.Weaknesses, "Стек совпадает лишь частично")
	} else {
		analysis.Weaknesses = append(analysis.Weaknesses, "Навыки не соответствуют профилю вакансии")
	}
	analysis.ScoreDetails = append(analysis.ScoreDetails, ScoreDetail{"Навыки", techPoints, 50})
	total += techPoints

	// 2. Опыт (Количественная оценка)
	expLevel := fmt.Sprintf("%v", s.Answers["exp_level"])
	expPoints := 0
	switch expLevel {
	case "1": expPoints = 10
	case "2": expPoints = 20
	case "3": expPoints = 30
	case "4", "5+": expPoints = 40
	}
	if expPoints >= 30 {
		analysis.Strengths = append(analysis.Strengths, "Опытный специалист (3+ года)")
	}
	analysis.ScoreDetails = append(analysis.ScoreDetails, ScoreDetail{"Опыт", expPoints, 40})
	total += expPoints

	// 3. Доступность (Бонус за скорость)
	ready := fmt.Sprintf("%v", s.Answers["ready_status"])
	readyPoints := 0
	if ready == "Завтра" {
		readyPoints = 10
		analysis.Strengths = append(analysis.Strengths, "Готов к немедленному выходу")
	}
	analysis.ScoreDetails = append(analysis.ScoreDetails, ScoreDetail{"Доступность", readyPoints, 10})
	total += readyPoints

	return total, analysis
}