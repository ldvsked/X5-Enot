import { useEffect, useState } from "react";
import { API_BASE_URL, getCandidate, getCandidates, getQuizSafe, submitQuiz } from "./api";
import type {
  Answers,
  AvatarSelectionStep,
  CandidateDetails,
  CandidateSummary,
  FinalStep,
  QuestionItem,
  QuestionsStep,
  QuizResponse,
  QuizStep,
  SubmitResponse,
  WelcomeStep,
} from "./types";

type Screen = { kind: "candidate" } | { kind: "hr-list" } | { kind: "hr-detail"; candidateId: number };
type SupportState = { imageUrl?: string } | null;

function shouldShowField(item: QuestionItem, answers: Answers) {
  if (!item.show_if) return true;

  if (item.id === "exp_details") {
    return answers.exp_level !== undefined && answers.exp_level !== "0";
  }

  if (item.id === "intern_details") {
    return answers.intern_level !== undefined && answers.intern_level !== "0";
  }

  return true;
}

function isQuestionsStep(step: QuizStep): step is QuestionsStep {
  return step.type === "questions";
}

function getRequiredItems(step: QuizStep, answers: Answers) {
  if (!isQuestionsStep(step)) return [];
  return step.items.filter((item) => item.required && shouldShowField(item, answers));
}

function isStepComplete(step: QuizStep, answers: Answers, enotId: string) {
  if (step.type === "avatar_selection") return Boolean(enotId);

  return getRequiredItems(step, answers).every((item) => {
    const value = answers[item.id];
    if (Array.isArray(value)) return value.length > 0;
    return typeof value === "string" && value.trim().length > 0;
  });
}

