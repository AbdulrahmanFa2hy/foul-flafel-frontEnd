import { useTranslation } from "react-i18next";
import {
  FaEdit,
  FaTrash,
  FaTable,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

const TableCard = ({ table, onEdit, onDelete }) => {
  const { t } = useTranslation();

  return (
    <div className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary-200 overflow-hidden">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 px-6 py-4 border-b border-primary-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary-500 rounded-xl p-3 shadow-lg">
              <FaTable className="text-white text-lg" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-primary-800">
                #{table.number}
              </h3>
              <p className="text-primary-600 text-sm font-medium">
                {t("table.tableNumber")}
              </p>
            </div>
          </div>

          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => onEdit(table)}
              className="bg-blue-500 hover:bg-blue-600 text-white p-2.5 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              title={t("table.editTable")}
            >
              <FaEdit size={14} />
            </button>
            <button
              onClick={() => onDelete(table)}
              className="bg-red-500 hover:bg-red-600 text-white p-2.5 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              title={t("table.deleteTable")}
            >
              <FaTrash size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 space-y-4">
        {/* Location */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="bg-gray-200 rounded-lg p-2">
              <FaMapMarkerAlt className="text-gray-600 text-sm" />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {t("table.seatingType")}
            </span>
          </div>
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
              table.location === "inside"
                ? "bg-blue-100 text-blue-800 border border-blue-200"
                : "bg-green-100 text-green-800 border border-green-200"
            }`}
          >
            {t(`table.${table.location}`)}
          </span>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="bg-gray-200 rounded-lg p-2">
              {table.isAvailable ? (
                <FaCheckCircle className="text-green-600 text-sm" />
              ) : (
                <FaTimesCircle className="text-red-600 text-sm" />
              )}
            </div>
            <span className="text-sm font-medium text-gray-700">
              {t("table.status")}
            </span>
          </div>
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
              table.isAvailable
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            {table.isAvailable ? t("table.available") : t("table.occupied")}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TableCard;
