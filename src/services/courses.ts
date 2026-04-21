import { api } from "@/lib/api";
import type {
  Course,
  CourseAuthor,
  CreateCourseAuthorInput,
  CreateCourseInput,
  Paginated,
  UpdateCourseAuthorInput,
  UpdateCourseInput,
} from "@/types/course";

type Wrapped<T> = { data: T };

const unwrap = <T>(res: Wrapped<T>): T => res.data;

export const courseService = {
  list: (page = 1) => api.get<Paginated<Course>>(`/courses?page=${page}`),

  mine: (page = 1) => api.get<Paginated<Course>>(`/courses/mine?page=${page}`),

  createdByMe: (page = 1) =>
    api.get<Paginated<Course>>(`/courses/mine/created?page=${page}`),

  getById: (id: number) =>
    api.get<Wrapped<Course>>(`/courses/${id}`).then(unwrap),

  create: (data: CreateCourseInput) =>
    api.post<Wrapped<Course>>("/courses", data).then(unwrap),

  update: (id: number, data: UpdateCourseInput) =>
    api.patch<Wrapped<Course>>(`/courses/${id}`, data).then(unwrap),

  archive: (id: number) => api.del<void>(`/courses/${id}`),
};

export const courseAuthorService = {
  list: (courseId: number) =>
    api
      .get<Wrapped<CourseAuthor[]>>(`/courses/${courseId}/authors`)
      .then(unwrap),

  add: (courseId: number, data: CreateCourseAuthorInput) =>
    api
      .post<Wrapped<CourseAuthor>>(`/courses/${courseId}/authors`, data)
      .then(unwrap),

  update: (courseId: number, authorId: number, data: UpdateCourseAuthorInput) =>
    api
      .patch<
        Wrapped<CourseAuthor>
      >(`/courses/${courseId}/authors/${authorId}`, data)
      .then(unwrap),

  remove: (courseId: number, authorId: number) =>
    api.del<void>(`/courses/${courseId}/authors/${authorId}`),
};
