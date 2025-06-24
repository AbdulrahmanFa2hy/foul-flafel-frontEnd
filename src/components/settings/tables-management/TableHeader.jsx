import { useTranslation } from "react-i18next";
import { FaPlus, FaTable } from "react-icons/fa";
import SearchInput from "../../common/SearchInput";

const TableHeader = ({ searchQuery, onSearchChange, onAddTable }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <div className="space-y-6">
      {/* Title Section */}
      <div className="flex items-center gap-4">
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
          <FaTable className="text-2xl text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">
            {t("table.tableManagement")}
          </h1>
          <p className="text-primary-100 mt-1">
            {t("table.manageRestaurantTables")}
          </p>
        </div>
      </div>

      {/* Search and Action Section */}
      <div
        className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-4 ${
          isRTL ? "sm:flex-row-reverse" : ""
        }`}
      >
        <div className="flex-1 max-w-md">
          <div className="relative">
            <SearchInput
              value={searchQuery}
              onChange={onSearchChange}
              placeholder={t("table.searchPlaceholder")}
            />
          </div>
        </div>

        <button
          onClick={onAddTable}
          className="group bg-white hover:bg-gray-50 text-primary-800 hover:text-primary-900 font-semibold px-6 py-1 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 border border-white/20 hover:border-primary-200"
        >
          <div className="bg-primary-100 group-hover:bg-primary-200 rounded-lg p-2 transition-colors">
            <FaPlus size={14} />
          </div>
          <span className="whitespace-nowrap">{t("table.addNewTable")}</span>
        </button>
      </div>
    </div>
  );
};

export default TableHeader;
