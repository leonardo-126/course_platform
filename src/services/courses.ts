import { api } from "@/lib/api";
import type { Course } from "@/types/course";

export const courseService = {
  getAll: () => api.get<Course[]>("/courses"),
  getById: (id: string) => api.get<Course>(`/courses/${id}`),
  create: (data: Omit<Course, "id">) => api.post<Course>("/courses", data),
  update: (id: string, data: Partial<Course>) =>
    api.patch<Course>(`/courses/${id}`, data),
  delete: (id: string) => api.del<void>(`/courses/${id}`),
};
