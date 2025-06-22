import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FaPlus, FaMinus, FaCheck } from "react-icons/fa";

// Enhanced Number keys component for bakery quantities
const NumberKeys = ({
  onNumberClick,
  selectedItemId,
  onCreateOrder,
  cart,
  isCreatingOrder,
  calculateTotal,
}) => {
  const { t } = useTranslation();
  const [displayValue, setDisplayValue] = useState("");
  const [lastSelectedItemId, setLastSelectedItemId] = useState(null);
  const [operatorUsed, setOperatorUsed] = useState(false);
  const [userStartedTyping, setUserStartedTyping] = useState(false);

  // Memoized function to safely evaluate mathematical expressions
  const evaluateExpression = useCallback((expression) => {
    try {
      // Only allow numbers, operators, and decimal points
      if (!/^[0-9+.*/()s-]+$/.test(expression)) {
        return parseFloat(expression) || 0;
      }

      // Use Function constructor for safe evaluation
      const result = Function(`"use strict"; return (${expression})`)();
      // Round to 2 decimal places to prevent floating point precision errors
      return isNaN(result) ? 0 : Math.round(result * 100) / 100;
    } catch {
      const parsed = parseFloat(expression) || 0;
      return Math.round(parsed * 100) / 100;
    }
  }, []);

  // Memoized selected item lookup
  const selectedItem = useMemo(() => {
    if (!selectedItemId || !cart) return null;
    return cart.find((item) => (item._id || item.id) === selectedItemId);
  }, [selectedItemId, cart]);

  // Memoized current quantity formatting
  const formattedCurrentQuantity = useMemo(() => {
    if (!selectedItem) return "";
    const currentQuantity = selectedItem.quantity || 0;
    return Number(currentQuantity)
      .toFixed(2)
      .replace(/\.?0+$/, "");
  }, [selectedItem]);

  // Memoized total calculation
  const formattedTotal = useMemo(() => {
    const total =
      calculateTotal && typeof calculateTotal === "function"
        ? calculateTotal()
        : 0;
    return typeof total === "number" && !isNaN(total)
      ? total.toFixed(2)
      : "0.00";
  }, [calculateTotal]);

  // Memoized current evaluated value
  const currentValue = useMemo(() => {
    if (!displayValue) return "";
    const value = evaluateExpression(displayValue);
    if (value > 0) {
      return Number(value)
        .toFixed(2)
        .replace(/\.?0+$/, "");
    }
    return "";
  }, [displayValue, evaluateExpression]);

  // Memoized insert button state
  const insertButtonDisabled = useMemo(() => {
    return (
      !selectedItemId || !displayValue || evaluateExpression(displayValue) <= 0
    );
  }, [selectedItemId, displayValue, evaluateExpression]);

  // Reset state when item selection changes
  useEffect(() => {
    if (selectedItemId !== lastSelectedItemId) {
      if (selectedItem) {
        setDisplayValue(formattedCurrentQuantity);
      } else {
        setDisplayValue("");
      }
      setLastSelectedItemId(selectedItemId);
      setOperatorUsed(false);
      setUserStartedTyping(false);
    }
  }, [
    selectedItemId,
    lastSelectedItemId,
    selectedItem,
    formattedCurrentQuantity,
  ]);

  // Update display when cart quantity changes for the selected item (including MenuCard additions)
  useEffect(() => {
    if (selectedItem && selectedItemId) {
      // Always update displayValue when cart changes, regardless of user typing state
      // This ensures MenuCard additions are reflected in NumberKeys
      if (displayValue !== formattedCurrentQuantity) {
        setDisplayValue(formattedCurrentQuantity);
        // Reset flags when quantity is updated externally (like from MenuCard)
        setOperatorUsed(false);
        setUserStartedTyping(false);
      }
    }
  }, [selectedItem, selectedItemId, formattedCurrentQuantity]);

  // Memoized key click handler
  const handleKeyClick = useCallback(
    (key) => {
      // For fraction values, replace the current display
      if (key.label.includes("/")) {
        setDisplayValue(key.value);
        setOperatorUsed(false);
        setUserStartedTyping(true);
        return;
      }

      if (key.value === ".") {
        // Handle decimal point - only allow one decimal point
        if (!displayValue.includes(".")) {
          const currentQuantity = selectedItem
            ? (selectedItem.quantity || 0).toString()
            : "0";

          if (
            !operatorUsed &&
            !userStartedTyping &&
            displayValue === currentQuantity
          ) {
            setDisplayValue("0.");
          } else {
            setDisplayValue((prev) => (prev || "0") + ".");
          }
          setUserStartedTyping(true);
        }
        return;
      }

      // For regular numbers
      const currentQuantity = selectedItem
        ? (selectedItem.quantity || 0).toString()
        : "0";

      let newValue;
      if (
        !operatorUsed &&
        !userStartedTyping &&
        displayValue === currentQuantity
      ) {
        newValue = key.value;
      } else {
        newValue = displayValue + key.value;
      }

      // Check if adding this digit would exceed 2 decimal places
      if (newValue.includes(".")) {
        const parts = newValue.split(".");
        if (parts[1] && parts[1].length > 2) {
          return; // Don't add the digit if it would exceed 2 decimal places
        }
      }

      setDisplayValue(newValue);
      setUserStartedTyping(true);
    },
    [displayValue, operatorUsed, userStartedTyping, selectedItem]
  );

  // Memoized operator click handler
  const handleOperatorClick = useCallback(
    (operator) => {
      if (selectedItem) {
        const currentQuantity = selectedItem.quantity || 0;

        if (!displayValue || displayValue === currentQuantity.toString()) {
          setDisplayValue(currentQuantity + operator);
        } else if (
          displayValue &&
          !displayValue.endsWith(operator) &&
          !/[+-]$/.test(displayValue)
        ) {
          setDisplayValue((prev) => prev + operator);
        }

        setOperatorUsed(true);
        setUserStartedTyping(true);
      }
    },
    [selectedItem, displayValue]
  );

  // Memoized clear handler - resets to quantity 1
  const handleClear = useCallback(() => {
    if (selectedItemId && onNumberClick) {
      // Set quantity to 1 for both display and cart
      onNumberClick(selectedItemId, 1);
      setDisplayValue("1");
    } else {
      setDisplayValue("");
    }
    setOperatorUsed(false);
    setUserStartedTyping(false);
  }, [selectedItemId, onNumberClick]);

  // Memoized insert handler
  const handleInsert = useCallback(() => {
    if (selectedItemId && displayValue && onNumberClick) {
      const numericValue = evaluateExpression(displayValue);
      if (!isNaN(numericValue) && numericValue > 0) {
        const roundedValue = Math.round(numericValue * 100) / 100;
        onNumberClick(selectedItemId, roundedValue);

        const formattedValue = Number(roundedValue)
          .toFixed(2)
          .replace(/\.?0+$/, "");
        setDisplayValue(formattedValue);
        setOperatorUsed(false);
        setUserStartedTyping(false);
      }
    }
  }, [selectedItemId, displayValue, onNumberClick, evaluateExpression]);

  // Memoized number buttons data
  const numberButtons = useMemo(
    () => [
      { label: "1", value: "1" },
      { label: "2", value: "2" },
      { label: "3", value: "3" },
      { label: "4", value: "4" },
      { label: "5", value: "5" },
      { label: "6", value: "6" },
      { label: "7", value: "7" },
      { label: "8", value: "8" },
      { label: "9", value: "9" },
      { label: "0", value: "0" },
      { label: ".", value: "." },
    ],
    []
  );

  return (
    <div className="bg-white space-y-3">
      {/* Display Value */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2 text-sm font-bold text-gray-600">
          <div className="hidden sm:block text-sm text-gray-600">
            {t("menu.total")}
          </div>
          {formattedTotal} <span className="hidden sm:inline-block">AED</span>
        </div>
        <div className="flex gap-1">
          <div className="text-sm text-gray-600">
            {displayValue
              ? `${t("numberKeys.input")}: ${displayValue}`
              : t("numberKeys.enterQuantity")}
          </div>
          <div className="text-sm font-bold text-blue-600">
            {currentValue && `= ${currentValue}`}
          </div>
        </div>
      </div>

      {/* 4-Column Grid Layout */}
      <div className="grid grid-cols-4 gap-2">
        {/* Row 1: 1, 2, 3, Insert */}
        {[0, 1, 2].map((index) => (
          <button
            key={numberButtons[index].value}
            onClick={() => handleKeyClick(numberButtons[index])}
            className="h-10 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
          >
            {numberButtons[index].label}
          </button>
        ))}
        <button
          onClick={handleInsert}
          disabled={insertButtonDisabled}
          className={`h-10 text-sm font-medium rounded-md transition-colors flex items-center justify-center ${
            insertButtonDisabled
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
          title={t("numberKeys.insertQuantity")}
        >
          <FaCheck />
        </button>

        {/* Row 2: 4, 5, 6, + */}
        {[3, 4, 5].map((index) => (
          <button
            key={numberButtons[index].value}
            onClick={() => handleKeyClick(numberButtons[index])}
            className="h-10 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
          >
            {numberButtons[index].label}
          </button>
        ))}
        <button
          onClick={() => handleOperatorClick("+")}
          className="h-10 text-sm font-medium bg-green-100 text-green-700 border border-green-300 rounded-md hover:bg-green-200 transition-colors flex items-center justify-center"
        >
          <FaPlus />
        </button>

        {/* Row 3: 7, 8, 9, - */}
        {[6, 7, 8].map((index) => (
          <button
            key={numberButtons[index].value}
            onClick={() => handleKeyClick(numberButtons[index])}
            className="h-10 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
          >
            {numberButtons[index].label}
          </button>
        ))}
        <button
          onClick={() => handleOperatorClick("-")}
          className="h-10 text-sm font-medium bg-red-100 text-red-700 border border-red-300 rounded-md hover:bg-red-200 transition-colors flex items-center justify-center"
        >
          <FaMinus />
        </button>

        {/* Row 4: Done, 0, ., Clear */}
        <button
          onClick={onCreateOrder}
          disabled={cart.length === 0 || isCreatingOrder}
          className={`h-10 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${
            cart.length === 0 || isCreatingOrder
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-primary-700 text-white hover:bg-primary-800"
          }`}
        >
          {isCreatingOrder ? t("numberKeys.creating") : t("numberKeys.done")}
        </button>
        <button
          onClick={() => handleKeyClick(numberButtons[9])} // 0
          className="h-10 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
        >
          {numberButtons[9].label}
        </button>
        <button
          onClick={() => handleKeyClick(numberButtons[10])} // .
          className="h-10 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
        >
          {numberButtons[10].label}
        </button>
        <button
          onClick={handleClear}
          className="h-10 text-sm font-medium bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
          title={t("numberKeys.resetToOne")}
        >
          {t("numberKeys.clear")}
        </button>
      </div>
    </div>
  );
};

export default NumberKeys;
