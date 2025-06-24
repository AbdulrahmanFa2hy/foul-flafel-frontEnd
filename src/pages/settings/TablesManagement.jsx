import { useTranslation } from "react-i18next";
import { Suspense } from "react";
import Loading from "../../components/common/Loading";
import DeleteConfirmation from "../../components/common/DeleteConfirmation";
import AddTableModal from "../../components/table/AddTableModal";
import {
  TableHeader,
  TableFilters,
  TableGrid,
  useTablesManagement,
} from "../../components/settings/tables-management";

function TablesManagement() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const {
    // Data
    tables,
    loading,
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
  } = useTablesManagement();

  if (loading && tables.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="">
        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-primary-800 to-primary-900 px-8 py-6">
            <TableHeader
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              onAddTable={() => handleOpenModal()}
            />
          </div>

          {/* Content Section */}
          <div className="p-2">
            {/* Filters Section */}
            <div className="mb-8">
              <TableFilters
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </div>

            {/* Tables Grid Section */}
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-12">
                  <Loading />
                </div>
              }
            >
              <TableGrid
                tables={tables}
                onEdit={handleOpenModal}
                onDelete={handleDeleteClick}
              />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddTableModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        tables={tables}
        editingTable={editingTable}
      />

      {isDeleteModalOpen && (
        <DeleteConfirmation
          title={t("table.deleteTable")}
          message={t("table.confirmDeleteTable", {
            tableNumber: tableToDelete?.number || "",
          })}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          loading={loading}
        />
      )}
    </div>
  );
}

export default TablesManagement;
