import { useTranslation } from "react-i18next";
import Modal from "../../common/Modal";

function PrinterFormModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  selectedPrinter,
}) {
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        selectedPrinter
          ? t("printers.editPrinter")
          : t("printers.addNewPrinter")
      }
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Printer Model */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("printers.printerModel")} *
          </label>
          <select
            name="model"
            value={formData.model}
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
            value={formData.connectionType}
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
            onClick={onClose}
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
    </Modal>
  );
}

export default PrinterFormModal;
