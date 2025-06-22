import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";
import { API_ENDPOINTS } from "../utils/constants";

// Async thunk for creating a user (manager only)
export const createUser = createAsyncThunk(
  "users/createUser",
  async (userData, { rejectWithValue }) => {
    try {
      const formData = new FormData();

      // Append all user data to FormData
      Object.keys(userData).forEach((key) => {
        if (key === "image" && userData[key]) {
          formData.append("image", userData[key]);
        } else if (userData[key] !== null && userData[key] !== undefined) {
          formData.append(key, userData[key]);
        }
      });

      const response = await api.post(API_ENDPOINTS.USERS, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to create user" }
      );
    }
  }
);

// Async thunk for fetching all users
export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ENDPOINTS.USERS);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch users" }
      );
    }
  }
);

// Async thunk for updating a user
export const updateUser = createAsyncThunk(
  "users/updateUser",
  async ({ userId, userData }, { rejectWithValue, getState }) => {
    try {
      const formData = new FormData();

      // Get the current user data to extract old image publicId
      const state = getState();
      const currentUser = state.users.users.find((user) => user._id === userId);

      // Append all user data to FormData
      Object.keys(userData).forEach((key) => {
        if (key === "image" && userData[key]) {
          formData.append("image", userData[key]);
          // If updating image and user has existing image, include old image ID for deletion
          if (currentUser?.image?.publicId) {
            formData.append("oldImageId", currentUser.image.publicId);
          }
        } else if (userData[key] !== null && userData[key] !== undefined) {
          formData.append(key, userData[key]);
        }
      });

      const response = await api.put(
        `${API_ENDPOINTS.USERS}/${userId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to update user" }
      );
    }
  }
);

// Async thunk for deleting a user
export const deleteUser = createAsyncThunk(
  "users/deleteUser",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`${API_ENDPOINTS.USERS}/${userId}`);
      return { userId, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to delete user" }
      );
    }
  }
);

// Async thunk for deleting user image
export const deleteUserImage = createAsyncThunk(
  "users/deleteUserImage",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.delete(
        `${API_ENDPOINTS.USERS}/${userId}/image`
      );
      return { userId, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to delete user image" }
      );
    }
  }
);

// Initial state
const initialState = {
  users: [],
  loading: false,
  error: null,
  successMessage: null,
  pagination: null,
  countOfDocuments: 0,
};

// User slice
const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    clearUsers: (state) => {
      state.users = [];
      state.pagination = null;
      state.countOfDocuments = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create user
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users.push(action.payload.document);
        state.successMessage =
          action.payload.message || "User created successfully";
        state.countOfDocuments += 1;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to create user";
      })

      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.documents || [];
        state.pagination = action.payload.pagination;
        state.countOfDocuments = action.payload.countOfDocuments || 0;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch users";
      })

      // Update user
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        const updatedUser = action.payload.data;
        const index = state.users.findIndex(
          (user) => user._id === updatedUser._id
        );
        if (index !== -1) {
          state.users[index] = updatedUser;
        }
        state.successMessage =
          action.payload.message || "User updated successfully";
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to update user";
      })

      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.filter(
          (user) => user._id !== action.payload.userId
        );
        state.successMessage =
          action.payload.message || "User deleted successfully";
        state.countOfDocuments -= 1;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to delete user";
      })

      // Delete user image
      .addCase(deleteUserImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUserImage.fulfilled, (state, action) => {
        state.loading = false;
        const userId = action.payload.userId;
        const userIndex = state.users.findIndex((user) => user._id === userId);
        if (userIndex !== -1) {
          state.users[userIndex].image = null;
        }
        state.successMessage =
          action.payload.message || "User image deleted successfully";
      })
      .addCase(deleteUserImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to delete user image";
      });
  },
});

// Export actions and reducer
export const { clearError, clearSuccessMessage, clearUsers } =
  userSlice.actions;
export default userSlice.reducer;
