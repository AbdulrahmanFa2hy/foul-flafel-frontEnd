import SearchInput from "../common/SearchInput";
import DatePicker from "../common/DatePicker";
import { useTranslation } from "react-i18next";

function HistoryHeader({ searchTerm, onSearchChange, onDateChange }) {
  const { t } = useTranslation();

  return (
    <header className="bg-white border-b border-neutral-200 py-4 px-6">
      <div className="flex items-center justify-between">
        <div className="w-full max-w-xl">
          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder={t("searchPlaceholder")}
          />
        </div>

        <DatePicker onDateChange={onDateChange} />
      </div>
    </header>
  );
}

export default HistoryHeader;
