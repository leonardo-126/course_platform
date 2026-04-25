import { api } from "@/lib/api";
import type {
  Course,
  CourseAuthor,
  CourseSection,
  CreateCourseAuthorInput,
  CreateCourseInput,
  CreateSectionInput,
  Paginated,
  ReorderSectionItem,
  UpdateCourseAuthorInput,
  UpdateCourseInput,
  UpdateSectionInput,
} from "@/types/course";

type Wrapped<T> = { data: T };

const unwrap = <T>(res: Wrapped<T>): T => res.data;

function appendField(form: FormData, key: string, value: unknown) {
  if (value === undefined || value === null) return;
  if (value instanceof File) {
    form.append(key, value);
    return;
  }
  if (typeof value === "boolean") {
    form.append(key, value ? "1" : "0");
    return;
  }
  form.append(key, String(value));
}

function toFormData(input: object): FormData {
  const form = new FormData();
  Object.entries(input).forEach(([key, value]) =>
    appendField(form, key, value)
  );
  return form;
}

export const courseService = {
  list: (page = 1) => api.get<Paginated<Course>>(`/courses?page=${page}`),

  mine: (page = 1) => api.get<Paginated<Course>>(`/courses/mine?page=${page}`),

  createdByMe: (page = 1) =>
    api.get<Paginated<Course>>(`/courses/mine/created?page=${page}`),

  getById: (id: number) =>
    api.get<Wrapped<Course>>(`/courses/${id}`).then(unwrap),

  create: (data: CreateCourseInput) =>
    api
      .post<Wrapped<Course>>("/courses", toFormData(data))
      .then(unwrap),

  update: (id: number, data: UpdateCourseInput) => {
    const form = toFormData(data);
    form.append("_method", "PATCH");
    return api
      .post<Wrapped<Course>>(`/courses/${id}`, form)
      .then(unwrap);
  },

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

export const courseSectionService = {
  list: (courseId: number) =>
    api
      .get<Wrapped<CourseSection[]>>(`/courses/${courseId}/sections`)
      .then(unwrap),

  getById: (courseId: number, sectionId: number) =>
    api
      .get<Wrapped<CourseSection>>(
        `/courses/${courseId}/sections/${sectionId}`
      )
      .then(unwrap),

  create: (courseId: number, data: CreateSectionInput) =>
    api
      .post<Wrapped<CourseSection>>(`/courses/${courseId}/sections`, data)
      .then(unwrap),

  update: (courseId: number, sectionId: number, data: UpdateSectionInput) =>
    api
      .patch<Wrapped<CourseSection>>(
        `/courses/${courseId}/sections/${sectionId}`,
        data
      )
      .then(unwrap),

  remove: (courseId: number, sectionId: number) =>
    api.del<void>(`/courses/${courseId}/sections/${sectionId}`),

  reorder: (courseId: number, sections: ReorderSectionItem[]) =>
    api.patch<void>(`/courses/${courseId}/sections/reorder`, { sections }),
};
