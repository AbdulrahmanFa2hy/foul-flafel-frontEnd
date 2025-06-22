import { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers, deleteUser, clearError } from "../../../store/userSlice";
import toast from "react-hot-toast";

export const useUsersManagement = () => {
  // UI state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const dispatch = useDispatch();

  // Redux selectors
  const { users, loading, error, countOfDocuments } = useSelector(
    (state) => state.users
  );

  const { user: currentUser } = useSelector((state) => state.auth);

  // Check if current user is manager
  const isManager = useMemo(() => {
    return currentUser?.role?.toLowerCase() === "manager";
  }, [currentUser]);

  // Memoized filtered users
  const filteredUsers = useMemo(() => {
    // Early return for invalid states
    if (!users || !Array.isArray(users)) return [];

    return users.filter((user) => {
      // Check if user exists and has required properties
      if (!user || typeof user !== "object") {
        return false;
      }

      // Check for required string properties and ensure they're not just undefined
      if (
        !user.name ||
        typeof user.name !== "string" ||
        !user.username ||
        typeof user.username !== "string" ||
        !user.role ||
        typeof user.role !== "string"
      ) {
        return false;
      }

      try {
        const matchesSearch =
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.username.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole =
          !roleFilter || user.role.toLowerCase() === roleFilter.toLowerCase();

        const matchesStatus =
          !statusFilter ||
          (statusFilter === "active" && user.active) ||
          (statusFilter === "inactive" && !user.active);

        return matchesSearch && matchesRole && matchesStatus;
      } catch (err) {
        console.error("Error filtering user:", user, err);
        return false;
      }
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    if (!users || !Array.isArray(users))
      return { total: 0, active: 0, inactive: 0, managers: 0, cashiers: 0 };

    // Filter out invalid users
    const validUsers = users.filter((user) => {
      return (
        user &&
        typeof user === "object" &&
        user.role &&
        typeof user.role === "string"
      );
    });

    try {
      return {
        total: validUsers.length,
        active: validUsers.filter((user) => user.active).length,
        inactive: validUsers.filter((user) => !user.active).length,
        managers: validUsers.filter(
          (user) => user.role.toLowerCase() === "manager"
        ).length,
        cashiers: validUsers.filter(
          (user) => user.role.toLowerCase() === "cashier"
        ).length,
      };
    } catch (err) {
      console.error("Error calculating stats:", err);
      return { total: 0, active: 0, inactive: 0, managers: 0, cashiers: 0 };
    }
  }, [users]);

  // Fetch users on mount if manager
  useEffect(() => {
    if (isManager) {
      dispatch(fetchUsers());
    }
  }, [dispatch, isManager]);

  // Clear messages after showing them
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  // Clear errors on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Form handlers
  const handleOpenForm = useCallback((user = null) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(
    (shouldRefresh = false) => {
      setSelectedUser(null);
      setIsFormOpen(false);
      // Only refresh if explicitly requested (after successful create/update)
      if (shouldRefresh && isManager) {
        dispatch(fetchUsers());
      }
    },
    [dispatch, isManager]
  );

  // Delete handlers
  const handleDeleteClick = useCallback((user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (selectedUser) {
      try {
        await dispatch(deleteUser(selectedUser._id)).unwrap();
        toast.success("User deleted successfully!");
        setIsDeleteModalOpen(false);
        setSelectedUser(null);
        // Refresh users list immediately after successful deletion
        if (isManager) {
          dispatch(fetchUsers());
        }
      } catch (error) {
        toast.error(error.message || "Failed to delete user");
      }
    }
  }, [selectedUser, dispatch, isManager]);

  const handleCancelDelete = useCallback(() => {
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
  }, []);

  // Filter handlers
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  const handleRoleFilterChange = useCallback((value) => {
    setRoleFilter(value);
  }, []);

  const handleStatusFilterChange = useCallback((value) => {
    setStatusFilter(value);
  }, []);

  return {
    // State
    isFormOpen,
    isDeleteModalOpen,
    selectedUser,
    searchTerm,
    roleFilter,
    statusFilter,

    // Data
    users,
    filteredUsers,
    stats,
    loading,
    error,
    countOfDocuments,
    isManager,

    // Handlers
    handleOpenForm,
    handleCloseForm,
    handleDeleteClick,
    handleDelete,
    handleCancelDelete,
    handleSearchChange,
    handleRoleFilterChange,
    handleStatusFilterChange,
  };
};
