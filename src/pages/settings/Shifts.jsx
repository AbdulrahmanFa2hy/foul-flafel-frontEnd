import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { FaSearch, FaEye } from "react-icons/fa";
import DatePicker from "../../components/common/DatePicker";
import {
  fetchShifts,
  selectShift,
  clearShiftError,
  setSearchTerm,
  setStatusFilter,
} from "../../store/shiftSlice";
import avatar from "../../assets/avatar.png";

// Lazy load shift components
const ShiftEndSummary = lazy(() =>
  import("../../components/shift/ShiftEndSummary")
);

function Shifts() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { shifts, loading, error, searchTerm, statusFilter } = useSelector(
    (state) => state.shift
  );
  const { user } = useSelector((state) => state.auth);

  const [dateFilter, setDateFilter] = useState("");
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedShiftForView, setSelectedShiftForView] = useState(null);

  // Fetch shifts on component mount
  useEffect(() => {
    // Managers can see all shifts, others see only their own
    const isManager = user?.role?.toLowerCase() === "manager";
    dispatch(fetchShifts({ includeAll: isManager }));
  }, [dispatch, user?.role]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearShiftError());
    };
  }, [dispatch]);

  // Helper function to get unique statuses
  const statuses = useMemo(() => {
    return ["active", "cancelled", "completed"];
  }, []);

  // Filter shifts based on search term, status, and date
  const filteredShifts = useMemo(() => {
    return shifts
      .filter((shift) => {
        const cashierName = shift.cashierData?.name?.toLowerCase() || "";
        const cashierUsername =
          shift.cashierData?.username?.toLowerCase() || "";
        const matchesSearch =
          cashierName.includes(searchTerm.toLowerCase()) ||
          cashierUsername.includes(searchTerm.toLowerCase());

        // Determine shift status
        let shiftStatus = "completed";
        if (shift.isCancelled) {
          shiftStatus = "cancelled";
        } else if (!shift.endBalance && !shift.cancelledAt) {
          shiftStatus = "active";
        }

        const matchesStatus = !statusFilter || shiftStatus === statusFilter;

        // Date filtering
        let matchesDate = true;
        if (dateFilter) {
          const shiftDate = new Date(shift.createdAt);
          if (dateFilter.includes(" - ")) {
            // Date range
            const [startStr, endStr] = dateFilter.split(" - ");
            const startDate = new Date(startStr);
            const endDate = new Date(endStr);
            endDate.setHours(23, 59, 59, 999); // Include full end date
            matchesDate = shiftDate >= startDate && shiftDate <= endDate;
          } else {
            // Single date
            const filterDate = new Date(dateFilter);
            const shiftDateOnly = new Date(
              shiftDate.getFullYear(),
              shiftDate.getMonth(),
              shiftDate.getDate()
            );
            const filterDateOnly = new Date(
              filterDate.getFullYear(),
              filterDate.getMonth(),
              filterDate.getDate()
            );
            matchesDate = shiftDateOnly.getTime() === filterDateOnly.getTime();
          }
        }

        return matchesSearch && matchesStatus && matchesDate;
      })
      .sort((a, b) => {
        // Sort by creation date, latest first
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [shifts, searchTerm, statusFilter, dateFilter]);

  const handleSearchChange = (e) => {
    dispatch(setSearchTerm(e.target.value));
  };

  const handleStatusChange = (e) => {
    dispatch(setStatusFilter(e.target.value));
  };

  const handleDateChange = (date) => {
    setDateFilter(date);
  };

  const formatCurrency = (amount) => {
    return `$${(amount || 0).toFixed(2)}`;
  };

  const formatDateTime = (dateString) => {
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

  const getShiftStatus = (shift) => {
    if (shift.isCancelled) {
      return { status: t("shifts.cancelled"), color: "red" };
    } else if (!shift.endBalance && !shift.cancelledAt) {
      return { status: t("shifts.active"), color: "green" };
    } else {
      return { status: t("shifts.completed"), color: "blue" };
    }
  };

  const calculateDuration = (startDate, endDate) => {
    if (!endDate) return t("shifts.active");
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}${t("shifts.hours")} ${diffMinutes}${t(
      "shifts.minutes"
    )}`;
  };

  if (loading && shifts.length === 0) {
    return (
      <div className="animate-fade-in flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">{t("shifts.loadingShifts")}</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {t("shifts.title")}
        </h1>
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
            placeholder={t("shifts.searchPlaceholder")}
            value={searchTerm}
            onChange={handleSearchChange}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-800/50 focus:border-primary-800 pl-10 w-full"
          />
        </div>
        <select
          value={statusFilter}
          onChange={handleStatusChange}
          className="px-3 py-2 border border-gray-300 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-800/50 focus:border-primary-800 sm:w-40"
        >
          <option value="">{t("shifts.allStatus")}</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {t(`shifts.${status}`)}
            </option>
          ))}
        </select>
        <DatePicker onDateChange={handleDateChange} />
      </div>

      {/* Shifts table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                {t("shifts.cashier")}
              </th>
              <th className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                {t("shifts.status")}
              </th>
              <th className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                {t("shifts.startTime")}
              </th>
              <th className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                {t("shifts.duration")}
              </th>
              <th className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                {t("shifts.startBalance")}
              </th>
              <th className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                {t("shifts.endBalance")}
              </th>
              <th className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                {t("shifts.orders")}
              </th>
              <th className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4 text-center">
                {t("shifts.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredShifts.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-8 px-4 text-center text-gray-500">
                  {shifts.length === 0
                    ? t("shifts.noShifts")
                    : t("shifts.noMatchingShifts")}
                </td>
              </tr>
            ) : (
              filteredShifts.map((shift) => {
                const shiftStatus = getShiftStatus(shift);
                return (
                  <tr key={shift._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <img
                          src={shift.cashierData?.image?.url || avatar}
                          alt={shift.cashierData?.name || "Cashier"}
                          className="h-10 w-10 rounded-full mr-3 object-cover"
                          onError={(e) => {
                            e.target.src = avatar;
                          }}
                        />
                        <div>
                          <div className="font-medium">
                            {shift.cashierData?.name || "Unknown"}
                          </div>
                          <div className="text-gray-500">
                            @{shift.cashierData?.username || "unknown"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          shiftStatus.color === "green"
                            ? "bg-green-100 text-green-800"
                            : shiftStatus.color === "blue"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {shiftStatus.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(shift.createdAt)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
                      {calculateDuration(
                        shift.createdAt,
                        shift.cancelledAt || shift.updatedAt
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(shift.startBalance)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
                      {shift.endBalance
                        ? formatCurrency(shift.endBalance)
                        : "-"}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-col">
                        <span>
                          {t("shifts.total")}: {shift.allOrdersCount || 0}
                        </span>
                        {shift.notPaidOrdersCount > 0 && (
                          <span className="text-xs text-red-600">
                            {t("shifts.unpaid")}: {shift.notPaidOrdersCount}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex justify-center space-x-2">
                        <button
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                          onClick={() => {
                            dispatch(selectShift(shift));
                            setSelectedShiftForView(shift);
                            setIsViewModalOpen(true);
                          }}
                          title={t("shifts.viewDetails")}
                        >
                          <FaEye />
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

      {/* Statistics */}
      <div className="flex justify-between items-center mt-6">
        <p className="text-sm text-gray-500">
          {t("shifts.showing")} {filteredShifts.length} {t("shifts.of")}{" "}
          {shifts.length} {t("shifts.shiftsText")}
        </p>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <span className="block text-green-600 font-medium">
              {
                shifts.filter(
                  (s) => !s.isCancelled && !s.endBalance && !s.cancelledAt
                ).length
              }
            </span>
            <span className="text-gray-500">{t("shifts.active")}</span>
          </div>
          <div className="text-center">
            <span className="block text-blue-600 font-medium">
              {shifts.filter((s) => s.endBalance && !s.isCancelled).length}
            </span>
            <span className="text-gray-500">{t("shifts.completed")}</span>
          </div>
          <div className="text-center">
            <span className="block text-red-600 font-medium">
              {shifts.filter((s) => s.isCancelled).length}
            </span>
            <span className="text-gray-500">{t("shifts.cancelled")}</span>
          </div>
        </div>
      </div>

      {isViewModalOpen && selectedShiftForView && (
        <Suspense fallback={<div>{t("shifts.loadingDetails")}</div>}>
          <ShiftEndSummary
            shift={selectedShiftForView}
            showCloseButton={true}
            onClose={() => {
              setIsViewModalOpen(false);
              setSelectedShiftForView(null);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}

export default Shifts;
