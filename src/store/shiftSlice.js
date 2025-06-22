import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";
import { API_ENDPOINTS } from "../utils/constants";

// Async thunk for fetching all shifts
export const fetchShifts = createAsyncThunk(
  "shift/fetchShifts",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { includeAll = false } = params;
      const queryParams = new URLSearchParams();

      if (includeAll) {
        queryParams.append("includeAll", "true");
      }

      const queryString = queryParams.toString();
      const url = queryString
        ? `${API_ENDPOINTS.SHIFT}?${queryString}`
        : API_ENDPOINTS.SHIFT;

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch shifts" }
      );
    }
  }
);

// Async thunk for fetching shift by ID
export const fetchShiftById = createAsyncThunk(
  "shift/fetchShiftById",
  async (shiftId, { rejectWithValue }) => {
    try {
      const response = await api.get(`${API_ENDPOINTS.SHIFT}/${shiftId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch shift" }
      );
    }
  }
);

// Async thunk for starting a shift
export const startShift = createAsyncThunk(
  "shift/startShift",
  async (shiftData, { rejectWithValue }) => {
    try {
      const response = await api.post(`${API_ENDPOINTS.SHIFT}`, shiftData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to start shift" }
      );
    }
  }
);

// Async thunk for ending a shift
export const endShift = createAsyncThunk(
  "shift/endShift",
  async (endData, { rejectWithValue }) => {
    try {
      const response = await api.patch(`${API_ENDPOINTS.SHIFT}`, endData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to end shift" }
      );
    }
  }
);

// Async thunk for checking current shift status
export const checkCurrentShift = createAsyncThunk(
  "shift/checkCurrentShift",
  async (_, { rejectWithValue }) => {
    try {
      // Get all shifts for the current user and find active one
      const response = await api.get(`${API_ENDPOINTS.SHIFT}`);
      const shifts = response.data.data || [];

      // Find active shift (not cancelled and no end balance)
      const activeShift = shifts.find(
        (shift) => !shift.isCancelled && !shift.endBalance && !shift.cancelledAt
      );

      return activeShift ? { data: activeShift } : null;
    } catch (error) {
      // If error fetching shifts, it's an actual error
      return rejectWithValue(
        error.response?.data || { message: "Failed to check current shift" }
      );
    }
  }
);

// Initial state
const initialState = {
  shifts: [],
  currentShift: null,
  selectedShift: null,
  lastEndedShift: null,
  loading: false,
  error: null,
  searchTerm: "",
  statusFilter: "",
  hasActiveShift: false,
};

// Shift slice
const shiftSlice = createSlice({
  name: "shift",
  initialState,
  reducers: {
    selectShift: (state, action) => {
      state.selectedShift = action.payload;
    },
    clearShiftError: (state) => {
      state.error = null;
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    setStatusFilter: (state, action) => {
      state.statusFilter = action.payload;
    },
    clearFilters: (state) => {
      state.searchTerm = "";
      state.statusFilter = "";
    },
    setActiveShift: (state, action) => {
      state.currentShift = action.payload;
      state.hasActiveShift = !!action.payload;
    },
    clearCurrentShift: (state) => {
      state.currentShift = null;
      state.hasActiveShift = false;
    },
    clearLastEndedShift: (state) => {
      state.lastEndedShift = null;
    },
    resetShiftState: (state) => {
      state.shifts = [];
      state.currentShift = null;
      state.selectedShift = null;
      state.lastEndedShift = null;
      state.loading = false;
      state.error = null;
      state.searchTerm = "";
      state.statusFilter = "";
      state.hasActiveShift = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all shifts
      .addCase(fetchShifts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShifts.fulfilled, (state, action) => {
        state.loading = false;
        state.shifts = action.payload.data || [];
      })
      .addCase(fetchShifts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch shifts";
      })

      // Fetch shift by ID
      .addCase(fetchShiftById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShiftById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedShift = action.payload.data;
      })
      .addCase(fetchShiftById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch shift";
      })

      // Start shift
      .addCase(startShift.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startShift.fulfilled, (state, action) => {
        state.loading = false;
        state.currentShift = action.payload.data;
        state.hasActiveShift = true;
        state.shifts.unshift(action.payload.data);
      })
      .addCase(startShift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to start shift";
      })

      // End shift
      .addCase(endShift.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(endShift.fulfilled, (state, action) => {
        state.loading = false;
        state.currentShift = null;
        state.hasActiveShift = false;
        // Update the shift in the shifts array
        const index = state.shifts.findIndex(
          (shift) => shift._id === action.payload.data._id
        );
        if (index !== -1) {
          state.shifts[index] = action.payload.data;
        }
        state.lastEndedShift = action.payload.data;
      })
      .addCase(endShift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to end shift";
      })

      // Check current shift
      .addCase(checkCurrentShift.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkCurrentShift.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.currentShift = action.payload.data;
          state.hasActiveShift = true;
        } else {
          state.currentShift = null;
          state.hasActiveShift = false;
        }
      })
      .addCase(checkCurrentShift.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to check current shift";
      });
  },
});

export const {
  selectShift,
  clearShiftError,
  setSearchTerm,
  setStatusFilter,
  clearFilters,
  setActiveShift,
  clearCurrentShift,
  clearLastEndedShift,
  resetShiftState,
} = shiftSlice.actions;

export default shiftSlice.reducer;
