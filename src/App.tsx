import { useEffect, useMemo, useState } from "react";
import { getQuizSafe, submitQuiz } from "./api";
import type {
  Answers,
  AvatarSelectionStep,
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

export default function App() {
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
        message: "Анкета сохранена в демо-режиме. HR свяжется с тобой в течение пары дней.",
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
          <span className={`backend-pill ${source}`}>{source === "backend" ? "backend online" : "mock mode"}</span>
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

function ImageWithFallback({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="image-fallback" role="img" aria-label={alt}>
        ENOT
      </div>
    );
  }

  return <img className="hero-image" src={src} alt={alt} onError={() => setFailed(true)} />;
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
            <strong>{result.message ?? "Анкета получена. HR свяжется с тобой в течение пары дней."}</strong>
            {typeof result.score === "number" && <span>Скоринг: {result.score}</span>}
            {result.status && <span>Статус: {result.status}</span>}
          </div>
        )}
        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  );
}
