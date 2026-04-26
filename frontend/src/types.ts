export type QuizResponse = {
  steps: QuizStep[];
};

export type QuizStep =
  | WelcomeStep
  | AvatarSelectionStep
  | QuestionsStep
  | FinalStep;

export type WelcomeStep = {
  type: "welcome";
  title: string;
  image_url: string;
  text: string;
};

export type AvatarSelectionStep = {
  type: "avatar_selection";
  title: string;
  options: AvatarOption[];
};

export type AvatarOption = {
  id: string;
  name: string;
  img: string;
};

export type QuestionsStep = {
  type: "questions";
  block_id: string;
  title: string;
  items: QuestionItem[];
};

export type QuestionItem = {
  id: string;
  label: string;
  ui: "input_text" | "single_select" | "multi_select";
  required?: boolean;
  variants?: string[];
  show_if?: string;
  max?: number;
};

export type FinalStep = {
  type: "final";
  title: string;
  image_url: string;
};

export type Answers = Record<string, string | string[]>;

export type SubmitRequest = {
  enot_id: string;
  answers: Answers;
};

export type SubmitResponse = {
  id?: number;
  candidate_id?: number;
  score?: number;
  status?: "top" | "review" | "delayed_reject";
  message?: string;
};
