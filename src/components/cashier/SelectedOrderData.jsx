import { MdDeleteOutline } from "react-icons/md";
import { useState, useEffect, memo, useCallback } from "react";
import { useTranslation } from "react-i18next";

// Memoized individual meal row component to prevent unnecessary re-renders
const MealRow = memo(function MealRow({
  item,
  index,
  uniqueKey,
  mealId,
  currentInputValue,
  isCancelled,
  stableKey,
  canDeleteMeals,
  canDecreaseQuantity,
  onQuantityInputChange,
  onQuantityInputBlur,
  onDecrease,
  onIncrease,
  onRemove,
  t,
}) {
  return (
    <tr
      key={stableKey}
      className={`border-t border-gray-200 transition-colors ${
        isCancelled
          ? "bg-gray-100 text-gray-500 opacity-60"
          : "hover:bg-gray-50"
      }`}
    >
      <td
        className={`py-3 px-4 ${
          isCancelled ? "text-gray-400" : "text-primary-700"
        }`}
      >
        {index + 1}
        {isCancelled && (
          <span className="ml-1 text-xs text-red-500">
            ({t("cashier.cancelled")})
          </span>
        )}
      </td>
      <td
        className={`py-3 px-4 min-w-[200px] ${
          isCancelled ? "text-gray-400 line-through" : "text-primary-700"
        }`}
      >
        {item.name}
      </td>
      <td className="py-3 px-4">
        {isCancelled ? (
          // Show static quantity for cancelled items
          <div className="flex items-center w-full justify-center">
            <span className="text-gray-400 line-through">{item.quantity}</span>
          </div>
        ) : (
          // Interactive controls for active items
          <div className="flex items-center w-full justify-center gap-1">
            <button
              className={`w-8 h-8 flex items-center justify-center rounded-full ${
                canDecreaseQuantity
                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer"
                  : "bg-gray-50 text-gray-300 cursor-not-allowed"
              }`}
              onClick={() => onDecrease(item)}
              disabled={!canDecreaseQuantity}
              title={
                !canDecreaseQuantity
                  ? t("cashier.onlyManagersCanDecrease")
                  : item.quantity <= 1
                  ? t("cashier.willDeleteItem")
                  : t("cashier.decreaseQuantity")
              }
            >
              -
            </button>
            <input
              type="text"
              value={currentInputValue}
              onChange={(e) => onQuantityInputChange(uniqueKey, e.target.value)}
              onFocus={(e) => {
                // Select all text when input is focused
                e.target.select();
              }}
              onBlur={(e) => onQuantityInputBlur(item, e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  onQuantityInputBlur(item, e.target.value);
                }
              }}
              className="w-16 text-center border border-gray-300 rounded px-1 py-1 text-sm focus:outline-none focus:border-primary-500"
              min="0"
              step="0.01"
            />
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              onClick={() => onIncrease(item)}
              title={t("cashier.increaseQuantity")}
            >
              +
            </button>
          </div>
        )}
      </td>
      <td
        className={`py-3 px-4 ${
          isCancelled ? "text-gray-400 line-through" : "text-primary-700"
        }`}
      >
        {(Math.round(item.price * 100) / 100).toFixed(2)}{" "}
        <span className="hidden sm:inline-block">{item.currency || "AED"}</span>
      </td>
      <td
        className={`py-3 px-4 font-semibold ${
          isCancelled ? "text-gray-400 line-through" : "text-primary-700"
        }`}
      >
        {isCancelled ? (
          <span className="line-through">
            {(Math.round(item.price * item.quantity * 100) / 100).toFixed(2)}
          </span>
        ) : (
          (Math.round(item.price * item.quantity * 100) / 100).toFixed(2)
        )}{" "}
        <span className="hidden sm:inline-block">{item.currency || "AED"}</span>
      </td>
      {canDeleteMeals && (
        <td className="py-3 px-4">
          {isCancelled ? (
            <span className="text-gray-400 text-xs">
              {t("cashier.cancelled")}
            </span>
          ) : (
            <button
              className="text-danger-400 hover:text-danger-500 text-lg text-center"
              onClick={() => onRemove(mealId)}
              title={t("cashier.deleteItemManagerOnly")}
            >
              <MdDeleteOutline />
            </button>
          )}
        </td>
      )}
    </tr>
  );
});

