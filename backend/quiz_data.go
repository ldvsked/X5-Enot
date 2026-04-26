package main

func GetQuizSteps() []QuizStep {
	return []QuizStep{
		{
			Type: "welcome",
			Title: "Стажировка в X5",
			Text: "Пройди путь енота до оффера!",
			ImageURL: "/static/enot.webp",
		},
		{
			Type: "avatar_selection",
			Title: "Выбери аватара",
			Options: []Option{
				{ID: "coder", Name: "Енот-кодер", Img: "/static/enot.webp"},
				{ID: "manager", Name: "Енот-менеджер", Img: "/static/enot.webp"},
				{ID: "analyst", Name: "Енот-аналитик", Img: "/static/enot.webp"},
			},
		},
		{
			Type: "questions",
			BlockID: "common_info",
			Title: "Общая информация",
			Items: []QuizItem{
				{ID: "fio", Label: "ФИО", UI: "input_text", Required: true},
				{ID: "age", Label: "Возраст", UI: "input_text", Required: true},
				{ID: "city", Label: "Город", UI: "input_text", Required: true},
				{ID: "university", Label: "ВУЗ", UI: "input_text", Required: true},
				{ID: "current_work", Label: "Место работы (если есть)", UI: "input_text"},
			},
		},
		{
			Type: "questions",
			BlockID: "availability",
			Title: "Доступность",
			Items: []QuizItem{
				{ID: "ready_status", Label: "Готов начать", UI: "single_select", Required: true, Variants: []string{"Завтра", "Через неделю", "Через месяц"}},
				{ID: "schedule", Label: "График", UI: "single_select", Required: true, Variants: []string{"Полный день", "Гибкий график", "Парт-тайм"}},
				{ID: "work_type", Label: "Формат работы", UI: "single_select", Required: true, Variants: []string{"Офис", "Гибрид", "Удаленка"}},
			},
		},
		{
			Type: "questions",
			BlockID: "experience_skills",
			Title: "Опыт и навыки",
			Items: []QuizItem{
				{ID: "exp_level", Label: "Опыт работы (лет)", UI: "single_select", Required: true, Variants: []string{"0", "1", "2", "3", "4", "5+"}},
				{ID: "exp_details", Label: "Где и кем работал?", UI: "input_text", ShowIf: "exp_level != '0'"},
				{ID: "intern_level", Label: "Стажировки (количество)", UI: "single_select", Required: true, Variants: []string{"0", "1", "2", "3", "4", "5+"}},
				{ID: "intern_details", Label: "Какие стажировки прошел?", UI: "input_text", ShowIf: "intern_level != '0'"},
				{ID: "hard_skills", Label: "Хард-скиллы (выбери до 5)", UI: "multi_select", Required: true, Max: 5, Variants: []string{"Go", "Python", "SQL", "Docker", "Git", "Linux", "Kubernetes", "Redis"}},
				{ID: "achievements", Label: "Профессиональные достижения / соревнования", UI: "single_select", Variants: []string{"0", "1", "2", "3", "4", "5+"}},
				{ID: "soft_skills", Label: "Софт-скиллы (выбери до 5)", UI: "multi_select", Max: 5, Variants: []string{"Командная работа", "Тайм-менеджмент", "Коммуникация", "Лидерство", "Критическое мышление"}},
			},
		},
		{
			Type: "final",
			Title: "Енот наелся!",
			ImageURL: "/static/enot.webp",
		},
	}
}
