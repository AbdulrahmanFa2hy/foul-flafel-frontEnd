import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaTimes, FaPlus, FaSync } from "react-icons/fa";
import Loading from "../../components/common/Loading";
import ErrorMessage from "../../components/common/ErrorMessage";
import SearchInput from "../../components/common/SearchInput";
import DeleteConfirmation from "../../components/common/DeleteConfirmation";
import {
  CategorySidebar,
  MealGrid,
  MealForm,
  MealDetails,
  CategoryForm,
} from "../../components/settings/meals-management";
import { useMealsManagement } from "../../components/settings/meals-management/useMealsManagement";

const Meals = () => {
  const { t } = useTranslation();
  const {
    // State
    isMealFormOpen,
    isMealDetailsOpen,
    isMealDeleteModalOpen,
    searchQuery,
    activeCategory,
    preSelectedCategoryId,
    isCategoryFormOpen,
    isCategoryDeleteModalOpen,
    selectedCategory,
    categoryActionMenuOpen,
    categorySidebarOpen,

    // Data
    selectedMeal,
    filteredMeals,
    isLoading,
    error,
    mealDeleteLoading,

    // Setters
    setSearchQuery,
    setIsMealDeleteModalOpen,
    setIsCategoryDeleteModalOpen,

    // Meal handlers
    handleMealClick,
    handleAddMealClick,
    handleOpenMealForm,
    handleCloseMealForm,
    handleCloseMealDetails,
    handleMealDeleteClick,
    handleMealDelete,

    // Category handlers
    handleCategorySelect,
    handleOpenCategoryForm,
    handleCloseCategoryForm,
    handleCategoryDeleteClick,
    handleCategoryDelete,
    toggleCategoryActionMenu,

    // UI handlers
    toggleCategorySidebar,
    handleRefresh,
  } = useMealsManagement();

  if (isLoading && filteredMeals.length === 0) {
    return <Loading />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="h-screen flex relative overflow-hidden">
      {/* Overlay for mobile sidebar */}
      {categorySidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleCategorySidebar}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto [scrollbar-width:none] [::-webkit-scrollbar]:hidden">
        <div className="w-full px-2 sm:px-3 lg:px-1 xl:px-3 py-4">
          {/* Header with Search, Refresh, and Add Meal Button */}
          <div className="flex items-center justify-between gap-2 sm:gap-4 mb-6">
            <div className="flex-1 max-w-md">
              <SearchInput value={searchQuery} onChange={setSearchQuery} />
            </div>
            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-md text-primary-800 border border-primary-200 hover:bg-primary-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-800/50"
                onClick={handleRefresh}
                title={t("common.refresh")}
              >
                <FaSync />
              </button>
              <button
                className="px-4 py-2 rounded-md text-white font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 bg-primary-800 hover:bg-primary-800 focus:ring-primary-800/50 flex items-center whitespace-nowrap"
                onClick={() => handleOpenMealForm()}
              >
                <FaPlus className="sm:mr-2" />{" "}
                <span className="hidden sm:inline">{t("meals.addMeal")}</span>
              </button>
            </div>
          </div>

          {/* Meals Grid */}
          <MealGrid
            meals={filteredMeals}
            activeCategory={activeCategory}
            searchQuery={searchQuery}
            onMealClick={handleMealClick}
            onAddMealClick={handleAddMealClick}
          />
        </div>
      </div>

      {/* Sidebar toggle button */}
      <button
        onClick={toggleCategorySidebar}
        className="fixed top-[22%] right-0 z-10 bg-white h-16 p-[5px] text-lg border border-primary-200 rounded-tl-lg rounded-bl-lg shadow-xl text-primary-800"
      >
        {categorySidebarOpen ? <FaTimes /> : <FaArrowLeft />}
      </button>

      {/* Category Sidebar */}
      <div
        className={`
          ${categorySidebarOpen ? "translate-x-0" : "translate-x-full"} 
          lg:translate-x-0 
          fixed lg:relative lg:block 
          w-80 max-w-[80vw] lg:max-w-none
          bg-white border-l border-neutral-200
          right-0 h-full z-40
          transition-transform duration-300 ease-in-out
        `}
      >
        <CategorySidebar
          activeCategory={activeCategory}
          onCategorySelect={handleCategorySelect}
          onAddCategory={() => handleOpenCategoryForm()}
          onEditCategory={handleOpenCategoryForm}
          onDeleteCategory={handleCategoryDeleteClick}
          categoryActionMenuOpen={categoryActionMenuOpen}
          onToggleActionMenu={toggleCategoryActionMenu}
        />
      </div>

      {/* Lazy-loaded Modals wrapped in Suspense */}
      <Suspense fallback={<Loading />}>
        {/* Meal Form Modal */}
        {isMealFormOpen && (
          <MealForm
            meal={selectedMeal}
            preSelectedCategoryId={preSelectedCategoryId}
            onClose={handleCloseMealForm}
          />
        )}

        {/* Meal Details Modal */}
        {isMealDetailsOpen && (
          <MealDetails
            meal={selectedMeal}
            onClose={handleCloseMealDetails}
            onEdit={() => {
              handleCloseMealDetails();
              handleOpenMealForm(selectedMeal);
            }}
            onDelete={() => {
              handleCloseMealDetails();
              handleMealDeleteClick(selectedMeal);
            }}
          />
        )}

        {/* Category Form Modal */}
        {isCategoryFormOpen && (
          <CategoryForm
            category={selectedCategory}
            onClose={handleCloseCategoryForm}
          />
        )}
      </Suspense>

      {/* Delete Confirmation Modals (small, no need for lazy loading) */}
      {/* Meal Delete Confirmation Modal */}
      {isMealDeleteModalOpen && (
        <DeleteConfirmation
          title={t("meals.deleteMealTitle")}
          message={t("meals.deleteMealConfirm", {
            mealName: selectedMeal?.name,
          })}
          onConfirm={handleMealDelete}
          onCancel={() => setIsMealDeleteModalOpen(false)}
          loading={mealDeleteLoading}
        />
      )}

      {/* Category Delete Confirmation Modal */}
      {isCategoryDeleteModalOpen && (
        <DeleteConfirmation
          title={t("meals.deleteCategoryTitle")}
          message={t("meals.deleteCategoryConfirm", {
            categoryName: selectedCategory?.name,
          })}
          onConfirm={handleCategoryDelete}
          onCancel={() => setIsCategoryDeleteModalOpen(false)}
          loading={false}
        />
      )}
    </div>
  );
};

export default Meals;
