package main

func GetQuizSteps() []QuizStep {
	return []QuizStep{
		{
			Type: "welcome",
			Title: "Стажировка в X5",
			Text: "Пройди путь енота до оффера!",
			ImageURL: "/static/welcome.png",
		},
		{
			Type: "avatar_selection",
			Title: "Выбери аватара",
			Options: []Option{
				{ID: "coder", Name: "Енот-кодер", Img: "/static/e1.png"},
				{ID: "manager", Name: "Енот-менеджер", Img: "/static/e2.png"},
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
			},
		},
		{
			Type: "questions",
			BlockID: "experience_skills",
			Title: "Опыт и навыки",
			Items: []QuizItem{
				{ID: "exp_level", Label: "Опыт работы", UI: "single_select", Variants: []string{"0", "1", "2", "3", "4", "5+"}},
				{ID: "intern_level", Label: "Стажировки", UI: "single_select", Variants: []string{"0", "1", "2", "3", "4", "5+"}},
				{ID: "hard_skills", Label: "Хард-скиллы (до 5)", UI: "multi_select", Max: 5, Variants: []string{"Go", "Python", "SQL", "Docker", "Git", "Linux", "Kubernetes", "Redis"}},
			},
		},
	}
}