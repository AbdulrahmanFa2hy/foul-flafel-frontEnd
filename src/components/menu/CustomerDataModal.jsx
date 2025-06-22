import { useState } from "react";
import { FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";

function CustomerDataModal({
  isOpen,
  onClose,
  onSave,
  orderType,
  initialData = {},
}) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [customerData, setCustomerData] = useState({
    custName: initialData.custName || "",
    custPhone: initialData.custPhone || "",
    custAddress: initialData.custAddress || "",
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (orderType === "delivery") {
      if (!customerData.custName.trim()) {
        newErrors.custName = t("customerModal.customerNameRequired");
      }
      if (!customerData.custPhone.trim()) {
        newErrors.custPhone = t("customerModal.phoneNumberRequired");
      }
      if (!customerData.custAddress.trim()) {
        newErrors.custAddress = t("customerModal.addressRequired");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(customerData);
      // Don't call onClose here - let parent handle it through onSave
    }
  };

  const handleClear = () => {
    setCustomerData({
      custName: "",
      custPhone: "",
      custAddress: "",
    });
    setErrors({});
  };

  const handleClose = () => {
    // For delivery orders, don't allow closing without valid data
    if (orderType === "delivery" && !validateForm()) {
      return;
    }
    onClose();
  };

  const handleBackdropClick = (e) => {
    // Close modal if clicking on backdrop (outside the modal content)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleInputChange = (field, value) => {
    setCustomerData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div
          className={`flex justify-between items-center p-6 border-b border-gray-200 ${
            isRTL ? "flex-row-reverse" : ""
          }`}
        >
          <h2 className="text-lg font-semibold text-gray-900">
            {t("customerModal.customerInformation")}
            <span className="text-sm text-gray-500 ml-2">
              (
              {orderType === "delivery"
                ? t("customerModal.required")
                : t("customerModal.optional")}
              )
            </span>
          </h2>
          {orderType === "takeaway" && (
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("customerModal.customerName")}{" "}
              {orderType === "delivery" && (
                <span className="text-red-500">*</span>
              )}
            </label>
            <input
              type="text"
              value={customerData.custName}
              onChange={(e) => handleInputChange("custName", e.target.value)}
              placeholder={t("customerModal.enterCustomerName")}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.custName ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.custName && (
              <p className="text-red-500 text-xs mt-1">{errors.custName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("customerModal.phoneNumber")}{" "}
              {orderType === "delivery" && (
                <span className="text-red-500">*</span>
              )}
            </label>
            <input
              type="tel"
              value={customerData.custPhone}
              onChange={(e) => handleInputChange("custPhone", e.target.value)}
              placeholder={t("customerModal.enterPhoneNumber")}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.custPhone ? "border-red-500" : "border-gray-300"
              } ${isRTL ? "placeholder:text-right text-right" : ""}`}
            />
            {errors.custPhone && (
              <p className="text-red-500 text-xs mt-1">{errors.custPhone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("customerModal.address")}{" "}
              {orderType === "delivery" && (
                <span className="text-red-500">*</span>
              )}
            </label>
            <textarea
              value={customerData.custAddress}
              onChange={(e) => handleInputChange("custAddress", e.target.value)}
              placeholder={t("customerModal.enterDeliveryAddress")}
              rows="3"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${
                errors.custAddress ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.custAddress && (
              <p className="text-red-500 text-xs mt-1">{errors.custAddress}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className={`flex justify-end space-x-3 p-6 border-t border-gray-200 ${
            isRTL ? "flex-row-reverse space-x-reverse" : ""
          }`}
        >
          {orderType === "takeaway" && (
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              {t("customerModal.skip")}
            </button>
          )}
          <button
            onClick={handleClear}
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            {t("customerModal.clear")}
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-2 bg-primary-700 text-white rounded-md hover:bg-primary-800 transition-colors"
          >
            {t("customerModal.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomerDataModal;
