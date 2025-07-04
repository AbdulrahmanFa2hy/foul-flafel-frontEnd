import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import TableCard from "./TableCard";
import TableBottom from "./TableBottom";
import AddTableModal from "./AddTableModal";

const TableGrid = ({ tables = [], onSelectTable, seatingType }) => {
  const { t } = useTranslation();
  const [selectedTable, setSelectedTable] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // Check if user is a manager
  const isManager = user?.role === "manager";

  const handleSelectTable = (tableId) => {
    setSelectedTable(tableId);
    onSelectTable(tableId);
    // Navigate directly to menu page with selected table info
    navigate(`/menu?table=${tableId}`);
  };

  // Filter tables based on seating type
  const filteredTables = tables
    .filter((table) => table.location === seatingType)
    .sort((a, b) => a.number - b.number);
  // Filter tables based on availability
  const freeTables = tables.filter((table) => table.isAvailable);
  const occupiedTables = tables.filter((table) => table.isAvailable == false);

  return (
    <div className="px-2 py-2 relative h-full">
      {/* Table Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-2 ">
        {filteredTables.map((table) => (
          <TableCard
            key={table._id}
            table={table}
            isSelected={selectedTable === table._id}
            onSelect={() => handleSelectTable(table._id)}
          />
        ))}
        {isManager && (
          <div
            onClick={() => setIsAddModalOpen(true)}
            className="flex justify-center items-center border-2 border-dashed border-primary-700 rounded-xl min-h-[90px] p-4 lg:p-7 cursor-pointer hover:border-primary-800 hover:bg-primary-50 transition-all duration-200 "
          >
            <span className="text-primary-700 font-medium flex items-center justify-center gap-4 text-lg">
              {t("table.addTable")}
            </span>
          </div>
        )}
      </div>
      <TableBottom freeTables={freeTables} occupiedTables={occupiedTables} />

      {/* Add Table Modal */}
      <AddTableModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        tables={tables}
        seatingType={seatingType}
      />
    </div>
  );
};

export default TableGrid;
