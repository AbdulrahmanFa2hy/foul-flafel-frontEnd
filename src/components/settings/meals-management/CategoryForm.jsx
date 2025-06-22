import { useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import Modal from "../../common/Modal";
import {
  createCategory,
  updateCategory,
  fetchCategories,
} from "../../../store/categorySlice";
import toast from "react-hot-toast";

// Predefined color palette that matches the website theme
const CATEGORY_COLORS = [
  { name: "Blue", value: "#3B82F6", bgClass: "bg-blue-500" },
  { name: "Green", value: "#10B981", bgClass: "bg-green-500" },
  { name: "Purple", value: "#8B5CF6", bgClass: "bg-purple-500" },
  { name: "Pink", value: "#EC4899", bgClass: "bg-pink-500" },
  { name: "Orange", value: "#F59E0B", bgClass: "bg-orange-500" },
  { name: "Red", value: "#EF4444", bgClass: "bg-red-500" },
  { name: "Teal", value: "#14B8A6", bgClass: "bg-teal-500" },
  { name: "Indigo", value: "#6366F1", bgClass: "bg-indigo-500" },
  { name: "Yellow", value: "#EAB308", bgClass: "bg-yellow-500" },
  { name: "Gray", value: "#6B7280", bgClass: "bg-gray-500" },
];

const CategoryForm = ({ category, onClose }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const isEditing = !!category;
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: category?.name || "",
    color: category?.color || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleColorSelect = useCallback((colorValue) => {
    setFormData((prev) => ({
      ...prev,
      color: colorValue,
    }));
  }, []);

  const clearColor = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      color: "",
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!formData.name.trim()) {
        toast.error(t("forms.categoryForm.nameRequired"));
        return;
      }

      setIsSubmitting(true);

      try {
        const categoryData = {
          name: formData.name.trim(),
        };

        // Explicitly handle color - set to empty string when removed, or the selected value
        if (formData.color) {
          categoryData.color = formData.color;
        } else {
          // Send empty string instead of null to match backend expectations
          categoryData.color = "";
        }

        if (isEditing) {
          await dispatch(
            updateCategory({
              categoryId: category._id,
              categoryData,
            })
          ).unwrap();
          toast.success(t("forms.categoryForm.categoryUpdated"));
        } else {
          await dispatch(createCategory(categoryData)).unwrap();
          toast.success(t("forms.categoryForm.categoryCreated"));
        }

        dispatch(fetchCategories()); // Refresh categories
        onClose();
      } catch (error) {
        toast.error(
          error.message ||
            t(
              isEditing
                ? "forms.categoryForm.updateFailed"
                : "forms.categoryForm.createFailed"
            )
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, isEditing, category, dispatch, onClose, t]
  );

  return (
    <Modal
      title={
        isEditing
          ? t("forms.categoryForm.editCategory")
          : t("forms.categoryForm.addCategory")
      }
      onClose={onClose}
      size="md"
    >
      <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
        <form onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("forms.categoryForm.categoryName")} *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-800/50 focus:border-primary-800 w-full"
              placeholder={t("forms.categoryForm.enterCategoryName")}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("forms.categoryForm.categoryColor")}
            </label>
            <div className="space-y-3">
              {/* Selected color preview */}
              {formData.color && (
                <div
                  className={`flex items-center gap-2 p-2 bg-gray-50 rounded-md ${
                    isRTL ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full border-2 border-gray-300"
                    style={{ backgroundColor: formData.color }}
                  ></div>
                  <span className="text-sm text-gray-600">
                    {t("forms.categoryForm.selected")}:{" "}
                    {CATEGORY_COLORS.find((c) => c.value === formData.color)
                      ?.name || t("forms.categoryForm.custom")}
                  </span>
                  <button
                    type="button"
                    onClick={clearColor}
                    className={`text-xs text-red-600 hover:text-red-800 ${
                      isRTL ? "mr-auto" : "ml-auto"
                    }`}
                    disabled={isSubmitting}
                  >
                    {t("forms.categoryForm.remove")}
                  </button>
                </div>
              )}

              {/* Color palette */}
              <div className="grid grid-cols-5 gap-2">
                {CATEGORY_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => handleColorSelect(color.value)}
                    className={`w-10 h-10 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                      formData.color === color.value
                        ? "border-gray-800 ring-2 ring-gray-300"
                        : "border-gray-300 hover:border-gray-400"
                    } ${color.bgClass}`}
                    title={color.name}
                    disabled={isSubmitting}
                  />
                ))}
              </div>

              <p className="text-xs text-gray-500">
                {t("forms.categoryForm.colorHelpText")}
              </p>
            </div>
          </div>

          <div
            className={`flex justify-end space-x-3 pt-4 border-t border-gray-200 ${
              isRTL ? "space-x-reverse" : ""
            }`}
          >
            <button
              type="button"
              className="btn-outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name.trim()}
              className="px-4 py-2 rounded-md text-white font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 bg-primary-800 hover:bg-primary-800 focus:ring-primary-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? isEditing
                  ? t("forms.categoryForm.updating")
                  : t("forms.categoryForm.creating")
                : isEditing
                ? t("forms.categoryForm.updateCategory")
                : t("forms.categoryForm.createCategory")}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CategoryForm;
