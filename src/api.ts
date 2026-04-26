import { mockQuiz } from "./mockQuiz";
import type { QuizResponse, SubmitRequest, SubmitResponse } from "./types";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1";

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 900) {
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

  return response.json();
}

export async function getQuizSafe(): Promise<{ data: QuizResponse; source: "backend" | "mock" }> {
  try {
    return { data: await getQuiz(), source: "backend" };
  } catch {
    return { data: mockQuiz, source: "mock" };
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
