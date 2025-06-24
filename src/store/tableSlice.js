import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";
import { API_ENDPOINTS } from "../utils/constants";

// Async thunk for fetching tables
export const fetchTables = createAsyncThunk(
  "table/fetchTables",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ENDPOINTS.TABLES);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch tables" }
      );
    }
  }
);

// Async thunk for creating a new table
export const createTable = createAsyncThunk(
  "table/createTable",
  async (tableData, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ENDPOINTS.TABLES, tableData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to create table" }
      );
    }
  }
);

// Async thunk for updating a table
export const updateTable = createAsyncThunk(
  "table/updateTable",
  async ({ tableNumber, tableData }, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `${API_ENDPOINTS.TABLES}/${tableNumber}`,
        tableData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to update table" }
      );
    }
  }
);

// Async thunk for deleting a table
export const deleteTable = createAsyncThunk(
  "table/deleteTable",
  async (tableNumber, { rejectWithValue }) => {
    try {
      const response = await api.delete(
        `${API_ENDPOINTS.TABLES}/${tableNumber}`
      );
      return { ...response.data, tableNumber };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to delete table" }
      );
    }
  }
);

// Initial state
const initialState = {
  tables: [],
  loading: false,
  error: null,
  selectedTable: null,
  successMessage: null,
};

// Table slice
const tableSlice = createSlice({
  name: "table",
  initialState,
  reducers: {
    selectTable: (state, action) => {
      state.selectedTable = action.payload;
    },
    clearSelectedTable: (state) => {
      state.selectedTable = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tables
      .addCase(fetchTables.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTables.fulfilled, (state, action) => {
        state.loading = false;
        state.tables = action.payload.data || [];
      })
      .addCase(fetchTables.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch tables";
      })
      // Create table
      .addCase(createTable.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTable.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          state.tables.push(action.payload.data);
          state.successMessage =
            action.payload.message || "Table created successfully";
        }
      })
      .addCase(createTable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to create table";
      })
      // Update table
      .addCase(updateTable.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTable.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          const index = state.tables.findIndex(
            (table) => table.number === action.payload.data.number
          );
          if (index !== -1) {
            state.tables[index] = action.payload.data;
          }
          state.successMessage =
            action.payload.message || "Table updated successfully";
        }
      })
      .addCase(updateTable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to update table";
      })
      // Delete table
      .addCase(deleteTable.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTable.fulfilled, (state, action) => {
        state.loading = false;
        state.tables = state.tables.filter(
          (table) => table.number !== action.payload.tableNumber
        );
        state.successMessage =
          action.payload.message || "Table deleted successfully";
        // Clear selected table if it was deleted
        if (state.selectedTable?.number === action.payload.tableNumber) {
          state.selectedTable = null;
        }
      })
      .addCase(deleteTable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to delete table";
      });
  },
});

// Export actions and reducer
export const {
  selectTable,
  clearSelectedTable,
  clearError,
  clearSuccessMessage,
} = tableSlice.actions;
export default tableSlice.reducer;
