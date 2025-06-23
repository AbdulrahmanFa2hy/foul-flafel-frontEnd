import { FaCog, FaPlus } from "react-icons/fa";
import { memo } from "react";
import { useTranslation } from "react-i18next";

const PrintersHeader = memo(function PrintersHeader({
  onOpenReceiptSettings,
  onOpenPrinterForm,
  isFormOpen,
}) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            {t("printers.title")}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {t("printers.description")}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={onOpenReceiptSettings}
            className="px-3 sm:px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors flex items-center justify-center text-sm sm:text-base order-1 sm:order-1"
          >
            <FaCog className="mr-1 sm:mr-2" />
            <span className="hidden xs:inline">
              {t("printers.receiptSettings")}
            </span>
            <span className="xs:hidden">{t("printers.settings")}</span>
          </button>
          {!isFormOpen && (
            <button
              onClick={onOpenPrinterForm}
              className="px-3 sm:px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors flex items-center justify-center text-sm sm:text-base order-2 sm:order-2"
            >
              <FaPlus className="mr-1 sm:mr-2" />
              <span className="hidden xs:inline">
                {t("printers.addPrinter")}
              </span>
              <span className="xs:hidden">{t("printers.add")}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default PrintersHeader;
