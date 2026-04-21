import { Button } from "@/Components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import { courseService } from "@/services/courses";
import type { Course, PaginationMeta } from "@/types/course";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

type ListMode = "all" | "mine" | "created";

function formatDuration(minutes: number): string {
  if (minutes <= 0) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

export default function Courses() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [mode, setMode] = useState<ListMode>("all");
  const [courses, setCourses] = useState<Course[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    const loader =
      mode === "mine"
        ? courseService.mine(page)
        : mode === "created"
          ? courseService.createdByMe(page)
          : courseService.list(page);

    loader
      .then((res) => {
        if (!active) return;
        setCourses(res.data);
        setMeta(res.meta);
      })
      .catch((err) => {
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
  }, [mode, page, t]);

  const switchMode = (next: ListMode) => {
    setMode(next);
    setPage(1);
  };

  const canPrev = meta ? meta.current_page > 1 : false;
  const canNext = meta ? meta.current_page < meta.last_page : false;

  return (
    <div className="container mx-auto space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {t("courses.title")}
          </h1>
          <p className="text-muted-foreground">{t("courses.description")}</p>
        </div>

        {isAuthenticated && (
          <Link to="/dashboard/courses/new">
            <Button>
              <Plus className="size-4" />
              {t("courses.create")}
            </Button>
          </Link>
        )}
      </div>

      {isAuthenticated && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={mode === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => switchMode("all")}
          >
            {t("courses.tabAll")}
          </Button>
          <Button
            variant={mode === "mine" ? "default" : "outline"}
            size="sm"
            onClick={() => switchMode("mine")}
          >
            {t("courses.tabMine")}
          </Button>
          <Button
            variant={mode === "created" ? "default" : "outline"}
            size="sm"
            onClick={() => switchMode("created")}
          >
            {t("courses.tabCreated")}
          </Button>
        </div>
      )}

      {isLoading && (
        <p className="text-muted-foreground">{t("courses.loading")}</p>
      )}

      {error && !isLoading && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {!isLoading && !error && courses.length === 0 && (
        <p className="text-muted-foreground">{t("courses.empty")}</p>
      )}

      {!isLoading && !error && courses.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Link
                key={course.id}
                to={`/dashboard/courses/${course.id}`}
                className="group"
              >
                <Card className="h-full transition-all group-hover:-translate-y-1 group-hover:ring-foreground/20">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="aspect-video w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center bg-muted text-muted-foreground">
                      <BookOpen className="size-10" />
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className="line-clamp-2 text-lg">
                      {course.title}
                    </CardTitle>
                    {course.description && (
                      <CardDescription className="line-clamp-3">
                        {course.description}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        {formatDuration(course.estimated_minutes)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Sparkles className="size-3.5 text-primary" />
                        {course.xp_reward} {t("courses.xp")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-sm text-muted-foreground">
                {t("courses.pageIndicator", {
                  current: meta.current_page,
                  total: meta.last_page,
                })}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!canPrev}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-4" />
                  {t("courses.previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!canNext}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t("courses.next")}
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
