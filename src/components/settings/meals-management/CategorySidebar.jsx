import { useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { FaPlus, FaEdit, FaTrash, FaEllipsisV } from "react-icons/fa";
import { getCategoryId } from "./utils";

const CategorySidebar = ({
  activeCategory,
  onCategorySelect,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  categoryActionMenuOpen,
  onToggleActionMenu,
}) => {
  const { t } = useTranslation();
  const { categories } = useSelector((state) => state.categories);
  const { meals } = useSelector((state) => state.meals);

  const formattedCategories = useMemo(() => {
    if (!categories) return [];

    return categories.map((category) => ({
      ...category,
      mealCount: meals
        ? meals.filter((meal) => {
            // Handle both populated and unpopulated categoryId formats
            const mealCategoryId = getCategoryId(meal.categoryId);
            return mealCategoryId === category._id;
          }).length
        : 0,
    }));
  }, [categories, meals]);

  const totalMealCount = useMemo(() => {
    return meals ? meals.length : 0;
  }, [meals]);

  // Function to get modern styling for categories
  const getCategoryStyles = useCallback((category, isActive) => {
    const hasColor = category.color && category.color.trim() !== "";

    if (!hasColor) {
      // Modern styling for categories without colors - blue-gray backgrounds like "All Meals"
      return {
        className: `relative cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md ${
          isActive ? "shadow-md" : "hover:shadow-md"
        }`,
        style: {
          // Use blue-gray backgrounds similar to "All Meals" styling
          backgroundColor: isActive ? "#e0e7ff" : "#f1f5f9", // Light blue-gray
          borderColor: isActive ? "#c7d2fe" : "#e2e8f0",
        },
        textClass: "text-gray-800",
        subTextClass: isActive ? "text-gray-600" : "text-gray-500",
      };
    }

    // Modern styling with subtle colors for categories with colors
    if (isActive) {
      return {
        className:
          "relative cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 shadow-md",
        style: {
          backgroundColor: `${category.color}35`,
          borderColor: `${category.color}80`,
        },
        textClass: "text-gray-800",
        subTextClass: "text-gray-600",
      };
    } else {
      return {
        className:
          "relative cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md",
        style: {
          backgroundColor: `${category.color}10`,
          borderColor: `${category.color}20`,
        },
        textClass: "text-gray-800",
        subTextClass: "text-gray-500",
      };
    }
  }, []);

  const handleCategorySelect = useCallback(
    (categoryId) => {
      onCategorySelect(categoryId);
    },
    [onCategorySelect]
  );

  const handleToggleActionMenu = useCallback(
    (categoryId, event) => {
      event.stopPropagation();
      onToggleActionMenu(categoryId);
    },
    [onToggleActionMenu]
  );

  const handleEditCategory = useCallback(
    (category, event) => {
      event.stopPropagation();
      onToggleActionMenu(null);
      onEditCategory(category);
    },
    [onToggleActionMenu, onEditCategory]
  );

  const handleDeleteCategory = useCallback(
    (category, event) => {
      event.stopPropagation();
      onToggleActionMenu(null);
      onDeleteCategory(category);
    },
    [onToggleActionMenu, onDeleteCategory]
  );

  return (
    <div className="bg-white h-full overflow-hidden p-2 px-1 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {t("meals.categories")} ({formattedCategories.length + 1})
        </h3>
        <button
          className="p-2 rounded-lg text-white bg-primary-700 hover:bg-primary-800 transition-colors shadow-sm"
          onClick={onAddCategory}
          title={t("meals.addCategory")}
        >
          <FaPlus size={14} />
        </button>
      </div>

      <div className="space-y-1 overflow-y-auto flex-1 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* All Meals Option */}
        <div
          className={`p-4 rounded-xl border-2 transition-all ease-in-out duration-300 cursor-pointer hover:shadow-md ${
            activeCategory === "all"
              ? "bg-primary-50 border-primary-500 shadow-md"
              : "bg-gray-50 hover:bg-gray-100 border-gray-200"
          }`}
          onClick={() => handleCategorySelect("all")}
        >
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-800">
              {t("meals.allMeals")}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-500">
              {totalMealCount} {t("meals.meals")}
            </span>
          </div>
        </div>

        {/* Category List */}
        {formattedCategories.length > 0 ? (
          formattedCategories.map((category) => {
            const isActive = activeCategory === category._id;
            const styles = getCategoryStyles(category, isActive);

            return (
              <div
                key={category._id}
                className={styles.className}
                style={styles.style}
                onClick={() => handleCategorySelect(category._id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3
                      className={`font-semibold text-base capitalize ${styles.textClass}`}
                    >
                      {category.name}
                    </h3>
                    <p className={`text-sm mt-1 ${styles.subTextClass}`}>
                      {category.mealCount}{" "}
                      {category.mealCount === 1
                        ? t("meals.meal")
                        : t("meals.meals")}
                    </p>
                  </div>

                  {/* Action menu button */}
                  <button
                    onClick={(e) => handleToggleActionMenu(category._id, e)}
                    className="p-2 rounded-lg hover:bg-gray-100 hover:bg-opacity-50 transition-colors text-gray-500 hover:text-gray-700"
                    aria-label={t("meals.categoryActions")}
                  >
                    <FaEllipsisV size={12} />
                  </button>
                </div>

                {/* Action Menu */}
                {categoryActionMenuOpen === category._id && (
                  <div className="absolute right-0 top-16 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[120px] overflow-hidden">
                    <button
                      onClick={(e) => handleEditCategory(category, e)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                    >
                      <FaEdit className="text-blue-500" />
                      {t("meals.edit")}
                    </button>
                    <button
                      onClick={(e) => handleDeleteCategory(category, e)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <FaTrash className="text-red-500" />
                      {t("meals.deleteCategory")}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">{t("meals.noCategoriesFound")}</p>
            <button
              className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
              onClick={onAddCategory}
            >
              {t("meals.createFirstCategory")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategorySidebar;
