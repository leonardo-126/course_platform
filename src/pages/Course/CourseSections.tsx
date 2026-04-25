import { useEffect, useState, type DragEvent, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/Components/ui/field";
import { Input } from "@/Components/ui/input";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import { extractFieldErrors, type FieldErrors } from "@/lib/api-errors";
import { courseService, courseSectionService } from "@/services/courses";
import { useAuth } from "@/contexts/AuthContext";
import type { Course, CourseSection } from "@/types/course";

type DraftMode = "create" | { editingId: number };

export default function CourseSections() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState<DraftMode | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftErrors, setDraftErrors] = useState<FieldErrors>({});
  const [draftFormError, setDraftFormError] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const [busyId, setBusyId] = useState<number | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  useEffect(() => {
    if (!Number.isFinite(courseId)) {
      setError(t("sections.notFound"));
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    Promise.all([
      courseService.getById(courseId),
      courseSectionService.list(courseId),
    ])
      .then(([courseData, sectionsData]) => {
        if (!active) return;
        setCourse(courseData);
        setSections(
          [...sectionsData].sort((a, b) => a.sort_order - b.sort_order)
        );
      })
      .catch(err => {
        if (!active) return;
        const message =
          err instanceof ApiError ? err.message : t("sections.loadError");
        setError(message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [courseId, t]);

  const currentUserId = user?.id ?? null;
  const ownerAuthor = course?.authors?.find(a => a.is_owner);
  const canManage =
    currentUserId !== null &&
    (course?.created_by === currentUserId ||
      ownerAuthor?.user_id === currentUserId);

  const resetDraft = () => {
    setDraft(null);
    setDraftTitle("");
    setDraftDescription("");
    setDraftErrors({});
    setDraftFormError(null);
  };

  const startCreate = () => {
    setDraft("create");
    setDraftTitle("");
    setDraftDescription("");
    setDraftErrors({});
    setDraftFormError(null);
  };

  const startEdit = (section: CourseSection) => {
    setDraft({ editingId: section.id });
    setDraftTitle(section.title);
    setDraftDescription(section.description ?? "");
    setDraftErrors({});
    setDraftFormError(null);
  };

  const handleSaveDraft = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft) return;

    setDraftErrors({});
    setDraftFormError(null);
    setIsSavingDraft(true);

    const payload = {
      title: draftTitle.trim(),
      description: draftDescription.trim() || null,
    };

    try {
      if (draft === "create") {
        const created = await courseSectionService.create(courseId, payload);
        setSections(prev =>
          [...prev, created].sort((a, b) => a.sort_order - b.sort_order)
        );
      } else {
        const updated = await courseSectionService.update(
          courseId,
          draft.editingId,
          payload
        );
        setSections(prev =>
          prev
            .map(s => (s.id === updated.id ? updated : s))
            .sort((a, b) => a.sort_order - b.sort_order)
        );
      }
      resetDraft();
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setDraftErrors(extractFieldErrors(err));
      } else {
        const message =
          err instanceof ApiError ? err.message : t("sections.saveError");
        setDraftFormError(message);
      }
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleDelete = async (section: CourseSection) => {
    if (!confirm(t("sections.confirmDelete"))) return;
    setBusyId(section.id);
    try {
      await courseSectionService.remove(courseId, section.id);
      setSections(prev => prev.filter(s => s.id !== section.id));
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : t("sections.deleteError");
      setError(message);
    } finally {
      setBusyId(null);
    }
  };

  const persistOrder = async (next: CourseSection[]) => {
    const previous = sections;
    setSections(next);
    try {
      await courseSectionService.reorder(
        courseId,
        next.map((s, i) => ({ id: s.id, sort_order: i + 1 }))
      );
    } catch (err) {
      setSections(previous);
      const message =
        err instanceof ApiError ? err.message : t("sections.reorderError");
      setError(message);
    }
  };

  const handleDragStart = (sectionId: number) => (event: DragEvent) => {
    setDraggingId(sectionId);
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
    const fromIdx = sections.findIndex(s => s.id === draggingId);
    const toIdx = sections.findIndex(s => s.id === targetId);
    if (fromIdx === -1 || toIdx === -1) {
      setDraggingId(null);
      return;
    }
    const next = [...sections];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    const reindexed = next.map((s, i) => ({ ...s, sort_order: i + 1 }));
    setDraggingId(null);
    void persistOrder(reindexed);
  };

  return (
    <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(`/dashboard/courses/${courseId}`)}
      >
        <ChevronLeft className="size-4" />
        {t("sections.back")}
      </Button>

      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {t("sections.title")}
        </h1>
        <p className="text-muted-foreground">
          {course?.title ?? t("sections.description")}
        </p>
      </div>

      {isLoading && (
        <p className="text-muted-foreground">{t("sections.loading")}</p>
      )}

      {error && !isLoading && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {!isLoading && !error && sections.length === 0 && draft !== "create" && (
        <p className="text-muted-foreground">{t("sections.empty")}</p>
      )}

      {!isLoading && !error && (
        <ul className="flex flex-col gap-3">
          {sections.map(section => {
            const isEditing =
              typeof draft === "object" && draft?.editingId === section.id;
            return (
              <li
                key={section.id}
                draggable={canManage && !isEditing}
                onDragStart={handleDragStart(section.id)}
                onDragOver={handleDragOver}
                onDrop={handleDrop(section.id)}
                className={cn(
                  draggingId === section.id && "opacity-50"
                )}
              >
                <Card>
                  {isEditing ? (
                    <form onSubmit={handleSaveDraft}>
                      <CardContent className="pt-4">
                        <SectionDraftFields
                          title={draftTitle}
                          description={draftDescription}
                          onTitleChange={setDraftTitle}
                          onDescriptionChange={setDraftDescription}
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
                            {t("sections.cancel")}
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            disabled={isSavingDraft}
                          >
                            {isSavingDraft
                              ? t("sections.saving")
                              : t("sections.save")}
                          </Button>
                        </div>
                      </CardContent>
                    </form>
                  ) : (
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        {canManage && (
                          <span
                            className="mt-0.5 cursor-grab text-muted-foreground active:cursor-grabbing"
                            title={t("sections.dragHandle")}
                          >
                            <GripVertical className="size-4" />
                          </span>
                        )}
                        <div className="flex-1 space-y-1">
                          <CardTitle className="text-base">
                            <span className="mr-2 text-muted-foreground">
                              {section.sort_order}.
                            </span>
                            {section.title}
                          </CardTitle>
                          {section.description && (
                            <CardDescription className="whitespace-pre-line">
                              {section.description}
                            </CardDescription>
                          )}
                        </div>
                        {canManage && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title={t("sections.edit")}
                              onClick={() => startEdit(section)}
                              disabled={busyId === section.id}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title={t("sections.delete")}
                              onClick={() => handleDelete(section)}
                              disabled={busyId === section.id}
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
                      {t("sections.addTitle")}
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
                    <SectionDraftFields
                      title={draftTitle}
                      description={draftDescription}
                      onTitleChange={setDraftTitle}
                      onDescriptionChange={setDraftDescription}
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
                        {t("sections.cancel")}
                      </Button>
                      <Button type="submit" size="sm" disabled={isSavingDraft}>
                        {isSavingDraft
                          ? t("sections.saving")
                          : t("sections.create")}
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
          {t("sections.add")}
        </Button>
      )}
    </div>
  );
}

interface SectionDraftFieldsProps {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  fieldErrors: FieldErrors;
}

function SectionDraftFields({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  fieldErrors,
}: SectionDraftFieldsProps) {
  const { t } = useTranslation();
  return (
    <FieldGroup>
      <Field data-invalid={fieldErrors.title ? true : undefined}>
        <FieldLabel htmlFor="section-title">
          {t("sections.fieldTitle")}
        </FieldLabel>
        <Input
          id="section-title"
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
      <Field data-invalid={fieldErrors.description ? true : undefined}>
        <FieldLabel htmlFor="section-description">
          {t("sections.fieldDescription")}
        </FieldLabel>
        <textarea
          id="section-description"
          value={description}
          onChange={e => onDescriptionChange(e.target.value)}
          rows={3}
          className={cn(
            "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "dark:bg-input/30",
            fieldErrors.description &&
              "border-destructive ring-3 ring-destructive/20"
          )}
          aria-invalid={Boolean(fieldErrors.description)}
        />
        <FieldError
          errors={fieldErrors.description?.map(message => ({ message }))}
        />
      </Field>
    </FieldGroup>
  );
}
