import {
  useEffect,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Check,
  ChevronLeft,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/Components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/Components/ui/field";
import { Input } from "@/Components/ui/input";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import { extractFieldErrors, type FieldErrors } from "@/lib/api-errors";
import {
  courseService,
  lessonQuestionService,
  lessonService,
} from "@/services/courses";
import { useAuth } from "@/contexts/AuthContext";
import type {
  Course,
  CreateQuestionInput,
  Lesson,
  LessonQuestion,
  QuestionOptionInput,
  UpdateQuestionInput,
} from "@/types/course";

type DraftMode = "create" | { editingId: number };

interface DraftOption {
  id?: number;
  option_text: string;
  is_correct: boolean;
}

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 10;

function blankOptions(): DraftOption[] {
  return [
    { option_text: "", is_correct: true },
    { option_text: "", is_correct: false },
  ];
}

function parseNonNegativeInt(value: string, min = 0): number {
  if (value.trim() === "") return min;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min ? parsed : min;
}

export default function LessonQuiz() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams<{
    id: string;
    sectionId: string;
    lessonId: string;
  }>();
  const courseId = Number(params.id);
  const sectionId = Number(params.sectionId);
  const lessonId = Number(params.lessonId);
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [questions, setQuestions] = useState<LessonQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState<DraftMode | null>(null);
  const [draftText, setDraftText] = useState("");
  const [draftPoints, setDraftPoints] = useState("1");
  const [draftOptions, setDraftOptions] = useState<DraftOption[]>(
    blankOptions()
  );
  const [draftErrors, setDraftErrors] = useState<FieldErrors>({});
  const [draftFormError, setDraftFormError] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const [busyId, setBusyId] = useState<number | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  useEffect(() => {
    if (
      !Number.isFinite(courseId) ||
      !Number.isFinite(sectionId) ||
      !Number.isFinite(lessonId)
    ) {
      setError(t("questions.notFound"));
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    Promise.all([
      courseService.getById(courseId),
      lessonService.getById(courseId, sectionId, lessonId),
      lessonQuestionService.list(courseId, sectionId, lessonId),
    ])
      .then(([courseData, lessonData, questionsData]) => {
        if (!active) return;
        setCourse(courseData);
        setLesson(lessonData);
        setQuestions(
          [...questionsData].sort((a, b) => a.sort_order - b.sort_order)
        );
      })
      .catch(err => {
        if (!active) return;
        const message =
          err instanceof ApiError ? err.message : t("questions.loadError");
        setError(message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [courseId, sectionId, lessonId, t]);

  const currentUserId = user?.id ?? null;
  const ownerAuthor = course?.authors?.find(a => a.is_owner);
  const canManage =
    currentUserId !== null &&
    (course?.created_by === currentUserId ||
      ownerAuthor?.user_id === currentUserId);

  const resetDraft = () => {
    setDraft(null);
    setDraftText("");
    setDraftPoints("1");
    setDraftOptions(blankOptions());
    setDraftErrors({});
    setDraftFormError(null);
  };

  const startCreate = () => {
    resetDraft();
    setDraft("create");
  };

  const startEdit = (question: LessonQuestion) => {
    setDraft({ editingId: question.id });
    setDraftText(question.question_text);
    setDraftPoints(String(question.points));
    setDraftOptions(
      [...question.options]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(opt => ({
          id: opt.id,
          option_text: opt.option_text,
          is_correct: opt.is_correct,
        }))
    );
    setDraftErrors({});
    setDraftFormError(null);
  };

  const updateOption = (idx: number, patch: Partial<DraftOption>) => {
    setDraftOptions(prev =>
      prev.map((opt, i) => (i === idx ? { ...opt, ...patch } : opt))
    );
  };

  const setCorrectOption = (idx: number) => {
    setDraftOptions(prev =>
      prev.map((opt, i) => ({ ...opt, is_correct: i === idx }))
    );
  };

  const addOption = () => {
    if (draftOptions.length >= MAX_OPTIONS) return;
    setDraftOptions(prev => [
      ...prev,
      { option_text: "", is_correct: false },
    ]);
  };

  const removeOption = (idx: number) => {
    setDraftOptions(prev => {
      if (prev.length <= MIN_OPTIONS) return prev;
      const removingCorrect = prev[idx].is_correct;
      const next = prev.filter((_, i) => i !== idx);
      if (removingCorrect && next.length > 0) {
        next[0] = { ...next[0], is_correct: true };
      }
      return next;
    });
  };

  const validateDraft = (): string | null => {
    if (!draftText.trim()) return t("questions.errorTextRequired");
    if (draftOptions.length < MIN_OPTIONS)
      return t("questions.errorMinOptions", { min: MIN_OPTIONS });
    if (draftOptions.length > MAX_OPTIONS)
      return t("questions.errorMaxOptions", { max: MAX_OPTIONS });
    const correctCount = draftOptions.filter(o => o.is_correct).length;
    if (correctCount !== 1) return t("questions.errorOneCorrect");
    if (draftOptions.some(o => !o.option_text.trim()))
      return t("questions.errorOptionTextRequired");
    return null;
  };

  const buildPayload = (): CreateQuestionInput => {
    const options: QuestionOptionInput[] = draftOptions.map((opt, i) => ({
      ...(opt.id !== undefined ? { id: opt.id } : {}),
      option_text: opt.option_text.trim(),
      is_correct: opt.is_correct,
      sort_order: i + 1,
    }));
    return {
      question_text: draftText.trim(),
      question_type: "single_choice",
      points: parseNonNegativeInt(draftPoints, 1) || 1,
      options,
    };
  };

  const handleSaveDraft = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft) return;

    setDraftErrors({});
    setDraftFormError(null);

    const validationError = validateDraft();
    if (validationError) {
      setDraftFormError(validationError);
      return;
    }

    setIsSavingDraft(true);
    try {
      if (draft === "create") {
        const created = await lessonQuestionService.create(
          courseId,
          sectionId,
          lessonId,
          buildPayload()
        );
        setQuestions(prev =>
          [...prev, created].sort((a, b) => a.sort_order - b.sort_order)
        );
      } else {
        const payload: UpdateQuestionInput = buildPayload();
        const updated = await lessonQuestionService.update(
          courseId,
          sectionId,
          lessonId,
          draft.editingId,
          payload
        );
        setQuestions(prev =>
          prev
            .map(q => (q.id === updated.id ? updated : q))
            .sort((a, b) => a.sort_order - b.sort_order)
        );
      }
      resetDraft();
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setDraftErrors(extractFieldErrors(err));
        setDraftFormError(err.message);
      } else {
        const message =
          err instanceof ApiError ? err.message : t("questions.saveError");
        setDraftFormError(message);
      }
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleDelete = async (question: LessonQuestion) => {
    if (!confirm(t("questions.confirmDelete"))) return;
    setBusyId(question.id);
    try {
      await lessonQuestionService.remove(
        courseId,
        sectionId,
        lessonId,
        question.id
      );
      setQuestions(prev => prev.filter(q => q.id !== question.id));
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : t("questions.deleteError");
      setError(message);
    } finally {
      setBusyId(null);
    }
  };

  const persistOrder = async (next: LessonQuestion[]) => {
    const previous = questions;
    setQuestions(next);
    try {
      await lessonQuestionService.reorder(
        courseId,
        sectionId,
        lessonId,
        next.map((q, i) => ({ id: q.id, sort_order: i + 1 }))
      );
    } catch (err) {
      setQuestions(previous);
      const message =
        err instanceof ApiError ? err.message : t("questions.reorderError");
      setError(message);
    }
  };

  const handleDragStart = (questionId: number) => (event: DragEvent) => {
    setDraggingId(questionId);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (targetId: number) => (event: DragEvent) => {
    event.preventDefault();
    if (draggingId === null || draggingId === targetId) {
      setDraggingId(null);
      return;
    }
    const fromIdx = questions.findIndex(q => q.id === draggingId);
    const toIdx = questions.findIndex(q => q.id === targetId);
    if (fromIdx === -1 || toIdx === -1) {
      setDraggingId(null);
      return;
    }
    const next = [...questions];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    const reindexed = next.map((q, i) => ({ ...q, sort_order: i + 1 }));
    setDraggingId(null);
    void persistOrder(reindexed);
  };

  const isQuizLesson = lesson?.type === "quiz";

  return (
    <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(`/dashboard/courses/${courseId}/sections`)}
      >
        <ChevronLeft className="size-4" />
        {t("questions.back")}
      </Button>

      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {t("questions.title")}
        </h1>
        <p className="text-muted-foreground">
          {lesson?.title ?? course?.title ?? t("questions.description")}
        </p>
      </div>

      {!isLoading && lesson && !isQuizLesson && (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">
              {t("questions.notQuizLesson")}
            </p>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <p className="text-muted-foreground">{t("questions.loading")}</p>
      )}

      {error && !isLoading && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {!isLoading && !error && questions.length === 0 && draft !== "create" && (
        <p className="text-muted-foreground">{t("questions.empty")}</p>
      )}

      {!isLoading && !error && (
        <ul className="flex flex-col gap-3">
          {questions.map(question => {
            const isEditing =
              typeof draft === "object" && draft?.editingId === question.id;
            return (
              <li
                key={question.id}
                draggable={canManage && !isEditing}
                onDragStart={handleDragStart(question.id)}
                onDragOver={handleDragOver}
                onDrop={handleDrop(question.id)}
                className={cn(draggingId === question.id && "opacity-50")}
              >
                <Card>
                  {isEditing ? (
                    <form onSubmit={handleSaveDraft}>
                      <CardContent className="pt-4">
                        <QuestionDraftFields
                          text={draftText}
                          points={draftPoints}
                          options={draftOptions}
                          onTextChange={setDraftText}
                          onPointsChange={setDraftPoints}
                          onOptionChange={updateOption}
                          onSetCorrect={setCorrectOption}
                          onAddOption={addOption}
                          onRemoveOption={removeOption}
                          fieldErrors={draftErrors}
                        />
                        {draftFormError && (
                          <p className="mt-2 text-sm text-destructive">
                            {draftFormError}
                          </p>
                        )}
                        <div className="mt-4 flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={resetDraft}
                            disabled={isSavingDraft}
                          >
                            {t("questions.cancel")}
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            disabled={isSavingDraft}
                          >
                            {isSavingDraft
                              ? t("questions.saving")
                              : t("questions.save")}
                          </Button>
                        </div>
                      </CardContent>
                    </form>
                  ) : (
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        {canManage && (
                          <span
                            className="mt-1 cursor-grab text-muted-foreground active:cursor-grabbing"
                            title={t("questions.dragHandle")}
                          >
                            <GripVertical className="size-4" />
                          </span>
                        )}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-medium text-muted-foreground">
                              {question.sort_order}.
                            </span>
                            <div className="flex-1">
                              <CardTitle className="text-base">
                                {question.question_text}
                              </CardTitle>
                              <CardDescription>
                                {question.points}{" "}
                                {t("questions.pointsLabel")}
                              </CardDescription>
                            </div>
                          </div>
                          <ul className="flex flex-col gap-1.5 pl-6">
                            {[...question.options]
                              .sort((a, b) => a.sort_order - b.sort_order)
                              .map(option => (
                                <li
                                  key={option.id}
                                  className={cn(
                                    "flex items-center gap-2 rounded-md px-2 py-1 text-sm",
                                    option.is_correct &&
                                      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "inline-flex size-4 items-center justify-center rounded-full border",
                                      option.is_correct
                                        ? "border-emerald-500 bg-emerald-500 text-white"
                                        : "border-input"
                                    )}
                                  >
                                    {option.is_correct && (
                                      <Check className="size-3" />
                                    )}
                                  </span>
                                  <span className="flex-1">
                                    {option.option_text}
                                  </span>
                                  {option.is_correct && (
                                    <span className="text-xs font-medium">
                                      {t("questions.correctBadge")}
                                    </span>
                                  )}
                                </li>
                              ))}
                          </ul>
                        </div>
                        {canManage && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title={t("questions.edit")}
                              onClick={() => startEdit(question)}
                              disabled={busyId === question.id}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title={t("questions.delete")}
                              onClick={() => handleDelete(question)}
                              disabled={busyId === question.id}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                  )}
                </Card>
              </li>
            );
          })}

          {draft === "create" && (
            <li>
              <Card>
                <form onSubmit={handleSaveDraft}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                      {t("questions.addTitle")}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={resetDraft}
                        disabled={isSavingDraft}
                      >
                        <X className="size-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <QuestionDraftFields
                      text={draftText}
                      points={draftPoints}
                      options={draftOptions}
                      onTextChange={setDraftText}
                      onPointsChange={setDraftPoints}
                      onOptionChange={updateOption}
                      onSetCorrect={setCorrectOption}
                      onAddOption={addOption}
                      onRemoveOption={removeOption}
                      fieldErrors={draftErrors}
                    />
                    {draftFormError && (
                      <p className="mt-2 text-sm text-destructive">
                        {draftFormError}
                      </p>
                    )}
                    <div className="mt-4 flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={resetDraft}
                        disabled={isSavingDraft}
                      >
                        {t("questions.cancel")}
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isSavingDraft}
                      >
                        {isSavingDraft
                          ? t("questions.saving")
                          : t("questions.create")}
                      </Button>
                    </div>
                  </CardContent>
                </form>
              </Card>
            </li>
          )}
        </ul>
      )}

      {canManage && draft === null && !isLoading && !error && (
        <Button variant="outline" onClick={startCreate}>
          <Plus className="size-4" />
          {t("questions.add")}
        </Button>
      )}
    </div>
  );
}

interface QuestionDraftFieldsProps {
  text: string;
  points: string;
  options: DraftOption[];
  onTextChange: (value: string) => void;
  onPointsChange: (value: string) => void;
  onOptionChange: (idx: number, patch: Partial<DraftOption>) => void;
  onSetCorrect: (idx: number) => void;
  onAddOption: () => void;
  onRemoveOption: (idx: number) => void;
  fieldErrors: FieldErrors;
}

function QuestionDraftFields({
  text,
  points,
  options,
  onTextChange,
  onPointsChange,
  onOptionChange,
  onSetCorrect,
  onAddOption,
  onRemoveOption,
  fieldErrors,
}: QuestionDraftFieldsProps) {
  const { t } = useTranslation();

  return (
    <FieldGroup>
      <Field data-invalid={fieldErrors.question_text ? true : undefined}>
        <FieldLabel htmlFor="question-text">
          {t("questions.fieldText")}
        </FieldLabel>
        <textarea
          id="question-text"
          value={text}
          onChange={e => onTextChange(e.target.value)}
          rows={3}
          maxLength={1000}
          required
          className={cn(
            "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "dark:bg-input/30",
            fieldErrors.question_text &&
              "border-destructive ring-3 ring-destructive/20"
          )}
          aria-invalid={Boolean(fieldErrors.question_text)}
        />
        <FieldError
          errors={fieldErrors.question_text?.map(message => ({ message }))}
        />
      </Field>

      <Field data-invalid={fieldErrors.points ? true : undefined}>
        <FieldLabel htmlFor="question-points">
          {t("questions.fieldPoints")}
        </FieldLabel>
        <Input
          id="question-points"
          type="number"
          min={1}
          inputMode="numeric"
          value={points}
          onChange={e => onPointsChange(e.target.value)}
          placeholder="1"
          aria-invalid={Boolean(fieldErrors.points)}
        />
        <FieldError
          errors={fieldErrors.points?.map(message => ({ message }))}
        />
      </Field>

      <Field data-invalid={fieldErrors.options ? true : undefined}>
        <FieldLabel>{t("questions.optionsTitle")}</FieldLabel>
        <FieldDescription>{t("questions.optionsHint")}</FieldDescription>
        <ul className="flex flex-col gap-2">
          {options.map((opt, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <input
                type="radio"
                name="question-correct-option"
                checked={opt.is_correct}
                onChange={() => onSetCorrect(idx)}
                title={t("questions.markCorrect")}
                className="size-4"
              />
              <Input
                type="text"
                value={opt.option_text}
                onChange={e =>
                  onOptionChange(idx, { option_text: e.target.value })
                }
                maxLength={500}
                placeholder={t("questions.optionPlaceholder", {
                  index: idx + 1,
                })}
                aria-invalid={Boolean(fieldErrors[`options.${idx}.option_text`])}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title={t("questions.removeOption")}
                onClick={() => onRemoveOption(idx)}
                disabled={options.length <= MIN_OPTIONS}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddOption}
          disabled={options.length >= MAX_OPTIONS}
          className="mt-2 self-start"
        >
          <Plus className="size-4" />
          {t("questions.addOption")}
        </Button>
        <FieldError
          errors={fieldErrors.options?.map(message => ({ message }))}
        />
      </Field>
    </FieldGroup>
  );
}
