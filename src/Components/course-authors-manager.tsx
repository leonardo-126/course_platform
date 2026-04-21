import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Crown, Eye, EyeOff, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/Components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";
import { Field, FieldError, FieldLabel } from "@/Components/ui/field";
import { Input } from "@/Components/ui/input";
import { Separator } from "@/Components/ui/separator";
import { courseAuthorService } from "@/services/courses";
import { ApiError } from "@/lib/api";
import { extractFieldErrors, type FieldErrors } from "@/lib/api-errors";
import type { CourseAuthor } from "@/types/course";

interface CourseAuthorsManagerProps {
  courseId: number;
  initialAuthors?: CourseAuthor[];
  canManage: boolean;
}

export function CourseAuthorsManager({
  courseId,
  initialAuthors,
  canManage,
}: CourseAuthorsManagerProps) {
  const { t } = useTranslation();
  const [authors, setAuthors] = useState<CourseAuthor[]>(initialAuthors ?? []);
  const [isLoading, setIsLoading] = useState(!initialAuthors);
  const [listError, setListError] = useState<string | null>(null);

  const [userId, setUserId] = useState("");
  const [canViewProgress, setCanViewProgress] = useState(true);
  const [addError, setAddError] = useState<string | null>(null);
  const [addFieldErrors, setAddFieldErrors] = useState<FieldErrors>({});
  const [isAdding, setIsAdding] = useState(false);

  const [busyAuthorId, setBusyAuthorId] = useState<number | null>(null);

  useEffect(() => {
    if (initialAuthors) return;
    let active = true;
    setIsLoading(true);
    courseAuthorService
      .list(courseId)
      .then(data => {
        if (active) setAuthors(data);
      })
      .catch(err => {
        if (!active) return;
        const message =
          err instanceof ApiError ? err.message : t("authors.loadError");
        setListError(message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [courseId, initialAuthors, t]);

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddError(null);
    setAddFieldErrors({});

    const numericId = Number(userId);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      setAddFieldErrors({ user_id: [t("authors.userIdInvalid")] });
      return;
    }

    setIsAdding(true);
    try {
      const newAuthor = await courseAuthorService.add(courseId, {
        user_id: numericId,
        can_view_student_progress: canViewProgress,
      });
      setAuthors(prev => [...prev, newAuthor]);
      setUserId("");
      setCanViewProgress(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setAddFieldErrors(extractFieldErrors(err));
      } else {
        const message =
          err instanceof ApiError ? err.message : t("authors.addError");
        setAddError(message);
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleProgress = async (author: CourseAuthor) => {
    setBusyAuthorId(author.id);
    try {
      const updated = await courseAuthorService.update(courseId, author.id, {
        can_view_student_progress: !author.can_view_student_progress,
      });
      setAuthors(prev =>
        prev.map(a => (a.id === updated.id ? updated : a))
      );
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : t("authors.updateError");
      setListError(message);
    } finally {
      setBusyAuthorId(null);
    }
  };

  const handleRemove = async (author: CourseAuthor) => {
    if (author.is_owner) return;
    if (!confirm(t("authors.confirmRemove"))) return;

    setBusyAuthorId(author.id);
    try {
      await courseAuthorService.remove(courseId, author.id);
      setAuthors(prev => prev.filter(a => a.id !== author.id));
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : t("authors.removeError");
      setListError(message);
    } finally {
      setBusyAuthorId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("authors.title")}</CardTitle>
        <CardDescription>{t("authors.description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {isLoading && (
          <p className="text-sm text-muted-foreground">
            {t("authors.loading")}
          </p>
        )}

        {listError && (
          <p className="text-sm text-destructive">{listError}</p>
        )}

        {!isLoading && authors.length > 0 && (
          <ul className="divide-y divide-border rounded-lg border">
            {authors.map(author => (
              <li
                key={author.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex min-w-0 flex-col">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {author.user?.name ??
                        `${t("authors.userId")} #${author.user_id}`}
                    </span>
                    {author.is_owner && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        <Crown className="size-3" />
                        {t("authors.owner")}
                      </span>
                    )}
                  </div>
                  {author.user?.email && (
                    <span className="truncate text-xs text-muted-foreground">
                      {author.user.email}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {canManage && !author.is_owner && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title={
                          author.can_view_student_progress
                            ? t("authors.revokeProgress")
                            : t("authors.grantProgress")
                        }
                        disabled={busyAuthorId === author.id}
                        onClick={() => handleToggleProgress(author)}
                      >
                        {author.can_view_student_progress ? (
                          <Eye className="size-4" />
                        ) : (
                          <EyeOff className="size-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title={t("authors.remove")}
                        disabled={busyAuthorId === author.id}
                        onClick={() => handleRemove(author)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {!isLoading && authors.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("authors.empty")}</p>
        )}

        {canManage && (
          <>
            <Separator />
            <form onSubmit={handleAdd} className="flex flex-col gap-4">
              <h3 className="text-sm font-medium">{t("authors.addTitle")}</h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                <Field data-invalid={addFieldErrors.user_id ? true : undefined}>
                  <FieldLabel htmlFor="author-user-id">
                    {t("authors.userId")}
                  </FieldLabel>
                  <Input
                    id="author-user-id"
                    type="number"
                    min={1}
                    value={userId}
                    onChange={e => setUserId(e.target.value)}
                    placeholder="123"
                    required
                    aria-invalid={Boolean(addFieldErrors.user_id)}
                  />
                  <FieldError
                    errors={addFieldErrors.user_id?.map(message => ({
                      message,
                    }))}
                  />
                </Field>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={canViewProgress}
                    onChange={e => setCanViewProgress(e.target.checked)}
                    className="size-4 rounded border-input"
                  />
                  {t("authors.canViewProgress")}
                </label>

                <Button type="submit" disabled={isAdding}>
                  <UserPlus className="size-4" />
                  {isAdding ? t("authors.adding") : t("authors.add")}
                </Button>
              </div>

              {addError && (
                <p className="text-sm text-destructive" role="alert">
                  {addError}
                </p>
              )}
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
}
