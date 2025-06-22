import { FaSearch } from "react-icons/fa";
import { useTranslation } from "react-i18next";

// Search Input component
const SearchInput = ({ value, onChange, placeholder }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const defaultPlaceholder = placeholder || t("menu.searchPlaceholder");

  return (
    <div className="relative w-full" dir={isRTL ? "rtl" : "ltr"}>
      <input
        type="text"
        placeholder={defaultPlaceholder}
        className={`w-full ${
          isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
        } py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 text-primary-900 focus:ring-primary-700 focus:border-primary-700`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <FaSearch
        className={`absolute ${
          isRTL ? "right-3" : "left-3"
        } top-1/2 -translate-y-1/2 text-neutral-500`}
      />
    </div>
  );
};

export default SearchInput;
