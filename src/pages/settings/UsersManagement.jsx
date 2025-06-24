import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { FaPlus } from "react-icons/fa";
import Loading from "../../components/common/Loading";
import ErrorMessage from "../../components/common/ErrorMessage";
import ErrorBoundary from "../../components/common/ErrorBoundary";
import DeleteConfirmation from "../../components/common/DeleteConfirmation";
import {
  UserFilters,
  UserStats,
  UserTable,
  UserForm,
} from "../../components/settings/users-management";
import { useUsersManagement } from "../../components/settings/users-management/useUsersManagement";

const UsersManagement = () => {
  const { t } = useTranslation();
  const {
    // State
    isFormOpen,
    isDeleteModalOpen,
    selectedUser,
    searchTerm,
    roleFilter,
    statusFilter,

    // Data
    filteredUsers,
    stats,
    loading,
    error,
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
  } = useUsersManagement();

  // If not manager, show access denied
  if (!isManager) {
    return (
      <div className="animate-fade-in">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {t("users.accessDenied")}
          </h2>
          <p className="text-gray-600">{t("users.accessDeniedMessage")}</p>
        </div>
      </div>
    );
  }

  if (loading && filteredUsers.length === 0) {
    return <Loading />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <ErrorBoundary>
      <div className="animate-fade-in p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {t("users.title")}
          </h1>
          <button
            className="px-4 py-2 rounded-md text-white font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 bg-primary-800 hover:bg-primary-800 focus:ring-primary-800/50 flex items-center"
            onClick={() => handleOpenForm()}
            disabled={loading}
          >
            <FaPlus className="mr-2" /> {t("users.addUser")}
          </button>
        </div>

        {/* User Statistics */}
        <UserStats stats={stats} />

        {/* Search and filters */}
        <UserFilters
          searchTerm={searchTerm}
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          onSearchChange={handleSearchChange}
          onRoleFilterChange={handleRoleFilterChange}
          onStatusFilterChange={handleStatusFilterChange}
        />

        {/* Loading state */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-800"></div>
            <p className="mt-2 text-gray-600">{t("users.loadingUsers")}</p>
          </div>
        )}

        {/* Users table */}
        {!loading && (
          <UserTable
            users={filteredUsers}
            onEdit={handleOpenForm}
            onDelete={handleDeleteClick}
          />
        )}

        {/* Lazy-loaded Modals wrapped in Suspense */}
        <Suspense fallback={<Loading />}>
          {/* User form modal */}
          {isFormOpen && (
            <UserForm user={selectedUser} onClose={handleCloseForm} />
          )}
        </Suspense>

        {/* Delete confirmation modal (small, no need for lazy loading) */}
        {isDeleteModalOpen && (
          <DeleteConfirmation
            title={t("users.deleteUser")}
            message={t("users.confirmDelete")}
            onConfirm={handleDelete}
            onCancel={handleCancelDelete}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default UsersManagement;
