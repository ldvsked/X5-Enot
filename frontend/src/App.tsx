import { useEffect, useMemo, useState } from "react";
import { getCandidate, getCandidates, getQuizSafe, submitQuiz } from "./api";
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

const supportingMessages = [
  "Енот уже несет анкету в сторону оффера.",
  "Еще чуть-чуть, и HR увидит самое важное.",
  "Супер, этот блок стал короче обычной формы.",
];

type Screen = { kind: "candidate" } | { kind: "hr-list" } | { kind: "hr-detail"; candidateId: number };

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

  if (hash === "/hr") {
    return { kind: "hr-list" };
  }

  const match = hash.match(/^\/hr\/candidates\/(\d+)$/);
  if (match) {
    return { kind: "hr-detail", candidateId: Number(match[1]) };
  }

  return { kind: "candidate" };
}

function setHash(nextHash: string) {
  window.location.hash = nextHash;
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
    return <HrCandidateDetailsPage candidateId={screen.candidateId} onBack={() => setHash("/hr")} />;
  }

  return <CandidateQuizPage onOpenHr={() => setHash("/hr")} />;
}

function CandidateQuizPage({ onOpenHr }: { onOpenHr: () => void }) {
  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [source, setSource] = useState<"backend" | "mock">("mock");
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [enotId, setEnotId] = useState("");
  const [submitResult, setSubmitResult] = useState<SubmitResponse | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  useEffect(() => {
    getQuizSafe().then(({ data, source: quizSource }) => {
      setQuiz(data);
      setSource(quizSource);
    });
  }, []);

  const steps = quiz?.steps ?? [];
  const currentStep = steps[stepIndex];
  const progress = steps.length > 1 ? Math.round((stepIndex / (steps.length - 1)) * 100) : 0;
  const selectedEnot = useMemo(() => {
    const avatarStep = steps.find((step): step is AvatarSelectionStep => step.type === "avatar_selection");
    return avatarStep?.options.find((option) => option.id === enotId);
  }, [enotId, steps]);

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

    setShowSupport(true);
    window.setTimeout(() => {
      setShowSupport(false);
      setStepIndex((current) => Math.min(current + 1, steps.length - 1));
    }, currentStep.type === "questions" ? 650 : 0);
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
      <section className={`quiz-card ${currentStep.type === "avatar_selection" ? "avatar-step-card" : ""}`}>
        <header className="topbar">
          <div>
            <p className="eyebrow">X5 First Touch</p>
            <h1>{currentStep.type === "welcome" ? currentStep.title : quiz.steps[0]?.title}</h1>
          </div>
          <div className="topbar-actions">
            <button className="nav-link-button" type="button" onClick={onOpenHr}>
              HR-панель
            </button>
            <span className={`backend-pill ${source}`}>{source === "backend" ? "backend online" : "mock mode"}</span>
          </div>
        </header>

        <ProgressRaccoon progress={progress} selectedName={selectedEnot?.name} />

        <div className="step-area">
          {currentStep.type === "welcome" && <WelcomeStepView step={currentStep} />}
          {currentStep.type === "avatar_selection" && (
            <AvatarStepView step={currentStep} selectedId={enotId} onSelect={setEnotId} />
          )}
          {currentStep.type === "questions" && (
            <QuestionsStepView
              step={currentStep}
              answers={answers}
              onTextAnswer={setAnswer}
              onSingleAnswer={setAnswer}
              onMultiToggle={toggleMultiValue}
            />
          )}
          {currentStep.type === "final" && (
            <FinalStepView
              step={currentStep}
              result={submitResult}
              error={submitError}
              selectedName={selectedEnot?.name}
            />
          )}
        </div>

        {showSupport && (
          <div className="support-popover">
            {supportingMessages[stepIndex % supportingMessages.length]}
          </div>
        )}

        <footer className="actions">
          <button className="secondary-button" type="button" onClick={goBack} disabled={stepIndex === 0 || isSubmitting}>
            Назад
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={goNext}
            disabled={(!canContinue && currentStep.type !== "final") || isSubmitting || Boolean(submitResult)}
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
          <button className="nav-link-button" type="button" onClick={() => setHash("/")}>
            К анкете
          </button>
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
                    <p>{candidate.enot_name}</p>
                  </div>
                </div>
                <div className="candidate-list-side">
                  <strong>{candidate.total_score} баллов</strong>
                  <button className="primary-button" type="button" onClick={() => onOpenCandidate(candidate.id)}>
                    Подробнее
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function HrCandidateDetailsPage({ candidateId, onBack }: { candidateId: number; onBack: () => void }) {
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
          <button className="secondary-button" type="button" onClick={onBack}>
            Назад к списку
          </button>
        </header>

        {error && <p className="error-text">{error}</p>}
        {!candidate && !error && <div className="loading-card">Загружаем детали...</div>}

        {candidate && (
          <div className="candidate-detail-layout">
            <section className="candidate-hero">
              <img className="candidate-avatar large" src={candidate.enot_img} alt={candidate.enot_name} />
              <div>
                <h2>{candidate.name}</h2>
                <p>{candidate.enot_name}</p>
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

function ProgressRaccoon({ progress, selectedName }: { progress: number; selectedName?: string }) {
  return (
    <div className="progress-wrap" aria-label={`Прогресс ${progress}%`}>
      <div className="progress-meta">
        <span>{selectedName ?? "Енот выбирает маршрут"}</span>
        <strong>{progress}%</strong>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
        <div className="raccoon-runner" style={{ left: `${progress}%` }}>
          <span>ENOT</span>
        </div>
      </div>
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
        <h2>{step.title}</h2>
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
      {step.support_image_url && (
        <div className="support-card">
          <ImageWithFallback src={step.support_image_url} alt={step.title} className="support-image" />
          <p>Енот рядом. Этот блок уже почти закрыт.</p>
        </div>
      )}
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
  selectedName,
}: {
  step: FinalStep;
  result: SubmitResponse | null;
  error: string;
  selectedName?: string;
}) {
  return (
    <div className="final-layout">
      <ImageWithFallback src={step.image_url} alt={step.title} />
      <div>
        <h2>{step.title}</h2>
        <p>{selectedName ? `${selectedName} добрался до финиша.` : "Анкета готова к отправке."}</p>
        {result && (
          <div className="result-box">
            <strong>{result.message ?? "Спасибо! Анкета отправлена."}</strong>
          </div>
        )}
        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  );
}
