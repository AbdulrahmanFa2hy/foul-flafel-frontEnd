import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import TableHeader from "./TableHeader";
import TableRow from "./TableRow";
import Loading from "../common/Loading";
import ErrorMessage from "../common/ErrorMessage";

function Table({ orders, loading, error, defaultSort }) {
  const { t } = useTranslation();
  const [sortConfig, setSortConfig] = useState(
    defaultSort || { key: "date", direction: "desc" }
  );

  // Update sort config when defaultSort changes
  useEffect(() => {
    if (defaultSort) {
      setSortConfig(defaultSort);
    }
  }, [defaultSort]);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    } else {
      // If sorting a new column, default to desc for date and asc for others
      direction = key === "date" ? "desc" : "asc";
    }
    setSortConfig({ key, direction });
  };

  const getSortedOrders = () => {
    if (!orders?.length) return [];

    return [...orders].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle date sorting using rawDate for accurate comparison
      if (sortConfig.key === "date" && a.rawDate && b.rawDate) {
        aValue = new Date(a.rawDate).getTime();
        bValue = new Date(b.rawDate).getTime();
      }

      // Handle time sorting by converting to comparable format
      if (sortConfig.key === "time") {
        const timeToMinutes = (timeStr) => {
          if (!timeStr || timeStr === "-") return 0;
          const [time, period] = timeStr.split(" ");
          const [hours, minutes] = time.split(":").map(Number);
          let totalMinutes = minutes + (hours % 12) * 60;
          if (period === "PM" && hours !== 12) totalMinutes += 12 * 60;
          if (period === "AM" && hours === 12) totalMinutes -= 12 * 60;
          return totalMinutes;
        };
        aValue = timeToMinutes(aValue);
        bValue = timeToMinutes(bValue);
      }

      // Handle amount sorting by extracting numeric value
      if (sortConfig.key === "amount") {
        const extractAmount = (amountStr) => {
          if (!amountStr || amountStr === "-") return 0;
          const numericValue = parseFloat(amountStr.replace(/[^\d.-]/g, ""));
          return isNaN(numericValue) ? 0 : numericValue;
        };
        aValue = extractAmount(aValue);
        bValue = extractAmount(bValue);
      }

      // Handle null or undefined values
      if (aValue === null || aValue === undefined) aValue = "";
      if (bValue === null || bValue === undefined) bValue = "";

      // Standard comparison
      const compareResult = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortConfig.direction === "asc" ? compareResult : -compareResult;
    });
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!orders?.length) {
    return (
      <div className="flex justify-center items-center py-10">
        <span className="text-lg text-neutral-500">
          {t("history.noOrders")}
        </span>
      </div>
    );
  }

  const sortedOrders = getSortedOrders();

  return (
    <div className="bg-white rounded-lg shadow-card overflow-hidden animate-fade-in">
      <div className="overflow-x-auto sm:pl-2">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-neutral-200">
            <colgroup>
              <col className="w-[20%] sm:w-[18%]" /> {/* Order Code */}
              <col className="w-[22%] sm:w-[20%]" /> {/* Date */}
              <col className="w-[18%] sm:w-[16%]" /> {/* Time */}
              <col className="w-[20%] sm:w-[22%]" /> {/* Amount */}
              <col className="w-[20%] sm:w-[24%]" /> {/* Payment Method */}
            </colgroup>
            <thead className="bg-white">
              <tr>
                <TableHeader
                  label={t("history.orderCode")}
                  field="orderId"
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <TableHeader
                  label={t("history.date")}
                  field="date"
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <TableHeader
                  label={t("history.time")}
                  field="time"
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <TableHeader
                  label={t("history.amount")}
                  field="amount"
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <TableHeader
                  label={t("history.paymentMethod")}
                  field="paymentMethod"
                  sortConfig={sortConfig}
                  onSort={requestSort}
                  className="justify-center"
                />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200 text-primary-800">
              {sortedOrders.map((order) => (
                <TableRow
                  key={`${order.orderId}-${order.time}`}
                  order={order}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Table;
