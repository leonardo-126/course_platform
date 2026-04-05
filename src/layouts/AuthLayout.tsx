import { Outlet } from "react-router-dom";
import AuthNavbar from "@/Components/AuthNavbar";
import Sidebar from "@/Components/Sidebar";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AuthNavbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-6 py-8 md:ml-60">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
