import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";
import { API_ENDPOINTS } from "../utils/constants";

// Async thunk for fetching all stocks
export const fetchStocks = createAsyncThunk(
  "stock/fetchStocks",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`${API_ENDPOINTS.STOCK}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch stocks" }
      );
    }
  }
);

// Async thunk for fetching stock by ID
export const fetchStockById = createAsyncThunk(
  "stock/fetchStockById",
  async (stockId, { rejectWithValue }) => {
    try {
      const response = await api.get(`${API_ENDPOINTS.STOCK}/${stockId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch stock" }
      );
    }
  }
);

// Async thunk for adding new stock
export const addStock = createAsyncThunk(
  "stock/addStock",
  async (stockData, { rejectWithValue }) => {
    try {
      const response = await api.post(`${API_ENDPOINTS.STOCK}`, stockData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to add stock" }
      );
    }
  }
);

// Async thunk for updating stock
export const updateStock = createAsyncThunk(
  "stock/updateStock",
  async ({ stockId, stockData }, { rejectWithValue }) => {
    try {
      const response = await api.put(
        `${API_ENDPOINTS.STOCK}/${stockId}`,
        stockData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to update stock" }
      );
    }
  }
);

// Async thunk for deleting stock
export const deleteStock = createAsyncThunk(
  "stock/deleteStock",
  async (stockId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`${API_ENDPOINTS.STOCK}/${stockId}`);
      return { stockId, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to delete stock" }
      );
    }
  }
);

// Initial state
const initialState = {
  stocks: [],
  selectedStock: null,
  loading: false,
  error: null,
  searchTerm: "",
  paymentTypeFilter: "",
};

// Stock slice
const stockSlice = createSlice({
  name: "stock",
  initialState,
  reducers: {
    selectStock: (state, action) => {
      state.selectedStock = action.payload;
    },
    clearStockError: (state) => {
      state.error = null;
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    setPaymentTypeFilter: (state, action) => {
      state.paymentTypeFilter = action.payload;
    },
    clearFilters: (state) => {
      state.searchTerm = "";
      state.paymentTypeFilter = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all stocks
      .addCase(fetchStocks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStocks.fulfilled, (state, action) => {
        state.loading = false;
        state.stocks = action.payload.data || [];
      })
      .addCase(fetchStocks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch stocks";
      })

      // Fetch stock by ID
      .addCase(fetchStockById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStockById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedStock = action.payload.data;
      })
      .addCase(fetchStockById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch stock";
      })

      // Add stock
      .addCase(addStock.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addStock.fulfilled, (state, action) => {
        state.loading = false;
        state.stocks.push(action.payload.data);
      })
      .addCase(addStock.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to add stock";
      })

      // Update stock
      .addCase(updateStock.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStock.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.stocks.findIndex(
          (stock) => stock._id === action.payload.data._id
        );
        if (index !== -1) {
          state.stocks[index] = action.payload.data;
        }
        if (state.selectedStock?._id === action.payload.data._id) {
          state.selectedStock = action.payload.data;
        }
      })
      .addCase(updateStock.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to update stock";
      })

      // Delete stock
      .addCase(deleteStock.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStock.fulfilled, (state, action) => {
        state.loading = false;
        state.stocks = state.stocks.filter(
          (stock) => stock._id !== action.payload.stockId
        );
        if (state.selectedStock?._id === action.payload.stockId) {
          state.selectedStock = null;
        }
      })
      .addCase(deleteStock.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to delete stock";
      });
  },
});

export const {
  selectStock,
  clearStockError,
  setSearchTerm,
  setPaymentTypeFilter,
  clearFilters,
} = stockSlice.actions;

export default stockSlice.reducer;
