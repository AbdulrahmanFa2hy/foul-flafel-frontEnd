import { FaPrint, FaInfoCircle } from "react-icons/fa";
import { memo } from "react";
import { useTranslation } from "react-i18next";

const PrinterTabs = memo(function PrinterTabs({ activeTab, onTabChange }) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <button
          onClick={() => onTabChange("printers")}
          className={`px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-center sm:justify-start text-sm sm:text-base font-medium transition-all duration-200 ${
            activeTab === "printers"
              ? "bg-primary-800 text-white shadow-lg"
              : "text-gray-600 hover:bg-gray-50 hover:text-primary-800"
          }`}
        >
          <FaPrint className="mr-2" />
          <span className="hidden xs:inline">
            {t("printers.printerSettings")}
          </span>
          <span className="xs:hidden">{t("printers.settings")}</span>
        </button>
        <button
          onClick={() => onTabChange("info")}
          className={`px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-center sm:justify-start text-sm sm:text-base font-medium transition-all duration-200 ${
            activeTab === "info"
              ? "bg-primary-800 text-white shadow-lg"
              : "text-gray-600 hover:bg-gray-50 hover:text-primary-800"
          }`}
        >
          <FaInfoCircle className="mr-2" />
          <span className="hidden xs:inline">{t("printers.information")}</span>
          <span className="xs:hidden">{t("printers.information")}</span>
        </button>
      </div>
    </div>
  );
});

export default PrinterTabs;
