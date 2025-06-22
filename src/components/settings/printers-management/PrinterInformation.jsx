import {
  FaInfoCircle,
  FaNetworkWired,
  FaPrint,
  FaCog,
  FaUsb,
  FaWifi,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { memo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import printingService from "../../../services/printingService";

const PrinterInformation = memo(function PrinterInformation() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [printers, setPrinters] = useState([]);
  const [qzStatus, setQzStatus] = useState(null);

  useEffect(() => {
    // Load actual printer settings
    const printerSettings = printingService.getPrinterSettings();
    setPrinters(printerSettings);

    // Get QZ Tray status
    const status = printingService.getQZStatus();
    setQzStatus(status);
  }, []);

  // Group printers by type
  const customerPrinters = printers.filter((p) => p.type === "customer");
  const kitchenPrinters = printers.filter((p) => p.type === "kitchen");

  // Check if we have at least one default printer for each type
  const hasDefaultCustomer = customerPrinters.some((p) => p.isDefault);
  const hasDefaultKitchen = kitchenPrinters.some((p) => p.isDefault);

  const getConnectionIcon = (connectionType) => {
    switch (connectionType) {
      case "USB":
        return <FaUsb className="text-blue-600" />;
      case "LAN":
        return <FaWifi className="text-green-600" />;
      case "QZ":
        return <FaPrint className="text-purple-600" />;
      default:
        return <FaPrint className="text-gray-600" />;
    }
  };

  const getConnectionColor = (connectionType) => {
    switch (connectionType) {
      case "USB":
        return "bg-blue-50 border-blue-200";
      case "LAN":
        return "bg-green-50 border-green-200";
      case "QZ":
        return "bg-purple-50 border-purple-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* QZ Tray Status */}
      {qzStatus && (
        <div
          className={`rounded-lg p-4 ${
            qzStatus.isConnected ? "bg-green-50" : "bg-yellow-50"
          }`}
        >
          <div
            className={`flex items-center gap-2 mb-2 ${
              qzStatus.isConnected ? "text-green-800" : "text-yellow-800"
            }`}
          >
            {qzStatus.isConnected ? (
              <FaCheckCircle />
            ) : (
              <FaExclamationTriangle />
            )}
            <h3 className="font-semibold">QZ Tray</h3>
          </div>
          <p
            className={`text-sm ${
              qzStatus.isConnected ? "text-green-700" : "text-yellow-700"
            }`}
          >
            {qzStatus.isConnected
              ? t("printers.qzConnected")
              : t("printers.qzNotConnected")}
          </p>
        </div>
      )}

      {/* Default Printer Status */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
          <FaInfoCircle />
          {t("printers.defaultPrinterStatus")}
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-blue-700">
              {t("printers.customerReceipt")}:
            </span>
            {hasDefaultCustomer ? (
              <span className="flex items-center gap-1 text-green-600">
                <FaCheckCircle className="text-xs" />
                {t("printers.configured")}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-600">
                <FaExclamationTriangle className="text-xs" />
                {t("printers.notConfigured")}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-blue-700">
              {t("printers.kitchenTicket")}:
            </span>
            {hasDefaultKitchen ? (
              <span className="flex items-center gap-1 text-green-600">
                <FaCheckCircle className="text-xs" />
                {t("printers.configured")}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-600">
                <FaExclamationTriangle className="text-xs" />
                {t("printers.notConfigured")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Configured Printers */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <FaPrint />
          {t("printers.configuredPrinters")} ({printers.length})
        </h3>

        {printers.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <FaPrint className="mx-auto mb-2 text-2xl opacity-50" />
            <p>{t("printers.noPrintersMessage")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Customer Printers */}
            {customerPrinters.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">
                  {t("printers.customerReceipt")} ({customerPrinters.length})
                </h4>
                <div className="space-y-2">
                  {customerPrinters.map((printer) => (
                    <div
                      key={printer.id}
                      className={`border rounded p-3 ${getConnectionColor(
                        printer.connectionType
                      )}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getConnectionIcon(printer.connectionType)}
                          <div>
                            <div className="font-medium text-sm">
                              {printer.name}
                            </div>
                            <div className="text-xs text-gray-600">
                              {printer.connectionType}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {printer.isDefault && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                              {t("printers.default")}
                            </span>
                          )}
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              printer.enabled
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {printer.enabled
                              ? t("printers.enabled")
                              : t("printers.disabled")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Kitchen Printers */}
            {kitchenPrinters.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">
                  {t("printers.kitchenTicket")} ({kitchenPrinters.length})
                </h4>
                <div className="space-y-2">
                  {kitchenPrinters.map((printer) => (
                    <div
                      key={printer.id}
                      className={`border rounded p-3 ${getConnectionColor(
                        printer.connectionType
                      )}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getConnectionIcon(printer.connectionType)}
                          <div>
                            <div className="font-medium text-sm">
                              {printer.name}
                            </div>
                            <div className="text-xs text-gray-600">
                              {printer.connectionType}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {printer.isDefault && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                              {t("printers.default")}
                            </span>
                          )}
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              printer.enabled
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {printer.enabled
                              ? t("printers.enabled")
                              : t("printers.disabled")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Setup Guide */}
      <div className="bg-green-50 rounded-lg p-4">
        <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
          <FaCog />
          {t("printers.quickSetup")}
        </h3>
        <div className="space-y-2 text-sm text-green-700">
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">1.</span>
            <span>{t("printers.step1")}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">2.</span>
            <span>{t("printers.step2")}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">3.</span>
            <span>{t("printers.step3")}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">4.</span>
            <span>{t("printers.step4")}</span>
          </div>
        </div>
      </div>

      {/* Connection Types */}
      <div className="bg-purple-50 rounded-lg p-4">
        <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
          <FaNetworkWired />
          {t("printers.connectionTypes")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="bg-purple-100 rounded p-3">
            <div className="flex items-center gap-2 mb-1">
              <FaPrint className="text-purple-600" />
              <span className="font-medium">QZ Tray</span>
            </div>
            <p className="text-purple-700 text-xs">
              {t("printers.qzDescription")}
            </p>
          </div>
          <div className="bg-blue-100 rounded p-3">
            <div className="flex items-center gap-2 mb-1">
              <FaUsb className="text-blue-600" />
              <span className="font-medium">USB</span>
            </div>
            <p className="text-blue-700 text-xs">
              {t("printers.usbDescription")}
            </p>
          </div>
          <div className="bg-green-100 rounded p-3">
            <div className="flex items-center gap-2 mb-1">
              <FaWifi className="text-green-600" />
              <span className="font-medium">LAN</span>
            </div>
            <p className="text-green-700 text-xs">
              {t("printers.lanDescription")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PrinterInformation;
