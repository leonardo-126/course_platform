export type CourseStatus = "draft" | "published" | "archived";

export interface Course {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  estimated_minutes: number;
  xp_reward: number;
  status: CourseStatus;
  published_at: string | null;
  created_by: number;
  authors?: CourseAuthor[];
}

export interface CourseAuthor {
  id: number;
  course_id: number;
  user_id: number;
  is_owner: boolean;
  can_view_student_progress: boolean;
  joined_at: string | null;
  user?: {
    id: number;
    name: string;
    email: string;
    created_at: string;
  };
}

export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface Paginated<T> {
  data: T[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

export interface CreateCourseInput {
  title: string;
  description?: string;
  thumbnail_url?: string;
  estimated_minutes?: number;
  xp_reward?: number;
}

export interface UpdateCourseInput {
  title?: string;
  slug?: string;
  description?: string | null;
  thumbnail_url?: string | null;
  estimated_minutes?: number;
  xp_reward?: number;
  status?: CourseStatus;
}

export interface CreateCourseAuthorInput {
  user_id: number;
  can_view_student_progress: boolean;
}

export interface UpdateCourseAuthorInput {
  can_view_student_progress: boolean;
}
