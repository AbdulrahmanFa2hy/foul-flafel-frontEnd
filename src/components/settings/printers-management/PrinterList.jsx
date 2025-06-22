import { useTranslation } from "react-i18next";
import PrinterCard from "./PrinterCard";

function PrinterList({
  printers,
  onToggleDefault,
  onToggleEnabled,
  onTestPrint,
  onEdit,
  onDelete,
}) {
  const { t } = useTranslation();

  if (!printers || printers.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-400 text-lg mb-4">
          <i className="fas fa-print text-4xl"></i>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t("printers.noPrintersConfigured")}
        </h3>
        <p className="text-gray-500 mb-4">
          {t("printers.configurePrintersDescription")}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {printers.map((printer) => (
          <PrinterCard
            key={printer.id}
            printer={printer}
            onToggleDefault={onToggleDefault}
            onToggleEnabled={onToggleEnabled}
            onTestPrint={onTestPrint}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

export default PrinterList;
