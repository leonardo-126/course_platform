import { useTranslation } from "react-i18next";
import { Button } from "@/Components/ui/button";
import { Languages } from "lucide-react";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => i18n.changeLanguage(i18n.language === "pt" ? "en" : "pt")}
      className="gap-1.5"
    >
      <Languages className="h-4 w-4" />
      {i18n.language === "pt" ? "EN" : "PT"}
    </Button>
  );
}
