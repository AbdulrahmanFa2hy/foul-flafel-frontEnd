import { useTranslation } from "react-i18next";

function ShiftEndSummary({
  shift,
  onAcknowledge,
  showAcknowledgeButton = false,
  onClose,
  showCloseButton = false,
}) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  if (!shift) return null;

  // Calculate expected cash balance (starting cash + cash payments received)
  const expectedCashBalance =
    (shift.startBalance || 0) + (shift.paymentWithCashBalance || 0);

  // Calculate cash variance (actual count vs expected)
  const cashVariance = (shift.endBalance || 0) - expectedCashBalance;

  // Calculate total revenue for the shift
  const totalRevenue =
    (shift.paymentWithCashBalance || 0) + (shift.paymentWithVisaBalance || 0);

  const formatCurrency = (amount) => {
    const numericAmount = Number(amount) || 0;
    return `${numericAmount.toFixed(2)} AED`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(
      i18n.language === "ar" ? "ar-AE" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-1 sm:p-4 z-50">
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="p-2 pt-3 sm:p-6 sm:pt-0">
          {/* Header with close button */}
          <div
            className={`flex justify-between items-center mb-6 ${
              isRTL ? "flex-row-reverse" : ""
            }`}
          >
            {showCloseButton && onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
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
            )}
          </div>

          {/* Success Header for acknowledgment mode */}
          {showAcknowledgeButton && (
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">🎉</div>
              <p className="text-sm text-gray-600 mb-6">
                {t("shiftSummary.shiftCompletedMessage")}
              </p>
            </div>
          )}

          {/* Cash Balance Summary Card */}
          <div
            className={`rounded-lg border-2 p-2 sm:p-6 mb-6 ${
              Math.abs(cashVariance) < 0.01
                ? "bg-green-50 border-green-200"
                : Math.abs(cashVariance) <= 5
                ? "bg-yellow-50 border-yellow-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="text-center mb-4">
              <h3 className="text-base sm:text-2xl font-bold text-gray-900 mb-2">
                {Math.abs(cashVariance) < 0.01
                  ? t("shiftSummary.perfectBalance")
                  : cashVariance > 0
                  ? t("shiftSummary.cashOver")
                  : t("shiftSummary.cashShort")}
              </h3>
              <div className="grid grid-cols-3 gap-1 sm:gap-4 max-w-md mx-auto">
                <div>
                  <p className="text-sm text-gray-600">
                    {t("shiftSummary.expected")}
                  </p>
                  <p className="text-sm sm:text-lg font-bold">
                    {formatCurrency(expectedCashBalance)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {t("shiftSummary.actual")}
                  </p>
                  <p className="text-sm sm:text-lg font-bold">
                    {formatCurrency(shift.endBalance)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {t("shiftSummary.difference")}
                  </p>
                  <p
                    className={`text-sm sm:text-lg font-bold ${
                      Math.abs(cashVariance) < 0.01
                        ? "text-green-600"
                        : cashVariance > 0
                        ? "text-blue-600"
                        : "text-red-600"
                    }`}
                  >
                    {cashVariance > 0 ? "+" : ""}
                    {formatCurrency(Math.abs(cashVariance))}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Shift Summary */}
          <div className="bg-gray-50 rounded-lg sm:p-6 mb-6">
            <h4
              className={`text-lg font-semibold text-gray-900 mb-4 ${
                isRTL ? "text-right" : "text-left"
              }`}
            >
              {t("shiftSummary.shiftSummary")}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className={`space-y-3 text-start`}>
                <div className={`flex justify-between text-start`}>
                  <span className="text-gray-600">
                    {t("shiftSummary.cashier")}:
                  </span>
                  <span className="font-medium">
                    {shift.cashierData?.name || "Unknown"}
                  </span>
                </div>
                <div className={`flex justify-between text-start`}>
                  <span className="text-gray-600">
                    {t("shiftSummary.shiftStarted")}:
                  </span>
                  <span className="font-medium">
                    {formatDate(shift.createdAt)}
                  </span>
                </div>
                <div className={`flex justify-between text-start`}>
                  <span className="text-gray-600">
                    {t("shiftSummary.shiftEnded")}:
                  </span>
                  <span className="font-medium">
                    {formatDate(shift.endedAt || shift.updatedAt)}
                  </span>
                </div>
                <div className={`flex justify-between text-start`}>
                  <span className="text-gray-600">
                    {t("shiftSummary.duration")}:
                  </span>
                  <span className="font-medium">
                    {(() => {
                      const start = new Date(shift.createdAt);
                      const end = new Date(shift.endedAt || shift.updatedAt);
                      const diffMs = end - start;
                      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                      const diffMinutes = Math.floor(
                        (diffMs % (1000 * 60 * 60)) / (1000 * 60)
                      );
                      return `${diffHours}${t(
                        "shifts.hours"
                      )} ${diffMinutes}${t("shifts.minutes")}`;
                    })()}
                  </span>
                </div>
                <div className={`flex justify-between text-start`}>
                  <span className="text-gray-600">
                    {t("shiftSummary.totalOrders")}:
                  </span>
                  <span className="font-medium">
                    {shift.allOrdersCount || 0}
                  </span>
                </div>
                <div className={`flex justify-between text-start`}>
                  <span className="text-gray-600">
                    {t("shiftSummary.itemsSold")}:
                  </span>
                  <span className="font-medium">
                    {shift.soldItemsCount || 0}
                  </span>
                </div>
                <div className={`flex justify-between text-start`}>
                  <span className="text-gray-600">
                    {t("shiftSummary.cancelledOrders")}:
                  </span>
                  <span className="font-medium text-red-600">
                    {shift.cancelledOrdersCount || 0}
                  </span>
                </div>
                <div className={`flex justify-between text-start`}>
                  <span className="text-gray-600">
                    {t("shiftSummary.unpaidOrders")}:
                  </span>
                  <span className="font-medium text-orange-600">
                    {shift.notPaidOrdersCount || 0}
                  </span>
                </div>
              </div>

              <div className={`space-y-3 text-start`}>
                <div className={`flex justify-between text-start`}>
                  <span className="text-gray-600">
                    {t("shiftSummary.startingBalance")}:
                  </span>
                  <span className="font-medium">
                    {formatCurrency(shift.startBalance)}
                  </span>
                </div>
                <div className={`flex justify-between text-start`}>
                  <span className="text-gray-600">
                    {t("shiftSummary.endingBalance")}:
                  </span>
                  <span className="font-medium">
                    {formatCurrency(shift.endBalance)}
                  </span>
                </div>
                <div className={`flex justify-between text-start`}>
                  <span className="text-gray-600">
                    {t("shiftSummary.cashPayments")}:
                  </span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(shift.paymentWithCashBalance)}
                  </span>
                </div>
                <div className={`flex justify-between text-start`}>
                  <span className="text-gray-600">
                    {t("shiftSummary.cardPayments")}:
                  </span>
                  <span className="font-medium text-blue-600">
                    {formatCurrency(shift.paymentWithVisaBalance)}
                  </span>
                </div>
                <div className={`flex justify-between text-start`}>
                  <span className="text-gray-600">
                    {t("shiftSummary.totalSales")}:
                  </span>
                  <span className="font-medium text-primary-600">
                    {formatCurrency(totalRevenue)}
                  </span>
                </div>
                <div
                  className={`flex justify-between pt-2 border-t text-start`}
                >
                  <span className="text-gray-600 font-medium">
                    {t("shiftSummary.cashVariance")}:
                  </span>
                  <span
                    className={`font-bold ${
                      Math.abs(cashVariance) < 0.01
                        ? "text-gray-600"
                        : cashVariance > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {cashVariance > 0 ? "+" : ""}
                    {formatCurrency(Math.abs(cashVariance))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            {showAcknowledgeButton && onAcknowledge && (
              <button
                onClick={onAcknowledge}
                className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                {t("shiftSummary.reviewedStartNew")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShiftEndSummary;
