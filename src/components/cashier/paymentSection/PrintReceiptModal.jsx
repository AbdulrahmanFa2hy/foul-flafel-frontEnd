import { useState } from "react";
import { FaTimes, FaPrint, FaReceipt, FaUtensils } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import printingService from "../../../services/printingService";

function PrintReceiptModal({ order, onClose }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { user } = useSelector((state) => state.auth);
  const [printing, setPrinting] = useState(false);

  // Prepare order data for printing
  const prepareOrderData = () => {
    // Get payment methods from the order or create default
    let paymentMethods = [];
    if (order.paymentMethods && order.paymentMethods.length > 0) {
      paymentMethods = order.paymentMethods;
    } else if (order.isPaid) {
      // If order is paid but no payment methods, assume cash payment
      paymentMethods = [
        {
          method: "cash",
          amount: order.totalPrice || order.total || 0,
        },
      ];
    }

    return {
      ...order,
      orderNumber: order.orderCode || order._id?.slice(-8) || "N/A",
      cashier: user?.name || "System",
      paymentMethods,
      tax: order.tax || 0,
      discount: order.discount || 0,
      finalTotal: order.totalPrice || order.total || 0,
      // Ensure order items have proper names - use the order's existing data structure
      orderItems: order.orderItems || [],
      // Pass the orderItemsData for meal lookup if available
      orderItemsData: order.orderItemsData || [],
      // Include customer data for the receipt
      custName: order.custName || "",
      custPhone: order.custPhone || order.custtPhone || "",
      custAddress: order.custAddress || "",
    };
  };

  const handlePrintCustomer = async () => {
    setPrinting(true);
    try {
      const orderData = prepareOrderData();
      await printingService.printCustomerReceipt(orderData);
      toast.success(t("payment.customerReceiptPrinted"), { icon: "🖨️" });
      onClose();
    } catch (error) {
      console.error("Customer receipt printing failed:", error);
      toast.error(t("payment.customerReceiptFailed"));
    } finally {
      setPrinting(false);
    }
  };

  const handlePrintKitchen = async () => {
    setPrinting(true);
    try {
      const orderData = prepareOrderData();
      await printingService.printKitchenTicket(orderData);
      toast.success(t("payment.kitchenTicketPrinted"), { icon: "🖨️" });
      onClose();
    } catch (error) {
      console.error("Kitchen ticket printing failed:", error);
      toast.error(t("payment.kitchenTicketFailed"));
    } finally {
      setPrinting(false);
    }
  };

  const handlePrintBoth = async () => {
    setPrinting(true);
    try {
      const orderData = prepareOrderData();
      const results = await printingService.printBothReceipts(orderData);

      const successCount = results.filter((result) => result.success).length;
      const failCount = results.filter((result) => !result.success).length;

      if (successCount > 0 && failCount === 0) {
        toast.success(t("payment.bothReceiptsPrinted"), { icon: "🖨️" });
      } else if (successCount > 0 && failCount > 0) {
        toast.success(
          `${successCount} ${t("payment.someReceiptsFailed")} ${failCount}`,
          { icon: "⚠️" }
        );
      } else {
        toast.error(t("payment.printFailed"));
      }
      onClose();
    } catch (error) {
      console.error("Printing failed:", error);
      toast.error(t("payment.printFailed"));
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="fixed left-0 -top-14 w-full h-[120%] inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-lg max-w-md w-full"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="p-6">
          {/* Header */}
          <div
            className={`flex justify-between items-center mb-6 ${
              isRTL ? "flex-row-reverse" : ""
            }`}
          >
            <h2 className="text-xl font-bold text-gray-800">
              {t("payment.printReceipt")}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={printing}
            >
              <FaTimes size={20} />
            </button>
          </div>

          {/* Receipt Type Selection */}
          <div className="space-y-3">
            {/* Customer Receipt Button */}
            <button
              onClick={handlePrintCustomer}
              disabled={printing}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div
                className={`flex items-center ${
                  isRTL ? "flex-row-reverse" : ""
                }`}
              >
                <FaReceipt
                  className={`text-blue-500 ${isRTL ? "ml-3" : "mr-3"}`}
                  size={20}
                />
                <div className={`${isRTL ? "text-right" : "text-left"}`}>
                  <div className="font-medium text-gray-800">
                    {t("payment.customerReceipt")}
                  </div>
                  <div className="text-sm text-gray-500">
                    {t("payment.customerReceiptDesc")}
                  </div>
                </div>
              </div>
              <FaPrint className="text-gray-400" />
            </button>

            {/* Kitchen Ticket Button */}
            <button
              onClick={handlePrintKitchen}
              disabled={printing}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div
                className={`flex items-center ${
                  isRTL ? "flex-row-reverse" : ""
                }`}
              >
                <FaUtensils
                  className={`text-orange-500 ${isRTL ? "ml-3" : "mr-3"}`}
                  size={20}
                />
                <div className={`${isRTL ? "text-right" : "text-left"}`}>
                  <div className="font-medium text-gray-800">
                    {t("payment.kitchenTicket")}
                  </div>
                  <div className="text-sm text-gray-500">
                    {t("payment.kitchenTicketDesc")}
                  </div>
                </div>
              </div>
              <FaPrint className="text-gray-400" />
            </button>

            {/* Both Receipts Button */}
            <button
              onClick={handlePrintBoth}
              disabled={printing}
              className="w-full flex items-center justify-between p-4 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 hover:border-primary-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div
                className={`flex items-center ${
                  isRTL ? "flex-row-reverse" : ""
                }`}
              >
                <FaPrint
                  className={`text-primary-600 ${isRTL ? "ml-3" : "mr-3"}`}
                  size={20}
                />
                <div className={`${isRTL ? "text-right" : "text-left"}`}>
                  <div className="font-medium text-primary-800">
                    {t("payment.printBoth")}
                  </div>
                  <div className="text-sm text-primary-600">
                    {t("payment.printBothDesc")}
                  </div>
                </div>
              </div>
              <FaPrint className="text-primary-400" />
            </button>
          </div>

          {/* Loading State */}
          {printing && (
            <div className="mt-4 flex items-center justify-center py-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-700 mr-3"></div>
              <span className="text-gray-600">{t("payment.printing")}</span>
            </div>
          )}

          {/* Cancel Button */}
          <div className="mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              disabled={printing}
              className="w-full py-2 px-4 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrintReceiptModal;
