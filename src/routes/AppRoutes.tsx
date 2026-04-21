import AuthLayout from "@/layouts/AuthLayout";
import PublicLayout from "@/layouts/PublicLayout";
import Login from "@/pages/auth/login";
import Signup from "@/pages/auth/signup";
import Home from "@/pages/Home";
import Courses from "@/pages/Course/Courses";
import CourseCreate from "@/pages/Course/CourseCreate";
import CourseDetail from "@/pages/Course/CourseDetail";
import CourseEdit from "@/pages/Course/CourseEdit";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/routes/ProtectedRoute";
import { Route, Routes } from "react-router-dom";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Rotas públicas — Navbar simples */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<Home />} />
        {/* <Route path="pricing" element={<Pricing />} /> */}
      </Route>

      {/* Rotas autenticadas — Navbar + Sidebar */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<AuthLayout />}>
          {/* <Route index element={<Dashboard />} /> */}
          <Route path="courses" element={<Courses />} />
          <Route path="courses/new" element={<CourseCreate />} />
          <Route path="courses/:id" element={<CourseDetail />} />
          <Route path="courses/:id/edit" element={<CourseEdit />} />
          {/* <Route path="progress" element={<Progress />} /> */}
          {/* <Route path="settings" element={<Settings />} /> */}
          {/* <Route path="profile" element={<Profile />} /> */}
        </Route>
      </Route>

      <Route path="login" element={<Login />} />
      <Route path="signup" element={<Signup />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
