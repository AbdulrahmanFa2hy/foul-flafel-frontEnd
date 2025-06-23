import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";
import { API_ENDPOINTS } from "../utils/constants";
import { processPayment as processPaymentAction } from "./paymentSlice";
import { invalidateMealsCache } from "./mealSlice";

// Async thunk for creating an order
export const createOrder = createAsyncThunk(
  "order/createOrder",
  async (
    { orderItems, type, custName, custPhone, custAddress, tableNumber },
    { rejectWithValue }
  ) => {
    try {
      const orderPayload = {
        orderItems,
        type,
        custName,
        custPhone,
        custAddress,
      };

      // Only add tableNumber if it exists
      if (tableNumber !== undefined && tableNumber !== null) {
        orderPayload.tableNumber = tableNumber;
      }

      const response = await api.post(API_ENDPOINTS.ORDER, orderPayload);

      // Invalidate meals cache since ingredients/stock may have changed
      invalidateMealsCache();

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to create order" }
      );
    }
  }
);

// Async thunk for fetching all orders
export const fetchAllOrders = createAsyncThunk(
  "order/fetchAllOrders",
  async (queryParams = {}, { rejectWithValue }) => {
    try {
      const { date, cashierId, shiftId, page = 1, size = 100 } = queryParams;
      const params = new URLSearchParams();

      // Always set pagination parameters to get more orders
      params.append("page", page.toString());
      params.append("size", size.toString());

      // Only add optional parameters if they exist
      if (date) params.append("date", date);
      if (cashierId) params.append("cashierId", cashierId);
      if (shiftId) params.append("shiftId", shiftId);

      const queryString = params.toString();
      const url = `${API_ENDPOINTS.ORDER}?${queryString}`;

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch orders" }
      );
    }
  }
);

// Async thunk for deleting a meal from an order
export const deleteMealFromOrder = createAsyncThunk(
  "order/deleteMealFromOrder",
  async ({ orderId, mealId }, { rejectWithValue }) => {
    try {
      const response = await api.delete(`${API_ENDPOINTS.ORDER}/${orderId}`, {
        data: { mealId },
      });

      // Invalidate meals cache since ingredients/stock may have changed
      invalidateMealsCache();

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to delete meal from order" }
      );
    }
  }
);

// Async thunk for adding a meal to an order
export const addMealToOrder = createAsyncThunk(
  "order/addMealToOrder",
  async ({ orderId, mealId, quantity, note }, { rejectWithValue }) => {
    try {
      const payload = { mealId, quantity };
      if (note) payload.note = note;

      const response = await api.patch(
        `${API_ENDPOINTS.ORDER}/${orderId}`,
        payload
      );

      // Invalidate meals cache since ingredients/stock may have changed
      invalidateMealsCache();

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to add meal to order" }
      );
    }
  }
);

// Async thunk for getting order by ID
export const getOrderById = createAsyncThunk(
  "order/getOrderById",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await api.get(`${API_ENDPOINTS.ORDER}/${orderId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch order" }
      );
    }
  }
);

// Async thunk for getting order by code
export const getOrderByCode = createAsyncThunk(
  "order/getOrderByCode",
  async (orderCode, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `${API_ENDPOINTS.ORDER}/get-by-code/${orderCode}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch order by code" }
      );
    }
  }
);

// Async thunk for cancelling an order
export const cancelOrder = createAsyncThunk(
  "order/cancelOrder",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `${API_ENDPOINTS.ORDER}/${orderId}/cancel`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to cancel order" }
      );
    }
  }
);

// Initial state
const initialState = {
  currentOrder: null,
  orders: [],
  loading: false,
  error: null,
  success: false,
};

