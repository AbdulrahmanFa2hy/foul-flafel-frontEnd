import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";
import { API_ENDPOINTS } from "../utils/constants";

// Constants for localStorage
const MEALS_CACHE_KEY = "bakery_meals_cache";
const MEALS_CACHE_EXPIRY = 5 * 60 * 60 * 1000; // 5 hours in milliseconds
const CACHE_VERSION = "v2"; // Version to force cache refresh after ingredient fix

// Utility function to normalize meal data from different API endpoints
const normalizeMealData = (meal) => {
  if (!meal) return meal;

  return {
    ...meal,
    // Ensure categoryId is always an object with _id and name if populated
    categoryId:
      typeof meal.categoryId === "object" && meal.categoryId
        ? meal.categoryId
        : meal.categoryId, // Keep as string if it's just an ID
    // Ensure ingredients have consistent structure
    ingredients:
      meal.ingredients?.map((ingredient) => ({
        ...ingredient,
        // Keep stockItemId structure as-is for both populated and unpopulated formats
        stockItemId: ingredient.stockItemId,
        quantityUsed: ingredient.quantityUsed || 0,
        unit: ingredient.unit || "pcs",
        // Preserve stockName if available, or extract from populated stockItemId
        stockName:
          ingredient.stockName ||
          (typeof ingredient.stockItemId === "object"
            ? ingredient.stockItemId?.nameOfItem ||
              ingredient.stockItemId?.name ||
              ""
            : ""),
      })) || [],
  };
};

// Utility function to normalize array of meals
const normalizeMealsArray = (meals) => {
  if (!Array.isArray(meals)) return [];
  return meals.map(normalizeMealData);
};

// Cache utility functions
const getCachedMeals = () => {
  try {
    const cached = localStorage.getItem(MEALS_CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp, version } = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is expired or from an old version
    if (now - timestamp > MEALS_CACHE_EXPIRY || version !== CACHE_VERSION) {
      localStorage.removeItem(MEALS_CACHE_KEY);
      return null;
    }

    return data;
  } catch (error) {
    console.warn(`Failed to get cached meals:`, error);
    localStorage.removeItem(MEALS_CACHE_KEY);
    return null;
  }
};

const setCachedMeals = (meals) => {
  try {
    // Cache complete meal data including ingredients
    const mealsToCache = meals.map((meal) => ({
      _id: meal._id,
      name: meal.name,
      price: meal.price,
      currency: meal.currency,
      categoryId: meal.categoryId,
      image: meal.image,
      isAvailable: meal.isAvailable,
      // Include ingredients to preserve them in cache
      ingredients: meal.ingredients || [],
    }));

    const cacheData = {
      data: mealsToCache,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    localStorage.setItem(MEALS_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn(`Failed to cache meals:`, error);
  }
};

// Utility to invalidate meals cache (call after orders)
export const invalidateMealsCache = () => {
  try {
    localStorage.removeItem(MEALS_CACHE_KEY);
  } catch (error) {
    console.warn("Failed to invalidate meals cache:", error);
  }
};

// Enhanced async thunk for fetching meals with caching
export const fetchMeals = createAsyncThunk(
  "meals/fetchMeals",
  async (forceRefresh = false, { rejectWithValue }) => {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedMeals = getCachedMeals();
        if (cachedMeals && cachedMeals.length > 0) {
          return { data: normalizeMealsArray(cachedMeals), fromCache: true };
        }
      }

      // Fetch from API
      const response = await api.get(`${API_ENDPOINTS.MEALS}`);
      const meals = response.data.data || [];

      // Normalize and cache the fresh data
      const normalizedMeals = normalizeMealsArray(meals);
      if (normalizedMeals.length > 0) {
        setCachedMeals(normalizedMeals);
      }

      return { data: normalizedMeals, fromCache: false };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch meals" }
      );
    }
  }
);

// Async thunk for creating a meal
export const createMeal = createAsyncThunk(
  "meals/createMeal",
  async (mealData, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post(`${API_ENDPOINTS.MEALS}`, mealData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Invalidate cache and refresh meals to get updated data
      invalidateMealsCache();
      dispatch(fetchMeals(true)); // Force refresh

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to create meal" }
      );
    }
  }
);

