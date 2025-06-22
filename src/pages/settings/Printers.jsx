import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import printingService from "../../services/printingService";

// Lazy load components for better performance
const PrintersHeader = lazy(() =>
  import("../../components/settings/printers-management/PrintersHeader")
);
const PrinterTabs = lazy(() =>
  import("../../components/settings/printers-management/PrinterTabs")
);
const PrinterList = lazy(() =>
  import("../../components/settings/printers-management/PrinterList")
);
const PrinterInformation = lazy(() =>
  import("../../components/settings/printers-management/PrinterInformation")
);
const ReceiptSettingsModal = lazy(() =>
  import("../../components/settings/printers-management/ReceiptSettingsModal")
);

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700"></div>
  </div>
);

// Inline Printer Form Component
const PrinterForm = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  selectedPrinter,
}) => {
  const { t } = useTranslation();

  // Available printer models
  const printerModels = [
    { value: "RP-D10", label: "SII RP-D10 (Desktop)" },
    { value: "RP-F10", label: "SII RP-F10 (Desktop)" },
    { value: "Generic", label: "Generic Thermal Printer" },
  ];

  // Connection types
  const connectionTypes = [
    { value: "QZ", label: "QZ Tray (Recommended)" },
    { value: "USB", label: "USB Connection" },
    { value: "LAN", label: "Network (LAN)" },
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleConnectionTypeChange = (e) => {
    const connectionType = e.target.value;
    setFormData((prev) => ({
      ...prev,
      connectionType,
      // Clear IP and port if switching to USB or QZ
      ...((connectionType === "USB" || connectionType === "QZ") && {
        ipAddress: "",
        port: "",
      }),
      // Set default port if switching to LAN
      ...(connectionType === "LAN" && !prev.port && { port: "9100" }),
    }));
  };

  const handleModelChange = (e) => {
    const model = e.target.value;
    let defaultName = "";

    if (model === "RP-D10") {
      defaultName = "SII RP-D10 Thermal Printer";
    } else if (model === "RP-F10") {
      defaultName = "SII RP-F10 Thermal Printer";
    } else if (model === "Generic") {
      defaultName = "Generic Thermal Printer";
    }

    setFormData((prev) => ({
      ...prev,
      model,
      // Update name if it's empty or matches a default pattern
      ...((!prev.name || prev.name.includes("Thermal Printer")) && {
        name: defaultName,
      }),
    }));
  };

  return (
    <div className="bg-white border-2 border-primary-200 rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {selectedPrinter
            ? t("printers.editPrinter")
            : t("printers.addNewPrinter")}
        </h3>
        <button
          onClick={onCancel}
          className="text-red-500 hover:text-red-700 p-1 transition-colors"
          title={t("common.close")}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Printer Model */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("printers.printerModel")} *
          </label>
          <select
            name="model"
            value={formData.model || ""}
            onChange={handleModelChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">{t("printers.selectModel")}</option>
            {printerModels.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
        </div>

        {/* Printer Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("printers.printerName")} *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder={t("printers.enterPrinterName")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Printer Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("printers.printerType")} *
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="customer">{t("printers.customerReceipt")}</option>
            <option value="kitchen">{t("printers.kitchenTicket")}</option>
          </select>
        </div>

        {/* Connection Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("printers.connectionType")} *
          </label>
          <select
            name="connectionType"
            value={formData.connectionType || "QZ"}
            onChange={handleConnectionTypeChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            {connectionTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Network Settings (only show for LAN connection) */}
        {formData.connectionType === "LAN" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* IP Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("printers.ipAddress")} *
                </label>
                <input
                  type="text"
                  name="ipAddress"
                  value={formData.ipAddress}
                  onChange={handleInputChange}
                  required={formData.connectionType === "LAN"}
                  placeholder="192.168.1.100"
                  pattern="^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Port */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("printers.port")} *
                </label>
                <input
                  type="text"
                  name="port"
                  value={formData.port}
                  onChange={handleInputChange}
                  required={formData.connectionType === "LAN"}
                  placeholder="9100"
                  pattern="^[0-9]{1,5}$"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-md">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    {t("printers.networkSetupNote")}
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>{t("printers.networkSetupInstructions")}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* USB Connection Info (only show for USB connection) */}
        {formData.connectionType === "USB" && (
          <div className="p-4 bg-yellow-50 rounded-md">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  {t("printers.usbSetupNote")}
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>{t("printers.usbSetupInstructions")}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QZ Tray Connection Info (only show for QZ connection) */}
        {formData.connectionType === "QZ" && (
          <div className="p-4 bg-green-50 rounded-md">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  {t("printers.qzSetupNote")}
                </h3>
                <div className="mt-2 text-sm text-green-700 space-y-1">
                  <p>{t("printers.qzStep1")}</p>
                  <p>{t("printers.qzStep2")}</p>
                  <p>{t("printers.qzStep3")}</p>
                  <p className="font-medium">{t("printers.qzRecommended")}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Arabic Support Information */}
        {formData.supportArabic && (
          <div className="p-4 bg-blue-50 rounded-md border-l-4 border-blue-400">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Arabic Text Support Enabled
                </h3>
                <div className="mt-2 text-sm text-blue-700 space-y-1">
                  <p>
                    ✓ Arabic characters will be printed correctly using CP864
                    codepage
                  </p>
                  <p>✓ Right-to-left (RTL) text direction is supported</p>
                  <p>✓ Arabic numerals (١٢٣٤٥) are supported</p>
                  <p className="font-medium">
                    Note: Make sure your thermal printer supports Arabic
                    characters
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Paper Width */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("printers.paperWidth")}
          </label>
          <select
            name="paperWidth"
            value={formData.paperWidth}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="58mm">58mm</option>
            <option value="80mm">80mm</option>
          </select>
        </div>

        {/* Settings */}
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDefault"
              name="isDefault"
              checked={formData.isDefault}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
              {t("printers.setAsDefault")}
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoPrint"
              name="autoPrint"
              checked={formData.autoPrint}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="autoPrint" className="ml-2 text-sm text-gray-700">
              {t("printers.autoPrint")}
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="supportArabic"
              name="supportArabic"
              checked={formData.supportArabic}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label
              htmlFor="supportArabic"
              className="ml-2 text-sm text-gray-700"
            >
              {t("printers.supportArabic")}{" "}
              <span className="text-green-600 font-medium">(Recommended)</span>
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enabled"
              name="enabled"
              checked={formData.enabled}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="enabled" className="ml-2 text-sm text-gray-700">
              {t("printers.printerEnabled")}
            </label>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {selectedPrinter ? t("common.update") : t("common.create")}
          </button>
        </div>
      </form>
    </div>
  );
};

function Printers() {
  const { t } = useTranslation();
  const [printers, setPrinters] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isReceiptSettingsOpen, setIsReceiptSettingsOpen] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [activeTab, setActiveTab] = useState("printers");

  const [formData, setFormData] = useState({
    name: "",
    model: "",
    type: "customer",
    connectionType: "QZ",
    ipAddress: "",
    port: "9100",
    paperWidth: "80mm",
    isDefault: false,
    autoPrint: true,
    supportArabic: true,
    enabled: true,
  });

  const [receiptSettings, setReceiptSettings] = useState({
    header: {
      businessName: "",
      address: "",
      city: "",
      phone: "",
      taxId: "",
      customText: "",
    },
    footer: {
      thankYouMessage: "",
      returnPolicy: "",
      customerService: "",
      website: "",
      customText: "",
    },
    display: {
      showCashierName: true,
    },
  });

  // Memoized default printers to prevent recreation on every render
  const defaultPrinters = useMemo(
    () => [
      {
        id: "customer_default",
        name: "Customer Receipt Printer",
        model: "RP-D10",
        type: "customer",
        connectionType: "QZ",
        ipAddress: "",
        port: "",
        paperWidth: "80mm",
        isDefault: true,
        autoPrint: true,
        supportArabic: true,
        enabled: true,
      },
      {
        id: "kitchen_default",
        name: "Kitchen Ticket Printer",
        model: "RP-F10",
        type: "kitchen",
        connectionType: "QZ",
        ipAddress: "",
        port: "",
        paperWidth: "80mm",
        isDefault: true,
        autoPrint: true,
        supportArabic: true,
        enabled: true,
      },
    ],
    []
  );

  // Load printer settings from localStorage on component mount
  useEffect(() => {
    const savedPrinters = localStorage.getItem("printer_settings");
    if (savedPrinters) {
      setPrinters(JSON.parse(savedPrinters));
    } else {
      setPrinters(defaultPrinters);
      localStorage.setItem("printer_settings", JSON.stringify(defaultPrinters));
    }

    // Load receipt settings
    const savedReceiptSettings = printingService.getReceiptSettings();
    setReceiptSettings(savedReceiptSettings);

    // Ensure display property exists and save if it was missing
    if (!savedReceiptSettings.display) {
      const updatedSettings = {
        ...savedReceiptSettings,
        display: {
          showCashierName: true,
        },
      };
      printingService.saveReceiptSettings(updatedSettings);
      setReceiptSettings(updatedSettings);
    }
  }, [defaultPrinters]);

  // Save printers to localStorage whenever printers change
  useEffect(() => {
    if (printers.length > 0) {
      localStorage.setItem("printer_settings", JSON.stringify(printers));
    }
  }, [printers]);

  // Memoized form close handler
  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setSelectedPrinter(null);
    // Reset form data to initial state
    setFormData({
      name: "",
      model: "",
      type: "customer",
      connectionType: "QZ",
      ipAddress: "",
      port: "9100",
      paperWidth: "80mm",
      isDefault: false,
      autoPrint: true,
      supportArabic: true,
      enabled: true,
    });
  }, []);

  // Memoized form submit handler
  const handleFormSubmit = useCallback(
    (e) => {
      e.preventDefault();

      if (selectedPrinter) {
        // Update existing printer
        setPrinters((prev) =>
          prev.map((printer) =>
            printer.id === selectedPrinter.id
              ? { ...formData, id: selectedPrinter.id }
              : printer
          )
        );
        toast.success(t("printers.printerUpdated"));
      } else {
        // Add new printer
        const newPrinter = {
          ...formData,
          id: Date.now().toString(),
        };
        setPrinters((prev) => [...prev, newPrinter]);
        toast.success(t("printers.printerAdded"));
      }

      handleCloseForm();
    },
    [selectedPrinter, formData, handleCloseForm, t]
  );

  // Memoized form open handler
  const handleOpenForm = useCallback((printer = null) => {
    if (printer) {
      setSelectedPrinter(printer);
      setFormData({ ...printer });
    } else {
      setSelectedPrinter(null);
      setFormData({
        name: "",
        model: "",
        type: "customer",
        connectionType: "QZ",
        ipAddress: "",
        port: "9100",
        paperWidth: "80mm",
        isDefault: false,
        autoPrint: true,
        supportArabic: true,
        enabled: true,
      });
    }
    setIsFormOpen(true);
  }, []);

  // Explicit handler for adding new printer
  const handleOpenAddForm = useCallback(() => {
    setSelectedPrinter(null);
    setFormData({
      name: "",
      model: "",
      type: "customer",
      connectionType: "QZ",
      ipAddress: "",
      port: "9100",
      paperWidth: "80mm",
      isDefault: false,
      autoPrint: true,
      supportArabic: true,
      enabled: true,
    });
    setIsFormOpen(true);
  }, []);

  // Memoized delete handler
  const handleDelete = useCallback(
    (printerId) => {
      setPrinters((prev) => prev.filter((printer) => printer.id !== printerId));
      toast.success(t("printers.printerDeleted"));
    },
    [t]
  );

  // Memoized toggle handlers
  const handleToggleDefault = useCallback((printerId) => {
    setPrinters((prev) =>
      prev.map((printer) => ({
        ...printer,
        isDefault:
          printer.id === printerId ? !printer.isDefault : printer.isDefault,
      }))
    );
  }, []);

  const handleToggleEnabled = useCallback((printerId) => {
    setPrinters((prev) =>
      prev.map((printer) =>
        printer.id === printerId
          ? { ...printer, enabled: !printer.enabled }
          : printer
      )
    );
  }, []);

  // Memoized test print handler
  const testPrint = useCallback(
    async (printer) => {
      try {
        await printingService.testPrint(printer);
        toast.success(
          t("printers.testPrintSent", { printerName: printer.name })
        );
      } catch {
        toast.error(
          t("printers.testPrintFailed", { printerName: printer.name })
        );
      }
    },
    [t]
  );

  // Memoized receipt settings handlers
  const handleReceiptSettingsSubmit = useCallback(
    (e) => {
      e.preventDefault();
      printingService.saveReceiptSettings(receiptSettings);
      toast.success(t("printers.receiptSettingsSaved"));
    },
    [receiptSettings, t]
  );

  const resetReceiptSettings = useCallback(() => {
    const defaultSettings = {
      header: {
        businessName: "",
        address: "",
        city: "",
        phone: "",
        taxId: "",
        customText: "",
      },
      footer: {
        thankYouMessage: "",
        returnPolicy: "",
        customerService: "",
        website: "",
        customText: "",
      },
      display: {
        showCashierName: true,
      },
    };
    setReceiptSettings(defaultSettings);
    toast.success(t("printers.receiptSettingsReset"));
  }, [t]);

  // Memoized preview receipt with updated mock data
  const previewReceipt = useCallback(() => {
    const mockOrderData = {
      orderNumber: "12345",
      cashier: "John Smith",
      custName: "Sarah Johnson",
      custPhone: "+1 (555) 123-4567",
      custAddress: "123 Main Street, City, State 12345",
      orderItems: [
        {
          name: "T-Shirt",
          quantity: 1,
          price: 25.5,
          isCancelled: false,
        },
        {
          name: "Watches",
          quantity: 1,
          price: 299.0,
          isCancelled: false,
        },
        {
          name: "Pants",
          quantity: 1,
          price: 32.99,
          isCancelled: false,
        },
        {
          name: "Socks",
          quantity: 1,
          price: 6.5,
          isCancelled: false,
        },
      ],
      tax: 5, // 5% tax
      discount: 10, // 10% discount
      finalTotal: 363.99,
      paymentMethods: [
        {
          method: "cash",
          amount: 400.0,
        },
        {
          method: "visa",
          amount: -36.01,
        },
      ],
    };

    const content = printingService.generateCustomerReceipt(mockOrderData);
    printingService.previewReceipt(content);
  }, []);

  // Memoized modal handlers
  const handleOpenReceiptSettings = useCallback(() => {
    setIsReceiptSettingsOpen(true);
  }, []);

  const handleCloseReceiptSettings = useCallback(() => {
    setIsReceiptSettingsOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <Suspense fallback={<LoadingSpinner />}>
          {/* Header */}
          <PrintersHeader
            onOpenReceiptSettings={handleOpenReceiptSettings}
            onOpenPrinterForm={handleOpenAddForm}
            isFormOpen={isFormOpen}
          />

          {/* Tabs */}
          <PrinterTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Tab Content */}
          <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
            {activeTab === "printers" && (
              <>
                {/* Inline Printer Form - shows when isFormOpen is true */}
                {isFormOpen && (
                  <div className="p-6 border-b border-gray-200">
                    <PrinterForm
                      formData={formData}
                      setFormData={setFormData}
                      onSubmit={handleFormSubmit}
                      onCancel={handleCloseForm}
                      selectedPrinter={selectedPrinter}
                    />
                  </div>
                )}

                {/* Printer List */}
                <PrinterList
                  printers={printers}
                  onToggleDefault={handleToggleDefault}
                  onToggleEnabled={handleToggleEnabled}
                  onTestPrint={testPrint}
                  onEdit={handleOpenForm}
                  onDelete={handleDelete}
                />
              </>
            )}

            {activeTab === "info" && <PrinterInformation />}
          </div>

          {/* Only Receipt Settings Modal remains */}
          <ReceiptSettingsModal
            isOpen={isReceiptSettingsOpen}
            onClose={handleCloseReceiptSettings}
            onSubmit={handleReceiptSettingsSubmit}
            receiptSettings={receiptSettings}
            setReceiptSettings={setReceiptSettings}
            onPreview={previewReceipt}
            onReset={resetReceiptSettings}
          />
        </Suspense>
      </div>
    </div>
  );
}

export default Printers;
