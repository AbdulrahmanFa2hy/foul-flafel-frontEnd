import { useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FaHandHoldingMedical } from "react-icons/fa";
import { MdTableRestaurant } from "react-icons/md";
import { TbTruckDelivery } from "react-icons/tb";
import MenuSidebarItem from "./MenuSidebarItem";
import NumberKeys from "./NumberKeys";

const MenuSidebar = ({
  cart,
  updateQuantity,
  setQuantity,
  selectedCartItemId,
  setSelectedCartItemId,
  calculateTotal,
  onCreateOrder,
  onClearCart,
  isCreatingOrder,
  orderType,
  onOrderTypeChange,
}) => {
  const { t } = useTranslation();

  const handleNumberKeyClick = useCallback(
    (itemId, quantity) => {
      setQuantity(itemId, quantity);
    },
    [setQuantity]
  );

  // Memoize the cart items rendering
  const cartItems = useMemo(() => {
    if (cart.length === 0) {
      return (
        <div className="h-full flex flex-col justify-center items-center">
          <p className="sm:text-xl text-neutral-500">
            {t("menu.cart")} {t("menu.empty").toLowerCase()}
          </p>
          <p className="text-sm text-neutral-400">Add items from the menu</p>
        </div>
      );
    }

    return (
      <div className="space-y-2 mb-4">
        {cart.map((item) => (
          <MenuSidebarItem
            key={item._id}
            item={item}
            updateQuantity={updateQuantity}
            isSelected={selectedCartItemId === item._id}
            onSelect={setSelectedCartItemId}
          />
        ))}
      </div>
    );
  }, [cart, updateQuantity, selectedCartItemId, setSelectedCartItemId, t]);

  return (
    <div className="pb-2 pt-1 px-1  h-full flex flex-col">
      {/* Order Type Selection */}
      <div className="mb-2">
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => onOrderTypeChange("takeaway")}
            className={`py-1 font-medium rounded transition-all duration-200 border-2 flex flex-col items-center justify-center ${
              orderType === "takeaway"
                ? "bg-primary-800 text-white border-primary-700 shadow-md"
                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
            }`}
            title={t("menu.takeaway")}
          >
            <FaHandHoldingMedical className="text-4xl" />
            {/* <span className="text-xs">Takeaway</span> */}
          </button>
          <button
            onClick={() => onOrderTypeChange("dinein")}
            className={`py-1 font-medium rounded transition-all duration-200 border-2 flex flex-col items-center justify-center ${
              orderType === "dinein"
                ? "bg-primary-800 text-white border-primary-700 shadow-md"
                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
            }`}
            title={t("menu.dineIn")}
          >
            <MdTableRestaurant className="text-4xl" />
            {/* <span className="text-xs">Dine-in</span> */}
          </button>
          <button
            onClick={() => onOrderTypeChange("delivery")}
            className={`py-1 font-medium rounded transition-all duration-200 border-2 flex flex-col items-center justify-center ${
              orderType === "delivery"
                ? "bg-primary-800 text-white border-primary-700 shadow-md"
                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
            }`}
            title={t("menu.delivery")}
          >
            <TbTruckDelivery className="text-4xl" />
            {/* <span className="text-xs">Delivery</span> */}
          </button>
        </div>
      </div>

      {/* Cart Items - Scrollable */}
      <div className="flex-1 overflow-y-auto [scrollbar-width:none] [::-webkit-scrollbar]:hidden">
        {cartItems}
      </div>

      {/* Number Keys Section - Always visible at bottom */}
      <div className="border-t border-neutral-200 pt-2">
        <NumberKeys
          selectedItemId={selectedCartItemId}
          onNumberClick={handleNumberKeyClick}
          onCreateOrder={onCreateOrder}
          onClearCart={onClearCart}
          cart={cart}
          isCreatingOrder={isCreatingOrder}
          calculateTotal={calculateTotal}
        />
      </div>
    </div>
  );
};

export default MenuSidebar;
