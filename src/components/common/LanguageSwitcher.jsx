import { useTranslation } from "react-i18next";
import { FaGlobe } from "react-icons/fa";
import Tooltip from "./Tooltip";

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const currentLang = i18n.language;
    const newLang = currentLang === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
  };

  const getCurrentLanguageLabel = () => {
    return i18n.language === "en"
      ? t("languageSwitcher.arabic")
      : t("languageSwitcher.english");
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center justify-center p-3 text-primary-800 hover:bg-[#edf4fb] rounded-xl transition-all duration-200 group relative"
      aria-label={`${t(
        "languageSwitcher.switchTo"
      )} ${getCurrentLanguageLabel()}`}
    >
      <FaGlobe className="text-xl" />
      <Tooltip>
        {t("languageSwitcher.switchTo")} {getCurrentLanguageLabel()}
      </Tooltip>
    </button>
  );
};

export default LanguageSwitcher;
