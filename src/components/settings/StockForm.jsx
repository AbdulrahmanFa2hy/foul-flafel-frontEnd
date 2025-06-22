import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import Modal from "../common/Modal";
import { addStock, updateStock, fetchStocks } from "../../store/stockSlice";

function StockForm({ stock = null, onClose, isViewMode = false }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const dispatch = useDispatch();
  const { loading, error, stocks } = useSelector((state) => state.stock);
  const { user } = useSelector((state) => state.auth);

  const isEditing = !!stock && !isViewMode;

  const [formData, setFormData] = useState({
    name: stock?.nameOfItem || stock?.name || "",
    supplierName: stock?.supplierName || "",
    quantity: stock?.quantity || "",
    unit: stock?.unit || "pcs",
    pricePerUnit: stock?.pricePerUnit || stock?.price || "",
    minimumQuantity: stock?.minimumQuantity || "",
    managerId: stock?.managerId || user?._id || "",
    invoiceType: "Cash",
    paidAmount: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [stockSuggestions, setStockSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isNewStock, setIsNewStock] = useState(true);
  const [selectedExistingStock, setSelectedExistingStock] = useState(null);

  useEffect(() => {
    if (stock) {
      const invoiceData = stock.invoice?.[0];
      const totalCost =
        stock.quantity * (stock.pricePerUnit || stock.price || 0);
      const paidAmount = invoiceData
        ? totalCost - (invoiceData.residualValue || 0)
        : totalCost;

      setFormData({
        name: stock.nameOfItem || stock.name || "",
        supplierName: stock.supplierName || "",
        quantity: stock.quantity || "",
        unit: stock.unit || "pcs",
        pricePerUnit: stock.pricePerUnit || stock.price || "",
        minimumQuantity: stock.minimumQuantity || "",
        managerId: stock.managerId || user?._id || "",
        invoiceType: invoiceData?.type || "Cash",
        paidAmount: paidAmount || "",
      });
      setIsNewStock(false);
      setSelectedExistingStock(stock);
    }
  }, [stock, user]);

  // Search for existing stocks when name changes or on focus
  useEffect(() => {
    if (!stock && showSuggestions) {
      if (formData.name && formData.name.length >= 1) {
        const suggestions = stocks.filter((s) =>
          s.name.toLowerCase().includes(formData.name.toLowerCase())
        );
        setStockSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } else if (formData.name === "" && showSuggestions) {
        setStockSuggestions(stocks);
        setShowSuggestions(stocks.length > 0);
      }
    } else if (stock || !showSuggestions) {
      setStockSuggestions([]);
      setShowSuggestions(false);
    }
  }, [formData.name, stocks, stock, showSuggestions]);

  // Handle input focus to show all stocks
  const handleNameInputFocus = () => {
    if (!stock && !isViewMode) {
      setShowSuggestions(true);
      if (formData.name.trim() === "") {
        setStockSuggestions(stocks);
      } else if (formData.name.length >= 1) {
        const suggestions = stocks.filter((s) =>
          s.name.toLowerCase().includes(formData.name.toLowerCase())
        );
        setStockSuggestions(suggestions);
      }
    }
  };

  // Handle input blur (with delay to allow selection)
  const handleNameInputBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
      setStockSuggestions([]);
    }, 200);
  };

  // Calculate total cost
  const calculateTotal = () => {
    const quantity = Number(formData.quantity) || 0;
    const pricePerUnit = Number(formData.pricePerUnit) || 0;
    return (quantity * pricePerUnit).toFixed(2);
  };

  // Calculate remaining amount
  const calculateRemaining = () => {
    const total = Number(calculateTotal()) || 0;
    const paid = Number(formData.paidAmount) || 0;
    return Math.max(0, total - paid).toFixed(2);
  };

  // Get payment status
  const getPaymentStatus = () => {
    const total = Number(calculateTotal());
    const paid = Number(formData.paidAmount) || 0;

    if (paid <= 0) return { status: "Not Paid", color: "red" };
    if (paid >= total) return { status: "Fully Paid", color: "green" };
    return { status: "Partial Payment", color: "yellow" };
  };

  const handleStockSelect = (selectedStock) => {
    setSelectedExistingStock(selectedStock);
    setIsNewStock(false);
    setFormData({
      name: selectedStock.name,
      supplierName: selectedStock.supplierName,
      quantity: selectedStock.quantity,
      unit: selectedStock.unit,
      pricePerUnit: selectedStock.pricePerUnit,
      minimumQuantity: selectedStock.minimumQuantity || "",
      managerId: selectedStock.managerId || user?._id || "",
      invoiceType: "Cash",
      paidAmount: "",
    });
    setShowSuggestions(false);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let newValue =
      type === "number" ? (value === "" ? "" : Number(value)) : value;

    setFormData((prev) => {
      const updated = { ...prev, [name]: newValue };

      // If name is being changed and we had selected an existing stock, reset to new stock mode
      if (name === "name" && selectedExistingStock) {
        const existingStock = stocks.find(
          (s) => s.name.toLowerCase() === value.toLowerCase()
        );
        if (!existingStock) {
          setSelectedExistingStock(null);
          setIsNewStock(true);
        }
      }

      // Auto-calculate paid amount for cash payments
      if (name === "invoiceType") {
        if (value === "Cash") {
          const totalCost =
            (Number(prev.quantity) || 0) * (Number(prev.pricePerUnit) || 0);
          updated.paidAmount = totalCost;
        } else {
          // For postponed, keep existing paid amount or set to 0
          updated.paidAmount = updated.paidAmount || 0;
        }
      }

      // Auto-update paid amount when quantity or price changes for cash payments
      if (
        (name === "quantity" || name === "pricePerUnit") &&
        updated.invoiceType === "Cash"
      ) {
        const quantity = name === "quantity" ? newValue : prev.quantity;
        const pricePerUnit =
          name === "pricePerUnit" ? newValue : prev.pricePerUnit;
        const totalCost = (Number(quantity) || 0) * (Number(pricePerUnit) || 0);
        updated.paidAmount = totalCost;
      }

      return updated;
    });

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = t("forms.stockForm.nameRequired");
    }

    if (!formData.supplierName.trim()) {
      errors.supplierName = t("forms.stockForm.supplierRequired");
    }

    if (!formData.quantity || formData.quantity <= 0) {
      errors.quantity = t("forms.stockForm.quantityRequired");
    }

    if (!formData.pricePerUnit || formData.pricePerUnit <= 0) {
      errors.pricePerUnit = t("forms.stockForm.priceRequired");
    }

    if (formData.minimumQuantity !== "" && formData.minimumQuantity < 0) {
      errors.minimumQuantity = "Minimum quantity cannot be negative";
    }

    // Validate managerId format
    const managerIdToUse = formData.managerId || user?._id;
    if (!managerIdToUse) {
      errors.managerId = "Manager ID is required";
    } else if (!/^[0-9a-fA-F]{24}$/.test(managerIdToUse)) {
      errors.managerId = "Invalid manager ID format";
    }

    // Validate payment for new items
    if (!isEditing && !isViewMode && isNewStock) {
      const totalCost = Number(calculateTotal());
      const paidAmount = Number(formData.paidAmount) || 0;

      if (totalCost <= 0) {
        errors.pricePerUnit = "Total cost must be greater than 0";
      }

      if (paidAmount < 0) {
        errors.paidAmount = "Paid amount cannot be negative";
      }

      if (paidAmount > totalCost) {
        errors.paidAmount = "Paid amount cannot exceed total cost";
      }

      if (formData.invoiceType === "Postponed" && paidAmount === totalCost) {
        errors.paidAmount =
          "For postponed payments, paid amount should be less than total";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const managerIdToUse = formData.managerId || user?._id;
      const totalCost = Number(calculateTotal());
      const paidAmount = Number(formData.paidAmount) || 0;
      const residualValue = Math.max(0, totalCost - paidAmount);

      const stockData = {
        name: formData.name,
        supplierName: formData.supplierName,
        quantity: Number(formData.quantity),
        pricePerUnit: Number(formData.pricePerUnit),
        unit: formData.unit,
        minimumQuantity: Number(formData.minimumQuantity) || 0,
        managerId: managerIdToUse,
      };

      // Determine whether to update existing or create new
      if (isEditing) {
        // Editing existing stock
        await dispatch(updateStock({ stockId: stock._id, stockData })).unwrap();
      } else if (selectedExistingStock && !isNewStock) {
        // Updating existing stock (add to quantity)
        const updatedStockData = {
          ...stockData,
          quantity:
            Number(selectedExistingStock.quantity) + Number(formData.quantity),
        };

        // Add invoice data for stock updates
        const existingInvoice = selectedExistingStock.invoice?.[0];
        if (existingInvoice) {
          updatedStockData.invoice = [
            {
              type: formData.invoiceType,
              value: existingInvoice.value + totalCost,
              residualValue: existingInvoice.residualValue + residualValue,
            },
          ];
        } else {
          updatedStockData.invoice = [
            {
              type: formData.invoiceType,
              value: totalCost,
              residualValue: residualValue,
            },
          ];
        }

        await dispatch(
          updateStock({
            stockId: selectedExistingStock._id,
            stockData: updatedStockData,
          })
        ).unwrap();
      } else {
        // Creating new stock
        stockData.invoice = [
          {
            type: formData.invoiceType,
            value: totalCost,
            residualValue: residualValue,
          },
        ];
        await dispatch(addStock(stockData)).unwrap();
      }

      dispatch(fetchStocks());
      onClose();
    } catch (error) {
      console.error("Error saving stock:", error);
    }
  };

  const getModalTitle = () => {
    if (isViewMode) return t("forms.stockForm.viewStock");
    if (isEditing) return t("forms.stockForm.editStock");
    if (selectedExistingStock && !isNewStock)
      return `${t("forms.stockForm.updateStock")}: ${
        selectedExistingStock.name
      }`;
    return t("forms.stockForm.addStock");
  };

  const paymentStatus = getPaymentStatus();

  return (
    <Modal title={getModalTitle()} onClose={onClose}>
      <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
        <form onSubmit={handleSubmit}>
          {/* Error display */}
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("forms.stockForm.itemName")} *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                formErrors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder={t("forms.stockForm.enterItemName")}
              required
              onFocus={handleNameInputFocus}
              onBlur={handleNameInputBlur}
            />
            {formErrors.name && (
              <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
            )}

            {/* Stock Suggestions Dropdown */}
            {showSuggestions && stockSuggestions.length > 0 && !isViewMode && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                <div className="p-2 bg-blue-50 border-b text-xs text-blue-700">
                  {t("forms.stockForm.existingStocksFound")}
                </div>
                {stockSuggestions.map((suggestion) => (
                  <div
                    key={suggestion._id}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    onClick={() => handleStockSelect(suggestion)}
                  >
                    <div className="font-medium text-gray-900">
                      {suggestion.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {t("forms.stockForm.currentQuantityLabel")}:{" "}
                      {suggestion.quantity} {suggestion.unit} |
                      {t("forms.stockForm.supplierName")}:{" "}
                      {suggestion.supplierName} | ${suggestion.pricePerUnit}/
                      {suggestion.unit}
                    </div>
                    {suggestion.minimumQuantity > 0 && (
                      <div className="text-xs text-orange-600">
                        {t("forms.stockForm.minStockLevel")}:{" "}
                        {suggestion.minimumQuantity} {suggestion.unit}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Show update mode indicator */}
            {selectedExistingStock && !isNewStock && !isEditing && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>{t("forms.stockForm.updateMode")}:</strong>{" "}
                  {t("forms.stockForm.addingToExistingStock")} &quot;
                  {selectedExistingStock.name}&quot;.{" "}
                  {t("forms.stockForm.currentQuantityLabel")}:{" "}
                  {selectedExistingStock.quantity} {selectedExistingStock.unit}
                </p>
              </div>
            )}
          </div>

          {/* Supplier Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("forms.stockForm.supplierName")} *
            </label>
            <input
              type="text"
              name="supplierName"
              value={formData.supplierName}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                formErrors.supplierName ? "border-red-500" : "border-gray-300"
              }`}
              placeholder={t("forms.stockForm.enterSupplierName")}
              required
            />
            {formErrors.supplierName && (
              <p className="text-red-500 text-xs mt-1">
                {formErrors.supplierName}
              </p>
            )}
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("forms.stockForm.quantity")} *{" "}
                {selectedExistingStock &&
                  !isNewStock &&
                  !isEditing &&
                  `(${t("forms.stockForm.additionalQuantity")})`}
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  formErrors.quantity ? "border-red-500" : "border-gray-300"
                }`}
                placeholder={
                  selectedExistingStock && !isNewStock && !isEditing
                    ? t("forms.stockForm.enterAdditionalQuantity")
                    : t("forms.stockForm.enterQuantity")
                }
                min="0"
                step="0.01"
                required={!isViewMode}
              />
              {formErrors.quantity && (
                <p className="text-red-500 text-xs mt-1">
                  {formErrors.quantity}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("forms.stockForm.unit")} *
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  isViewMode ? "bg-gray-100" : "border-gray-300"
                }`}
                required={!isViewMode}
                disabled={isViewMode}
              >
                <option value="pcs">{t("forms.stockForm.pieces")}</option>
                <option value="kg">{t("forms.stockForm.kilogram")}</option>
                <option value="grams">{t("forms.stockForm.grams")}</option>
                <option value="liters">{t("forms.stockForm.liters")}</option>
                <option value="ml">{t("forms.stockForm.milliliters")}</option>
                <option value="cans">{t("forms.stockForm.cans")}</option>
                <option value="cups">{t("forms.stockForm.cups")}</option>
                <option value="tsp">{t("forms.stockForm.teaspoon")}</option>
                <option value="tbsp">{t("forms.stockForm.tablespoon")}</option>
                <option value="packets">{t("forms.stockForm.packets")}</option>
                <option value="boxes">{t("forms.stockForm.boxes")}</option>
              </select>
            </div>
          </div>

          {/* Price Per Unit and Minimum Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("forms.stockForm.pricePerUnit")} ($) *
              </label>
              <input
                type="number"
                name="pricePerUnit"
                value={formData.pricePerUnit}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  formErrors.pricePerUnit ? "border-red-500" : "border-gray-300"
                }`}
                placeholder={t("forms.stockForm.enterPricePerUnit")}
                min="0"
                step="0.01"
                required={!isViewMode}
              />
              {formErrors.pricePerUnit && (
                <p className="text-red-500 text-xs mt-1">
                  {formErrors.pricePerUnit}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("forms.stockForm.minStockLevel")}
              </label>
              <input
                type="number"
                name="minimumQuantity"
                value={formData.minimumQuantity}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  formErrors.minimumQuantity
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder={t("forms.stockForm.enterMinLevel")}
                min="0"
                step="1"
              />
              {formErrors.minimumQuantity && (
                <p className="text-red-500 text-xs mt-1">
                  {formErrors.minimumQuantity}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {t("forms.stockForm.getNotifiedWhenStockFallsBelowLevel")}
              </p>
            </div>
          </div>

          {/* Total Calculation Display */}
          {formData.quantity && formData.pricePerUnit && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-800">
                  {t("forms.stockForm.totalValue")}:
                </span>
                <span className="text-lg font-bold text-blue-900">
                  ${calculateTotal()}
                </span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                {formData.quantity} {formData.unit} × ${formData.pricePerUnit}{" "}
                {t("forms.stockForm.per")} {formData.unit}
              </p>
            </div>
          )}

          {/* Manager ID Error Display */}
          {formErrors.managerId && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
              {formErrors.managerId}
            </div>
          )}

          {/* Payment Information */}
          {(!isEditing ||
            (isEditing && formData.invoiceType === "Postponed")) && (
            <div className="border-t pt-4">
              {/* Payment Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("forms.stockForm.paymentType")}
                </label>
                <select
                  name="invoiceType"
                  value={formData.invoiceType}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    isViewMode ? "bg-gray-100" : "bg-gray-100"
                  }`}
                >
                  <option value="Cash">{t("forms.stockForm.cash")}</option>
                  <option value="Postponed">
                    {t("forms.stockForm.postponed")}
                  </option>
                </select>
                {isEditing && (
                  <p className="text-xs text-blue-600 mt-1">
                    {t(
                      "forms.stockForm.noteEditingPaymentTypeWillAffectFinancialRecords"
                    )}
                  </p>
                )}
              </div>

              {/* Paid Amount */}
              {(formData.invoiceType === "Postponed" || isEditing) && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("forms.stockForm.paidAmount")} ($){" "}
                    {!isViewMode && !isEditing && "*"}
                  </label>
                  <input
                    type="number"
                    name="paidAmount"
                    value={formData.paidAmount}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      formErrors.paidAmount
                        ? "border-red-500"
                        : "border-gray-300"
                    } ${
                      isViewMode ||
                      (!isEditing && formData.invoiceType === "Cash")
                        ? "bg-gray-100"
                        : ""
                    }`}
                    placeholder={t("forms.stockForm.enterPaidAmount")}
                    min="0"
                    max={calculateTotal()}
                    step="0.01"
                    required={
                      !isViewMode &&
                      !isEditing &&
                      formData.invoiceType === "Postponed"
                    }
                  />
                  {formErrors.paidAmount && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.paidAmount}
                    </p>
                  )}
                </div>
              )}

              {/* Payment Summary */}
              {formData.quantity && formData.pricePerUnit && (
                <div
                  className={`p-4 rounded-md border ${
                    paymentStatus.color === "green"
                      ? "bg-green-50 border-green-200"
                      : paymentStatus.color === "yellow"
                      ? "bg-yellow-50 border-yellow-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span
                        className={`font-medium ${
                          paymentStatus.color === "green"
                            ? "text-green-800"
                            : paymentStatus.color === "yellow"
                            ? "text-yellow-800"
                            : "text-red-800"
                        }`}
                      >
                        {t("forms.stockForm.remaining")}: $
                        {calculateRemaining()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Additional Info for View Mode */}
          {isViewMode && stock && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-800 mb-3">
                {t("forms.stockForm.additionalInformation")}
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">
                    {t("forms.stockForm.created")}:
                  </span>
                  <p className="text-gray-600">
                    {new Date(stock.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    {t("forms.stockForm.lastUpdated")}:
                  </span>
                  <p className="text-gray-600">
                    {new Date(stock.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div></div>
              </div>
            </div>
          )}

          {/* Form actions */}
          <div
            className={`flex justify-end space-x-3 pt-4 border-t border-gray-200 ${
              isRTL ? "space-x-reverse" : ""
            }`}
          >
            <button
              type="button"
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              onClick={onClose}
              disabled={loading && !isViewMode}
            >
              {isViewMode ? t("common.close") : t("common.cancel")}
            </button>
            {!isViewMode && (
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? t("forms.stockForm.saving")
                  : isEditing
                  ? t("forms.stockForm.updateStock")
                  : t("forms.stockForm.createStock")}
              </button>
            )}
          </div>
        </form>
      </div>
    </Modal>
  );
}

export default StockForm;
