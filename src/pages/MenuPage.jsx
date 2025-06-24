import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  lazy,
  Suspense,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaArrowLeft, FaTimes, FaStopCircle } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import MenuHeader from "../components/menu/MenuHeader";
import MenuGrid from "../components/menu/MenuGrid";
import MenuSidebar from "../components/menu/MenuSidebar";
import {
  fetchMeals,
  loadCachedMeals,
  invalidateCache,
} from "../store/mealSlice";
import { fetchCategories, loadCachedCategories } from "../store/categorySlice";
import { createOrder } from "../store/orderSlice";
import { fetchTables } from "../store/tableSlice";
import Loading from "../components/common/Loading";
import ErrorMessage from "../components/common/ErrorMessage";
import { getCategoryId } from "../components/settings/meals-management/utils";

// Lazy load heavy components
const CustomerDataModal = lazy(() =>
  import("../components/menu/CustomerDataModal")
);
const EndShiftModal = lazy(() => import("../components/shift/EndShiftModal"));

const MenuPage = () => {
  const { t } = useTranslation();

  // State management
  const [activeCategory, setActiveCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [selectedCartItemId, setSelectedCartItemId] = useState(null);
  const [menuSidebarOpen, setMenuSidebarOpen] = useState(
    window.innerWidth >= 768
  );

  // Order controls state
  const [orderType, setOrderType] = useState("takeaway");
  const [customerData, setCustomerData] = useState({
    custName: "",
    custPhone: "",
    custAddress: "",
  });
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isEndShiftModalOpen, setIsEndShiftModalOpen] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Redux selectors with memoization
  const {
    meals,
    loading: mealsLoading,
    error: mealsError,
    fromCache,
  } = useSelector((state) => state.meals);
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useSelector((state) => state.categories);
  const { user } = useSelector((state) => state.auth);
  const { hasActiveShift, currentShift } = useSelector((state) => state.shift);
  const { tables } = useSelector((state) => state.table);

  // Memoized user role check
  const isCashier = useMemo(
    () => user?.role?.toLowerCase() === "cashier",
    [user?.role]
  );
  const isManager = useMemo(
    () => user?.role?.toLowerCase() === "manager",
    [user?.role]
  );

  // Memoized loading and error states
  const loading = useMemo(
    () => mealsLoading || categoriesLoading,
    [mealsLoading, categoriesLoading]
  );
  const error = useMemo(
    () => mealsError || categoriesError,
    [mealsError, categoriesError]
  );

  // Load cached data and fetch fresh data
  const loadData = useCallback(() => {
    // First try to load cached data immediately
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

  // Handle table selection from URL params and fetch tables
  useEffect(() => {
    const tableId = searchParams.get("table");
    if (tableId) {
      setSelectedTableId(tableId);
      setOrderType("dinein");
      // Fetch tables if we don't have them yet
      if (!tables || tables.length === 0) {
        dispatch(fetchTables());
      }
    }
  }, [searchParams, tables, dispatch]);

  // Memoized filtered menu items
  const filteredMenuItems = useMemo(() => {
    if (!meals) return [];

    let filteredMeals = activeCategory
      ? meals.filter((meal) => {
          // Handle both populated and unpopulated categoryId formats
          const mealCategoryId = getCategoryId(meal.categoryId);
          return mealCategoryId === activeCategory;
        })
      : meals;

    if (searchQuery.trim() !== "") {
      return filteredMeals.filter((meal) =>
        meal.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filteredMeals;
  }, [meals, activeCategory, searchQuery]);

  // Memoized total calculation
  const calculateTotal = useCallback(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  // Set first category as active when categories are loaded
  useEffect(() => {
    if (categories && categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]._id);
    }
  }, [categories, activeCategory]);

  // Responsive sidebar handling
  const handleResize = useCallback(() => {
    setMenuSidebarOpen(window.innerWidth >= 1000);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  useEffect(() => {
    if (window.innerWidth < 1000) {
      setMenuSidebarOpen(false);
    }
  }, []);

  // Memoized event handlers
  const toggleRightSidebar = useCallback(() => {
    setMenuSidebarOpen((prev) => !prev);
  }, []);

  const addToCart = useCallback((meal) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (cartItem) => cartItem._id === meal._id
      );

      if (existingItemIndex !== -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + 1,
        };
        setSelectedCartItemId(meal._id);
        return updatedCart;
      } else {
        const newItem = { ...meal, quantity: 1 };
        setSelectedCartItemId(meal._id);
        return [...prevCart, newItem];
      }
    });
  }, []);

  const updateQuantity = useCallback((id, change) => {
    setCart((prevCart) => {
      const item = prevCart.find((item) => item._id === id);
      if (item && item.quantity + change <= 0) {
        setSelectedCartItemId((prevSelected) =>
          prevSelected === id ? null : prevSelected
        );
        return prevCart.filter((item) => item._id !== id);
      } else {
        return prevCart.map((item) =>
          item._id === id ? { ...item, quantity: item.quantity + change } : item
        );
      }
    });
  }, []);

  const setQuantity = useCallback((id, quantity) => {
    if (quantity <= 0) {
      setCart((prevCart) => prevCart.filter((item) => item._id !== id));
      setSelectedCartItemId((prevSelected) =>
        prevSelected === id ? null : prevSelected
      );
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) => (item._id === id ? { ...item, quantity } : item))
    );
  }, []);

  // Order type handlers
  const handleOrderTypeChange = useCallback(
    (type) => {
      setOrderType(type);
      if (type === "takeaway") {
        setCustomerData({ custName: "", custPhone: "", custAddress: "" });
        setSelectedTableId(null);
        // Clear table param from URL
        navigate("/menu", { replace: true });
      } else if (type === "delivery") {
        setIsCustomerModalOpen(true);
        setSelectedTableId(null);
        // Clear table param from URL
        navigate("/menu", { replace: true });
      } else if (type === "dinein") {
        setCustomerData({ custName: "", custPhone: "", custAddress: "" });
        // If no table is selected, navigate to table selection
        if (!selectedTableId) {
          navigate("/tables");
        }
      }
    },
    [navigate, selectedTableId]
  );

  // Customer data handlers
  const handleCustomerDataSave = useCallback((data) => {
    setCustomerData(data);
    setIsCustomerModalOpen(false);
  }, []);

  const handleCustomerModalClose = useCallback(() => {
    setIsCustomerModalOpen(false);
    if (
      orderType === "delivery" &&
      (!customerData.custName ||
        !customerData.custPhone ||
        !customerData.custAddress)
    ) {
      setOrderType("takeaway");
      setCustomerData({ custName: "", custPhone: "", custAddress: "" });
    }
  }, [orderType, customerData]);

  // Order creation with proper cache invalidation
  const handleCreateOrder = useCallback(async () => {
    if (cart.length === 0) {
      toast.error(t("menu.cartEmpty"));
      return;
    }

    // Validate customer data for delivery orders
    if (orderType === "delivery") {
      if (
        !customerData.custName.trim() ||
        !customerData.custPhone.trim() ||
        !customerData.custAddress.trim()
      ) {
        toast.error(t("menu.customerInfoRequired"));
        setIsCustomerModalOpen(true);
        return;
      }
    }

    // Validate table selection for dine-in orders
    if (orderType === "dinein" && !selectedTableId) {
      toast.error(t("menu.selectTable"));
      navigate("/tables");
      return;
    }

    setIsCreatingOrder(true);
    try {
      // Prepare order items
      const orderItems = cart.map((item) => ({
        mealId: item._id,
        quantity: item.quantity,
      }));

      const orderData = {
        orderItems,
        type: orderType,
      };

      // Add customer info only for delivery orders
      if (orderType === "delivery") {
        orderData.custName = customerData.custName.trim();
        orderData.custPhone = customerData.custPhone.trim();
        orderData.custAddress = customerData.custAddress.trim();
      }

      // Add table info for dine-in orders
      if (orderType === "dinein" && selectedTableId) {
        // Find the table to get the table number
        const selectedTable = tables?.find(
          (table) => table._id === selectedTableId
        );
        if (selectedTable) {
          orderData.tableNumber = selectedTable.number;
        } else {
          toast.error("Selected table not found. Please select a table again.");
          navigate("/tables");
          return;
        }
      }

      const result = await dispatch(createOrder(orderData)).unwrap();

      toast.success(t("menu.orderCreated"), {
        duration: 2000,
      });

      // Clear cart and navigate to cashier
      setCart([]);
      setSelectedCartItemId(null);
      setCustomerData({ custName: "", custPhone: "", custAddress: "" });
      setSelectedTableId(null);
      setOrderType("takeaway");

      // Invalidate meals cache since ingredients/stock changed
      dispatch(invalidateCache());

      navigate("/cashier", {
        state: { fromOrderCreation: true, orderId: result.data._id },
      });
    } catch (error) {
      console.error("Failed to create order:", error);
      toast.error(t("menu.orderFailed"), {
        duration: 3000,
      });
    } finally {
      setIsCreatingOrder(false);
    }
  }, [cart, orderType, customerData, dispatch, navigate, t]);

  // Clear cart handler
  const handleClearCart = useCallback(() => {
    setCart([]);
    setSelectedCartItemId(null);
    setCustomerData({ custName: "", custPhone: "", custAddress: "" });
    setSelectedTableId(null);
    setOrderType("takeaway");
    // Clear table param from URL
    navigate("/menu", { replace: true });
  }, [navigate]);

  // End shift handler
  const handleEndShift = useCallback(() => {
    setIsEndShiftModalOpen(true);
  }, []);

  // Close modals handlers
  const closeEndShiftModal = useCallback(() => {
    setIsEndShiftModalOpen(false);
  }, []);

  // Redirect managers away from menu page (they can't create orders)
  useEffect(() => {
    if (isManager) {
      navigate("/tables", { replace: true });
    }
  }, [isManager, navigate]);

  // Show loading state only if we don't have cached data
  if (loading && !fromCache && (!meals || meals.length === 0)) {
    return <Loading />;
  }

  if (error && (!meals || meals.length === 0)) {
    return <ErrorMessage message={error} />;
  }

  // Don't render if manager (will be redirected)
  if (isManager) {
    return <Loading />;
  }

  return (
    <>
      <div className="h-full flex relative">
        {menuSidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={toggleRightSidebar}
          />
        )}

        <div className="flex-1 overflow-y-auto [scrollbar-width:none] [::-webkit-scrollbar]:hidden relative">
          <MenuHeader
            categories={categories}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />

          <div className="p-1 pb-24">
            <MenuGrid menuItems={filteredMenuItems} addToCart={addToCart} />
          </div>

          {/* Left Bottom Controls - Only End Shift */}
          <div className="fixed bottom-0 left-1 lg:left-20 z-30">
            {isCashier && hasActiveShift && currentShift && (
              <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-0 lg:p-3">
                <button
                  onClick={handleEndShift}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2  text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors shadow-sm border border-orange-200"
                >
                  <FaStopCircle className="text-base sm:text-lg" />
                  <span className="hidden lg:inline-block text-sm sm:text-base font-medium">
                    {t("menu.endShift")}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={toggleRightSidebar}
          className="fixed top-[22%] right-0 z-10 bg-white h-16 p-[5px] text-lg border border-primary-200 rounded-tl-lg rounded-bl-lg shadow-xl text-primary-800"
        >
          {menuSidebarOpen ? <FaTimes /> : <FaArrowLeft />}
        </button>

        <div
          className={`
            ${menuSidebarOpen ? "translate-x-0" : "translate-x-full"} 
            lg:translate-x-0 
            fixed lg:relative lg:block 
            w-96 max-w-[80vw] lg:max-w-none 
            bg-white border-l border-neutral-200
            right-0 h-full z-50
            transition-transform duration-300 ease-in-out
          `}
        >
          <MenuSidebar
            cart={cart}
            updateQuantity={updateQuantity}
            setQuantity={setQuantity}
            selectedCartItemId={selectedCartItemId}
            setSelectedCartItemId={setSelectedCartItemId}
            calculateTotal={calculateTotal}
            onCreateOrder={handleCreateOrder}
            onClearCart={handleClearCart}
            isCreatingOrder={isCreatingOrder}
            orderType={orderType}
            onOrderTypeChange={handleOrderTypeChange}
          />
        </div>
      </div>

      {/* Lazy loaded modals with suspense */}
      <Suspense fallback={<Loading />}>
        {/* Customer Data Modal */}
        {isCustomerModalOpen && (
          <CustomerDataModal
            isOpen={isCustomerModalOpen}
            onClose={handleCustomerModalClose}
            onSave={handleCustomerDataSave}
            orderType={orderType}
            initialData={customerData}
          />
        )}

        {/* End Shift Modal */}
        {isEndShiftModalOpen && <EndShiftModal onClose={closeEndShiftModal} />}
      </Suspense>
    </>
  );
};

export default MenuPage;