const SelectedOrderData = memo(function SelectedOrderData({
  orderItems,
  updateQuantity,
  removeFromOrder,
  canDeleteMeals,
  canDecreaseQuantity,
  currentOrder,
}) {
  const { t } = useTranslation();

  // Local state for quantity inputs - using unique keys
  const [quantityInputs, setQuantityInputs] = useState({});

  // Initialize quantity inputs when orderItems change
  useEffect(() => {
    const newQuantityInputs = {};
    orderItems.forEach((item) => {
      // Create a unique key for each order item
      const uniqueKey = `${item._id}_${item.mealId || item._id}`;
      newQuantityInputs[uniqueKey] = item.quantity.toString();
    });
    setQuantityInputs(newQuantityInputs);
  }, [orderItems]);

  const getUniqueKey = useCallback((item) => {
    return `${item._id}_${item.mealId || item._id}`;
  }, []);

  const getMealId = useCallback((item) => {
    // For order items, use mealId; for direct meal objects, use _id
    return item.mealId || item._id;
  }, []);

  const handleQuantityInputChange = useCallback((uniqueKey, value) => {
    // Allow only numbers and decimal point, max 2 decimal places
    const regex = /^\d*\.?\d{0,2}$/;
    if (regex.test(value) || value === "") {
      setQuantityInputs((prev) => ({
        ...prev,
        [uniqueKey]: value,
      }));
    }
  }, []);

  const handleQuantityInputBlur = useCallback(
    (item, value) => {
      const uniqueKey = getUniqueKey(item);
      const mealId = getMealId(item);

      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        // Reset to original quantity if invalid
        setQuantityInputs((prev) => ({
          ...prev,
          [uniqueKey]: item.quantity.toString(),
        }));
      } else {
        // Round to 2 decimal places and update
        const roundedValue = Math.round(numValue * 100) / 100;
        setQuantityInputs((prev) => ({
          ...prev,
          [uniqueKey]: roundedValue.toString(),
        }));

        console.log(
          "Updating quantity for mealId:",
          mealId,
          "with quantity:",
          roundedValue
        );
        updateQuantity(mealId, roundedValue);
      }
    },
    [getUniqueKey, getMealId, updateQuantity]
  );

  const handleDecrease = useCallback(
    (item) => {
      const mealId = getMealId(item);

      if (item.quantity <= 1) {
        // Delete the meal if quantity is 1 or less
        if (canDeleteMeals) {
          console.log("Removing meal with mealId:", mealId);
          removeFromOrder(mealId);
        }
      } else {
        const newQuantity = Math.round((item.quantity - 1) * 100) / 100;
        console.log(
          "Decreasing quantity for mealId:",
          mealId,
          "to:",
          newQuantity
        );
        updateQuantity(mealId, newQuantity);
      }
    },
    [getMealId, canDeleteMeals, removeFromOrder, updateQuantity]
  );

  const handleIncrease = useCallback(
    (item) => {
      const mealId = getMealId(item);
      const newQuantity = Math.round((item.quantity + 1) * 100) / 100;

      console.log(
        "Increasing quantity for mealId:",
        mealId,
        "to:",
        newQuantity
      );
      updateQuantity(mealId, newQuantity);
    },
    [getMealId, updateQuantity]
  );

  const handleRemove = useCallback(
    (mealId) => {
      removeFromOrder(mealId);
    },
    [removeFromOrder]
  );

  if (orderItems.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 text-center shadow-md mt-4">
        <p className="text-gray-500">{t("cashier.noItemsInOrder")}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-card transition-all duration-200 overflow-hidden animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-700 text-center text-sm sm:text-base">
            <tr>
              <th className="py-3 px-4 font-semibold">#</th>
              <th className="py-3 px-4 font-semibold">
                {t("cashier.orderItems")}
              </th>
              <th className="py-3 px-4 font-semibold">
                {t("cashier.quantity")}
              </th>
              <th className="py-3 px-4 font-semibold">{t("cashier.price")}</th>
              <th className="py-3 px-4 font-semibold">{t("cashier.total")}</th>
              {canDeleteMeals && (
                <th className="py-3 px-4 font-semibold w-10"></th>
              )}
            </tr>
          </thead>
          <tbody className="text-center text-sm sm:text-base">
            {orderItems.map((item, index) => {
              const uniqueKey = getUniqueKey(item);
              const mealId = getMealId(item);
              const currentInputValue =
                quantityInputs[uniqueKey] || item.quantity.toString();
              // Treat item as cancelled if order is cancelled OR if individual item is cancelled
              const isCancelled =
                currentOrder?.isCancelled || item.isCancelled || false;

              // Stable key based on order index to maintain position
              const stableKey = `order_item_${
                item.orderIndex || index
              }_${mealId}`;

              return (
                <MealRow
                  key={stableKey}
                  item={item}
                  index={index}
                  uniqueKey={uniqueKey}
                  mealId={mealId}
                  currentInputValue={currentInputValue}
                  isCancelled={isCancelled}
                  stableKey={stableKey}
                  canDeleteMeals={canDeleteMeals}
                  canDecreaseQuantity={canDecreaseQuantity}
                  onQuantityInputChange={handleQuantityInputChange}
                  onQuantityInputBlur={handleQuantityInputBlur}
                  onDecrease={handleDecrease}
                  onIncrease={handleIncrease}
                  onRemove={handleRemove}
                  t={t}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default SelectedOrderData;
