import { useMemo, useCallback, useState, useEffect, memo } from "react";
import { useTranslation } from "react-i18next";
import { FaHandHoldingMedical } from "react-icons/fa";
import { MdTableRestaurant } from "react-icons/md";
import { TbTruckDelivery } from "react-icons/tb";

import { useSelector } from "react-redux";

// Memoized OrderCard component to prevent unnecessary re-renders
const OrderCard = memo(function OrderCard({
  order,
  isSelected,
  onSelect,
  getStatusColor,
  getStatusText,
}) {
  const handleClick = useCallback(() => {
    onSelect(order.id);
  }, [order.id, onSelect]);

  return (
    <button
      className={`w-full p-4 rounded-lg border-2 border-gray-200 transition-all ease-in-out duration-200 ${
        isSelected
          ? "bg-primary-50 border-primary-700"
          : "bg-gray-50 hover:bg-gray-100"
      }`}
      onClick={handleClick}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-medium">{order.orderCode}</span>
        </div>
        <span className="text-primary-700 font-bold">{order.total} AED</span>
      </div>

      <div className="flex justify-between items-center mt-2">
        <span className="text-sm text-gray-500">Items: {order.itemCount}</span>

        <div className="flex flex-col justify-center items-center gap-1 ">
          {order.type === "dinein" && order.tableNumber && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
              T{order.tableNumber}
            </span>
          )}
          <span
            className={`text-sm px-2 py-1 rounded-full ${getStatusColor(
              order.status
            )}`}
          >
            {getStatusText(order.status)}
          </span>
        </div>
      </div>
      <div className="text-xs text-gray-400 mt-1">
        {new Date(order.createdAt).toLocaleTimeString()}
      </div>
    </button>
  );
});

