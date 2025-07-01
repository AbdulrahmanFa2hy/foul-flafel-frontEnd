import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaEye } from "react-icons/fa";
import DeleteConfirmation from "../../components/common/DeleteConfirmation";
import DatePicker from "../../components/common/DatePicker";
import {
  fetchStocks,
  deleteStock,
  selectStock,
  clearStockError,
  setSearchTerm,
  setPaymentTypeFilter,
} from "../../store/stockSlice";

// Lazy load stock form
const StockForm = lazy(() => import("../../components/settings/StockForm"));

function StocksManagement() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { stocks, loading, error, searchTerm, paymentTypeFilter } = useSelector(
    (state) => state.stock
  );

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [formMode, setFormMode] = useState("add"); // "add", "edit", "view"
  const [dateFilter, setDateFilter] = useState("");

  // Fetch stocks on component mount
  useEffect(() => {
    dispatch(fetchStocks());
  }, [dispatch]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearStockError());
    };
  }, [dispatch]);

  // Helper function to get unique payment types
  const paymentTypes = useMemo(() => {
    const uniquePaymentTypes = [
      ...new Set(
        stocks.map((stock) => stock.invoice?.[0]?.type).filter(Boolean)
      ),
    ];
    return uniquePaymentTypes;
  }, [stocks]);

  // Filter stocks based on search term, payment type, and date
  const filteredStocks = useMemo(() => {
    return stocks
      .filter((stock) => {
        const matchesSearch =
          stock.nameOfItem?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stock.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stock.supplierName?.toLowerCase().includes(searchTerm.toLowerCase());

        const paymentType = stock.invoice?.[0]?.type;
        const matchesPaymentType =
          !paymentTypeFilter || paymentType === paymentTypeFilter;

        // Date filtering
        let matchesDate = true;
        if (dateFilter) {
          const stockDate = new Date(stock.createdAt || stock.date);
          if (dateFilter.includes(" - ")) {
            // Date range
            const [startStr, endStr] = dateFilter.split(" - ");
            const startDate = new Date(startStr);
            const endDate = new Date(endStr);
            endDate.setHours(23, 59, 59, 999); // Include full end date
            matchesDate = stockDate >= startDate && stockDate <= endDate;
          } else {
            // Single date
            const filterDate = new Date(dateFilter);
            const stockDateOnly = new Date(
              stockDate.getFullYear(),
              stockDate.getMonth(),
              stockDate.getDate()
            );
            const filterDateOnly = new Date(
              filterDate.getFullYear(),
              filterDate.getMonth(),
              filterDate.getDate()
            );
            matchesDate = stockDateOnly.getTime() === filterDateOnly.getTime();
          }
        }

        return matchesSearch && matchesPaymentType && matchesDate;
      })
      .sort((a, b) => {
        // Sort by creation date, latest first
        return (
          new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
        );
      });
  }, [stocks, searchTerm, paymentTypeFilter, dateFilter]);

  const handleOpenForm = (stock = null, mode = "add") => {
    setSelectedStockItem(stock);
    setFormMode(mode);
    dispatch(selectStock(stock));
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setSelectedStockItem(null);
    setFormMode("add");
    dispatch(selectStock(null));
    setIsFormOpen(false);
  };

  const handleDeleteClick = (stock) => {
    setSelectedStockItem(stock);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (selectedStockItem) {
      await dispatch(deleteStock(selectedStockItem._id));
      setIsDeleteModalOpen(false);
      setSelectedStockItem(null);
    }
  };

  const handleSearchChange = (e) => {
    dispatch(setSearchTerm(e.target.value));
  };

  const handlePaymentTypeChange = (e) => {
    dispatch(setPaymentTypeFilter(e.target.value));
  };

  const handleDateChange = (date) => {
    setDateFilter(date);
  };

  // Helper function to format numbers with proper decimals
  const formatNumber = (value) => {
    const num = Math.max(0, parseFloat(value) || 0); // Prevent negative values
    return num % 1 === 0 ? num.toString() : num.toFixed(2);
  };

  // Helper function to format currency
  const formatCurrency = (value) => {
    const num = Math.max(0, parseFloat(value) || 0); // Prevent negative values
    return num % 1 === 0 ? `$${num}` : `$${num.toFixed(2)}`;
  };

  const calculateTotal = (stock) => {
    const quantity = stock.quantity || 0;
    const price = stock.pricePerUnit || stock.price || 0;
    const total = Math.max(0, quantity * price); // Prevent negative totals
    return total % 1 === 0 ? total.toString() : total.toFixed(2);
  };

  const getPaymentInfo = (stock) => {
    if (!stock.invoice || stock.invoice.length === 0) {
      return { type: t("stock.na"), residual: 0 };
    }

    const invoice = stock.invoice[0];
    return {
      type: invoice.type || t("stock.na"),
      residual: invoice.residualValue || 0,
    };
  };

  if (loading && stocks.length === 0) {
    return (
      <div className="animate-fade-in flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">{t("stock.loadingStock")}</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
          {t("stock.title")}
        </h1>
        <button
          className="px-2 sm:px-4 py-2 text-sm sm:text-base rounded-md text-white font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 bg-primary-800 hover:bg-primary-800 focus:ring-primary-800/50 flex items-center"
          onClick={() => handleOpenForm()}
        >
          <FaPlus className="sm:mr-2" /> {t("stock.addStock")}
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t("stock.search")}
            value={searchTerm}
            onChange={handleSearchChange}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-800/50 focus:border-primary-800 pl-10 w-full"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={paymentTypeFilter}
            onChange={handlePaymentTypeChange}
            className="w-full px-3 py-2 border border-gray-300 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-800/50 focus:border-primary-800 sm:w-40"
          >
            <option value="">{t("stock.allPayments")}</option>
            {paymentTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
          <DatePicker onDateChange={handleDateChange} />
        </div>
      </div>

      {/* Stock table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                {t("stock.name")}
              </th>
              <th className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                {t("stock.supplier")}
              </th>
              <th className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                {t("stock.status")}
              </th>
              <th className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                {t("stock.paymentMethod")}
              </th>
              <th className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                {t("stock.currentQuantity")}
              </th>
              <th className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                {t("stock.totalPurchased")}
              </th>
              <th className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                {t("stock.unitPrice")}
              </th>
              <th className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                {t("stock.total")}
              </th>
              <th className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4 text-center">
                {t("stock.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredStocks.length === 0 ? (
              <tr>
                <td colSpan="9" className="py-8 px-4 text-center text-gray-500">
                  {stocks.length === 0
                    ? t("stock.noStock")
                    : t("stock.noItemsMatch")}
                </td>
              </tr>
            ) : (
              filteredStocks.map((item) => {
                const paymentInfo = getPaymentInfo(item);
                const isLowStock =
                  item.minimumQuantity > 0 &&
                  item.quantity <= item.minimumQuantity;

                return (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {item.nameOfItem || item.name}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
                      {item.supplierName || t("stock.na")}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm">
                      {item.minimumQuantity > 0 ? (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isLowStock
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {isLowStock
                            ? t("stock.lowStock")
                            : t("stock.goodStock")}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-xs">
                          {t("stock.noMinSet")}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-col">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${
                            paymentInfo.type === "Cash"
                              ? "bg-green-100 text-green-800"
                              : paymentInfo.type === "Postponed"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {paymentInfo.type}
                        </span>
                        {paymentInfo.type === "Postponed" &&
                          paymentInfo.residual > 0 && (
                            <span className="text-xs text-red-600 mt-1">
                              {t("stock.remaining")}: $
                              {paymentInfo.residual.toFixed(2)}
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-col">
                        <span
                          className={
                            isLowStock ? "text-red-600 font-medium" : ""
                          }
                        >
                          {formatNumber(item.quantity)} {item.unit}
                        </span>
                        {item.minimumQuantity > 0 && (
                          <span className="text-xs text-gray-500">
                            {t("stock.min")}:{" "}
                            {formatNumber(item.minimumQuantity)} {item.unit}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-col">
                        {item.invoice && item.invoice.length > 0 ? (
                          <>
                            <span className="font-medium">
                              {formatNumber(
                                item.invoice[0].value / (item.pricePerUnit || 1)
                              )}{" "}
                              {item.unit}
                            </span>
                            <span className="text-xs text-gray-500">
                              {t("stock.used")}:{" "}
                              {formatNumber(
                                Math.max(
                                  0,
                                  item.invoice[0].value /
                                    (item.pricePerUnit || 1) -
                                    item.quantity
                                )
                              )}{" "}
                              {item.unit}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-500">{t("stock.na")}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(item.pricePerUnit || item.price || 0)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {formatCurrency(calculateTotal(item))}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex justify-center space-x-2">
                        <button
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                          onClick={() => handleOpenForm(item, "view")}
                          title={t("stock.viewDetails")}
                        >
                          <FaEye />
                        </button>
                        <button
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
                          onClick={() => handleOpenForm(item, "edit")}
                          title={t("stock.editItem")}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                          onClick={() => handleDeleteClick(item)}
                          title={t("stock.deleteItem")}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6 text-xs sm:text-sm">
        <p className="text-sm text-gray-500">
          {t("stock.showing")} {filteredStocks.length} {t("stock.of")}{" "}
          {stocks.length} {t("stock.items")}
        </p>
        <div className="flex sm:space-x-2">
          <button
            className="btn-outline px-3 py-1 disabled:opacity-50"
            disabled
          >
            {t("stock.previous")}
          </button>
          <button
            className="btn-outline px-3 py-1 disabled:opacity-50"
            disabled
          >
            {t("stock.next")}
          </button>
        </div>
      </div>

      {/* Stock form modal */}
      {isFormOpen && (
        <Suspense fallback={<div>{t("stock.loadingStockForm")}</div>}>
          <StockForm
            stock={selectedStockItem}
            onClose={handleCloseForm}
            isViewMode={formMode === "view"}
          />
        </Suspense>
      )}

      {/* Delete confirmation modal */}
      {isDeleteModalOpen && (
        <DeleteConfirmation
          title={t("stock.deleteStock")}
          message={t("stock.confirmDelete")}
          onConfirm={handleDelete}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      )}
    </div>
  );
}

export default StocksManagement;
