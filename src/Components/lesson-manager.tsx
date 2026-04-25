import {
  useEffect,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";
import { useTranslation } from "react-i18next";
import {
  Eye,
  EyeOff,
  FileText,
  GripVertical,
  HelpCircle,
  Pencil,
  Plus,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { Button } from "@/Components/ui/button";
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
import { lessonService } from "@/services/courses";
import type {
  CreateLessonInput,
  Lesson,
  LessonType,
  UpdateLessonInput,
} from "@/types/course";

type DraftMode = "create" | { editingId: number };

interface LessonManagerProps {
  courseId: number;
  sectionId: number;
  canManage: boolean;
}

const LESSON_TYPES: { value: LessonType; icon: typeof Video }[] = [
  { value: "video", icon: Video },
  { value: "text", icon: FileText },
  { value: "quiz", icon: HelpCircle },
];

function parseNonNegativeInt(value: string): number {
  if (value.trim() === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function lessonTypeIcon(type: LessonType) {
  if (type === "video") return Video;
  if (type === "text") return FileText;
  return HelpCircle;
}

export function LessonManager({
  courseId,
  sectionId,
  canManage,
}: LessonManagerProps) {
  const { t } = useTranslation();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState<DraftMode | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftType, setDraftType] = useState<LessonType>("video");
  const [draftVideoUrl, setDraftVideoUrl] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftDuration, setDraftDuration] = useState("");
  const [draftIsPreview, setDraftIsPreview] = useState(false);
  const [draftErrors, setDraftErrors] = useState<FieldErrors>({});
  const [draftFormError, setDraftFormError] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const [busyId, setBusyId] = useState<number | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    lessonService
      .list(courseId, sectionId)
      .then(data => {
        if (!active) return;
        setLessons([...data].sort((a, b) => a.sort_order - b.sort_order));
      })
      .catch(err => {
        if (!active) return;
        const message =
          err instanceof ApiError ? err.message : t("lessons.loadError");
        setError(message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [courseId, sectionId, t]);

  const resetDraft = () => {
    setDraft(null);
    setDraftTitle("");
    setDraftType("video");
    setDraftVideoUrl("");
    setDraftContent("");
    setDraftDuration("");
    setDraftIsPreview(false);
    setDraftErrors({});
    setDraftFormError(null);
  };

  const startCreate = () => {
    resetDraft();
    setDraft("create");
  };

  const startEdit = (lesson: Lesson) => {
    setDraft({ editingId: lesson.id });
    setDraftTitle(lesson.title);
    setDraftType(lesson.type);
    setDraftVideoUrl(lesson.video_url ?? "");
    setDraftContent(lesson.content ?? "");
    setDraftDuration(String(lesson.duration_minutes));
    setDraftIsPreview(lesson.is_preview);
    setDraftErrors({});
    setDraftFormError(null);
  };

  const buildPayload = (): CreateLessonInput => {
    const base: CreateLessonInput = {
      title: draftTitle.trim(),
      type: draftType,
      duration_minutes: parseNonNegativeInt(draftDuration),
      is_preview: draftIsPreview,
    };
    if (draftType === "video") {
      base.video_url = draftVideoUrl.trim();
      base.content = null;
    } else if (draftType === "text") {
      base.content = draftContent;
      base.video_url = null;
    } else {
      base.content = null;
      base.video_url = null;
    }
    return base;
  };

  const handleSaveDraft = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft) return;

    setDraftErrors({});
    setDraftFormError(null);
    setIsSavingDraft(true);

    try {
      if (draft === "create") {
        const payload = buildPayload();
        const created = await lessonService.create(
          courseId,
          sectionId,
          payload
        );
        setLessons(prev =>
          [...prev, created].sort((a, b) => a.sort_order - b.sort_order)
        );
      } else {
        const payload: UpdateLessonInput = buildPayload();
        const updated = await lessonService.update(
          courseId,
          sectionId,
          draft.editingId,
          payload
        );
        setLessons(prev =>
          prev
            .map(l => (l.id === updated.id ? updated : l))
            .sort((a, b) => a.sort_order - b.sort_order)
        );
      }
      resetDraft();
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setDraftErrors(extractFieldErrors(err));
      } else {
        const message =
          err instanceof ApiError ? err.message : t("lessons.saveError");
        setDraftFormError(message);
      }
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleDelete = async (lesson: Lesson) => {
    if (!confirm(t("lessons.confirmDelete"))) return;
    setBusyId(lesson.id);
    try {
      await lessonService.remove(courseId, sectionId, lesson.id);
      setLessons(prev => prev.filter(l => l.id !== lesson.id));
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : t("lessons.deleteError");
      setError(message);
    } finally {
      setBusyId(null);
    }
  };

  const togglePreview = async (lesson: Lesson) => {
    setBusyId(lesson.id);
    try {
      const updated = await lessonService.update(
        courseId,
        sectionId,
        lesson.id,
        { is_preview: !lesson.is_preview }
      );
      setLessons(prev => prev.map(l => (l.id === updated.id ? updated : l)));
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : t("lessons.saveError");
      setError(message);
    } finally {
      setBusyId(null);
    }
  };

  const persistOrder = async (next: Lesson[]) => {
    const previous = lessons;
    setLessons(next);
    try {
      await lessonService.reorder(
        courseId,
        sectionId,
        next.map((l, i) => ({ id: l.id, sort_order: i + 1 }))
      );
    } catch (err) {
      setLessons(previous);
      const message =
        err instanceof ApiError ? err.message : t("lessons.reorderError");
      setError(message);
    }
  };

  const handleDragStart = (lessonId: number) => (event: DragEvent) => {
    setDraggingId(lessonId);
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
    const fromIdx = lessons.findIndex(l => l.id === draggingId);
    const toIdx = lessons.findIndex(l => l.id === targetId);
    if (fromIdx === -1 || toIdx === -1) {
      setDraggingId(null);
      return;
    }
    const next = [...lessons];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    const reindexed = next.map((l, i) => ({ ...l, sort_order: i + 1 }));
    setDraggingId(null);
    void persistOrder(reindexed);
  };

  return (
    <div className="border-t bg-muted/30 px-4 py-3">
      {isLoading && (
        <p className="text-xs text-muted-foreground">
          {t("lessons.loading")}
        </p>
      )}

      {error && !isLoading && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {!isLoading && !error && lessons.length === 0 && draft !== "create" && (
        <p className="text-xs text-muted-foreground">{t("lessons.empty")}</p>
      )}

      {!isLoading && !error && lessons.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {lessons.map(lesson => {
            const isEditing =
              typeof draft === "object" && draft?.editingId === lesson.id;
            const Icon = lessonTypeIcon(lesson.type);
            return (
              <li
                key={lesson.id}
                draggable={canManage && !isEditing}
                onDragStart={handleDragStart(lesson.id)}
                onDragOver={handleDragOver}
                onDrop={handleDrop(lesson.id)}
                className={cn(
                  "rounded-md bg-background ring-1 ring-foreground/10",
                  draggingId === lesson.id && "opacity-50"
                )}
              >
                {isEditing ? (
                  <form onSubmit={handleSaveDraft} className="p-3">
                    <LessonDraftFields
                      title={draftTitle}
                      type={draftType}
                      videoUrl={draftVideoUrl}
                      content={draftContent}
                      duration={draftDuration}
                      isPreview={draftIsPreview}
                      onTitleChange={setDraftTitle}
                      onTypeChange={setDraftType}
                      onVideoUrlChange={setDraftVideoUrl}
                      onContentChange={setDraftContent}
                      onDurationChange={setDraftDuration}
                      onIsPreviewChange={setDraftIsPreview}
                      fieldErrors={draftErrors}
                    />
                    {draftFormError && (
                      <p className="mt-2 text-sm text-destructive">
                        {draftFormError}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={resetDraft}
                        disabled={isSavingDraft}
                      >
                        {t("lessons.cancel")}
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isSavingDraft}
                      >
                        {isSavingDraft
                          ? t("lessons.saving")
                          : t("lessons.save")}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2">
                    {canManage && (
                      <span className="cursor-grab text-muted-foreground active:cursor-grabbing">
                        <GripVertical className="size-4" />
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {lesson.sort_order}.
                    </span>
                    <Icon className="size-4 text-muted-foreground" />
                    <span className="flex-1 truncate text-sm">
                      {lesson.title}
                    </span>
                    {lesson.duration_minutes > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {lesson.duration_minutes}min
                      </span>
                    )}
                    {lesson.is_preview && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                        {t("lessons.previewBadge")}
                      </span>
                    )}
                    {canManage && (
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title={
                            lesson.is_preview
                              ? t("lessons.unsetPreview")
                              : t("lessons.setPreview")
                          }
                          disabled={busyId === lesson.id}
                          onClick={() => togglePreview(lesson)}
                        >
                          {lesson.is_preview ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title={t("lessons.edit")}
                          disabled={busyId === lesson.id}
                          onClick={() => startEdit(lesson)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title={t("lessons.delete")}
                          disabled={busyId === lesson.id}
                          onClick={() => handleDelete(lesson)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {draft === "create" && (
        <form
          onSubmit={handleSaveDraft}
          className="mt-3 rounded-md bg-background p-3 ring-1 ring-foreground/10"
        >
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-medium">{t("lessons.addTitle")}</h4>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={resetDraft}
              disabled={isSavingDraft}
            >
              <X className="size-4" />
            </Button>
          </div>
          <LessonDraftFields
            title={draftTitle}
            type={draftType}
            videoUrl={draftVideoUrl}
            content={draftContent}
            duration={draftDuration}
            isPreview={draftIsPreview}
            onTitleChange={setDraftTitle}
            onTypeChange={setDraftType}
            onVideoUrlChange={setDraftVideoUrl}
            onContentChange={setDraftContent}
            onDurationChange={setDraftDuration}
            onIsPreviewChange={setDraftIsPreview}
            fieldErrors={draftErrors}
          />
          {draftFormError && (
            <p className="mt-2 text-sm text-destructive">{draftFormError}</p>
          )}
          <div className="mt-3 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetDraft}
              disabled={isSavingDraft}
            >
              {t("lessons.cancel")}
            </Button>
            <Button type="submit" size="sm" disabled={isSavingDraft}>
              {isSavingDraft ? t("lessons.saving") : t("lessons.create")}
            </Button>
          </div>
        </form>
      )}

      {canManage && draft === null && !isLoading && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={startCreate}
        >
          <Plus className="size-4" />
          {t("lessons.add")}
        </Button>
      )}
    </div>
  );
}

interface LessonDraftFieldsProps {
  title: string;
  type: LessonType;
  videoUrl: string;
  content: string;
  duration: string;
  isPreview: boolean;
  onTitleChange: (value: string) => void;
  onTypeChange: (value: LessonType) => void;
  onVideoUrlChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onIsPreviewChange: (value: boolean) => void;
  fieldErrors: FieldErrors;
}

function LessonDraftFields({
  title,
  type,
  videoUrl,
  content,
  duration,
  isPreview,
  onTitleChange,
  onTypeChange,
  onVideoUrlChange,
  onContentChange,
  onDurationChange,
  onIsPreviewChange,
  fieldErrors,
}: LessonDraftFieldsProps) {
  const { t } = useTranslation();

  return (
    <FieldGroup>
      <Field data-invalid={fieldErrors.title ? true : undefined}>
        <FieldLabel htmlFor="lesson-title">
          {t("lessons.fieldTitle")}
        </FieldLabel>
        <Input
          id="lesson-title"
          type="text"
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          maxLength={255}
          required
          aria-invalid={Boolean(fieldErrors.title)}
        />
        <FieldError
          errors={fieldErrors.title?.map(message => ({ message }))}
        />
      </Field>

      <Field data-invalid={fieldErrors.type ? true : undefined}>
        <FieldLabel>{t("lessons.fieldType")}</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {LESSON_TYPES.map(({ value, icon: Icon }) => (
            <label
              key={value}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm",
                type === value
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-input text-muted-foreground hover:bg-muted"
              )}
            >
              <input
                type="radio"
                name="lesson-type"
                value={value}
                checked={type === value}
                onChange={() => onTypeChange(value)}
                className="sr-only"
              />
              <Icon className="size-4" />
              {t(`lessons.type.${value}`)}
            </label>
          ))}
        </div>
        <FieldError
          errors={fieldErrors.type?.map(message => ({ message }))}
        />
      </Field>

      {type === "video" && (
        <Field data-invalid={fieldErrors.video_url ? true : undefined}>
          <FieldLabel htmlFor="lesson-video-url">
            {t("lessons.fieldVideoUrl")}
          </FieldLabel>
          <Input
            id="lesson-video-url"
            type="url"
            value={videoUrl}
            onChange={e => onVideoUrlChange(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            maxLength={500}
            required
            aria-invalid={Boolean(fieldErrors.video_url)}
          />
          <FieldError
            errors={fieldErrors.video_url?.map(message => ({ message }))}
          />
        </Field>
      )}

      {type === "text" && (
        <Field data-invalid={fieldErrors.content ? true : undefined}>
          <FieldLabel htmlFor="lesson-content">
            {t("lessons.fieldContent")}
          </FieldLabel>
          <textarea
            id="lesson-content"
            value={content}
            onChange={e => onContentChange(e.target.value)}
            rows={6}
            required
            className={cn(
              "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none",
              "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              "dark:bg-input/30",
              fieldErrors.content &&
                "border-destructive ring-3 ring-destructive/20"
            )}
            aria-invalid={Boolean(fieldErrors.content)}
          />
          <FieldDescription>
            {t("lessons.fieldContentHint")}
          </FieldDescription>
          <FieldError
            errors={fieldErrors.content?.map(message => ({ message }))}
          />
        </Field>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field data-invalid={fieldErrors.duration_minutes ? true : undefined}>
          <FieldLabel htmlFor="lesson-duration">
            {t("lessons.fieldDuration")}
          </FieldLabel>
          <Input
            id="lesson-duration"
            type="number"
            min={0}
            inputMode="numeric"
            value={duration}
            onChange={e => onDurationChange(e.target.value)}
            placeholder="0"
            aria-invalid={Boolean(fieldErrors.duration_minutes)}
          />
          <FieldError
            errors={fieldErrors.duration_minutes?.map(message => ({
              message,
            }))}
          />
        </Field>

        <Field>
          <FieldLabel className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPreview}
              onChange={e => onIsPreviewChange(e.target.checked)}
              className="size-4 rounded border-input"
            />
            {t("lessons.fieldIsPreview")}
          </FieldLabel>
          <FieldDescription>
            {t("lessons.fieldIsPreviewHint")}
          </FieldDescription>
        </Field>
      </div>
    </FieldGroup>
  );
}
