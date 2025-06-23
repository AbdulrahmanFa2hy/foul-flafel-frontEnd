import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { FaArrowLeft, FaTimes } from "react-icons/fa";
import printingService from "../services/printingService";
import CategoryTabs from "../components/common/CategoryTabs";
import SearchInput from "../components/common/SearchInput";
import MenuGrid from "../components/menu/MenuGrid";
import SelectedOrderData from "../components/cashier/SelectedOrderData";
import CashierSidebar from "../components/cashier/CashierSidebar";
import CashierHeader from "../components/cashier/CashierHeader";
import Loading from "../components/common/Loading";
import { fetchMeals, loadCachedMeals } from "../store/mealSlice";
import { fetchCategories, loadCachedCategories } from "../store/categorySlice";
import {
  fetchAllOrders,
  setSelectedOrder,
  addMealToOrder,
  deleteMealFromOrder,
} from "../store/orderSlice";

// Lazy load heavy components
const PaymentSection = lazy(() =>
  import("../components/cashier/paymentSection/PaymentSection")
);

function CashierPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const location = useLocation();

  // Redux state with memoized selectors
  const {
    meals,
    loading: mealsLoading,
    fromCache: mealsFromCache,
  } = useSelector((state) => state.meals);
  const {
    categories,
    loading: categoriesLoading,
    fromCache: categoriesFromCache,
  } = useSelector((state) => state.categories);
  const {
    orders,
    currentOrder,
    loading: ordersLoading,
  } = useSelector((state) => state.order);
  const {
    currentShift,
    loading: shiftLoading,
    hasActiveShift,
  } = useSelector((state) => state.shift);
  const { user } = useSelector((state) => state.auth);

  // Local state
  const [activeCategory, setActiveCategory] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cashierSidebarOpen, setCashierSidebarOpen] = useState(
    window.innerWidth >= 1024
  );

  // Per-order state management
  const [orderStates, setOrderStates] = useState({});
  const [mealOperationLoading, setMealOperationLoading] = useState(false);

  // Memoized user role checks
  const needsShiftManagement = useMemo(() => {
    const role = user?.role?.toLowerCase();
    return role === "cashier" || role === "manager";
  }, [user?.role]);

  // Memoized permissions
  const { canDeleteMeals, canDecreaseQuantity } = useMemo(
    () => ({
      canDeleteMeals: true, // All users have full permissions in bakery shop
      canDecreaseQuantity: true,
    }),
    []
  );

  // Memoized loading state
  const loading = useMemo(
    () => mealsLoading || ordersLoading || categoriesLoading,
    [mealsLoading, ordersLoading, categoriesLoading]
  );

  // Get current order's state
  const currentOrderState = useMemo(() => {
    if (!currentOrder?._id) return { tax: "", discount: "" };
    return orderStates[currentOrder._id] || { tax: "", discount: "" };
  }, [currentOrder?._id, orderStates]);

  // Load cached data and fetch fresh data
  const loadData = useCallback(() => {
    // Load cached data immediately
    dispatch(loadCachedMeals());
    dispatch(loadCachedCategories());

    // Then fetch fresh data
    dispatch(fetchMeals());
    dispatch(fetchCategories());
  }, [dispatch]);

  // Initial data loading
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Fetch orders when shift is available or on initial load
  useEffect(() => {
    // Skip if still loading shift status
    if (shiftLoading) return;

    if (needsShiftManagement) {
      // Only fetch orders if we have an active shift
      if (hasActiveShift && currentShift?._id) {
        dispatch(fetchAllOrders({ shiftId: currentShift._id }));
      }
    } else {
      // For other roles, fetch all orders
      dispatch(fetchAllOrders());
    }
  }, [
    dispatch,
    currentShift?._id,
    shiftLoading,
    hasActiveShift,
    needsShiftManagement,
  ]);

  // Set first category as active when categories are loaded
  useEffect(() => {
    if (categories && categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]._id);
    }
  }, [categories, activeCategory]);

  // Memoized responsive sidebar handling
  const handleResize = useCallback(() => {
    setCashierSidebarOpen(window.innerWidth >= 1024);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setCashierSidebarOpen(false);
    }
  }, []);

  // Memoized sidebar toggle
  const toggleCashierSidebar = useCallback(() => {
    setCashierSidebarOpen((prev) => !prev);
  }, []);

  // Auto-select order when orders are loaded with memoized logic
  const selectOrderLogic = useCallback(() => {
    if (orders && orders.length > 0) {
      // Check if current order is still in the orders list
      const currentOrderStillExists =
        currentOrder && orders.some((order) => order._id === currentOrder._id);

      if (!currentOrderStillExists) {
        // Sort orders: pending first, then by creation date (latest first)
        const sortedOrders = [...orders].sort((a, b) => {
          // First, sort by status (pending first)
          if (a.status === "pending" && b.status !== "pending") return -1;
          if (a.status !== "pending" && b.status === "pending") return 1;

          // Then by creation date (latest first)
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

        // Select the first order
        const selectedOrder = sortedOrders[0];
        if (selectedOrder) {
          dispatch(setSelectedOrder(selectedOrder));
        }
      }
    } else if (orders && orders.length === 0 && currentOrder) {
      // Clear current order if no orders available
      dispatch(setSelectedOrder(null));
    }
  }, [orders, currentOrder, dispatch]);

  // Auto-print kitchen receipt only when arriving from order creation
  useEffect(() => {
    const handleAutoPrint = async () => {
      if (location.state?.fromOrderCreation && orders && orders.length > 0) {
        const orderId = location.state.orderId;
        const orderToPrint = orders.find((order) => order._id === orderId);

        if (orderToPrint) {
          try {
            // Only print kitchen ticket when navigating from menu
            await printingService.printKitchenTicket(orderToPrint);
            toast.success(t("cashier.kitchenTicketPrinted"));
          } catch (error) {
            console.warn("Kitchen ticket print failed:", error);
            toast.warning(t("cashier.kitchenPrintFailed"));
          }
        }

        // Clear the navigation state to prevent re-printing
        window.history.replaceState({}, document.title);
      }
    };

    handleAutoPrint();
  }, [location.state, orders, t]);

  useEffect(() => {
    selectOrderLogic();
  }, [selectOrderLogic]);

  // Update orderItems when currentOrder changes with memoized formatting
  const formatOrderItems = useCallback((currentOrder) => {
    if (!currentOrder || !currentOrder.orderItems) return [];

    return currentOrder.orderItems.map((item, index) => {
      let mealData = null;

      if (
        currentOrder.orderItemsData &&
        currentOrder.orderItemsData.length > 0
      ) {
        mealData = currentOrder.orderItemsData.find(
          (meal) => meal._id === item.mealId
        );
      }

      if (!mealData && item.meal) {
        mealData = item.meal;
      }

      if (!mealData) {
        console.warn(`No meal data found for mealId: ${item.mealId}`);
        mealData = {
          _id: item.mealId,
          name: `Meal ${item.mealId}`,
          price: item.price,
          categoryId: "unknown",
          currency: "AED",
        };
      }

      return {
        _id: item._id || `order_item_${item.mealId}_${index}`, // Stable unique ID
        id: mealData._id, // Keep for backward compatibility
        mealId: item.mealId, // Preserve the mealId for API calls
        name: mealData.name,
        price: item.price,
        quantity: item.quantity,
        categoryId: mealData.categoryId,
        currency: mealData.currency || "AED",
        isCancelled: item.isCancelled || false, // Include cancellation status
        orderIndex: index, // Preserve original order
      };
    });
  }, []);

  useEffect(() => {
    setOrderItems(formatOrderItems(currentOrder));
  }, [currentOrder, formatOrderItems]);

  // Memoized filtered items
  useEffect(() => {
    if (meals && meals.length > 0) {
      setFilteredItems(
        meals.filter(
          (item) =>
            item.categoryId === activeCategory &&
            (searchTerm === "" ||
              item.name.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
    }
  }, [activeCategory, meals, searchTerm]);

  // Update order state
  const updateOrderState = useCallback((orderId, updates) => {
    setOrderStates((prev) => ({
      ...prev,
      [orderId]: { ...prev[orderId], ...updates },
    }));
  }, []);

  // Memoized add item to order function
  const addToOrder = useCallback(
    async (item) => {
      if (!currentOrder) {
        console.warn("No current order selected");
        return;
      }

      setMealOperationLoading(true);
      try {
        const existingOrderItem = currentOrder.orderItems?.find(
          (orderItem) => orderItem.mealId === item._id
        );

        let newQuantity = 1;
        let actionMessage = `${item.name} ${t("cashier.mealAdded")}`;

        if (existingOrderItem) {
          if (existingOrderItem.isCancelled) {
            // If the meal was cancelled, restore it with the same quantity
            newQuantity = existingOrderItem.quantity;
            actionMessage = `${item.name} restored to order`;
          } else {
            // If the meal is active, increment quantity
            newQuantity = existingOrderItem.quantity + 1;
            actionMessage = `${item.name} quantity increased to ${newQuantity}`;
          }
        }

        await dispatch(
          addMealToOrder({
            orderId: currentOrder._id,
            mealId: item._id,
            quantity: newQuantity,
          })
        ).unwrap();

        toast.success(actionMessage, { duration: 2000 });
      } catch (error) {
        console.error("Failed to add meal to order:", error);
        toast.error(t("cashier.operationFailed"), { duration: 3000 });
      } finally {
        setMealOperationLoading(false);
      }
    },
    [currentOrder, dispatch, t]
  );

  // Memoized remove item from order function
  const removeFromOrder = useCallback(
    async (id) => {
      if (!currentOrder || !canDeleteMeals) {
        console.warn("No current order selected or no permission");
        return;
      }

      setMealOperationLoading(true);
      try {
        await dispatch(
          deleteMealFromOrder({
            orderId: currentOrder._id,
            mealId: id,
          })
        ).unwrap();

        toast.success(t("cashier.mealRemoved"), {
          duration: 2000,
          icon: "❌",
        });
      } catch (error) {
        console.error("Failed to remove meal from order:", error);
        toast.error(t("cashier.operationFailed"), { duration: 3000 });
      } finally {
        setMealOperationLoading(false);
      }
    },
    [currentOrder, dispatch, canDeleteMeals, t]
  );

  // Memoized update quantity function
  const updateQuantity = useCallback(
    async (id, quantity) => {
      if (!currentOrder) {
        console.warn("No current order selected");
        return;
      }

      if (quantity <= 0) {
        if (canDeleteMeals) {
          removeFromOrder(id);
        }
        return;
      }

      setMealOperationLoading(true);
      try {
        await dispatch(
          addMealToOrder({
            orderId: currentOrder._id,
            mealId: id,
            quantity: quantity,
          })
        ).unwrap();

        toast.success(t("cashier.quantityUpdated"), { duration: 2000 });
      } catch (error) {
        console.error("Failed to update meal quantity:", error);
        toast.error(t("cashier.operationFailed"), { duration: 3000 });
      } finally {
        setMealOperationLoading(false);
      }
    },
    [currentOrder, dispatch, canDeleteMeals, removeFromOrder, t]
  );

  // Memoized calculation functions
  const calculateSubtotal = useCallback(() => {
    return orderItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }, [orderItems]);

  const calculateDiscount = useCallback(() => {
    const discount = parseFloat(currentOrderState.discount) || 0;
    return (calculateSubtotal() * discount) / 100;
  }, [calculateSubtotal, currentOrderState.discount]);

  // Memoized event handlers
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  const handleSelectOrder = useCallback(
    (order) => {
      dispatch(setSelectedOrder(order));
    },
    [dispatch]
  );

  const handleTaxChange = useCallback(
    (tax) => {
      if (currentOrder?._id) {
        updateOrderState(currentOrder._id, { tax });
      }
    },
    [currentOrder?._id, updateOrderState]
  );

  const handleDiscountChange = useCallback(
    (discount) => {
      if (currentOrder?._id) {
        updateOrderState(currentOrder._id, { discount });
      }
    },
    [currentOrder?._id, updateOrderState]
  );

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  // Show loading if shift is still being checked for users who need shift management
  if (needsShiftManagement && shiftLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-800"></div>
          <p className="mt-2 text-gray-600">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  // Show loading only if we don't have cached data
  if (
    loading &&
    !mealsFromCache &&
    !categoriesFromCache &&
    (!meals || meals.length === 0)
  ) {
    return <Loading />;
  }

  return (
    <div className="h-full flex relative">
      {/* Overlay for mobile sidebar */}
      {cashierSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleCashierSidebar}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto [scrollbar-width:none] [::-webkit-scrollbar]:hidden">
        <div className="w-full px-1 sm:px-2 lg:px-1 xl:px-2 pb-4 pt-2">
          <CashierHeader selectedOrder={currentOrder} />

          {/* Search and Add Meal Button */}
          <div className="flex items-center gap-2 sm:gap-4 mb-6">
            <div className="flex-1">
              <SearchInput value={searchTerm} onChange={handleSearch} />
            </div>
            <button
              onClick={toggleMenu}
              className="btn bg-primary-700 text-white hover:bg-primary-800 whitespace-nowrap text-sm sm:text-base px-2 sm:px-4 py-2"
            >
              {isMenuOpen ? t("cashier.closeMenu") : t("cashier.addMeal")}
            </button>
          </div>

          {/* Collapsible Menu Section */}
          {isMenuOpen && categories && categories.length > 0 && (
            <div className="mb-6 animate-fade-in">
              <CategoryTabs
                categories={categories}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
              />
              <MenuGrid menuItems={filteredItems} addToCart={addToOrder} />
            </div>
          )}

          {/* Loading overlay for meal operations */}
          {mealOperationLoading && (
            <div className="fixed inset-0 bg-black bg-opacity-45 flex justify-center items-center z-50">
              <div className="bg-white rounded-lg p-4 shadow-lg">
                <div className="flex items-center justify-center w-full h-full space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-700"></div>
                  <span className="text-gray-700">{t("cashier.updating")}</span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <SelectedOrderData
              orderItems={orderItems}
              updateQuantity={updateQuantity}
              removeFromOrder={removeFromOrder}
              canDeleteMeals={canDeleteMeals}
              canDecreaseQuantity={canDecreaseQuantity}
            />

            {/* Payment Section with Lazy Loading */}
            <div className="mt-6">
              <Suspense
                fallback={
                  <div className="bg-white rounded-lg p-4 shadow-md">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                      <div className="space-y-3">
                        <div className="h-10 bg-gray-200 rounded"></div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                        <div className="h-12 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                }
              >
                <PaymentSection
                  tax={currentOrderState.tax}
                  setTax={handleTaxChange}
                  discount={currentOrderState.discount}
                  setDiscount={handleDiscountChange}
                  subtotal={calculateSubtotal()}
                  discountAmount={calculateDiscount()}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar toggle button */}
      <button
        onClick={toggleCashierSidebar}
        className="fixed top-[22%] right-0 z-10 bg-white h-16 p-[5px] text-lg border border-primary-200 rounded-tl-lg rounded-bl-lg shadow-xl text-primary-800"
      >
        {cashierSidebarOpen ? <FaTimes /> : <FaArrowLeft />}
      </button>

      {/* Orders List Sidebar */}
      <div
        className={`
          ${cashierSidebarOpen ? "translate-x-0" : "translate-x-full"} 
          lg:translate-x-0 
          fixed lg:relative lg:block 
          w-96 max-w-[80vw] lg:max-w-none lg:w-80
          bg-white border-l border-neutral-200
          right-0 h-full z-40
          transition-transform duration-300 ease-in-out
        `}
      >
        <CashierSidebar
          selectedOrder={currentOrder}
          onSelectOrder={handleSelectOrder}
        />
      </div>
    </div>
  );
}

export default CashierPage;
