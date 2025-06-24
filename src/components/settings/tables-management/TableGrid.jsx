import { useTranslation } from "react-i18next";
import { FaTable, FaPlus } from "react-icons/fa";
import TableCard from "./TableCard";

const TableGrid = ({ tables, onEdit, onDelete }) => {
  const { t } = useTranslation();

  if (tables.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-lg">
          <FaTable className="text-4xl text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          {t("table.noTablesFound")}
        </h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          {t("table.noTablesDescription")}
        </p>
        <div className="flex items-center justify-center gap-2 text-primary-600">
          <FaPlus className="text-sm" />
          <span className="text-sm font-medium">
            {t("table.createFirstTable")}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {t("table.showingResults", { count: tables.length })}
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tables.map((table) => (
          <TableCard
            key={table._id}
            table={table}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};

export default TableGrid;