// Async thunk for updating a meal
export const updateMeal = createAsyncThunk(
  "meals/updateMeal",
  async ({ mealId, mealData }, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.put(
        `${API_ENDPOINTS.MEALS}/${mealId}`,
        mealData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Invalidate cache and refresh meals to get updated data
      invalidateMealsCache();
      dispatch(fetchMeals(true)); // Force refresh

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to update meal" }
      );
    }
  }
);

// Async thunk for deleting a meal
export const deleteMeal = createAsyncThunk(
  "meals/deleteMeal",
  async (mealId, { rejectWithValue, dispatch }) => {
    try {
      await api.delete(`${API_ENDPOINTS.MEALS}/${mealId}`);

      // Invalidate cache and refresh meals
      invalidateMealsCache();
      dispatch(fetchMeals(true)); // Force refresh

      return mealId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to delete meal" }
      );
    }
  }
);

// Async thunk for deleting a meal image
export const deleteMealImage = createAsyncThunk(
  "meals/deleteMealImage",
  async (mealId, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.delete(
        `${API_ENDPOINTS.MEALS}/${mealId}/image`
      );

      // Invalidate cache and refresh meals
      invalidateMealsCache();
      dispatch(fetchMeals(true)); // Force refresh

      return { mealId, data: response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to delete meal image" }
      );
    }
  }
);

// Async thunk for fetching a meal by ID
export const fetchMealById = createAsyncThunk(
  "meals/fetchMealById",
  async (mealId, { rejectWithValue }) => {
    try {
      const response = await api.get(`${API_ENDPOINTS.MEALS}/${mealId}`);
      // Normalize the single meal data
      const normalizedMeal = normalizeMealData(response.data.data);
      return { data: normalizedMeal };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch meal" }
      );
    }
  }
);

// Initial state
const initialState = {
  meals: [],
  loading: false,
  error: null,
  selectedMeal: null,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
  fromCache: false, // Track if data is from cache
};

// Meals slice
const mealSlice = createSlice({
  name: "meals",
  initialState,
  reducers: {
    selectMeal: (state, action) => {
      state.selectedMeal = action.payload;
    },
    clearMealError: (state) => {
      state.error = null;
    },
    clearSelectedMeal: (state) => {
      state.selectedMeal = null;
    },
    // Action to invalidate cache when needed (e.g., after orders)
    invalidateCache: (state) => {
      invalidateMealsCache();
      state.fromCache = false;
    },
    // Action to load cached meals on app initialization
    loadCachedMeals: (state) => {
      const cachedMeals = getCachedMeals();
      if (cachedMeals && cachedMeals.length > 0) {
        state.meals = normalizeMealsArray(cachedMeals);
        state.fromCache = true;
        state.loading = false;
        state.error = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch meals
      .addCase(fetchMeals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMeals.fulfilled, (state, action) => {
        state.loading = false;
        state.meals = action.payload.data || [];
        state.fromCache = action.payload.fromCache || false;
      })
      .addCase(fetchMeals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch meals";
        state.fromCache = false;
      })

      // Create meal
      .addCase(createMeal.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createMeal.fulfilled, (state) => {
        state.createLoading = false;
        // Don't manually add to state since we're refreshing from API
        state.fromCache = false;
      })
      .addCase(createMeal.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload?.message || "Failed to create meal";
      })

      // Update meal
      .addCase(updateMeal.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateMeal.fulfilled, (state) => {
        state.updateLoading = false;
        // Don't manually update state since we're refreshing from API
        state.fromCache = false;
      })
      .addCase(updateMeal.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload?.message || "Failed to update meal";
      })

      // Delete meal
      .addCase(deleteMeal.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deleteMeal.fulfilled, (state) => {
        state.deleteLoading = false;
        // Don't manually remove from state since we're refreshing from API
        state.fromCache = false;
      })
      .addCase(deleteMeal.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload?.message || "Failed to delete meal";
      })

      // Delete meal image
      .addCase(deleteMealImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMealImage.fulfilled, (state) => {
        state.loading = false;
        // Don't manually update state since we're refreshing from API
        state.fromCache = false;
      })
      .addCase(deleteMealImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to delete meal image";
      })

      // Fetch meal by ID
      .addCase(fetchMealById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMealById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedMeal = action.payload.data || null;
      })
      .addCase(fetchMealById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch meal";
      });
  },
});

export const {
  selectMeal,
  clearMealError,
  clearSelectedMeal,
  invalidateCache,
  loadCachedMeals,
} = mealSlice.actions;

export default mealSlice.reducer;
