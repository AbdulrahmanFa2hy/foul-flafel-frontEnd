import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import AddMealCard from "../meals-management/AddMealCard";

const MealCard = memo(({ meal, onClick }) => (
  <div className="cursor-pointer" onClick={() => onClick(meal)}>
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md active:scale-95 transition-all duration-75">
      <img
        src={meal.image?.url || "/placeholder-meal.jpg"}
        alt={meal.name}
        className="w-full h-20 object-cover rounded-t-md"
      />
      <div className="p-1 text-center">
        <h3 className="text-sm font-medium text-primary-800 truncate">
          {meal.name}
        </h3>
        <p className="text-sm font-semibold text-neutral-700">
          {meal.price} {meal.currency || "AED"}
        </p>
      </div>
    </div>
  </div>
));

MealCard.displayName = "MealCard";

const EmptyState = memo(({ searchQuery, activeCategory }) => {
  const { t } = useTranslation();
  const isAllCategories = !activeCategory || activeCategory === "all";

  return (
    <div className="col-span-full text-center py-8">
      <p className="text-neutral-500">
        {searchQuery
          ? t("meals.noItemsFoundSearch")
          : isAllCategories
          ? t("meals.noMealsAvailable")
          : t("meals.noMealsInCategory")}
      </p>
    </div>
  );
});

EmptyState.displayName = "EmptyState";

const MealGrid = ({
  meals,
  activeCategory,
  searchQuery,
  onMealClick,
  onAddMealClick,
}) => {
  const handleMealClick = useCallback(
    (meal) => {
      onMealClick(meal);
    },
    [onMealClick]
  );

  const handleAddMealClick = useCallback(() => {
    onAddMealClick();
  }, [onAddMealClick]);

  const showAddMealCard = activeCategory && activeCategory !== "all";
  const hasMeals = meals && meals.length > 0;

  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {/* Regular Meal Cards */}
        {hasMeals &&
          meals.map((meal) => (
            <MealCard key={meal._id} meal={meal} onClick={handleMealClick} />
          ))}

        {/* Add Meal Card - show after meals if a specific category is selected */}
        {showAddMealCard && <AddMealCard onClick={handleAddMealClick} />}

        {/* Empty state */}
        {!hasMeals && (
          <EmptyState
            searchQuery={searchQuery}
            activeCategory={activeCategory}
          />
        )}
      </div>
    </div>
  );
};

export default memo(MealGrid);
