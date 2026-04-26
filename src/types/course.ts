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
  thumbnail?: File;
  estimated_minutes?: number;
  xp_reward?: number;
}

export interface UpdateCourseInput {
  title?: string;
  slug?: string;
  description?: string;
  thumbnail?: File;
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

export interface CourseSection {
  id: number;
  course_id: number;
  title: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSectionInput {
  title: string;
  description?: string | null;
  sort_order?: number;
}

export interface UpdateSectionInput {
  title?: string;
  description?: string | null;
  sort_order?: number;
}

export interface ReorderSectionItem {
  id: number;
  sort_order: number;
}

export type LessonType = "video" | "text" | "quiz";

export interface Lesson {
  id: number;
  course_section_id: number;
  title: string;
  type: LessonType;
  content: string | null;
  video_url: string | null;
  duration_minutes: number;
  sort_order: number;
  is_preview: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateLessonInput {
  title: string;
  type: LessonType;
  content?: string | null;
  video_url?: string | null;
  duration_minutes?: number;
  sort_order?: number;
  is_preview?: boolean;
}

export interface UpdateLessonInput {
  title?: string;
  type?: LessonType;
  content?: string | null;
  video_url?: string | null;
  duration_minutes?: number;
  sort_order?: number;
  is_preview?: boolean;
}

export interface ReorderLessonItem {
  id: number;
  sort_order: number;
}

export type QuestionType = "single_choice";

export interface LessonQuestionOption {
  id: number;
  question_id: number;
  option_text: string;
  is_correct: boolean;
  sort_order: number;
}

export interface LessonQuestion {
  id: number;
  lesson_id: number;
  question_text: string;
  question_type: QuestionType;
  points: number;
  sort_order: number;
  options: LessonQuestionOption[];
  created_at: string;
  updated_at: string;
}

export interface QuestionOptionInput {
  id?: number;
  option_text: string;
  is_correct: boolean;
  sort_order?: number;
}

export interface CreateQuestionInput {
  question_text: string;
  question_type: QuestionType;
  points?: number;
  sort_order?: number;
  options: QuestionOptionInput[];
}

export interface UpdateQuestionInput {
  question_text?: string;
  question_type?: QuestionType;
  points?: number;
  sort_order?: number;
  options?: QuestionOptionInput[];
}

export interface ReorderQuestionItem {
  id: number;
  sort_order: number;
}