// Order slice
const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    clearOrderError: (state) => {
      state.error = null;
    },
    clearOrderSuccess: (state) => {
      state.success = false;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
      state.error = null;
    },
    setSelectedOrder: (state, action) => {
      state.currentOrder = action.payload;
    },
    addItemToOrder: (state, action) => {
      if (state.currentOrder) {
        state.currentOrder.orderItems.push(action.payload);
        // Recalculate totals
        state.currentOrder.subtotalPrice = state.currentOrder.orderItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        state.currentOrder.totalPrice =
          state.currentOrder.subtotalPrice - state.currentOrder.discount;
      }
    },
    removeItemFromOrder: (state, action) => {
      if (state.currentOrder) {
        state.currentOrder.orderItems = state.currentOrder.orderItems.filter(
          (item) => item._id !== action.payload
        );
        // Recalculate totals
        state.currentOrder.subtotalPrice = state.currentOrder.orderItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        state.currentOrder.totalPrice =
          state.currentOrder.subtotalPrice - state.currentOrder.discount;
      }
    },
    updateOrderDiscount: (state, action) => {
      if (state.currentOrder) {
        state.currentOrder.discount = action.payload;
        state.currentOrder.totalPrice =
          state.currentOrder.subtotalPrice - state.currentOrder.discount;
      }
    },
    resetOrderState: (state) => {
      state.currentOrder = null;
      state.orders = [];
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Order Cases
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload.data;
        state.orders.push(action.payload.data);
        state.success = true;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to create order";
        state.success = false;
      })
      // Fetch All Orders Cases
      .addCase(fetchAllOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.data;
        state.error = null;
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch orders";
      })
      // Add meal to order
      .addCase(addMealToOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addMealToOrder.fulfilled, (state, action) => {
        state.loading = false;
        // Update the current order with the new data
        state.currentOrder = action.payload.data;
        // Update the order in the orders array as well
        const updatedOrder = action.payload.data;
        state.orders = state.orders.map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order
        );
      })
      .addCase(addMealToOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to add meal to order";
      })
      // Delete meal from order
      .addCase(deleteMealFromOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMealFromOrder.fulfilled, (state, action) => {
        state.loading = false;
        // Update the current order with the new data
        state.currentOrder = action.payload.data;
        // Update the order in the orders array as well
        const updatedOrder = action.payload.data;
        state.orders = state.orders.map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order
        );
      })
      .addCase(deleteMealFromOrder.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to delete meal from order";
      })
      // Get order by ID
      .addCase(getOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload.data;
        // Update the order in the orders array if it exists
        const updatedOrder = action.payload.data;
        const orderIndex = state.orders.findIndex(
          (order) => order._id === updatedOrder._id
        );
        if (orderIndex !== -1) {
          state.orders[orderIndex] = updatedOrder;
        }
      })
      .addCase(getOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch order";
      })
      // Get order by code
      .addCase(getOrderByCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrderByCode.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload.data;
        // Update the order in the orders array if it exists
        const updatedOrder = action.payload.data;
        const orderIndex = state.orders.findIndex(
          (order) => order._id === updatedOrder._id
        );
        if (orderIndex !== -1) {
          state.orders[orderIndex] = updatedOrder;
        }
      })
      .addCase(getOrderByCode.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch order by code";
      })
      // Cancel order
      .addCase(cancelOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.loading = false;
        // Update the current order with the new data
        state.currentOrder = action.payload.data;
        // Update the order in the orders array as well
        const updatedOrder = action.payload.data;
        state.orders = state.orders.map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order
        );
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to cancel order";
      })
      // Handle payment success from paymentSlice
      .addCase(processPaymentAction.fulfilled, (state, action) => {
        const { orderId } = action.payload;
        // Update the current order if it matches
        if (state.currentOrder?._id === orderId) {
          state.currentOrder.isPaid = true;
        }
        // Update the order in the orders array
        state.orders = state.orders.map((order) =>
          order._id === orderId ? { ...order, isPaid: true } : order
        );
      });
  },
});

export const {
  clearOrderError,
  clearOrderSuccess,
  clearCurrentOrder,
  setSelectedOrder,
  addItemToOrder,
  removeItemFromOrder,
  updateOrderDiscount,
  resetOrderState,
} = orderSlice.actions;

export default orderSlice.reducer;
