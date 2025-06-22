import { useTranslation } from "react-i18next";

function PaymentModeToggle({ paymentMode, setPaymentMode }) {
  const { t } = useTranslation();

  return (
    <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
      <button
        type="button"
        onClick={() => setPaymentMode("single")}
        className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
          paymentMode === "single"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        {t("payment.singlePayment")}
      </button>
      <button
        type="button"
        onClick={() => setPaymentMode("split")}
        className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
          paymentMode === "split"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        {t("payment.splitPayment")}
      </button>
    </div>
  );
}

export default PaymentModeToggle;