const CashierSidebar = memo(function CashierSidebar({
  selectedOrder,
  onSelectOrder,
}) {
  const { t } = useTranslation();
  // Get orders from Redux store
  const { orders } = useSelector((state) => state.order);

  // State for order type filter - default to takeaway
  const [orderTypeFilter, setOrderTypeFilter] = useState("takeaway");

  // Auto-select tab when an order is selected
  useEffect(() => {
    if (selectedOrder?.type === "delivery") {
      setOrderTypeFilter("delivery");
    } else if (selectedOrder?.type === "takeaway") {
      setOrderTypeFilter("takeaway");
    } else if (selectedOrder?.type === "dinein") {
      setOrderTypeFilter("dinein");
    }
  }, [selectedOrder?.type]);

  // Memoized order counts by type
  const orderCounts = useMemo(() => {
    if (!orders || orders.length === 0) {
      return { takeaway: 0, delivery: 0, dinein: 0 };
    }

    return orders.reduce(
      (counts, order) => {
        if (order.type === "takeaway") {
          counts.takeaway++;
        } else if (order.type === "delivery") {
          counts.delivery++;
        } else if (order.type === "dinein") {
          counts.dinein++;
        }
        return counts;
      },
      { takeaway: 0, delivery: 0, dinein: 0 }
    );
  }, [orders]);

  // Memoized format order function
  const formatOrder = useCallback(
    (order) => ({
      id: order._id,
      orderCode: order.orderCode,
      total: order.totalPrice?.toFixed(2) || "0.00",
      status: order.isPaid
        ? "paid"
        : order.isCancelled
        ? "cancelled"
        : "pending",
      itemCount: order.orderItems ? order.orderItems.length : 0,
      createdAt: order.createdAt,
      type: order.type,
      custName: order.custName,
      custPhone: order.custPhone,
      custAddress: order.custAddress,
      tableNumber: order.tableNumber,
    }),
    []
  );

  // Memoized filtered and formatted orders with improved sorting
  const formattedOrders = useMemo(() => {
    if (!orders || orders.length === 0) {
      return [];
    }

    // Filter by order type first
    const filteredOrders = orders.filter(
      (order) => order.type === orderTypeFilter
    );

    // Format orders
    const formattedOrdersList = filteredOrders.map(formatOrder);

    // Improved sorting: pending first, then paid, both sorted by newest first
    return formattedOrdersList.sort((a, b) => {
      // First, sort by status (pending first)
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;

      // Within same status, sort by creation date (newest first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [orders, orderTypeFilter, formatOrder]);

  // Memoized status color function
  const getStatusColor = useCallback((status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "paid":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  }, []);

  // Memoized status text function
  const getStatusText = useCallback(
    (status) => {
      switch (status) {
        case "pending":
          return t("cashier.pending");
        case "paid":
          return t("cashier.completed");
        case "cancelled":
          return t("cashier.cancelled");
        default:
          return status;
      }
    },
    [t]
  );

  // Memoized order selection handler
  const handleOrderSelect = useCallback(
    (orderId) => {
      const order = orders.find((o) => o._id === orderId);
      if (order) {
        onSelectOrder(order);
      }
    },
    [orders, onSelectOrder]
  );

  // Memoized filter button handlers
  const handleTakeawayFilter = useCallback(() => {
    setOrderTypeFilter("takeaway");
  }, []);

  const handleDeliveryFilter = useCallback(() => {
    setOrderTypeFilter("delivery");
  }, []);

  const handleDineInFilter = useCallback(() => {
    setOrderTypeFilter("dinein");
  }, []);

  // Memoized order cards
  const orderCards = useMemo(() => {
    return formattedOrders.map((order) => {
      const isSelected =
        selectedOrder?.id === order.id || selectedOrder?._id === order.id;

      return (
        <OrderCard
          key={order.id}
          order={order}
          isSelected={isSelected}
          onSelect={handleOrderSelect}
          getStatusColor={getStatusColor}
          getStatusText={getStatusText}
        />
      );
    });
  }, [
    formattedOrders,
    selectedOrder,
    handleOrderSelect,
    getStatusColor,
    getStatusText,
  ]);

  return (
    <div className="bg-white h-full overflow-hidden p-1 flex flex-col">
      <div className="mb-2">
        {/* Order Type Filter Buttons */}
        <div className="grid grid-cols-3 gap-1 mb-2">
          <button
            onClick={handleTakeawayFilter}
            className={`relative px-2 pb-1 rounded-lg text-xs font-medium transition-colors flex flex-col items-center justify-center ${
              orderTypeFilter === "takeaway"
                ? "bg-primary-700 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            title={t("menu.takeaway")}
          >
            <FaHandHoldingMedical className="text-4xl mb-1" />
            <span className="absolute bottom-1 right-1 text-xs font-bold">
              {orderCounts.takeaway}
            </span>
          </button>
          <button
            onClick={handleDineInFilter}
            className={`relative px-2 pb-1 rounded-lg text-xs font-medium transition-colors flex flex-col items-center justify-center ${
              orderTypeFilter === "dinein"
                ? "bg-primary-700 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            title={t("menu.dineIn")}
          >
            <MdTableRestaurant className="text-4xl mb-1" />
            <span className="absolute bottom-1 right-1 text-xs font-bold">
              {orderCounts.dinein}
            </span>
          </button>
          <button
            onClick={handleDeliveryFilter}
            className={`relative px-2 pb-1 rounded-lg text-xs font-medium transition-colors flex flex-col items-center justify-center ${
              orderTypeFilter === "delivery"
                ? "bg-primary-700 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            title={t("menu.delivery")}
          >
            <TbTruckDelivery className="text-4xl mb-1" />
            <span className="absolute bottom-1 right-1 text-xs font-bold">
              {orderCounts.delivery}
            </span>
          </button>
        </div>
      </div>

      <div className="space-y-2 overflow-y-auto flex-1 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {orderCards.length > 0 ? (
          orderCards
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">{t("cashier.noOrders")}</p>
          </div>
        )}
      </div>
    </div>
  );
});

export default CashierSidebar;
