import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { createTable, updateTable } from "../../store/tableSlice";
import { FaTimes } from "react-icons/fa";

const AddTableModal = ({
  isOpen,
  onClose,
  tables,
  seatingType,
  editingTable,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.table);

  const [formData, setFormData] = useState({
    number: "",
    location: seatingType || "inside",
  });
  const [formErrors, setFormErrors] = useState({});

  // Update location when seatingType changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      location: seatingType || "inside",
    }));
  }, [seatingType]);

  // Handle form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editingTable) {
        // If editing, populate form with existing data
        setFormData({
          number: editingTable.number.toString(),
          location: editingTable.location,
        });
      } else if (tables.length > 0) {
        // If adding new, calculate next table number
        const tableNumbers = tables.map((table) => parseInt(table.number) || 0);
        const maxNumber = Math.max(...tableNumbers);
        setFormData((prev) => ({
          ...prev,
          number: maxNumber + 1,
        }));
      }
    }
  }, [isOpen, tables, editingTable]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear specific error when user starts typing
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: "" });
    }
  };

  const validateForm = () => {
    const errors = {};

    // Validate table number
    if (!formData.number) {
      errors.number = t("table.tableNumberRequired");
    } else if (parseInt(formData.number) <= 0) {
      errors.number = t("table.tableNumberMustBePositive");
    } else {
      // Check if table number already exists (only for new tables or different number)
      const tableNumber = parseInt(formData.number);
      const existingTable = tables.find(
        (table) => table.number === tableNumber
      );
      if (
        existingTable &&
        (!editingTable || existingTable.number !== editingTable.number)
      ) {
        errors.number = t("table.tableNumberExists");
      }
    }

    // Validate location
    if (!formData.location) {
      errors.location = t("table.locationRequired");
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      // Convert number to integer
      const tableData = {
        number: parseInt(formData.number),
        location: formData.location,
      };

      if (editingTable) {
        await dispatch(
          updateTable({
            tableNumber: editingTable.number,
            tableData,
          })
        ).unwrap();
      } else {
        await dispatch(createTable(tableData)).unwrap();
      }

      // Reset form and close modal on success
      setFormData({
        number: "",
        location: seatingType || "inside",
      });
      setFormErrors({});
      onClose();
    } catch (error) {
      console.error("Failed to save table:", error);
    }
  };

  const handleClose = () => {
    setFormData({
      number: "",
      location: seatingType || "inside",
    });
    setFormErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-neutral-800">
            {editingTable ? t("table.editTable") : t("table.addTable")}
          </h2>
          <button
            onClick={handleClose}
            className="text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                className="block text-sm font-medium text-neutral-700 mb-2"
                htmlFor="number"
              >
                {t("table.tableNumber")}
              </label>
              <input
                id="number"
                name="number"
                type="number"
                min="1"
                value={formData.number}
                onChange={handleChange}
                className={`w-full p-3 border ${
                  formErrors.number ? "border-red-500" : "border-neutral-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-800`}
                placeholder={t("table.enterTableNumber")}
              />
              {formErrors.number && (
                <p className="mt-1 text-sm text-red-500">{formErrors.number}</p>
              )}
            </div>

            <div className="mb-6">
              <label
                className="block text-sm font-medium text-neutral-700 mb-2"
                htmlFor="location"
              >
                {t("table.seatingType")}
              </label>
              <select
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={`w-full p-3 border ${
                  formErrors.location ? "border-red-500" : "border-neutral-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-800`}
              >
                <option value="inside">{t("table.indoor")}</option>
                <option value="outside">{t("table.outdoor")}</option>
              </select>
              {formErrors.location && (
                <p className="mt-1 text-sm text-red-500">
                  {formErrors.location}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-70"
              >
                {loading
                  ? editingTable
                    ? t("table.updating")
                    : t("table.adding")
                  : editingTable
                  ? t("table.updateTable")
                  : t("table.addTable")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddTableModal;
