import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/Components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";
import { CourseForm } from "@/Components/course-form";
import { courseService } from "@/services/courses";
import { ApiError } from "@/lib/api";
import { extractFieldErrors, type FieldErrors } from "@/lib/api-errors";
import type { Course, CreateCourseInput, UpdateCourseInput } from "@/types/course";

export default function CourseEdit() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);

  const [course, setCourse] = useState<Course | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(courseId)) {
      setLoadError(t("courseForm.notFound"));
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    courseService
      .getById(courseId)
      .then(data => {
        if (active) setCourse(data);
      })
      .catch(err => {
        if (!active) return;
        const message =
          err instanceof ApiError ? err.message : t("courseForm.loadError");
        setLoadError(message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [courseId, t]);

  const handleSubmit = async (
    values: CreateCourseInput | UpdateCourseInput
  ) => {
    setFieldErrors({});
    setFormError(null);
    setIsSubmitting(true);
    try {
      const updated = await courseService.update(
        courseId,
        values as UpdateCourseInput
      );
      navigate(`/dashboard/courses/${updated.id}`, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setFieldErrors(extractFieldErrors(err));
      } else {
        const message =
          err instanceof ApiError ? err.message : t("courseForm.genericError");
        setFormError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(`/dashboard/courses/${courseId}`)}
      >
        <ChevronLeft className="size-4" />
        {t("courseForm.back")}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t("courseEdit.title")}</CardTitle>
          <CardDescription>{t("courseEdit.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <p className="text-muted-foreground">{t("courseForm.loading")}</p>
          )}
          {loadError && !isLoading && (
            <p className="text-sm text-destructive">{loadError}</p>
          )}
          {course && !isLoading && (
            <CourseForm
              mode="edit"
              initialValues={course}
              fieldErrors={fieldErrors}
              formError={formError}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onCancel={() => navigate(`/dashboard/courses/${courseId}`)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
