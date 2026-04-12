import { api } from "@/lib/api";
import type {
  LoginCredentials,
  SignupCredentials,
  User,
} from "@/types/auth";

export const authService = {
  login: (credentials: LoginCredentials) =>
    api.post<User>("/auth/login", credentials),

  signup: (credentials: SignupCredentials) =>
    api.post<User>("/auth/register", credentials),

  me: () => api.get<User>("/auth/me"),

  logout: () => api.post<void>("/auth/logout"),
};
