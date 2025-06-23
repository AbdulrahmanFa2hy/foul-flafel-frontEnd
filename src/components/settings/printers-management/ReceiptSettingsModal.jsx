import { FaCog, FaEye, FaUndo, FaTimes, FaSave, FaUser } from "react-icons/fa";
import { memo } from "react";
import { useTranslation } from "react-i18next";

const ReceiptSettingsModal = memo(function ReceiptSettingsModal({
  isOpen,
  onClose,
  onSubmit,
  receiptSettings,
  setReceiptSettings,
  onPreview,
  onReset,
}) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={(e) => {
        // Close modal if clicking on the backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto shadow-2xl"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="p-3 sm:p-6">
          {/* Action Buttons - Top on large screens */}
          <div
            className={`hidden sm:flex justify-end items-center gap-2 mb-6 ${
              isRTL ? "flex-row-reverse" : ""
            }`}
          >
            <button
              onClick={onPreview}
              className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm sm:text-base"
            >
              <FaEye className={`${isRTL ? "ml-1 sm:ml-2" : "mr-1 sm:mr-2"}`} />
              <span className="hidden sm:inline">
                {t("receiptSettings.preview")}
              </span>
            </button>
            <button
              onClick={onReset}
              className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center text-sm sm:text-base"
            >
              <FaUndo
                className={`${isRTL ? "ml-1 sm:ml-2" : "mr-1 sm:mr-2"}`}
              />
              <span className="hidden sm:inline">
                {t("receiptSettings.reset")}
              </span>
            </button>
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center text-sm sm:text-base"
            >
              <FaTimes
                className={`${isRTL ? "ml-1 sm:ml-2" : "mr-1 sm:mr-2"}`}
              />
              <span className="hidden sm:inline">
                {t("receiptSettings.close")}
              </span>
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
            {/* Header Settings */}
            <div className="bg-primary-50 rounded-xl p-3 sm:p-6">
              <h3
                className={`text-base sm:text-lg font-semibold text-primary-800 mb-4 flex items-center justify-start`}
              >
                <FaCog className={`${isRTL ? "ml-2" : "mr-2"}`} />
                {t("receiptSettings.headerSettings")}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("receiptSettings.businessName")}
                    </label>
                    <input
                      type="text"
                      value={receiptSettings.header.businessName}
                      onChange={(e) =>
                        setReceiptSettings((prev) => ({
                          ...prev,
                          header: {
                            ...prev.header,
                            businessName: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                      placeholder={t("receiptSettings.leaveEmptyToHide")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("receiptSettings.businessNameAr")}
                    </label>
                    <input
                      type="text"
                      value={receiptSettings.header.businessNameAr || ""}
                      onChange={(e) =>
                        setReceiptSettings((prev) => ({
                          ...prev,
                          header: {
                            ...prev.header,
                            businessNameAr: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                      placeholder="اتركه فارغاً لإخفائه"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("receiptSettings.address")}
                    </label>
                    <input
                      type="text"
                      value={receiptSettings.header.address}
                      onChange={(e) =>
                        setReceiptSettings((prev) => ({
                          ...prev,
                          header: {
                            ...prev.header,
                            address: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                      placeholder={t("receiptSettings.leaveEmptyToHide")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("receiptSettings.addressAr")}
                    </label>
                    <input
                      type="text"
                      value={receiptSettings.header.addressAr || ""}
                      onChange={(e) =>
                        setReceiptSettings((prev) => ({
                          ...prev,
                          header: {
                            ...prev.header,
                            addressAr: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                      placeholder="اتركه فارغاً لإخفائه"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("receiptSettings.cityStateZip")}
                    </label>
                    <input
                      type="text"
                      value={receiptSettings.header.city}
                      onChange={(e) =>
                        setReceiptSettings((prev) => ({
                          ...prev,
                          header: { ...prev.header, city: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                      placeholder={t("receiptSettings.leaveEmptyToHide")}
                    />
                  </div>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("receiptSettings.phoneNumber")}
                    </label>
                    <input
                      type="text"
                      value={receiptSettings.header.phone}
                      onChange={(e) =>
                        setReceiptSettings((prev) => ({
                          ...prev,
                          header: { ...prev.header, phone: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                      placeholder={t("receiptSettings.leaveEmptyToHide")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("receiptSettings.phoneNumberAr")}
                    </label>
                    <input
                      type="text"
                      value={receiptSettings.header.phoneAr || ""}
                      onChange={(e) =>
                        setReceiptSettings((prev) => ({
                          ...prev,
                          header: { ...prev.header, phoneAr: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                      placeholder="اتركه فارغاً لإخفائه"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("receiptSettings.taxId")}
                    </label>
                    <input
                      type="text"
                      value={receiptSettings.header.taxId}
                      onChange={(e) =>
                        setReceiptSettings((prev) => ({
                          ...prev,
                          header: { ...prev.header, taxId: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                      placeholder={t("receiptSettings.leaveEmptyToHide")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("receiptSettings.customText")}
                    </label>
                    <input
                      type="text"
                      value={receiptSettings.header.customText}
                      onChange={(e) =>
                        setReceiptSettings((prev) => ({
                          ...prev,
                          header: {
                            ...prev.header,
                            customText: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                      placeholder={t("receiptSettings.additionalHeaderText")}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Display Settings */}
            <div className="bg-purple-50 rounded-xl p-3 sm:p-6">
              <h3
                className={`text-base sm:text-lg font-semibold text-purple-800 mb-4 flex items-center justify-start`}
              >
                <FaUser className={`${isRTL ? "ml-2" : "mr-2"}`} />
                {t("receiptSettings.displaySettings")}
              </h3>
              <div className="space-y-3">
                <div className={`flex items-center justify-start`}>
                  <input
                    type="checkbox"
                    id="showCashierName"
                    checked={receiptSettings.display?.showCashierName || false}
                    onChange={(e) =>
                      setReceiptSettings((prev) => ({
                        ...prev,
                        display: {
                          ...prev.display,
                          showCashierName: e.target.checked,
                        },
                      }))
                    }
                    className={`${
                      isRTL ? "ml-3" : "mr-3"
                    } w-4 h-4 text-purple-600 focus:ring-purple-500 focus:ring-2`}
                  />
                  <label
                    htmlFor="showCashierName"
                    className="text-sm font-medium text-gray-700"
                  >
                    {t("receiptSettings.showCashierName")}
                  </label>
                </div>
                <p
                  className={`text-xs text-gray-500 ${isRTL ? "mr-7" : "ml-7"}`}
                >
                  {t("receiptSettings.cashierNameDescription")}
                </p>
              </div>
            </div>

            {/* Footer Settings */}
            <div className="bg-green-50 rounded-xl p-3 sm:p-6">
              <h3
                className={`text-base sm:text-lg font-semibold text-green-800 mb-4 flex items-center justify-start`}
              >
                <FaCog className={`${isRTL ? "ml-2" : "mr-2"}`} />
                {t("receiptSettings.footerSettings")}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("receiptSettings.thankYouMessage")}
                    </label>
                    <input
                      type="text"
                      value={receiptSettings.footer.thankYouMessage}
                      onChange={(e) =>
                        setReceiptSettings((prev) => ({
                          ...prev,
                          footer: {
                            ...prev.footer,
                            thankYouMessage: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                      placeholder={t("receiptSettings.leaveEmptyToHide")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("receiptSettings.thankYouMessageAr")}
                    </label>
                    <input
                      type="text"
                      value={receiptSettings.footer.thankYouMessageAr || ""}
                      onChange={(e) =>
                        setReceiptSettings((prev) => ({
                          ...prev,
                          footer: {
                            ...prev.footer,
                            thankYouMessageAr: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                      placeholder="اتركه فارغاً لإخفائه"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("receiptSettings.returnPolicy")}
                    </label>
                    <input
                      type="text"
                      value={receiptSettings.footer.returnPolicy}
                      onChange={(e) =>
                        setReceiptSettings((prev) => ({
                          ...prev,
                          footer: {
                            ...prev.footer,
                            returnPolicy: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                      placeholder={t("receiptSettings.leaveEmptyToHide")}
                    />
                  </div>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("receiptSettings.customerService")}
                    </label>
                    <input
                      type="text"
                      value={receiptSettings.footer.customerService}
                      onChange={(e) =>
                        setReceiptSettings((prev) => ({
                          ...prev,
                          footer: {
                            ...prev.footer,
                            customerService: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                      placeholder={t("receiptSettings.leaveEmptyToHide")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("receiptSettings.website")}
                    </label>
                    <input
                      type="text"
                      value={receiptSettings.footer.website}
                      onChange={(e) =>
                        setReceiptSettings((prev) => ({
                          ...prev,
                          footer: {
                            ...prev.footer,
                            website: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                      placeholder={t("receiptSettings.leaveEmptyToHide")}
                    />
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("receiptSettings.customFooterText")}
                  </label>
                  <textarea
                    value={receiptSettings.footer.customText}
                    onChange={(e) =>
                      setReceiptSettings((prev) => ({
                        ...prev,
                        footer: {
                          ...prev.footer,
                          customText: e.target.value,
                        },
                      }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                    placeholder={t("receiptSettings.additionalFooterText")}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons - Mobile at bottom, Desktop Save button */}
            <div className="pt-4 sm:pt-6">
              {/* Desktop Save Button */}
              <div className={`hidden sm:flex justify-start`}>
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                >
                  <FaSave className={`${isRTL ? "ml-2" : "mr-2"}`} />
                  {t("receiptSettings.saveSettings")}
                </button>
              </div>

              {/* Mobile Buttons */}
              <div className="sm:hidden space-y-3">
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
                >
                  <FaSave className={`${isRTL ? "ml-2" : "mr-2"}`} />
                  {t("receiptSettings.saveSettings")}
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={onPreview}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center text-sm"
                  >
                    <FaEye className={`${isRTL ? "ml-1" : "mr-1"}`} />
                    {t("receiptSettings.preview")}
                  </button>
                  <button
                    type="button"
                    onClick={onReset}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center text-sm"
                  >
                    <FaUndo className={`${isRTL ? "ml-1" : "mr-1"}`} />
                    {t("receiptSettings.reset")}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {t("receiptSettings.close")}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});

export default ReceiptSettingsModal;