function getScreenFromHash(): Screen {
  const hash = window.location.hash.replace(/^#/, "");

  if (hash === "/hr" || hash === "hr") {
    return { kind: "hr-list" };
  }

  const match = hash.match(/^\/?hr\/candidates\/(\d+)$/);
  if (match) {
    return { kind: "hr-detail", candidateId: Number(match[1]) };
  }

  return { kind: "candidate" };
}

function setHash(nextHash: string) {
  const normalized = nextHash.startsWith("#") ? nextHash : `#${nextHash}`;
  window.location.hash = normalized;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(() => getScreenFromHash());

  useEffect(() => {
    const handleHashChange = () => setScreen(getScreenFromHash());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (screen.kind === "hr-list") {
    return <HrCandidatesPage onOpenCandidate={(candidateId) => setHash(`/hr/candidates/${candidateId}`)} />;
  }

  if (screen.kind === "hr-detail") {
    return <HrCandidateDetailsPage candidateId={screen.candidateId} />;
  }

  return <CandidateQuizPage />;
}

function CandidateQuizPage() {
  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [enotId, setEnotId] = useState("");
  const [submitResult, setSubmitResult] = useState<SubmitResponse | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supportState, setSupportState] = useState<SupportState>(null);

  useEffect(() => {
    getQuizSafe().then(({ data }) => {
      setQuiz(data);
    });
  }, []);

  const steps = quiz?.steps ?? [];
  const currentStep = steps[stepIndex];
  const progress = steps.length > 1 ? Math.round((stepIndex / (steps.length - 1)) * 100) : 0;
  function setAnswer(id: string, value: string | string[]) {
    setAnswers((current) => ({ ...current, [id]: value }));
  }

  function toggleMultiValue(item: QuestionItem, value: string) {
    const currentValue = answers[item.id];
    const current = Array.isArray(currentValue) ? currentValue : [];
    const isSelected = current.includes(value);

    if (isSelected) {
      setAnswer(
        item.id,
        current.filter((entry) => entry !== value),
      );
      return;
    }

    if (current.length >= (item.max ?? 5)) return;

    setAnswer(item.id, [...current, value]);
  }

  async function goNext() {
    if (!currentStep) return;

    if (currentStep.type === "final") {
      await handleSubmit();
      return;
    }

    if (currentStep.type === "questions") {
      setSupportState({
        imageUrl: currentStep.support_image_url,
      });
    }

    window.setTimeout(() => {
      setSupportState(null);
      setStepIndex((current) => Math.min(current + 1, steps.length - 1));
    }, currentStep.type === "questions" ? 1800 : 0);
  }

  function goBack() {
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const result = await submitQuiz({
        enot_id: enotId,
        answers,
      });
      setSubmitResult(result);
    } catch {
      setSubmitResult({
        status: "review",
        message: "Спасибо! Анкета сохранена, HR скоро посмотрит твой профиль.",
      });
      setSubmitError("Бэк пока недоступен, показываем демо-ответ.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!quiz || !currentStep) {
    return (
      <main className="app-shell">
        <section className="quiz-card loading-card">Загружаем путь енота...</section>
      </main>
    );
  }

  const canContinue = isStepComplete(currentStep, answers, enotId);

  return (
    <main className="app-shell">
      <section className={`quiz-card candidate-card ${currentStep.type === "avatar_selection" ? "avatar-step-card" : ""}`}>
        <ProgressRaccoon progress={progress} />

        <div className="step-area">
          {supportState && <SupportTransitionView state={supportState} />}
          {!supportState && currentStep.type === "welcome" && <WelcomeStepView step={currentStep} />}
          {!supportState && currentStep.type === "avatar_selection" && (
            <AvatarStepView step={currentStep} selectedId={enotId} onSelect={setEnotId} />
          )}
          {!supportState && currentStep.type === "questions" && (
            <QuestionsStepView
              step={currentStep}
              answers={answers}
              onTextAnswer={setAnswer}
              onSingleAnswer={setAnswer}
              onMultiToggle={toggleMultiValue}
            />
          )}
          {!supportState && currentStep.type === "final" && (
            <FinalStepView step={currentStep} result={submitResult} error={submitError} />
          )}
        </div>

        <footer className="actions">
          <button
            className="secondary-button"
            type="button"
            onClick={goBack}
            disabled={stepIndex === 0 || isSubmitting || Boolean(supportState)}
          >
            Назад
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={goNext}
            disabled={(!canContinue && currentStep.type !== "final") || isSubmitting || Boolean(submitResult) || Boolean(supportState)}
          >
            {currentStep.type === "final" ? (isSubmitting ? "Отправляем..." : "Завершить") : "Дальше"}
          </button>
        </footer>
      </section>
    </main>
  );
}

function HrCandidatesPage({ onOpenCandidate }: { onOpenCandidate: (candidateId: number) => void }) {
  const [candidates, setCandidates] = useState<CandidateSummary[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCandidates()
      .then((data) => {
        setCandidates(data);
        setError("");
      })
      .catch(() => {
        setError("Не удалось загрузить список кандидатов.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="app-shell">
      <section className="quiz-card hr-card">
        <header className="topbar">
          <div>
            <p className="eyebrow">HR panel</p>
            <h1>Кандидаты после скоринга</h1>
          </div>
        </header>

        {loading && <div className="loading-card">Загружаем кандидатов...</div>}
        {error && !loading && <p className="error-text">{error}</p>}

        {!loading && !error && (
          <div className="candidate-list">
            {candidates.length === 0 && <p>Пока никто не прошел скоринг.</p>}
            {candidates.map((candidate) => (
              <article className="candidate-list-item" key={candidate.id}>
                <div className="candidate-list-main">
                  <img className="candidate-avatar" src={candidate.enot_img} alt={candidate.enot_name} />
                  <div>
                    <h2>{candidate.name}</h2>
                  </div>
                </div>
                <div className="candidate-list-side">
                  <strong>{candidate.total_score} баллов</strong>
                  <a
                    className="primary-button action-link"
                    href={`#/hr/candidates/${candidate.id}`}
                    onClick={() => onOpenCandidate(Number(candidate.id))}
                  >
                    Подробнее
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function HrCandidateDetailsPage({ candidateId }: { candidateId: number }) {
  const [candidate, setCandidate] = useState<CandidateDetails | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getCandidate(candidateId)
      .then((data) => {
        setCandidate(data);
        setError("");
      })
      .catch(() => {
        setError("Не удалось загрузить карточку кандидата.");
      });
  }, [candidateId]);

  return (
    <main className="app-shell">
      <section className="quiz-card hr-card">
        <header className="topbar">
          <div>
            <p className="eyebrow">HR panel</p>
            <h1>Карточка кандидата</h1>
          </div>
        </header>

        {error && <p className="error-text">{error}</p>}
        {!candidate && !error && <div className="loading-card">Загружаем детали...</div>}

        {candidate && (
          <div className="candidate-detail-layout">
            <section className="candidate-hero">
              <img className="candidate-avatar large" src={candidate.enot_img} alt={candidate.enot_name} />
              <div>
                <h2>{candidate.name}</h2>
                <strong className="score-badge">{candidate.total_score} баллов</strong>
              </div>
            </section>

            <section className="detail-grid">
              <div className="detail-panel">
                <h3>Сильные стороны</h3>
                <ul className="simple-list">
                  {candidate.analysis.strengths.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="detail-panel">
                <h3>Зоны внимания</h3>
                <ul className="simple-list">
                  {candidate.analysis.weaknesses.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="detail-panel">
              <h3>Разбор скоринга</h3>
              <div className="score-breakdown">
                {candidate.analysis.score_details.map((detail) => (
                  <div className="score-row" key={detail.label}>
                    <span>{detail.label}</span>
                    <strong>
                      {detail.points} / {detail.max}
                    </strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="detail-panel">
              <h3>Ответы кандидата</h3>
              <div className="answers-grid">
                {Object.entries(candidate.full_answers).map(([key, value]) => (
                  <div className="answer-row" key={key}>
                    <span>{key}</span>
                    <strong>{Array.isArray(value) ? value.join(", ") : value}</strong>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

function ProgressRaccoon({ progress }: { progress: number }) {
  const runnerImage = `${new URL(API_BASE_URL).origin}/static/enot.webp`;

  return (
    <div className="progress-wrap" aria-label={`Прогресс ${progress}%`}>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
        <img className="raccoon-runner" style={{ left: `${progress}%` }} src={runnerImage} alt="" aria-hidden="true" />
      </div>
    </div>
  );
}

function SupportTransitionView({ state }: { state: NonNullable<SupportState> }) {
  return (
    <div className="support-transition">
      {state.imageUrl && <ImageWithFallback src={state.imageUrl} alt="" className="support-transition-image" />}
    </div>
  );
}

function ImageWithFallback({ src, alt, className = "hero-image" }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`image-fallback ${className}`} role="img" aria-label={alt}>
        ENOT
      </div>
    );
  }

  return <img className={className} src={src} alt={alt} onError={() => setFailed(true)} />;
}

function WelcomeStepView({ step }: { step: WelcomeStep }) {
  return (
    <div className="welcome-layout">
      <ImageWithFallback src={step.image_url} alt={step.title} />
      <div>
        <h1 className="welcome-title">{step.title}</h1>
        <p>{step.text}</p>
      </div>
    </div>
  );
}

function AvatarStepView({
  step,
  selectedId,
  onSelect,
}: {
  step: AvatarSelectionStep;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <h2>{step.title}</h2>
      <div className="avatar-grid">
        {step.options.map((option) => (
          <button
            className={`avatar-card ${selectedId === option.id ? "selected" : ""}`}
            key={option.id}
            type="button"
            aria-label={option.name}
            onClick={() => onSelect(option.id)}
          >
            <ImageWithFallback src={option.img} alt={option.name} />
            <strong className="avatar-label">{option.name}</strong>
          </button>
        ))}
      </div>
    </div>
  );
}

function QuestionsStepView({
  step,
  answers,
  onTextAnswer,
  onSingleAnswer,
  onMultiToggle,
}: {
  step: QuestionsStep;
  answers: Answers;
  onTextAnswer: (id: string, value: string) => void;
  onSingleAnswer: (id: string, value: string) => void;
  onMultiToggle: (item: QuestionItem, value: string) => void;
}) {
  return (
    <div>
      <p className="block-id">{step.block_id}</p>
      <h2>{step.title}</h2>
      <div className="fields">
        {step.items
          .filter((item) => shouldShowField(item, answers))
          .map((item) => (
            <FieldView
              key={item.id}
              item={item}
              value={answers[item.id]}
              onTextAnswer={onTextAnswer}
              onSingleAnswer={onSingleAnswer}
              onMultiToggle={onMultiToggle}
            />
          ))}
      </div>
    </div>
  );
}

function FieldView({
  item,
  value,
  onTextAnswer,
  onSingleAnswer,
  onMultiToggle,
}: {
  item: QuestionItem;
  value: string | string[] | undefined;
  onTextAnswer: (id: string, value: string) => void;
  onSingleAnswer: (id: string, value: string) => void;
  onMultiToggle: (item: QuestionItem, value: string) => void;
}) {
  const selectedValues = Array.isArray(value) ? value : [];

  return (
    <div className="field">
      <label htmlFor={item.id}>
        {item.label}
        {item.required && <span className="required">*</span>}
      </label>

      {item.ui === "input_text" && (
        <input
          id={item.id}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onTextAnswer(item.id, event.target.value)}
          placeholder="Введите ответ"
        />
      )}

      {item.ui === "single_select" && (
        <div className="choice-row">
          {(item.variants ?? []).map((variant) => (
            <button
              className={`choice-button ${value === variant ? "selected" : ""}`}
              key={variant}
              type="button"
              onClick={() => onSingleAnswer(item.id, variant)}
            >
              {variant}
            </button>
          ))}
        </div>
      )}

      {item.ui === "multi_select" && (
        <>
          <div className="choice-row">
            {(item.variants ?? []).map((variant) => {
              const selected = selectedValues.includes(variant);
              const locked = !selected && selectedValues.length >= (item.max ?? 5);
              return (
                <button
                  className={`choice-button ${selected ? "selected" : ""}`}
                  key={variant}
                  type="button"
                  disabled={locked}
                  onClick={() => onMultiToggle(item, variant)}
                >
                  {variant}
                </button>
              );
            })}
          </div>
          <p className="limit-text">
            Выбрано {selectedValues.length} из {item.max ?? 5}
          </p>
        </>
      )}
    </div>
  );
}

function FinalStepView({
  step,
  result,
  error,
}: {
  step: FinalStep;
  result: SubmitResponse | null;
  error: string;
}) {
  return (
    <div className="final-layout">
      <ImageWithFallback src={step.image_url} alt={step.title} />
      <div>
        <h2>Спасибо!</h2>
        <p>Ты молодец! Спасибо за заполнение анкеты, мы вернемся позже с фидбэком.</p>
        <p>Вперед еноты! Вперед X5!</p>
        {result && <div className="result-box" />}
        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  );
}
