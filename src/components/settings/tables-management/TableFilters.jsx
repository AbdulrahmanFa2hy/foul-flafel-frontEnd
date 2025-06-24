import { useTranslation } from "react-i18next";
import {
  FaFilter,
  FaSort,
  FaMapMarkerAlt,
  FaCheckCircle,
} from "react-icons/fa";

const TableFilters = ({ filters, onFilterChange }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const FilterCard = ({ icon: Icon, label, children }) => (
    <div className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-all duration-200 border border-gray-200 hover:border-gray-300">
      <div className="flex items-center gap-2 mb-3">
        <div className="bg-primary-100 rounded-lg p-2">
          <Icon className="text-primary-800 text-sm" />
        </div>
        <label className="text-sm font-semibold text-gray-700">{label}</label>
      </div>
      {children}
    </div>
  );

  return (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-primary-800 rounded-lg p-2">
          <FaFilter className="text-white text-sm" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">
          {t("common.filters")}
        </h3>
      </div>

      <div
        className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${
          isRTL ? "text-right" : "text-left"
        }`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Location Filter */}
        <FilterCard icon={FaMapMarkerAlt} label={t("table.location")}>
          <select
            value={filters.location}
            onChange={(e) =>
              onFilterChange({ ...filters, location: e.target.value })
            }
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-800 focus:border-transparent text-sm font-medium text-gray-700 shadow-sm"
          >
            <option value="">{t("table.allLocations")}</option>
            <option value="inside">{t("table.inside")}</option>
            <option value="outside">{t("table.outside")}</option>
          </select>
        </FilterCard>

        {/* Availability Filter */}
        <FilterCard icon={FaCheckCircle} label={t("table.availability")}>
          <select
            value={filters.availability}
            onChange={(e) =>
              onFilterChange({ ...filters, availability: e.target.value })
            }
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-800 focus:border-transparent text-sm font-medium text-gray-700 shadow-sm"
          >
            <option value="">{t("table.allStatuses")}</option>
            <option value="available">{t("table.available")}</option>
            <option value="occupied">{t("table.occupied")}</option>
          </select>
        </FilterCard>

        {/* Sort Order */}
        <FilterCard icon={FaSort} label={t("table.sortBy")}>
          <select
            value={filters.sortOrder}
            onChange={(e) =>
              onFilterChange({ ...filters, sortOrder: e.target.value })
            }
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-800 focus:border-transparent text-sm font-medium text-gray-700 shadow-sm"
          >
            <option value="asc">{t("table.tableNumberAsc")}</option>
            <option value="desc">{t("table.tableNumberDesc")}</option>
          </select>
        </FilterCard>
      </div>
    </div>
  );
};

export default TableFilters;
