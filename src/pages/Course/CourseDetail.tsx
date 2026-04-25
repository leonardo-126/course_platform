import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Archive,
  BookOpen,
  ChevronLeft,
  Clock,
  Layers,
  Pencil,
  Sparkles,
} from "lucide-react";
import { Button } from "@/Components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";
import { CourseAuthorsManager } from "@/Components/course-authors-manager";
import { courseService } from "@/services/courses";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Course, CourseStatus } from "@/types/course";

function formatDuration(minutes: number): string {
  if (minutes <= 0) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

function statusBadgeClasses(status: CourseStatus): string {
  switch (status) {
    case "published":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "archived":
      return "bg-muted text-muted-foreground";
    case "draft":
    default:
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  }
}

export default function CourseDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(courseId)) {
      setError(t("courseDetail.notFound"));
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
          err instanceof ApiError ? err.message : t("courseDetail.loadError");
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
  const isOwner =
    currentUserId !== null &&
    (course?.created_by === currentUserId ||
      ownerAuthor?.user_id === currentUserId);

  const handleArchive = async () => {
    if (!course) return;
    if (!confirm(t("courseDetail.confirmArchive"))) return;
    setIsArchiving(true);
    try {
      await courseService.archive(course.id);
      navigate("/dashboard/courses", { replace: true });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : t("courseDetail.archiveError");
      setError(message);
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/dashboard/courses")}
      >
        <ChevronLeft className="size-4" />
        {t("courseDetail.back")}
      </Button>

      {isLoading && (
        <p className="text-muted-foreground">{t("courseDetail.loading")}</p>
      )}

      {error && !isLoading && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {course && !isLoading && (
        <>
          <Card>
            {course.thumbnail_url ? (
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="aspect-video w-full object-cover"
              />
            ) : (
              <div className="flex aspect-video w-full items-center justify-center bg-muted text-muted-foreground">
                <BookOpen className="size-12" />
              </div>
            )}

            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <span
                    className={
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium " +
                      statusBadgeClasses(course.status)
                    }
                  >
                    {t(`courseForm.status${course.status.charAt(0).toUpperCase() + course.status.slice(1)}`)}
                  </span>
                  <CardTitle className="text-2xl">{course.title}</CardTitle>
                  {course.description && (
                    <CardDescription className="whitespace-pre-line">
                      {course.description}
                    </CardDescription>
                  )}
                </div>

                {isOwner && (
                  <div className="flex items-center gap-2">
                    <Link to={`/dashboard/courses/${course.id}/sections`}>
                      <Button variant="outline" size="sm">
                        <Layers className="size-4" />
                        {t("courseDetail.sections")}
                      </Button>
                    </Link>
                    <Link to={`/dashboard/courses/${course.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Pencil className="size-4" />
                        {t("courseDetail.edit")}
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isArchiving || course.status === "archived"}
                      onClick={handleArchive}
                    >
                      <Archive className="size-4" />
                      {isArchiving
                        ? t("courseDetail.archiving")
                        : t("courseDetail.archive")}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-4">
                <div>
                  <div className="text-xs text-muted-foreground">
                    {t("courseDetail.duration")}
                  </div>
                  <div className="mt-1 inline-flex items-center gap-1.5 font-medium">
                    <Clock className="size-4 text-muted-foreground" />
                    {formatDuration(course.estimated_minutes)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    {t("courseDetail.xp")}
                  </div>
                  <div className="mt-1 inline-flex items-center gap-1.5 font-medium">
                    <Sparkles className="size-4 text-primary" />
                    {course.xp_reward}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    {t("courseDetail.slug")}
                  </div>
                  <div className="mt-1 truncate font-mono text-sm">
                    {course.slug}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    {t("courseDetail.publishedAt")}
                  </div>
                  <div className="mt-1 text-sm">
                    {course.published_at
                      ? new Date(course.published_at).toLocaleDateString()
                      : "—"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <CourseAuthorsManager
            courseId={course.id}
            initialAuthors={course.authors}
            canManage={isOwner}
          />
        </>
      )}
    </div>
  );
}
