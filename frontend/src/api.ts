import { mockQuiz } from "./mockQuiz";
import type { CandidateDetails, CandidateSummary, QuizResponse, SubmitRequest, SubmitResponse } from "./types";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1";
const API_ORIGIN = new URL(API_BASE_URL).origin;

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 4000) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function getQuiz(): Promise<QuizResponse> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/quiz`);

  if (!response.ok) {
    throw new Error("Failed to load quiz");
  }

  const quiz = (await response.json()) as QuizResponse;
  return normalizeQuizAssets(quiz);
}

export async function getQuizSafe(): Promise<{ data: QuizResponse; source: "backend" | "mock" }> {
  try {
    return { data: await getQuiz(), source: "backend" };
  } catch {
    return { data: normalizeQuizAssets(mockQuiz), source: "mock" };
  }
}

export async function submitQuiz(payload: SubmitRequest): Promise<SubmitResponse> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }, 1400);

  if (!response.ok) {
    throw new Error("Failed to submit quiz");
  }

  return response.json();
}

export async function getCandidates(): Promise<CandidateSummary[]> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/hr/candidates`);

  if (!response.ok) {
    throw new Error("Failed to load candidates");
  }

  const candidates = (await response.json()) as CandidateSummary[];
  return candidates.map((candidate) => ({
    ...candidate,
    enot_img: toAbsoluteAssetUrl(candidate.enot_img),
  }));
}

export async function getCandidate(id: number): Promise<CandidateDetails> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/hr/candidates/${id}`);

  if (!response.ok) {
    throw new Error("Failed to load candidate");
  }

  const candidate = (await response.json()) as CandidateDetails;
  return {
    ...candidate,
    enot_img: toAbsoluteAssetUrl(candidate.enot_img),
    analysis: {
      strengths: candidate.analysis?.strengths ?? [],
      weaknesses: candidate.analysis?.weaknesses ?? [],
      score_details: candidate.analysis?.score_details ?? [],
    },
    full_answers: candidate.full_answers ?? {},
  };
}

function normalizeQuizAssets(quiz: QuizResponse): QuizResponse {
  return {
    ...quiz,
    steps: quiz.steps.map((step) => {
      if ("image_url" in step) {
        return {
          ...step,
          image_url: toAbsoluteAssetUrl(step.image_url),
        };
      }

      if ("support_image_url" in step) {
        return {
          ...step,
          support_image_url: step.support_image_url ? toAbsoluteAssetUrl(step.support_image_url) : undefined,
        };
      }

      if ("options" in step) {
        return {
          ...step,
          options: step.options.map((option) => ({
            ...option,
            img: toAbsoluteAssetUrl(option.img),
          })),
        };
      }

      return step;
    }),
  };
}

function toAbsoluteAssetUrl(url: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `${API_ORIGIN}${url}`;
}
