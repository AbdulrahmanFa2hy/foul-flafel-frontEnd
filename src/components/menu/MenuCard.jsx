import imageUrl from "../../assets/img1.jpeg";
import { useTranslation } from "react-i18next";

const MenuCard = ({ item, addToCart }) => {
  const { t } = useTranslation();

  // Check if the meal is available
  // A meal is considered unavailable if isAvailable is explicitly false OR stock is 0
  const isAvailable = item.isAvailable !== false && item.stock !== 0;

  const handleClick = () => {
    // Only allow clicking if the meal is available
    if (isAvailable) {
      addToCart(item);
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-75 relative ${
        isAvailable
          ? "cursor-pointer active:scale-95"
          : "cursor-not-allowed opacity-50 grayscale"
      }`}
      onClick={handleClick}
    >
      <img
        src={item.image?.url || imageUrl}
        alt={item.name}
        className="w-full h-20 object-cover rounded-t-md"
      />

      {/* Unavailable Overlay */}
      {!isAvailable && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
          <div className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">
            {t("menuCard.unavailable")}
          </div>
        </div>
      )}

      <div className="p-1 text-center">
        <h3
          className={`text-sm font-medium truncate ${
            isAvailable ? "text-primary-800" : "text-gray-500"
          }`}
        >
          {item.name}
        </h3>
        <p
          className={`text-sm font-semibold ${
            isAvailable ? "text-neutral-700" : "text-gray-400"
          }`}
        >
          {item.price} {item.currency || "AED"}
        </p>
      </div>
    </div>
  );
};

export default MenuCard;
