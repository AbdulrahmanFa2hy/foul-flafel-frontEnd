import { useEffect, useState, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { format, parse } from "date-fns";
import { ar } from "date-fns/locale";
import { fetchAllPayments } from "../store/paymentSlice";
import HistoryHeader from "../components/history/HistoryHeader";
import Table from "../components/history/Table";
import { useTranslation } from "react-i18next";

function HistoryPage() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const {
    payments,
    loading,
    error,
    currentPage,
    totalPages,
    totalPayments,
    pageSize,
  } = useSelector((state) => state.payment);

  // Get user role to determine if we should filter by cashier
  const { user } = useSelector((state) => state.auth);
  const isManager = user?.role === "manager";

  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [filters, setFilters] = useState({
    page: 1,
    size: 20,
    paymentMethod: null,
    date: null,
    shiftId: null,
    cashierId: null,
    search: null,
  });

  // Fetch payments when filters change
  useEffect(() => {
    const fetchParams = { ...filters };

    // Add search term to backend request
    if (searchTerm.trim()) {
      fetchParams.search = searchTerm.trim();
    }

    // Convert date range to backend format if provided
    if (dateRange) {
      if (dateRange.includes(" - ")) {
        // For date range, use the start date
        const [startStr] = dateRange.split(" - ");
        const startDate = parse(startStr, "d MMM, yyyy", new Date());
        fetchParams.date = startDate.toISOString();
      } else {
        // Single date
        const selectedDate = parse(dateRange, "d MMM, yyyy", new Date());
        fetchParams.date = selectedDate.toISOString();
      }
    }

    // Managers should see all payments, cashiers only their own
    // Remove cashierId for managers to get all payments
    if (isManager && fetchParams.cashierId) {
      delete fetchParams.cashierId;
    }

    dispatch(fetchAllPayments(fetchParams));
  }, [dispatch, filters, dateRange, searchTerm, isManager]);

  // Handle page change
  const handlePageChange = useCallback((newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  }, []);

  // Handle filters change
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 })); // Reset to page 1 when filters change
  }, []);

  // Handle search change with debouncing
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
    // Reset to page 1 when search changes
    setFilters((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Transform payment API data to OrdersTable format
  const transformPayment = (payment) => {
    const orderData = payment.orderData || {};
    const createdAt = payment.createdAt || orderData.createdAt;
    const dateObj = createdAt ? new Date(createdAt) : null;

    const locale = i18n.language === "ar" ? ar : undefined;

    return {
      orderId: orderData.orderCode || "-",
      date: dateObj ? format(dateObj, "d MMM, yyyy", { locale }) : "-",
      time: dateObj ? format(dateObj, "h:mm a", { locale }) : "-",
      amount: payment.totalAmount ? `${payment.totalAmount} AED` : "-",
      paymentMethod:
        payment.paymentMethods?.length > 0
          ? payment.paymentMethods
              .map((pm) => pm.method.toUpperCase())
              .join(" & ")
          : "-",
      rawDate: dateObj, // Keep the raw date for client-side filtering if needed
    };
  };

  // Transform payments without additional client-side filtering since search is now handled by backend
  const transformedOrders = useMemo(() => {
    return payments.map(transformPayment);
  }, [payments, i18n.language]);

  return (
    <div className="space-y-4 px-4 mb-4">
      <HistoryHeader
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onDateChange={setDateRange}
        onFiltersChange={handleFiltersChange}
        currentFilters={filters}
      />
      <Table
        orders={transformedOrders}
        loading={loading}
        error={error}
        // Pagination props
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalPayments}
        pageSize={pageSize}
        onPageChange={handlePageChange}
      />
      {/* Enhanced Pagination Controls */}
      {totalPayments > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 mt-6 bg-white px-4 py-3 border border-gray-200 rounded-lg">
          {/* Results info */}
          <div className="text-sm text-gray-700">
            {t("history.showing")}{" "}
            <span className="font-medium">
              {totalPayments > 0 ? (currentPage - 1) * pageSize + 1 : 0}
            </span>{" "}
            {t("history.to")}{" "}
            <span className="font-medium">
              {Math.min(currentPage * pageSize, totalPayments)}
            </span>{" "}
            {t("history.of")}{" "}
            <span className="font-medium">{totalPayments}</span>{" "}
            {t("history.results")}
            {searchTerm && (
              <span className="ml-2 text-gray-500">
                ({t("history.filtered_by")} &quot;{searchTerm}&quot;)
              </span>
            )}
          </div>

          {/* Pagination buttons - only show if more than one page */}
          {totalPages > 1 && (
            <div className="flex items-center space-x-1">
              {/* Previous button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("history.previous")}
              </button>

              {/* Page numbers */}
              <div className="hidden sm:flex space-x-1">
                {/* First page */}
                {currentPage > 3 && (
                  <>
                    <button
                      onClick={() => handlePageChange(1)}
                      className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                    >
                      1
                    </button>
                    {currentPage > 4 && (
                      <span className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300">
                        ...
                      </span>
                    )}
                  </>
                )}

                {/* Pages around current page */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  if (pageNum < 1 || pageNum > totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`relative inline-flex items-center px-3 py-2 text-sm font-medium border hover:bg-gray-50 ${
                        pageNum === currentPage
                          ? "z-10 bg-primary-50 border-primary-500 text-primary-600"
                          : "text-gray-500 bg-white border-gray-300"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {/* Last page */}
                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && (
                      <span className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300">
                        ...
                      </span>
                    )}
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              {/* Mobile page info */}
              <div className="sm:hidden flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300">
                {currentPage} / {totalPages}
              </div>

              {/* Next button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("history.next")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default HistoryPage;
