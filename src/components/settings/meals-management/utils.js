// Utility functions for meal management components

/**
 * Extracts category name from both populated and unpopulated categoryId formats
 * @param {string|object} categoryId - The categoryId (can be string ID or populated object)
 * @param {Array} categories - Array of category objects for lookup
 * @returns {string} - The category name
 */
export const getCategoryName = (categoryId, categories = []) => {
  if (!categoryId) return "Unknown";

  // Handle populated categoryId format (from GET /meals)
  if (typeof categoryId === "object" && categoryId.name) {
    return categoryId.name;
  }

  // Handle unpopulated categoryId format (from GET /meals/:id or PUT /meals/:id)
  if (typeof categoryId === "string" && categories.length > 0) {
    const category = categories.find((cat) => cat._id === categoryId);
    return category ? category.name : "Unknown";
  }

  return "Unknown";
};

/**
 * Extracts stock item name from both populated and unpopulated stockItemId formats
 * @param {Object} ingredient - The complete ingredient object
 * @param {Array} stocks - Array of stock objects for lookup
 * @returns {string} - The stock item name
 */
export const getStockItemName = (ingredient, stocks = []) => {
  if (!ingredient) return "Unknown ingredient";

  // First check if stockName is directly available in the ingredient
  if (ingredient.stockName) {
    return ingredient.stockName;
  }

  const { stockItemId } = ingredient;
  if (!stockItemId) return "Unknown ingredient";

  // Handle populated stockItemId format (from GET /meals or CREATE meal)
  if (typeof stockItemId === "object" && stockItemId.name) {
    return stockItemId.nameOfItem || stockItemId.name;
  }

  // Handle unpopulated stockItemId format (from GET /meals/:id or PUT /meals/:id)
  if (typeof stockItemId === "string" && stocks.length > 0) {
    const stock = stocks.find((s) => s._id === stockItemId);
    return stock ? stock.nameOfItem || stock.name : "Unknown ingredient";
  }

  return "Unknown ingredient";
};

/**
 * Extracts category ID from both populated and unpopulated categoryId formats
 * @param {string|object} categoryId - The categoryId (can be string ID or populated object)
 * @returns {string} - The category ID
 */
export const getCategoryId = (categoryId) => {
  if (!categoryId) return null;

  // Handle populated categoryId format
  if (typeof categoryId === "object" && categoryId._id) {
    return categoryId._id;
  }

  // Handle unpopulated categoryId format
  if (typeof categoryId === "string") {
    return categoryId;
  }

  return null;
};

/**
 * Extracts stock item ID from both populated and unpopulated stockItemId formats
 * @param {string|object} stockItemId - The stockItemId (can be string ID or populated object)
 * @returns {string} - The stock item ID
 */
export const getStockItemId = (stockItemId) => {
  if (!stockItemId) return null;

  // Handle populated stockItemId format
  if (typeof stockItemId === "object" && stockItemId._id) {
    return stockItemId._id;
  }

  // Handle unpopulated stockItemId format
  if (typeof stockItemId === "string") {
    return stockItemId;
  }

  return null;
};
