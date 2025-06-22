import { useSelector, useDispatch } from "react-redux";
import { useMemo, useCallback, useEffect } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import Modal from "../../common/Modal";
import { getCategoryName, getStockItemName } from "./utils";
import { fetchStocks } from "../../../store/stockSlice";
import { useTranslation } from "react-i18next";

const MealDetails = ({ meal, onClose, onEdit, onDelete }) => {
  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.categories);
  const { stocks } = useSelector((state) => state.stock);
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  // Fetch stocks data when component mounts to resolve ingredient names
  useEffect(() => {
    if (!stocks || stocks.length === 0) {
      dispatch(fetchStocks());
    }
  }, [dispatch, stocks]);

  const mealInfo = useMemo(() => {
    if (!meal) return null;

    return {
      categoryName: getCategoryName(meal.categoryId, categories),
      ingredientsCount: meal.ingredients?.length || 0,
      statusInfo: {
        label: meal.isAvailable
          ? t("mealDetails.available")
          : t("mealDetails.unavailable"),
        className: meal.isAvailable
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800",
      },
    };
  }, [meal, categories, t]);

  const handleEdit = useCallback(() => {
    onEdit();
  }, [onEdit]);

  const handleDelete = useCallback(() => {
    onDelete();
  }, [onDelete]);

  if (!meal || !mealInfo) return null;

  return (
    <Modal title={t("mealDetails.mealDetails")} onClose={onClose} size="lg">
      <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        {/* Action Buttons */}
        <div
          className={`flex justify-end gap-2 pb-4 border-b border-gray-200 ${
            isRTL ? "flex-row-reverse" : ""
          }`}
        >
          <button
            type="button"
            className="px-4 py-2 rounded-md text-white font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 bg-primary-800 hover:bg-primary-900 focus:ring-primary-800/50 flex items-center"
            onClick={handleEdit}
          >
            <FaEdit className={`${isRTL ? "ml-2" : "mr-2"}`} size={14} />
            {t("mealDetails.editMeal")}
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-md text-white font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 bg-red-600 hover:bg-red-700 focus:ring-red-500 flex items-center"
            onClick={handleDelete}
          >
            <FaTrash className={`${isRTL ? "ml-2" : "mr-2"}`} size={14} />
            {t("mealDetails.deleteMeal")}
          </button>
        </div>

        {/* Meal Image */}
        <div className="mb-6">
          <div className="relative h-60 bg-gray-100 rounded-md overflow-hidden">
            <img
              src={meal.image?.url || "/placeholder-meal.jpg"}
              alt={meal.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Meal Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Basic Info */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {t("mealDetails.basicInformation")}
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">
                    {t("mealDetails.name")}:
                  </span>
                  <span className="text-gray-800 font-semibold">
                    {meal.name}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">
                    {t("mealDetails.category")}:
                  </span>
                  <span className="text-gray-800 capitalize">
                    {mealInfo.categoryName}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">
                    {t("mealDetails.price")}:
                  </span>
                  <span className="text-lg font-bold text-primary-800">
                    {meal.price} AED
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">
                    {t("mealDetails.status")}:
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${mealInfo.statusInfo.className}`}
                  >
                    {mealInfo.statusInfo.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Ingredients */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {t("mealDetails.ingredients")} ({mealInfo.ingredientsCount})
              </h3>

              {meal.ingredients && meal.ingredients.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {meal.ingredients.map((ingredient, index) => (
                    <div
                      key={`${ingredient.stockItemId}-${index}`}
                      className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200"
                    >
                      <span className="font-medium text-gray-800">
                        {getStockItemName(ingredient, stocks)}
                      </span>
                      <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded text-sm">
                        {ingredient.quantityUsed} {ingredient.unit}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 italic">
                    {t("mealDetails.noIngredientsListed")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default MealDetails;
