import { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMeals,
  deleteMeal,
  selectMeal,
  clearMealError,
  clearSelectedMeal,
  loadCachedMeals,
} from "../../../store/mealSlice";
import {
  fetchCategories,
  deleteCategory,
  clearError as clearCategoryError,
  loadCachedCategories,
} from "../../../store/categorySlice";
import { fetchStocks } from "../../../store/stockSlice";
import { getCategoryId } from "./utils";
import toast from "react-hot-toast";

export const useMealsManagement = () => {
  // Meal management state
  const [isMealFormOpen, setIsMealFormOpen] = useState(false);
  const [isMealDetailsOpen, setIsMealDetailsOpen] = useState(false);
  const [isMealDeleteModalOpen, setIsMealDeleteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [preSelectedCategoryId, setPreSelectedCategoryId] = useState(null);

  // Category management state
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [isCategoryDeleteModalOpen, setIsCategoryDeleteModalOpen] =
    useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryActionMenuOpen, setCategoryActionMenuOpen] = useState(null);

  // Sidebar state
  const [categorySidebarOpen, setCategorySidebarOpen] = useState(
    window.innerWidth >= 1024
  );

  const dispatch = useDispatch();

  // Redux selectors
  const {
    meals,
    selectedMeal,
    loading: mealsLoading,
    deleteLoading: mealDeleteLoading,
    error: mealsError,
    fromCache: mealsFromCache,
  } = useSelector((state) => state.meals);

  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    fromCache: categoriesFromCache,
  } = useSelector((state) => state.categories);

  // Memoized filtered meals
  const filteredMeals = useMemo(() => {
    let filtered = meals || [];

    // Filter by active category (if not "all")
    if (activeCategory && activeCategory !== "all") {
      filtered = filtered.filter((meal) => {
        // Handle both populated and unpopulated categoryId formats
        const mealCategoryId = getCategoryId(meal.categoryId);
        return mealCategoryId === activeCategory;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((meal) =>
        meal.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [meals, activeCategory, searchQuery]);

  // Loading state - don't show loading if we have cached data
  const isLoading = useMemo(() => {
    return (
      (mealsLoading || categoriesLoading) &&
      !mealsFromCache &&
      !categoriesFromCache &&
      (!meals || meals.length === 0)
    );
  }, [
    mealsLoading,
    categoriesLoading,
    mealsFromCache,
    categoriesFromCache,
    meals,
  ]);

  // Error state - only show error if we don't have cached data
  const error = useMemo(() => {
    if ((mealsError || categoriesError) && (!meals || meals.length === 0)) {
      return mealsError || categoriesError;
    }
    return null;
  }, [mealsError, categoriesError, meals]);

  // Load data with cache-first approach
  const loadData = useCallback(() => {
    // First try to load cached data immediately
    dispatch(loadCachedMeals());
    dispatch(loadCachedCategories());

    // Then fetch fresh data including stocks for ingredient resolution
    dispatch(fetchMeals());
    dispatch(fetchCategories());
    dispatch(fetchStocks());
  }, [dispatch]);

  // Fetch data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Add periodic refresh and window focus refresh to sync with other devices
  useEffect(() => {
    // Refresh data when window regains focus (user comes back to app)
    const handleFocus = () => {
      // Force refresh to get latest data from server
      dispatch(fetchMeals(true));
      dispatch(fetchCategories());
    };

    // Periodic refresh every 30 seconds to sync with other devices
    const interval = setInterval(() => {
      dispatch(fetchMeals(true));
      dispatch(fetchCategories());
    }, 30000); // 30 seconds

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [dispatch]);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      setCategorySidebarOpen(window.innerWidth >= 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Clear errors on unmount
  useEffect(() => {
    return () => {
      dispatch(clearMealError());
      dispatch(clearCategoryError());
    };
  }, [dispatch]);

  // Meal management handlers
  const handleMealClick = useCallback(
    (meal) => {
      dispatch(selectMeal(meal));
      setIsMealDetailsOpen(true);
    },
    [dispatch]
  );

  const handleAddMealClick = useCallback(() => {
    if (activeCategory && activeCategory !== "all") {
      setPreSelectedCategoryId(activeCategory);
    } else {
      setPreSelectedCategoryId(null);
    }
    dispatch(clearSelectedMeal());
    setIsMealFormOpen(true);
  }, [activeCategory, dispatch]);

  const handleOpenMealForm = useCallback(
    (meal = null) => {
      if (meal) {
        dispatch(selectMeal(meal));
        setPreSelectedCategoryId(null);
      } else {
        dispatch(clearSelectedMeal());
        if (activeCategory && activeCategory !== "all") {
          setPreSelectedCategoryId(activeCategory);
        } else {
          setPreSelectedCategoryId(null);
        }
      }
      setIsMealFormOpen(true);
    },
    [activeCategory, dispatch]
  );

  const handleCloseMealForm = useCallback(() => {
    dispatch(clearSelectedMeal());
    setPreSelectedCategoryId(null);
    setIsMealFormOpen(false);
  }, [dispatch]);

  const handleCloseMealDetails = useCallback(() => {
    dispatch(clearSelectedMeal());
    setIsMealDetailsOpen(false);
  }, [dispatch]);

  const handleMealDeleteClick = useCallback(
    (meal) => {
      dispatch(selectMeal(meal));
      setIsMealDeleteModalOpen(true);
    },
    [dispatch]
  );

  const handleMealDelete = useCallback(async () => {
    if (selectedMeal) {
      try {
        await dispatch(deleteMeal(selectedMeal._id)).unwrap();
        toast.success("Meal deleted successfully!");
        setIsMealDeleteModalOpen(false);
        dispatch(clearSelectedMeal());
      } catch (error) {
        toast.error(error.message || "Failed to delete meal");
      }
    }
  }, [selectedMeal, dispatch]);

  // Category management handlers
  const handleCategorySelect = useCallback((categoryId) => {
    setActiveCategory(categoryId);
  }, []);

  const handleOpenCategoryForm = useCallback((category = null) => {
    setSelectedCategory(category);
    setIsCategoryFormOpen(true);
  }, []);

  const handleCloseCategoryForm = useCallback(() => {
    setSelectedCategory(null);
    setIsCategoryFormOpen(false);
  }, []);

  const handleCategoryDeleteClick = useCallback((category) => {
    setSelectedCategory(category);
    setIsCategoryDeleteModalOpen(true);
  }, []);

  const handleCategoryDelete = useCallback(async () => {
    if (selectedCategory) {
      try {
        await dispatch(deleteCategory(selectedCategory._id)).unwrap();
        toast.success("Category deleted successfully!");
        setIsCategoryDeleteModalOpen(false);
        setSelectedCategory(null);

        if (activeCategory === selectedCategory._id) {
          setActiveCategory("all");
        }
      } catch (error) {
        toast.error(error.message || "Failed to delete category");
      }
    }
  }, [selectedCategory, activeCategory, dispatch]);

  const toggleCategoryActionMenu = useCallback(
    (categoryId) => {
      setCategoryActionMenuOpen(
        categoryActionMenuOpen === categoryId ? null : categoryId
      );
    },
    [categoryActionMenuOpen]
  );

  const toggleCategorySidebar = useCallback(() => {
    setCategorySidebarOpen(!categorySidebarOpen);
  }, [categorySidebarOpen]);

  // Manual refresh function to force data sync
  const handleRefresh = useCallback(() => {
    dispatch(fetchMeals(true)); // Force refresh from server
    dispatch(fetchCategories(true)); // Force refresh categories from server
    dispatch(fetchStocks());
  }, [dispatch]);

  return {
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
    meals,
    selectedMeal,
    categories,
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
  };
};
