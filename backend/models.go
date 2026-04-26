package main

type Option struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Img  string `json:"img"`
}

type QuizItem struct {
	ID       string   `json:"id"`
	Label    string   `json:"label"`
	UI       string   `json:"ui"`
	Required bool     `json:"required,omitempty"`
	Variants []string `json:"variants,omitempty"`
	Max      int      `json:"max,omitempty"`
	ShowIf   string   `json:"show_if,omitempty"`
}

type QuizStep struct {
	Type     string     `json:"type"`
	Title    string     `json:"title,omitempty"`
	Text     string     `json:"text,omitempty"`
	ImageURL string     `json:"image_url,omitempty"`
	Options  []Option   `json:"options,omitempty"`
	BlockID  string     `json:"block_id,omitempty"`
	Items    []QuizItem `json:"items,omitempty"`
}

type Submission struct {
	EnotID  string                 `json:"enot_id"`
	Answers map[string]interface{} `json:"answers"`
}

type SubmitResponse struct {
	ID          int    `json:"id"`
	CandidateID int    `json:"candidate_id"`
	Score       int    `json:"score"`
	Status      string `json:"status"`
	Message     string `json:"message"`
}

type ScoreDetail struct {
	Label  string `json:"label"`
	Points int    `json:"points"`
	Max    int    `json:"max"`
}

type ScoreAnalysis struct {
	Strengths    []string      `json:"strengths"`
	Weaknesses   []string      `json:"weaknesses"`
	ScoreDetails []ScoreDetail `json:"score_details"`
}

type Candidate struct {
	ID          int                    `json:"id"`
	Name        string                 `json:"name"`
	EnotID      string                 `json:"enot_id"`
	TotalScore  int                    `json:"total_score"`
	Analysis    ScoreAnalysis          `json:"analysis"`
	FullAnswers map[string]interface{} `json:"full_answers"`
}

type CandidateSummary struct {
	ID         int    `json:"id"`
	Name       string `json:"name"`
	EnotID     string `json:"enot_id"`
	TotalScore int    `json:"total_score"`
}
