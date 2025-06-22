import {
  FaPrint,
  FaEdit,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaStar,
  FaRegStar,
  FaUsb,
  FaNetworkWired,
  FaDesktop,
} from "react-icons/fa";
import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";

const PrinterCard = memo(function PrinterCard({
  printer,
  onToggleDefault,
  onToggleEnabled,
  onTestPrint,
  onEdit,
  onDelete,
}) {
  const { t } = useTranslation();

  const handleToggleDefault = useCallback(() => {
    onToggleDefault(printer.id);
  }, [onToggleDefault, printer.id]);

  const handleToggleEnabled = useCallback(() => {
    onToggleEnabled(printer.id);
  }, [onToggleEnabled, printer.id]);

  const handleTestPrint = useCallback(() => {
    onTestPrint(printer);
  }, [onTestPrint, printer]);

  const handleEdit = useCallback(() => {
    onEdit(printer);
  }, [onEdit, printer]);

  const handleDelete = useCallback(() => {
    onDelete(printer.id);
  }, [onDelete, printer.id]);

  const getConnectionIcon = () => {
    switch (printer.connectionType) {
      case "USB":
        return <FaUsb className="text-blue-500" />;
      case "LAN":
        return <FaNetworkWired className="text-green-500" />;
      default:
        return <FaDesktop className="text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    if (!printer.enabled) return "text-red-500";
    return printer.isDefault ? "text-green-600" : "text-gray-600";
  };

  const getStatusText = () => {
    if (!printer.enabled) return t("printers.disabled");
    return printer.isDefault
      ? t("printers.defaultPrinter")
      : t("printers.enabled");
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <FaPrint className="w-8 h-8 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {printer.name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                {printer.model && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {printer.model}
                  </span>
                )}
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    printer.type === "customer"
                      ? "bg-green-100 text-green-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {printer.type === "customer"
                    ? t("printers.customerReceipt")
                    : t("printers.kitchenTicket")}
                </span>
              </div>
            </div>
          </div>

          {/* Status indicator */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleDefault}
              className="text-yellow-500 hover:text-yellow-600 transition-colors"
              title={
                printer.isDefault
                  ? t("printers.removeDefault")
                  : t("printers.setAsDefault")
              }
            >
              {printer.isDefault ? <FaStar /> : <FaRegStar />}
            </button>
            <button
              onClick={handleToggleEnabled}
              className={`transition-colors ${
                printer.enabled
                  ? "text-green-500 hover:text-green-600"
                  : "text-red-500 hover:text-red-600"
              }`}
              title={
                printer.enabled ? t("printers.disable") : t("printers.enable")
              }
            >
              {printer.enabled ? (
                <FaToggleOn size={20} />
              ) : (
                <FaToggleOff size={20} />
              )}
            </button>
          </div>
        </div>

        {/* Connection Info */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center space-x-2">
            {getConnectionIcon()}
            <span className="text-sm font-medium text-gray-700">
              {printer.connectionType === "USB"
                ? t("printers.usbConnection")
                : t("printers.networkConnection")}
            </span>
          </div>

          {printer.connectionType === "LAN" && printer.ipAddress && (
            <div className="text-sm text-gray-600 pl-6">
              <div>
                {t("printers.ipAddress")}: {printer.ipAddress}
              </div>
              {printer.port && (
                <div>
                  {t("printers.port")}: {printer.port}
                </div>
              )}
            </div>
          )}

          {printer.connectionType === "USB" && (
            <div className="text-sm text-gray-600 pl-6">
              {t("printers.usbConnectionInfo")}
            </div>
          )}

          <div className="flex items-center space-x-4 text-sm text-gray-600 pl-6">
            <span>
              {t("printers.paperWidth")}: {printer.paperWidth}
            </span>
            <span className={`font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            onClick={handleTestPrint}
            disabled={!printer.enabled}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              printer.enabled
                ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                : "bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200"
            }`}
            title={t("printers.testPrint")}
          >
            <FaPrint className="w-4 h-4 mr-2 inline" />
            {t("printers.testPrint")}
          </button>

          <div className="flex space-x-2">
            <button
              onClick={handleEdit}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title={t("printers.editPrinter")}
            >
              <FaEdit className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title={t("printers.deletePrinter")}
            >
              <FaTrash className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PrinterCard;
