import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

function CashierHeader({ selectedOrder }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const currentDate = new Date();
  const formattedDate = format(currentDate, "EEEE, d MMMM, yyyy", {
    locale: i18n.language === "ar" ? ar : undefined,
  });

  const isDeliveryOrder = selectedOrder?.type === "delivery";
  const hasCustomerData =
    selectedOrder?.custName ||
    selectedOrder?.custPhone ||
    selectedOrder?.custAddress;

  return (
    <div
      className={`flex justify-between mb-2 ${isRTL ? "flex-row-reverse" : ""}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Customer Info for Delivery Orders */}
      {isDeliveryOrder && hasCustomerData && (
        <div
          className={`flex justify-start items-center gap-6 overflow-x-auto scrollbar-hide flex-1 min-w-0`}
        >
          {selectedOrder.custName && (
            <div className={`flex items-center gap-1 flex-shrink-0`}>
              <span className="text-gray-600 font-medium">
                {t("cashier.name")}:
              </span>
              <span className="text-primary-800">{selectedOrder.custName}</span>
            </div>
          )}
          {selectedOrder.custPhone && (
            <div
              className={`flex items-center gap-1 justify-start flex-shrink-0`}
            >
              <span className="text-gray-600 font-medium">
                {t("cashier.phone")}:
              </span>
              <span className="text-primary-800">
                {selectedOrder.custPhone}
              </span>
            </div>
          )}
          {selectedOrder.custAddress && (
            <div
              className={`flex items-center gap-1 justify-start flex-shrink-0`}
            >
              <span className="text-gray-600 font-medium">
                {t("cashier.address")}:
              </span>
              <span className="text-primary-800 break-words">
                {selectedOrder.custAddress}
              </span>
            </div>
          )}
        </div>
      )}
      <div
        className={`text-sm text-gray-600 font-medium hidden xl:inline-block ${
          isDeliveryOrder && hasCustomerData ? "ml-4 flex-shrink-0" : "ml-auto"
        }`}
      >
        {formattedDate}
      </div>
    </div>
  );
}

export default CashierHeader;
