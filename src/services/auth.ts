import { api } from "@/lib/api";
import type {
  LoginCredentials,
  SignupCredentials,
  User,
} from "@/types/auth";

const API_BASE = import.meta.env.VITE_API_URL as string;
const SERVER_URL = API_BASE.replace(/\/api\/?$/, "");

export const authService = {
  csrfCookie: () =>
    fetch(`${SERVER_URL}/sanctum/csrf-cookie`, { credentials: "include" }),

  login: (credentials: LoginCredentials) =>
    api.post<User>("/auth/login", credentials),

  signup: (credentials: SignupCredentials) =>
    api.post<User>("/auth/register", credentials),

  me: () => api.get<User>("/auth/me"),

  logout: () => api.post<void>("/auth/logout"),
};
