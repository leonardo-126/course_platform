import { Outlet } from "react-router-dom";
import LanguageSwitcher from "../Components/LanguegeSwitcher";
import ThemeSwitcher from "../Components/ThemeSwitcher";

export default function MainLayout() {
  return (
    <div>
      <h1>Main Layout</h1>
      <LanguageSwitcher />
      <ThemeSwitcher />
      <Outlet />
    </div>
  );
}
