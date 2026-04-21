import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/Components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/Components/ui/field";
import { Input } from "@/Components/ui/input";
import type {
  Course,
  CourseStatus,
  CreateCourseInput,
  UpdateCourseInput,
} from "@/types/course";
import type { FieldErrors } from "@/lib/api-errors";

export type CourseFormValues = {
  title: string;
  slug?: string;
  description: string;
  thumbnail_url: string;
  estimated_minutes: number;
  xp_reward: number;
  status?: CourseStatus;
};

export type CourseFormMode = "create" | "edit";

interface CourseFormProps {
  mode: CourseFormMode;
  initialValues?: Partial<Course>;
  fieldErrors?: FieldErrors;
  formError?: string | null;
  isSubmitting?: boolean;
  onSubmit: (values: CreateCourseInput | UpdateCourseInput) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

function normalizeNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function CourseForm({
  mode,
  initialValues,
  fieldErrors = {},
  formError,
  isSubmitting,
  onSubmit,
  onCancel,
  className,
}: CourseFormProps) {
  const { t } = useTranslation();

  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [slug, setSlug] = useState(initialValues?.slug ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? ""
  );
  const [thumbnailUrl, setThumbnailUrl] = useState(
    initialValues?.thumbnail_url ?? ""
  );
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    initialValues?.estimated_minutes ?? 0
  );
  const [xpReward, setXpReward] = useState(initialValues?.xp_reward ?? 0);
  const [status, setStatus] = useState<CourseStatus>(
    initialValues?.status ?? "draft"
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (mode === "create") {
      const payload: CreateCourseInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        thumbnail_url: thumbnailUrl.trim() || undefined,
        estimated_minutes: estimatedMinutes,
        xp_reward: xpReward,
      };
      await onSubmit(payload);
    } else {
      const payload: UpdateCourseInput = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || null,
        thumbnail_url: thumbnailUrl.trim() || null,
        estimated_minutes: estimatedMinutes,
        xp_reward: xpReward,
        status,
      };
      await onSubmit(payload);
    }
  };

  const err = (field: string) =>
    fieldErrors[field]?.map(message => ({ message }));

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      noValidate
    >
      <FieldGroup>
        <Field data-invalid={fieldErrors.title ? true : undefined}>
          <FieldLabel htmlFor="course-title">
            {t("courseForm.title")}
          </FieldLabel>
          <Input
            id="course-title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={255}
            required
            aria-invalid={Boolean(fieldErrors.title)}
          />
          <FieldError errors={err("title")} />
        </Field>

        {mode === "edit" && (
          <Field data-invalid={fieldErrors.slug ? true : undefined}>
            <FieldLabel htmlFor="course-slug">
              {t("courseForm.slug")}
            </FieldLabel>
            <Input
              id="course-slug"
              type="text"
              value={slug}
              onChange={e => setSlug(e.target.value)}
              placeholder="auto-generated-from-title"
              aria-invalid={Boolean(fieldErrors.slug)}
            />
            <FieldDescription>{t("courseForm.slugHint")}</FieldDescription>
            <FieldError errors={err("slug")} />
          </Field>
        )}

        <Field data-invalid={fieldErrors.description ? true : undefined}>
          <FieldLabel htmlFor="course-description">
            {t("courseForm.description")}
          </FieldLabel>
          <textarea
            id="course-description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={5}
            className={cn(
              "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none",
              "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              "dark:bg-input/30",
              fieldErrors.description &&
                "border-destructive ring-3 ring-destructive/20"
            )}
            aria-invalid={Boolean(fieldErrors.description)}
          />
          <FieldError errors={err("description")} />
        </Field>

        <Field data-invalid={fieldErrors.thumbnail_url ? true : undefined}>
          <FieldLabel htmlFor="course-thumbnail">
            {t("courseForm.thumbnail")}
          </FieldLabel>
          <Input
            id="course-thumbnail"
            type="url"
            value={thumbnailUrl}
            onChange={e => setThumbnailUrl(e.target.value)}
            placeholder="https://..."
            maxLength={500}
            aria-invalid={Boolean(fieldErrors.thumbnail_url)}
          />
          <FieldDescription>{t("courseForm.thumbnailHint")}</FieldDescription>
          <FieldError errors={err("thumbnail_url")} />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field data-invalid={fieldErrors.estimated_minutes ? true : undefined}>
            <FieldLabel htmlFor="course-minutes">
              {t("courseForm.estimatedMinutes")}
            </FieldLabel>
            <Input
              id="course-minutes"
              type="number"
              min={0}
              value={estimatedMinutes}
              onChange={e => setEstimatedMinutes(normalizeNumber(e.target.value))}
              aria-invalid={Boolean(fieldErrors.estimated_minutes)}
            />
            <FieldError errors={err("estimated_minutes")} />
          </Field>

          <Field data-invalid={fieldErrors.xp_reward ? true : undefined}>
            <FieldLabel htmlFor="course-xp">
              {t("courseForm.xpReward")}
            </FieldLabel>
            <Input
              id="course-xp"
              type="number"
              min={0}
              value={xpReward}
              onChange={e => setXpReward(normalizeNumber(e.target.value))}
              aria-invalid={Boolean(fieldErrors.xp_reward)}
            />
            <FieldError errors={err("xp_reward")} />
          </Field>
        </div>

        {mode === "edit" && (
          <Field data-invalid={fieldErrors.status ? true : undefined}>
            <FieldLabel htmlFor="course-status">
              {t("courseForm.status")}
            </FieldLabel>
            <select
              id="course-status"
              value={status}
              onChange={e => setStatus(e.target.value as CourseStatus)}
              className={cn(
                "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none",
                "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                "dark:bg-input/30"
              )}
              aria-invalid={Boolean(fieldErrors.status)}
            >
              <option value="draft">{t("courseForm.statusDraft")}</option>
              <option value="published">
                {t("courseForm.statusPublished")}
              </option>
              <option value="archived">
                {t("courseForm.statusArchived")}
              </option>
            </select>
            <FieldDescription>{t("courseForm.statusHint")}</FieldDescription>
            <FieldError errors={err("status")} />
          </Field>
        )}

        {formError && (
          <p className="text-sm text-destructive" role="alert">
            {formError}
          </p>
        )}

        <div className="flex items-center justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {t("courseForm.cancel")}
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? t("courseForm.saving")
              : mode === "create"
                ? t("courseForm.create")
                : t("courseForm.save")}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
