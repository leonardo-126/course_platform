import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { courseService } from "@/services/courses";
import { ApiError } from "@/lib/api";
import type { Course } from "@/types/course";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";

export default function Courses() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    courseService
      .getAll()
      .then(data => {
        if (active) setCourses(data);
      })
      .catch(err => {
        if (!active) return;
        const message =
          err instanceof ApiError ? err.message : t("courses.loadError");
        setError(message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [t]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("courses.title")}</h1>
        <p className="text-muted-foreground">{t("courses.description")}</p>
      </div>

      {isLoading && (
        <p className="text-muted-foreground">{t("courses.loading")}</p>
      )}

      {error && !isLoading && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {!isLoading && !error && courses.length === 0 && (
        <p className="text-muted-foreground">{t("courses.empty")}</p>
      )}

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {courses.map(course => (
          <Card key={course.id}>
            <CardHeader>
              <CardTitle>{course.title}</CardTitle>
              <CardDescription>{course.instructor}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {course.description}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">
                  {t("courses.price")}: ${course.price}
                </span>
                <span>
                  ⭐ {course.rating} · {course.students}{" "}
                  {t("courses.students")}
                </span>
              </div>
              <Button className="w-full">{t("courses.viewMore")}</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
