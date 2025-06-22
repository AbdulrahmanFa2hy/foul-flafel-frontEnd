import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";
import { API_ENDPOINTS } from "../utils/constants";

// Async thunk for fetching all payments with pagination and filtering
export const fetchAllPayments = createAsyncThunk(
  "payment/fetchAllPayments",
  async (
    {
      page = 1,
      size = 20,
      paymentMethod,
      date,
      shiftId,
      cashierId,
      search,
    } = {},
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("size", size.toString());

      if (paymentMethod) params.append("paymentMethod", paymentMethod);
      if (date) params.append("date", date);
      if (shiftId) params.append("shiftId", shiftId);
      if (cashierId) params.append("cashierId", cashierId);
      if (search) params.append("search", search);

      const response = await api.get(
        `${API_ENDPOINTS.PAYMENT}?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch payments" }
      );
    }
  }
);

// Async thunk for processing payment
export const processPayment = createAsyncThunk(
  "payment/processPayment",
  async ({ orderId, paymentMethods, tax, discount }, { rejectWithValue }) => {
    try {
      // Ensure amounts are numbers, not strings and round to 2 decimal places
      const processedPaymentMethods = paymentMethods.map((method) => ({
        method: method.method,
        amount: Math.round(parseFloat(method.amount) * 100) / 100, // Round to 2 decimal places
      }));

      // Ensure tax and discount are integers as expected by backend
      const paymentData = {
        orderId,
        paymentMethods: processedPaymentMethods,
      };

      // Only add tax if it's provided and valid
      if (tax && tax > 0) {
        paymentData.tax = Math.round(parseFloat(tax)); // Backend expects integer
      }

      // Only add discount if it's provided and valid
      if (discount && discount > 0) {
        paymentData.discount = Math.round(parseFloat(discount)); // Backend expects integer
      }

      console.log("Payment data being sent:", paymentData);

      const response = await api.post(API_ENDPOINTS.PAYMENT, paymentData);

      // Return both payment data and orderId for state updates
      return {
        payment: response.data,
        orderId,
      };
    } catch (error) {
      console.error("Payment error details:", error);

      // Enhanced error handling
      let errorMessage = "Failed to process payment";
      let shouldRetry = false;

      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        // Handle specific error cases
        if (status === 400) {
          if (data.message?.includes("already paid")) {
            // Payment was successful but we got an error response
            // This is likely because the order was already paid
            return {
              payment: { success: true, message: "Payment already processed" },
              orderId,
              alreadyPaid: true,
            };
          }
          errorMessage = data.message || "Invalid payment data";
        } else if (status === 500) {
          errorMessage = "Server error occurred. Please try again.";
          shouldRetry = true;
        } else if (status === 404) {
          errorMessage = "Order not found";
        } else {
          errorMessage = data.message || errorMessage;
        }
      } else if (error.request) {
        // Network error
        errorMessage =
          "Network error. Please check your connection and try again.";
        shouldRetry = true;
      } else {
        errorMessage = error.message || errorMessage;
      }

      return rejectWithValue({
        message: errorMessage,
        shouldRetry,
        orderId,
        originalError: error.response?.data || error.message,
      });
    }
  }
);

const initialState = {
  payments: [],
  loading: false,
  error: null,
  success: false,
  // Pagination metadata
  currentPage: 1,
  totalPages: 1,
  totalPayments: 0,
  pageSize: 20,
};

const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    clearPaymentError: (state) => {
      state.error = null;
    },
    clearPaymentSuccess: (state) => {
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Payments
      .addCase(fetchAllPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllPayments.fulfilled, (state, action) => {
        state.loading = false;
        const response = action.payload;

        // Handle the response structure from backend
        if (
          response.data &&
          response.data.data &&
          Array.isArray(response.data.data)
        ) {
          // Backend returns { data: { data: payments[], pagination: {...} } }
          const payments = response.data.data;
          const pagination = response.data.pagination;

          state.payments = payments;
          state.currentPage = pagination?.currentPage || 1;
          state.totalPages = pagination?.totalPages || 1;
          state.totalPayments = pagination?.totalItems || payments.length;
          state.pageSize = pagination?.pageSize || 20;
        } else if (response.data && Array.isArray(response.data)) {
          // Backward compatibility: direct array
          state.payments = response.data;
          state.totalPayments = response.data.length;
          state.currentPage = 1;
          state.totalPages = 1;
        } else {
          // Fallback
          state.payments = [];
          state.totalPayments = 0;
          state.currentPage = 1;
          state.totalPages = 1;
        }
      })
      .addCase(fetchAllPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch payments";
      })
      // Process Payment
      .addCase(processPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        // Handle already paid scenario
        if (action.payload.alreadyPaid) {
          state.error = null; // Clear any previous errors
        }

        // Add the new payment to the payments array
        if (action.payload.payment?.data) {
          state.payments.push(action.payload.payment.data);
        }
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.loading = false;
        state.success = false;

        // Enhanced error handling
        if (action.payload?.message) {
          state.error = action.payload.message;
        } else {
          state.error = "Failed to process payment";
        }

        // Store additional error info for debugging
        if (action.payload?.originalError) {
          console.error(
            "Payment failed with details:",
            action.payload.originalError
          );
        }
      });
  },
});

export const { clearPaymentError, clearPaymentSuccess } = paymentSlice.actions;
export default paymentSlice.reducer;
