import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <button
      onClick={() => i18n.changeLanguage(i18n.language === "pt" ? "en" : "pt")}
    >
      {i18n.language === "pt" ? "EN" : "PT"}
    </button>
  );
}
