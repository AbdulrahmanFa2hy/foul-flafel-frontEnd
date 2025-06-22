import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";
import { API_ENDPOINTS } from "../utils/constants";

// Constants for localStorage
const CATEGORIES_CACHE_KEY = "bakery_categories_cache";
const CATEGORIES_CACHE_EXPIRY = 5 * 60 * 60 * 1000; // 5 hours in milliseconds

// Cache utility functions
const getCachedCategories = () => {
  try {
    const cached = localStorage.getItem(CATEGORIES_CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();

    if (now - timestamp > CATEGORIES_CACHE_EXPIRY) {
      localStorage.removeItem(CATEGORIES_CACHE_KEY);
      return null;
    }

    return data;
  } catch (error) {
    console.warn(`Failed to get cached categories:`, error);
    localStorage.removeItem(CATEGORIES_CACHE_KEY);
    return null;
  }
};

const setCachedCategories = (categories) => {
  try {
    const cacheData = {
      data: categories,
      timestamp: Date.now(),
    };
    localStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn(`Failed to cache categories:`, error);
  }
};

// Utility to invalidate categories cache
export const invalidateCategoriesCache = () => {
  try {
    localStorage.removeItem(CATEGORIES_CACHE_KEY);
  } catch (error) {
    console.warn("Failed to invalidate categories cache:", error);
  }
};

// Enhanced async thunk for fetching categories with caching
export const fetchCategories = createAsyncThunk(
  "categories/fetchCategories",
  async (forceRefresh = false, { rejectWithValue }) => {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedCategories = getCachedCategories();
        if (cachedCategories && cachedCategories.length > 0) {
          return { data: cachedCategories, fromCache: true };
        }
      }

      // Fetch from API
      const response = await api.get(API_ENDPOINTS.CATEGORIES);
      const categories = response.data.data || [];

      // Cache the fresh data
      if (categories.length > 0) {
        setCachedCategories(categories);
      }

      return { data: categories, fromCache: false };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch categories" }
      );
    }
  }
);

// Async thunk for creating a category
export const createCategory = createAsyncThunk(
  "categories/createCategory",
  async (categoryData, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post(API_ENDPOINTS.CATEGORIES, categoryData);

      // Invalidate cache and refresh categories
      invalidateCategoriesCache();
      dispatch(fetchCategories(true)); // Force refresh

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to create category" }
      );
    }
  }
);

// Async thunk for updating a category
export const updateCategory = createAsyncThunk(
  "categories/updateCategory",
  async ({ categoryId, categoryData }, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.put(
        `${API_ENDPOINTS.CATEGORIES}/${categoryId}`,
        categoryData
      );

      // Invalidate cache and refresh categories
      invalidateCategoriesCache();
      dispatch(fetchCategories(true)); // Force refresh

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to update category" }
      );
    }
  }
);

// Async thunk for deleting a category
export const deleteCategory = createAsyncThunk(
  "categories/deleteCategory",
  async (categoryId, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.delete(
        `${API_ENDPOINTS.CATEGORIES}/${categoryId}`
      );

      // Invalidate cache and refresh categories
      invalidateCategoriesCache();
      dispatch(fetchCategories(true)); // Force refresh

      return { categoryId, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to delete category" }
      );
    }
  }
);

// Async thunk for fetching a category by ID
export const fetchCategoryById = createAsyncThunk(
  "categories/fetchCategoryById",
  async (categoryId, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `${API_ENDPOINTS.CATEGORIES}/${categoryId}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch category" }
      );
    }
  }
);

// Initial state
const initialState = {
  categories: [],
  selectedCategory: null,
  loading: false,
  error: null,
  successMessage: null,
  fromCache: false, // Track if data is from cache
};

// Category slice
const categorySlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    clearSelectedCategory: (state) => {
      state.selectedCategory = null;
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    // Action to invalidate cache when needed
    invalidateCache: (state) => {
      invalidateCategoriesCache();
      state.fromCache = false;
    },
    // Action to load cached categories on app initialization
    loadCachedCategories: (state) => {
      const cachedCategories = getCachedCategories();
      if (cachedCategories && cachedCategories.length > 0) {
        state.categories = cachedCategories;
        state.fromCache = true;
        state.loading = false;
        state.error = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload.data || [];
        state.fromCache = action.payload.fromCache || false;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch categories";
        state.fromCache = false;
      })

      // Create category
      .addCase(createCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.loading = false;
        // Don't manually add to state since we're refreshing from API
        state.successMessage =
          action.payload.message || "Category created successfully";
        state.fromCache = false;
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to create category";
      })

      // Update category
      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.loading = false;
        // Don't manually update state since we're refreshing from API
        state.successMessage =
          action.payload.message || "Category updated successfully";
        state.fromCache = false;
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to update category";
      })

      // Delete category
      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.loading = false;
        // Don't manually remove from state since we're refreshing from API
        state.successMessage =
          action.payload.message || "Category deleted successfully";
        state.fromCache = false;
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to delete category";
      })

      // Fetch category by ID
      .addCase(fetchCategoryById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategoryById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCategory = action.payload.data;
      })
      .addCase(fetchCategoryById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch category";
      });
  },
});

// Export actions and reducer
export const {
  clearError,
  clearSuccessMessage,
  clearSelectedCategory,
  setSelectedCategory,
  invalidateCache,
  loadCachedCategories,
} = categorySlice.actions;

export default categorySlice.reducer;
