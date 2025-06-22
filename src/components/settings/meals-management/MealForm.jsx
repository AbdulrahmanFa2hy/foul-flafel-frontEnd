import { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { FaImage, FaPlus, FaTimes } from "react-icons/fa";
import Modal from "../../common/Modal";
import { createMeal, updateMeal, fetchMeals } from "../../../store/mealSlice";
import { fetchCategories } from "../../../store/categorySlice";
import { fetchStocks } from "../../../store/stockSlice";
import { getCategoryId, getStockItemId } from "./utils";
import toast from "react-hot-toast";

const MealForm = ({ meal, preSelectedCategoryId, onClose }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const isEditing = !!meal;
  const dispatch = useDispatch();

  // Redux state
  const { createLoading, updateLoading, error } = useSelector(
    (state) => state.meals
  );
  const { categories } = useSelector((state) => state.categories);
  const { stocks } = useSelector((state) => state.stock);

  // Initialize ingredients with proper default values
  const initializeIngredients = (ingredients) => {
    if (!ingredients || ingredients.length === 0) {
      return [
        {
          stockItemId: "",
          quantityUsed: 1,
          unit: "pcs",
          stockName: "",
        },
      ];
    }

    return ingredients.map((ing) => ({
      // Handle both populated and unpopulated stockItemId formats
      stockItemId: getStockItemId(ing.stockItemId) || "",
      quantityUsed: ing.quantityUsed || 1,
      unit: ing.unit || "pcs",
      stockName:
        ing.stockName ||
        (typeof ing.stockItemId === "object"
          ? ing.stockItemId.nameOfItem || ing.stockItemId.name || ""
          : ""),
    }));
  };

  const [formData, setFormData] = useState({
    name: meal?.name || "",
    // Handle both populated and unpopulated categoryId formats
    categoryId: getCategoryId(meal?.categoryId) || preSelectedCategoryId || "",
    price: meal?.price || "",
    isAvailable: meal?.isAvailable !== undefined ? meal?.isAvailable : true,
    image: null,
    ingredients: initializeIngredients(meal?.ingredients),
  });

  const [imagePreview, setImagePreview] = useState(meal?.image?.url || null);
  const [errors, setErrors] = useState({});

  // Fetch required data
  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchStocks());
  }, [dispatch]);

  const isLoading = useMemo(() => {
    return createLoading || updateLoading;
  }, [createLoading, updateLoading]);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Meal name is required";
    }

    if (!formData.categoryId) {
      newErrors.categoryId = "Category is required";
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = "Price must be greater than 0";
    }

    if (!isEditing && !formData.image) {
      newErrors.image = "Image is required for new meals";
    }

    // Validate ingredients
    const validIngredients = formData.ingredients.filter(
      (ing) => ing.stockItemId && ing.quantityUsed > 0
    );
    if (validIngredients.length === 0) {
      newErrors.ingredients = "At least one ingredient is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, isEditing]);

  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]:
          type === "checkbox"
            ? checked
            : type === "number"
            ? value === ""
              ? ""
              : Number(value)
            : value,
      }));

      // Clear error when user starts typing
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: null }));
      }
    },
    [errors]
  );

  const handleImageChange = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (file) {
        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
          toast.error("Image size must be less than 2MB");
          return;
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast.error("Please select a valid image file");
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
          setFormData((prev) => ({
            ...prev,
            image: file,
          }));
        };
        reader.readAsDataURL(file);

        // Clear image error
        if (errors.image) {
          setErrors((prev) => ({ ...prev, image: null }));
        }
      }
    },
    [errors.image]
  );

  const handleIngredientChange = useCallback(
    (index, field, value) => {
      const updatedIngredients = [...formData.ingredients];
      updatedIngredients[index] = {
        ...updatedIngredients[index],
        [field]: field === "quantityUsed" ? Number(value) || 0 : value,
      };

      // If stockItemId changes, update stockName
      if (field === "stockItemId") {
        const selectedStock = stocks?.find((stock) => stock._id === value);
        if (selectedStock) {
          updatedIngredients[index].stockName =
            selectedStock.nameOfItem || selectedStock.name || "";
        }
      }

      setFormData((prev) => ({ ...prev, ingredients: updatedIngredients }));

      // Clear ingredients error
      if (errors.ingredients) {
        setErrors((prev) => ({ ...prev, ingredients: null }));
      }
    },
    [formData.ingredients, errors.ingredients, stocks]
  );

  const addIngredient = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          stockItemId: "",
          quantityUsed: 1,
          unit: "pcs",
          stockName: "",
        },
      ],
    }));
  }, []);

  const removeIngredient = useCallback(
    (index) => {
      if (formData.ingredients.length > 1) {
        const updatedIngredients = formData.ingredients.filter(
          (_, i) => i !== index
        );
        setFormData((prev) => ({ ...prev, ingredients: updatedIngredients }));
      }
    },
    [formData.ingredients.length]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      try {
        // Prepare form data for multipart submission
        const submitData = new FormData();
        submitData.append("name", formData.name);
        submitData.append("categoryId", formData.categoryId);
        submitData.append("price", formData.price);
        submitData.append("isAvailable", formData.isAvailable);

        // Add image only if it's a new file
        if (formData.image) {
          submitData.append("image", formData.image);
        }

        // Filter and add valid ingredients
        const validIngredients = formData.ingredients.filter(
          (ing) => ing.stockItemId && ing.quantityUsed > 0
        );

        validIngredients.forEach((ingredient, index) => {
          submitData.append(
            `ingredients[${index}][stockItemId]`,
            ingredient.stockItemId
          );
          submitData.append(
            `ingredients[${index}][quantityUsed]`,
            ingredient.quantityUsed
          );
          submitData.append(`ingredients[${index}][unit]`, ingredient.unit);
          submitData.append(
            `ingredients[${index}][stockName]`,
            ingredient.stockName || ""
          );
        });

        if (isEditing) {
          await dispatch(
            updateMeal({ mealId: meal._id, mealData: submitData })
          ).unwrap();
          toast.success("Meal updated successfully!");
        } else {
          await dispatch(createMeal(submitData)).unwrap();
          toast.success("Meal created successfully!");
        }

        // Refresh meals data
        dispatch(fetchMeals());
        onClose();
      } catch (error) {
        toast.error(
          error.message || `Failed to ${isEditing ? "update" : "create"} meal`
        );
      }
    },
    [validateForm, formData, isEditing, meal, dispatch, onClose]
  );

  return (
    <Modal
      title={
        isEditing ? t("forms.mealForm.editMeal") : t("forms.mealForm.addMeal")
      }
      onClose={onClose}
      size="lg"
    >
      <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Meal Image Section */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div
                className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary-500 transition-colors group"
                onClick={() => document.getElementById("imageInput").click()}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt={t("forms.mealForm.mealImage")}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-center">
                    <FaImage className="mx-auto text-gray-400 text-2xl mb-2 group-hover:text-primary-500 transition-colors" />
                    <p className="text-sm text-gray-500 group-hover:text-primary-500 transition-colors">
                      {t("forms.mealForm.uploadImage")}
                    </p>
                  </div>
                )}
              </div>
              <input
                id="imageInput"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Meal Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("forms.mealForm.mealName")} *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-800/50 focus:border-primary-800 w-full ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder={t("forms.mealForm.enterMealName")}
                required
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("forms.mealForm.price")} *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-800/50 focus:border-primary-800 w-full ${
                  errors.price ? "border-red-500" : "border-gray-300"
                }`}
                placeholder={t("forms.mealForm.enterPrice")}
                min="0"
                step="0.01"
                required
              />
              {errors.price && (
                <p className="text-red-500 text-xs mt-1">{errors.price}</p>
              )}
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("forms.mealForm.category")} *
            </label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-800/50 focus:border-primary-800 w-full ${
                errors.categoryId ? "border-red-500" : "border-gray-300"
              }`}
              required
            >
              <option value="">{t("forms.mealForm.selectCategory")}</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>
            )}
          </div>

          {/* Availability */}
          <div>
            <div className="flex items-center mt-2 gap-1">
              <input
                type="checkbox"
                name="isAvailable"
                checked={formData.isAvailable}
                onChange={handleChange}
                className="h-4 w-4 text-primary rounded focus:ring-primary-800 "
              />
              <span className="ml-2 text-gray-700">
                {t("forms.mealForm.mealAvailable")}
              </span>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("forms.mealForm.ingredients")} *
            </label>
            {errors.ingredients && (
              <p className="text-red-500 text-xs mb-2">{errors.ingredients}</p>
            )}
            <div className="space-y-2">
              {formData.ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <select
                    value={ingredient.stockItemId}
                    onChange={(e) =>
                      handleIngredientChange(
                        index,
                        "stockItemId",
                        e.target.value
                      )
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-800/50 focus:border-primary-800"
                  >
                    <option value="">{t("forms.mealForm.selectStock")}</option>
                    {stocks &&
                      stocks.map((stock) => (
                        <option key={stock._id} value={stock._id}>
                          {stock.name} ({stock.unit})
                        </option>
                      ))}
                  </select>
                  <input
                    type="number"
                    value={ingredient.quantityUsed}
                    onChange={(e) =>
                      handleIngredientChange(
                        index,
                        "quantityUsed",
                        e.target.value
                      )
                    }
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-800/50 focus:border-primary-800"
                    placeholder={t("forms.mealForm.qty")}
                    min="0.01"
                    step="0.01"
                  />
                  <select
                    value={ingredient.unit}
                    onChange={(e) =>
                      handleIngredientChange(index, "unit", e.target.value)
                    }
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-800/50 focus:border-primary-800"
                  >
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                    <option value="grams">g</option>
                    <option value="liters">L</option>
                    <option value="ml">ml</option>
                    <option value="cups">cups</option>
                    <option value="tsp">tsp</option>
                    <option value="tbsp">tbsp</option>
                  </select>
                  {formData.ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="p-2 text-red-500 hover:text-red-700"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addIngredient}
              className="mt-2 flex items-center text-primary-800 hover:text-primary-900"
            >
              <FaPlus className="mr-1" /> {t("forms.mealForm.addIngredient")}
            </button>
          </div>

          {/* Form actions */}
          <div
            className={`flex justify-end space-x-3 pt-4 border-t border-gray-200 ${
              isRTL ? "space-x-reverse" : ""
            }`}
          >
            <button
              type="button"
              className="btn-outline"
              onClick={onClose}
              disabled={isLoading}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-md text-white font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 bg-primary-800 hover:bg-primary-800 focus:ring-primary-800/50 disabled:opacity-50"
            >
              {isLoading
                ? t("forms.mealForm.saving")
                : isEditing
                ? t("forms.mealForm.updateMeal")
                : t("forms.mealForm.createMeal")}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default MealForm;
