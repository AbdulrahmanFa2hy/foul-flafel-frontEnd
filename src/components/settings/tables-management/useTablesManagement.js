import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  fetchTables,
  deleteTable,
  clearError,
  clearSuccessMessage,
} from "../../../store/tableSlice";

export const useTablesManagement = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { tables, loading, error, successMessage } = useSelector(
    (state) => state.table
  );

  // Local state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [tableToDelete, setTableToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    location: "",
    availability: "",
    sortOrder: "asc",
  });

  // Load tables on component mount
  useEffect(() => {
    dispatch(fetchTables());
  }, [dispatch]);

  // Handle success messages
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearSuccessMessage());
      setIsModalOpen(false);
      setIsDeleteModalOpen(false);
    }
  }, [successMessage, dispatch]);

  // Handle error messages
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Filtered and sorted tables
  const filteredTables = useMemo(() => {
    if (!tables) return [];

    let filtered = [...tables];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((table) => {
        return (
          table.number.toString().includes(query) ||
          t(`table.${table.location}`).toLowerCase().includes(query) ||
          (table.isAvailable ? t("table.available") : t("table.occupied"))
            .toLowerCase()
            .includes(query)
        );
      });
    }

    // Apply location filter
    if (filters.location) {
      filtered = filtered.filter(
        (table) => table.location === filters.location
      );
    }

    // Apply availability filter
    if (filters.availability) {
      const isAvailable = filters.availability === "available";
      filtered = filtered.filter((table) => table.isAvailable === isAvailable);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const comparison = a.number - b.number;
      return filters.sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [tables, searchQuery, filters, t]);

  // Modal handlers
  const handleOpenModal = (table = null) => {
    setEditingTable(table);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTable(null);
  };

  // Delete handlers
  const handleDeleteClick = (table) => {
    setTableToDelete(table);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!tableToDelete) return;

    try {
      await dispatch(deleteTable(tableToDelete.number)).unwrap();
    } catch {
      // Error is handled by useEffect
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setTableToDelete(null);
  };

  // Filter handlers
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  return {
    // Data
    tables: filteredTables,
    loading,
    error,
    isModalOpen,
    isDeleteModalOpen,
    editingTable,
    tableToDelete,
    searchQuery,
    filters,

    // Handlers
    handleOpenModal,
    handleCloseModal,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    handleFilterChange,
    handleSearchChange,
  };
};
