import PaymentMethodSelect from "./PaymentMethodSelect";
import NumberInput from "./NumberInput";

const SplitPaymentRow = ({
  payment,
  index,
  onMethodChange,
  onAmountChange,
  finalTotal,
}) => {
  const handleAmountChange = (amount) => {
    onAmountChange(index, amount);

    // Find the other payment index (0 or 1)
    const otherIndex = index === 0 ? 1 : 0;

    // First, clear the other input
    onAmountChange(otherIndex, "");

    // Then check if we need to fill the remaining amount
    if (amount && !isNaN(amount)) {
      const remaining = finalTotal - parseFloat(amount);
      if (remaining > 0) {
        // Fill with the needed value (round to 2 decimal places)
        onAmountChange(otherIndex, parseFloat(remaining.toFixed(2)));
      } else {
        // Set to 0 if no remaining amount needed
        onAmountChange(otherIndex, 0);
      }
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <div className="flex-1">
        <PaymentMethodSelect
          value={payment.method}
          onChange={(e) => onMethodChange(index, e.target.value)}
        />
      </div>
      <div className="flex-1">
        <NumberInput
          value={payment.amount}
          onChange={handleAmountChange}
          placeholder="0.00"
          min="0"
          step="1"
        />
      </div>
    </div>
  );
};

export default SplitPaymentRow;
