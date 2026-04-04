import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import pt from "./locales/pt.json";

i18n.use(initReactI18next).init({
  resources: {
    pt: { translation: pt },
    en: { translation: en },
  },
  lng: "en", //padrao
  fallbackLng: "en", // fallback se faltar tradução
  interpolation: {
    escapeValue: false, //react já faz isso
  },
});
export default i18n;
