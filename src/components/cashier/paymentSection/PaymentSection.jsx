import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { processPayment } from "../../../store/paymentSlice";
import { fetchAllOrders } from "../../../store/orderSlice";
import NumberInput from "./NumberInput";
import PaymentMethodSelect from "./PaymentMethodSelect";
import OrderSummary from "./OrderSummary";
import PaymentModeToggle from "./PaymentModeToggle";
import SplitPaymentRow from "./SplitPaymentRow";
import printingService from "../../../services/printingService";

// Lazy load print receipt modal
const PrintReceiptModal = lazy(() => import("./PrintReceiptModal"));

function PaymentSection({
  tax,
  setTax,
  discount,
  setDiscount,
  subtotal,
  discountAmount,
}) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentOrder } = useSelector((state) => state.order);
  const { loading } = useSelector((state) => state.payment);
  const { currentShift } = useSelector((state) => state.shift);
  const { user } = useSelector((state) => state.auth);

  const [paymentMode, setPaymentMode] = useState("single");
  const [singlePaymentMethod, setSinglePaymentMethod] = useState("cash");
  const [splitPayments, setSplitPayments] = useState([
    { method: "cash", amount: "" },
    { method: "visa", amount: "" },
  ]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [hasProcessedPayment, setHasProcessedPayment] = useState(false);

  // Calculate tax amount and final total
  const taxAmount = (subtotal * (tax || 0)) / 100;
  const finalTotal = subtotal - discountAmount + taxAmount;

  // Auto-print receipts after successful payment (currently disabled)
  // const handleAutoPrint = async (orderData) => {
  //   try {
  //     const printResults = await printingService.printBothReceipts(orderData);

  //     const successCount = printResults.filter(
  //       (result) => result.success
  //     ).length;
  //     const failCount = printResults.filter((result) => !result.success).length;

  //     if (successCount > 0 && failCount === 0) {
  //       // toast.success(t("payment.receiptsPrinted"), { icon: "🖨️" });
  //     } else if (successCount > 0 && failCount > 0) {
  //       toast.success(
  //         `${successCount} ${t("payment.someReceiptsFailed")} ${failCount}`,
  //         { icon: "⚠️" }
  //       );
  //     } else {
  //       toast.error(t("payment.printFailed"), { icon: "❌" });
  //     }
  //   } catch (error) {
  //     console.error("Auto-print failed:", error);
  //     toast.error(t("payment.autoPrintFailed"));
  //   }
  // };

  // Split payment handlers
  const handleSplitMethodChange = useCallback((index, method) => {
    setSplitPayments((prev) => {
      const updated = [...prev];
      updated[index].method = method;
      return updated;
    });
  }, []);

  const handleSplitAmountChange = useCallback((index, amount) => {
    setSplitPayments((prev) => {
      const updated = [...prev];
      updated[index].amount = amount;
      return updated;
    });
  }, []);

  // Calculate remaining amount for split payments
  const totalSplitAmount = splitPayments.reduce((sum, payment) => {
    const amount = parseFloat(payment.amount) || 0;
    return sum + amount;
  }, 0);
  const remainingAmount = finalTotal - totalSplitAmount;

  // Validation helpers
  const validateSplitPayments = () => {
    const validPayments = splitPayments.filter((payment) => {
      const amount = parseFloat(payment.amount) || 0;
      return amount > 0;
    });

    if (validPayments.length === 0) {
      return {
        isValid: false,
        message: t("payment.enterPaymentAmount"),
      };
    }

    // Allow overpayment but process only the required amount
    const totalPaid = validPayments.reduce((sum, payment) => {
      return sum + parseFloat(payment.amount);
    }, 0);

    if (totalPaid < finalTotal) {
      return {
        isValid: false,
        message: `${t("payment.needMoreAmount")} ${(
          finalTotal - totalPaid
        ).toFixed(2)} AED`,
      };
    }

    // If overpaid, adjust the payments to match the required total
    if (totalPaid > finalTotal) {
      const adjustedPayments = [...validPayments];
      let remaining = finalTotal;

      for (let i = 0; i < adjustedPayments.length; i++) {
        const paymentAmount = parseFloat(adjustedPayments[i].amount);
        if (remaining >= paymentAmount) {
          remaining -= paymentAmount;
        } else {
          adjustedPayments[i].amount = remaining;
          remaining = 0;
          // Remove any remaining payments
          adjustedPayments.splice(i + 1);
          break;
        }
      }

      return { isValid: true, payments: adjustedPayments };
    }

    return { isValid: true, payments: validPayments };
  };

  const handlePayment = async () => {
    if (!currentOrder) {
      toast.error(t("payment.noOrderSelected"));
      return;
    }

    // Check if order is cancelled
    if (currentOrder.isCancelled) {
      toast.error(t("payment.cannotPayCancelledOrder"));
      return;
    }

    // Check if order is already paid
    if (currentOrder.isPaid) {
      toast.error(t("payment.orderAlreadyPaid"));
      return;
    }

    // Prevent multiple payment processing
    if (hasProcessedPayment) {
      console.log("Payment already processed for this order");
      return;
    }

    setHasProcessedPayment(true);

    try {
      let paymentMethods = [];

      if (paymentMode === "single") {
        paymentMethods = [
          {
            method: singlePaymentMethod,
            amount: finalTotal,
          },
        ];
      } else {
        const validation = validateSplitPayments();
        if (!validation.isValid) {
          toast.error(validation.message);
          return;
        }
        paymentMethods = validation.payments.map((payment) => ({
          method: payment.method,
          amount: parseFloat(payment.amount),
        }));
      }

      const result = await dispatch(
        processPayment({
          orderId: currentOrder._id,
          paymentMethods,
          tax: tax || 0,
          discount: discount || 0,
        })
      ).unwrap();

      // Handle already paid scenario
      if (result.alreadyPaid) {
        toast.success(t("payment.alreadyPaidSuccess"), {
          duration: 3000,
          icon: "✅",
        });

        // Refresh orders to get updated data
        if (currentShift?._id) {
          await dispatch(fetchAllOrders({ shiftId: currentShift._id }));
        } else {
          await dispatch(fetchAllOrders());
        }

        // Navigate to menu page
        setTimeout(() => {
          navigate("/menu");
        }, 1500);
        return;
      }

      // Refresh orders to get updated data
      if (currentShift?._id) {
        await dispatch(fetchAllOrders({ shiftId: currentShift._id }));
      } else {
        await dispatch(fetchAllOrders());
      }

      toast.success(t("payment.paymentSuccess"), {
        duration: 3000,
        icon: "✅",
      });

      // Navigate to menu page after successful payment
      setTimeout(() => {
        navigate("/menu");
      }, 1500); // Short delay to let the user see the success message

      // Print customer receipt after successful payment (only once)
      const orderData = {
        ...currentOrder,
        orderNumber:
          currentOrder.orderCode || currentOrder._id?.slice(-8) || "N/A",
        cashier: user?.name || "System",
        paymentMethods,
        tax: tax || 0,
        discount: discount || 0,
        finalTotal,
        subtotal,
        orderItems: currentOrder.orderItems || [],
        orderItemsData: currentOrder.orderItemsData || [],
        // Include customer data for the receipt
        custName: currentOrder.custName || "",
        custPhone: currentOrder.custPhone || currentOrder.custtPhone || "",
        custAddress: currentOrder.custAddress || "",
      };

      // Print customer receipt only after payment (to customer printer only)
      try {
        await printingService.printCustomerReceipt(orderData);
        console.log(
          "✅ Customer receipt printed successfully to customer printer"
        );
      } catch (error) {
        console.warn("❌ Customer receipt print failed:", error);
        // Don't show error toast to avoid interrupting payment flow
      }
    } catch (error) {
      console.error("Payment failed:", error);

      // Reset payment processing flag on error
      setHasProcessedPayment(false);

      // Enhanced error handling
      let errorMessage = t("payment.paymentFailedRetry");
      let shouldShowRetry = false;

      if (error.shouldRetry) {
        errorMessage = error.message + " Would you like to try again?";
        shouldShowRetry = true;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Check if the order might have been paid despite the error
      if (
        error.message?.includes("already paid") ||
        error.originalError?.message?.includes("already paid")
      ) {
        // Refresh orders to check if payment actually went through
        if (currentShift?._id) {
          await dispatch(fetchAllOrders({ shiftId: currentShift._id }));
        } else {
          await dispatch(fetchAllOrders());
        }

        toast.error(t("payment.paymentStatusUnclear"), {
          duration: 5000,
          icon: "⚠️",
        });
        return;
      }

      toast.error(errorMessage, {
        duration: shouldShowRetry ? 6000 : 4000,
        icon: "❌",
      });
    }
  };

  // Reset payment processing flag when order changes
  useEffect(() => {
    setHasProcessedPayment(false);
  }, [currentOrder?._id]);

  const handlePrintReceipt = () => {
    if (!currentOrder) {
      toast.error(t("payment.noOrderSelected"));
      return;
    }

    // Prevent printing cancelled orders
    if (currentOrder.isCancelled) {
      toast.error(t("payment.cannotPrintCancelledOrder"));
      return;
    }

    // Allow printing even before payment - useful for kitchen tickets and pre-payment receipts
    setIsPrintModalOpen(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-card p-2 sm:p-6 space-y-6">
      {/* Tax and Discount Section */}
      <div className="grid grid-cols-2 gap-4">
        <NumberInput
          label={t("payment.taxPercent")}
          value={tax}
          onChange={setTax}
          placeholder="0"
          min="0"
          max="100"
          step="1"
        />
        <NumberInput
          label={t("payment.discountPercent")}
          value={discount}
          onChange={setDiscount}
          placeholder="0"
          min="0"
          max="100"
          step="1"
        />
      </div>

      {/* Order Summary */}
      <OrderSummary
        subtotal={subtotal}
        discount={discount}
        discountAmount={discountAmount}
        tax={tax}
        taxAmount={taxAmount}
        finalTotal={finalTotal}
      />

      {/* Payment Method Section */}
      <div>
        <label className="hidden sm:block text-sm font-medium text-gray-700 mb-3">
          {t("payment.paymentMethod")}
        </label>

        <PaymentModeToggle
          paymentMode={paymentMode}
          setPaymentMode={setPaymentMode}
        />

        {/* Single Payment */}
        {paymentMode === "single" && (
          <PaymentMethodSelect
            value={singlePaymentMethod}
            onChange={(e) => setSinglePaymentMethod(e.target.value)}
          />
        )}

        {/* Split Payment */}
        {paymentMode === "split" && (
          <div className="space-y-3">
            {splitPayments.map((payment, index) => (
              <SplitPaymentRow
                key={index}
                payment={payment}
                index={index}
                onMethodChange={handleSplitMethodChange}
                onAmountChange={handleSplitAmountChange}
                finalTotal={finalTotal}
              />
            ))}

            <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded text-start">
              {t("payment.remaining")}:{" "}
              <span
                className={`font-medium ${
                  remainingAmount > 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {remainingAmount.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handlePayment}
          disabled={
            loading ||
            !currentOrder ||
            currentOrder?.isPaid ||
            currentOrder?.isCancelled
          }
          className={`w-full py-3 px-4 rounded-md transition-colors font-medium ${
            currentOrder?.isPaid
              ? "bg-green-100 text-green-800 cursor-not-allowed"
              : currentOrder?.isCancelled
              ? "bg-red-100 text-red-800 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          }`}
        >
          {currentOrder?.isPaid
            ? t("payment.orderAlreadyPaid")
            : currentOrder?.isCancelled
            ? t("payment.orderCancelled")
            : loading
            ? t("payment.processing")
            : `${t("payment.pay")} ${finalTotal.toFixed(2)} AED`}
        </button>

        <button
          onClick={handlePrintReceipt}
          disabled={currentOrder?.isCancelled}
          className={`w-full py-2 px-4 rounded-md transition-colors ${
            currentOrder?.isCancelled
              ? "bg-gray-400 text-gray-600 cursor-not-allowed"
              : "bg-primary-700 text-white hover:bg-primary-800"
          }`}
        >
          {currentOrder?.isCancelled
            ? t("payment.cannotPrintCancelled")
            : currentOrder?.isPaid
            ? t("payment.printReceipt")
            : t("payment.printPreview")}
        </button>
      </div>

      {/* Print Receipt Modal */}
      {isPrintModalOpen && (
        <Suspense fallback={<div>{t("common.loading")}</div>}>
          <PrintReceiptModal
            order={currentOrder}
            onClose={() => setIsPrintModalOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

export default PaymentSection;
