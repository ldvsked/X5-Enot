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
	hards := getStringSlice(s.Answers["hard_skills"])
	techPoints := 0
	matches := 0
	for _, skill := range hards {
		if targetSkills[skill] {
			techPoints += 10
			matches++
		}
	}
	if techPoints > 50 {
		techPoints = 50
	}

	if matches >= 3 {
		analysis.Strengths = append(analysis.Strengths, "Высокая релевантность стека технологий")
	} else if matches > 0 {
		analysis.Strengths = append(analysis.Strengths, "Есть базовое совпадение по ключевым навыкам")
		analysis.Weaknesses = append(analysis.Weaknesses, "Стек совпадает лишь частично")
	} else {
		analysis.Weaknesses = append(analysis.Weaknesses, "Навыки не соответствуют профилю вакансии")
	}
	if len(hards) < 3 {
		analysis.Weaknesses = append(analysis.Weaknesses, "Узкий набор технических компетенций")
	}
	analysis.ScoreDetails = append(analysis.ScoreDetails, ScoreDetail{Label: "Технические навыки", Points: techPoints, Max: 50})
	total += techPoints

	// 2. Опыт и стажировки
	expLevel := fmt.Sprintf("%v", s.Answers["exp_level"])
	internLevel := fmt.Sprintf("%v", s.Answers["intern_level"])
	expPoints := pointsFromLevel(expLevel, 18, 5)
	internPoints := pointsFromLevel(internLevel, 12, 4)
	experiencePoints := expPoints + internPoints
	if experiencePoints > 30 {
		experiencePoints = 30
	}
	if expPoints >= 13 {
		analysis.Strengths = append(analysis.Strengths, "Есть уверенный практический опыт")
	} else if expLevel == "0" {
		analysis.Weaknesses = append(analysis.Weaknesses, "Нет коммерческого опыта")
	}
	if internPoints >= 8 {
		analysis.Strengths = append(analysis.Strengths, "Есть опыт стажировок")
	} else if internLevel == "0" {
		analysis.Weaknesses = append(analysis.Weaknesses, "Не указаны стажировки")
	}
	analysis.ScoreDetails = append(analysis.ScoreDetails, ScoreDetail{Label: "Опыт и стажировки", Points: experiencePoints, Max: 30})
	total += experiencePoints

	// 3. Доступность и формат
	ready := fmt.Sprintf("%v", s.Answers["ready_status"])
	schedule := fmt.Sprintf("%v", s.Answers["schedule"])
	workType := fmt.Sprintf("%v", s.Answers["work_type"])
	availabilityPoints := 0
	switch expLevel {
	case "1":
	case "2":
	case "3":
	case "4", "5+":
	}
	switch ready {
	case "Завтра":
		availabilityPoints += 10
		analysis.Strengths = append(analysis.Strengths, "Готов к немедленному выходу")
	case "Через неделю":
		availabilityPoints += 7
	case "Через месяц":
		availabilityPoints += 4
		analysis.Weaknesses = append(analysis.Weaknesses, "Доступность к выходу не самая быстрая")
	}

	if schedule == "Полный день" || schedule == "Гибкий график" {
		availabilityPoints += 5
	}
	if workType == "Офис" || workType == "Гибрид" {
		availabilityPoints += 5
	}

	if availabilityPoints > 20 {
		availabilityPoints = 20
	}
	analysis.ScoreDetails = append(analysis.ScoreDetails, ScoreDetail{Label: "Доступность", Points: availabilityPoints, Max: 20})
	total += availabilityPoints

	achievementLevel := fmt.Sprintf("%v", s.Answers["achievements"])
	if achievementLevel == "0" {
		analysis.Weaknesses = append(analysis.Weaknesses, "Не указаны достижения в профильных соревнованиях")
	}

	if len(analysis.Strengths) == 0 {
		analysis.Strengths = append(analysis.Strengths, "Анкета заполнена корректно и готова к рассмотрению")
	}

	return total, analysis
}

func getStringSlice(value interface{}) []string {
	switch typed := value.(type) {
	case []string:
		return typed
	case []interface{}:
		result := make([]string, 0, len(typed))
		for _, item := range typed {
			result = append(result, fmt.Sprintf("%v", item))
		}
		return result
	default:
		return nil
	}
}

func pointsFromLevel(level string, maxPoints int, step int) int {
	switch level {
	case "1":
		return step
	case "2":
		return step * 2
	case "3":
		return step * 3
	case "4", "5+":
		return maxPoints
	default:
		return 0
	}
}
