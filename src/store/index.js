import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "@reduxjs/toolkit";

import authReducer from "./authSlice";
import categoryReducer from "./categorySlice";
import orderReducer, { resetOrderState } from "./orderSlice";
import paymentReducer from "./paymentSlice";
import mealReducer from "./mealSlice";
import userReducer from "./userSlice";
import stockReducer from "./stockSlice";
import shiftReducer, { resetShiftState } from "./shiftSlice";
import tableReducer from "./tableSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  categories: categoryReducer,
  order: orderReducer,
  payment: paymentReducer,
  meals: mealReducer,
  users: userReducer,
  stock: stockReducer,
  shift: shiftReducer,
  table: tableReducer,
});

// Middleware to reset shift state on logout
const logoutMiddleware = (store) => (next) => (action) => {
  if (action.type === "auth/logout") {
    // Reset shift state when user logs out
    store.dispatch(resetShiftState());

    // Also clear orders state to prevent stale data
    store.dispatch(resetOrderState());
  }
  return next(action);
};

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(logoutMiddleware),
});

export default store;
