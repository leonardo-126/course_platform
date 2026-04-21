import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import type { CreateCourseInput, UpdateCourseInput } from "@/types/course";

export default function CourseCreate() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (
    values: CreateCourseInput | UpdateCourseInput
  ) => {
    setFieldErrors({});
    setFormError(null);
    setIsSubmitting(true);
    try {
      const created = await courseService.create(values as CreateCourseInput);
      navigate(`/dashboard/courses/${created.id}`, { replace: true });
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
        onClick={() => navigate("/dashboard/courses")}
      >
        <ChevronLeft className="size-4" />
        {t("courseForm.back")}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t("courseCreate.title")}</CardTitle>
          <CardDescription>{t("courseCreate.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <CourseForm
            mode="create"
            fieldErrors={fieldErrors}
            formError={formError}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/dashboard/courses")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
