import { useEffect, useState, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { format, parse } from "date-fns";
import { ar } from "date-fns/locale";
import { fetchAllPayments } from "../store/paymentSlice";
import { fetchAllOrders } from "../store/orderSlice";
import HistoryHeader from "../components/history/HistoryHeader";
import Table from "../components/history/Table";
import { useTranslation } from "react-i18next";

function HistoryPage() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const {
    payments,
    loading: paymentLoading,
    error: paymentError,
    currentPage,
    totalPages,
    totalPayments,
    pageSize,
  } = useSelector((state) => state.payment);

  const {
    orders,
    loading: orderLoading,
    error: orderError,
  } = useSelector((state) => state.order);

  // Get user role to determine if we should filter by cashier
  const { user } = useSelector((state) => state.auth);
  const isManager = user?.role === "manager";

  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [selectedTab, setSelectedTab] = useState("paid"); // "paid" or "cancelled"
  const [defaultSort, setDefaultSort] = useState({
    key: "date",
    direction: "desc",
  });
  const [filters, setFilters] = useState({
    page: 1,
    size: 20,
    paymentMethod: null,
    date: null,
    shiftId: null,
    cashierId: null,
    search: null,
  });

  // Fetch data based on selected tab
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

    // Managers should see all data, cashiers only their own
    if (!isManager && fetchParams.cashierId) {
      delete fetchParams.cashierId;
    }

    if (selectedTab === "paid") {
      dispatch(fetchAllPayments(fetchParams));
    } else {
      dispatch(fetchAllOrders({ ...fetchParams, status: "cancelled" }));
    }
  }, [dispatch, filters, dateRange, searchTerm, isManager, selectedTab]);

  // Handle page change
  const handlePageChange = useCallback((newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  }, []);

  // Handle filters change
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  // Handle search change with debouncing
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
    setFilters((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Transform data based on selected tab
  const transformedOrders = useMemo(() => {
    const locale = i18n.language === "ar" ? ar : undefined;

    if (selectedTab === "paid") {
      return payments.map((payment) => {
        const orderData = payment.orderData || {};
        const createdAt = payment.createdAt || orderData.createdAt;
        const dateObj = createdAt ? new Date(createdAt) : null;

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
          rawDate: dateObj,
        };
      });
    } else {
      return orders.map((order) => {
        const dateObj = order.createdAt ? new Date(order.createdAt) : null;
        return {
          orderId: order.orderCode || "-",
          date: dateObj ? format(dateObj, "d MMM, yyyy", { locale }) : "-",
          time: dateObj ? format(dateObj, "h:mm a", { locale }) : "-",
          amount: order.totalPrice ? `${order.totalPrice} AED` : "-",
          paymentMethod: "CANCELLED",
          rawDate: dateObj,
        };
      });
    }
  }, [payments, orders, selectedTab, i18n.language]);

  return (
    <div className="space-y-4 mb-4">
      <HistoryHeader
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onDateChange={setDateRange}
        onFiltersChange={handleFiltersChange}
        currentFilters={filters}
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
      />

      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <Table
          orders={transformedOrders}
          loading={selectedTab === "paid" ? paymentLoading : orderLoading}
          error={selectedTab === "paid" ? paymentError : orderError}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalPayments}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          defaultSort={defaultSort}
        />
      </div>

      {/* Pagination info */}
      {totalPayments > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 mt-6 bg-white px-3 sm:px-4 py-3 border border-gray-200 rounded-lg">
          {/* Results info */}
          <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
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
              <span className="block sm:inline mt-1 sm:mt-0 sm:ml-2 text-gray-500">
                ({t("history.filtered_by")} &quot;{searchTerm}&quot;)
              </span>
            )}
          </div>

          {/* Pagination buttons */}
          {totalPages > 1 && (
            <div className="flex items-center space-x-1 w-full sm:w-auto justify-center sm:justify-end">
              {/* Previous button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 sm:px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("history.previous")}
              </button>

              {/* Page numbers - Only show on larger screens */}
              <div className="hidden md:flex space-x-1">
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
              <div className="inline-flex md:hidden items-center px-2 sm:px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300">
                {currentPage} / {totalPages}
              </div>

              {/* Next button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 sm:px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
