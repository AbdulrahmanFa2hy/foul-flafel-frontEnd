import SearchInput from "../common/SearchInput";
import DatePicker from "../common/DatePicker";
import { useTranslation } from "react-i18next";

function HistoryHeader({
  searchTerm,
  onSearchChange,
  onDateChange,
  selectedTab,
  onTabChange,
}) {
  const { t } = useTranslation();

  return (
    <header className="bg-white border-b border-neutral-200 py-4 px-2 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Tabs */}
        <div className="flex justify-center space-x-4 min-w-fit overflow-x-auto pb-2 sm:pb-0 sm:mr-6">
          <button
            className={`text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${
              selectedTab === "paid"
                ? "text-primary-800 border-b-2 border-primary-800"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => onTabChange("paid")}
          >
            {t("history.paidOrders")}
          </button>
          <button
            className={`text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${
              selectedTab === "cancelled"
                ? "text-primary-800 border-b-2 border-primary-800"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => onTabChange("cancelled")}
          >
            {t("history.cancelledOrders")}
          </button>
        </div>

        {/* Search and Date Picker Row */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1">
          <div className="flex-1">
            <SearchInput
              value={searchTerm}
              onChange={onSearchChange}
              placeholder={t("searchPlaceholder")}
            />
          </div>
          <div className="flex-shrink-0">
            <DatePicker onDateChange={onDateChange} />
          </div>
        </div>
      </div>
    </header>
  );
}

export default HistoryHeader;
