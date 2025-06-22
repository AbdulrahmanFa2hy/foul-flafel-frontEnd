import { FaMinus, FaPlus } from "react-icons/fa";
import { useTranslation } from "react-i18next";

// Quantity Control Button component
const QuantityButton = ({ onClick, disabled, icon: Icon }) => (
  <button
    className="w-6 h-6 rounded-full border border-neutral-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors"
    onClick={onClick}
    disabled={disabled}
  >
    <Icon className="text-xs text-neutral-600" />
  </button>
);

const MenuSidebarItem = ({ item, updateQuantity, isSelected, onSelect }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const handleQuantityChange = (change) => {
    const currentQuantity = item.quantity || 0;
    const newQuantity = currentQuantity + change;

    if (newQuantity >= 0) {
      // Ensure quantity is valid (rounded for validation)
      Math.round(newQuantity * 100) / 100;
      updateQuantity(item.id || item._id, change);
    }
  };

  const handleItemClick = () => {
    if (onSelect) {
      onSelect(item.id || item._id);
    }
  };

  // Format quantity display
  const formatQuantity = (qty) => {
    if (!qty || qty === 0) return "0";
    // Round to 2 decimal places and remove trailing zeros
    const rounded = Math.round(qty * 100) / 100;
    return rounded % 1 === 0
      ? rounded.toString()
      : rounded.toFixed(2).replace(/\.?0+$/, "");
  };

  return (
    <div
      className={`flex items-center gap-2 rounded-md p-2 shadow-sm cursor-pointer transition-all ${
        isSelected
          ? "bg-primary-50 border border-primary-300"
          : "bg-white border border-neutral-200 hover:bg-neutral-50"
      } ${isRTL ? "flex-row-reverse" : ""}`}
      onClick={handleItemClick}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Item Info */}
      <div className="flex-1 min-w-0">
        <div
          className={`flex items-center justify-between ${
            isRTL ? "flex-row-reverse" : ""
          }`}
        >
          <h4 className="font-medium text-primary-800 truncate text-sm">
            {item.name}
          </h4>
          <span
            className={`text-xs text-neutral-600 ${isRTL ? "mr-2" : "ml-2"}`}
          >
            {(Math.round(item.price * 100) / 100).toFixed(2)}{" "}
            <span className="hidden sm:inline-block">
              {item.currency || t("menuSidebarItem.currency")}
            </span>
          </span>
        </div>
      </div>

      {/* Quantity Controls */}
      <div
        className={`flex items-center sm:gap-2 ${
          isRTL ? "flex-row-reverse" : ""
        }`}
      >
        <QuantityButton
          onClick={(e) => {
            e.stopPropagation();
            handleQuantityChange(-1);
          }}
          disabled={!item.quantity || item.quantity <= 0}
          icon={FaMinus}
        />
        <span className="w-8 text-center font-medium text-sm">
          {formatQuantity(item.quantity)}
        </span>
        <QuantityButton
          onClick={(e) => {
            e.stopPropagation();
            handleQuantityChange(1);
          }}
          disabled={false}
          icon={FaPlus}
        />
      </div>
    </div>
  );
};

export default MenuSidebarItem;
