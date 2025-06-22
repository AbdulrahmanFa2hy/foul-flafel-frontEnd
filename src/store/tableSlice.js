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

// Initial state
const initialState = {
  tables: [],
  loading: false,
  error: null,
  selectedTable: null,
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
        }
      })
      .addCase(createTable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to create table";
      });
  },
});

// Export actions and reducer
export const { selectTable, clearSelectedTable } = tableSlice.actions;
export default tableSlice.reducer;
