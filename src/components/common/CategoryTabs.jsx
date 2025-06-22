import React, { useMemo, useCallback } from "react";

const CategoryTabs = React.memo(
  ({ categories, activeCategory, setActiveCategory }) => {
    // Memoized category selection handler
    const handleCategoryClick = useCallback(
      (categoryId) => {
        setActiveCategory(categoryId);
      },
      [setActiveCategory]
    );

    // Function to get modern styling for categories
    const getCategoryStyles = useCallback((category, isActive) => {
      const hasColor = category.color && category.color.trim() !== "";

      if (!hasColor) {
        // Modern styling for categories without colors - blue-gray backgrounds like "All Meals"
        return {
          className: `px-0 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-xl font-medium hover:shadow-lg ${
            isActive ? "shadow-md text-gray-800" : "text-gray-700 hover:shadow"
          }`,
          style: {
            // Use blue-gray backgrounds similar to "All Meals" styling
            backgroundColor: isActive ? "#e0e7ff" : "#f1f5f9", // Light blue-gray
            outline: `2px solid ${isActive ? "#c7d2fe" : "#e2e8f0"}`,
          },
        };
      }

      // Modern styling with subtle colors for categories with colors
      if (isActive) {
        return {
          className:
            "px-0 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-xl font-medium  shadow-lg text-gray-800",
          style: {
            backgroundColor: `${category.color}35`,
            outlineColor: category.color,
            ringColor: `${category.color}50`,
            outline: `2px solid ${category.color}`,
          },
        };
      } else {
        return {
          className:
            "px-0 sm:px-6 py-2 sm:py-3 rounded-xl font-medium text-sm sm:text-base  hover:shadow-md text-gray-700 outline",
          style: {
            backgroundColor: `${category.color}18`,
            outlineColor: `${category.color}30`,
          },
        };
      }
    }, []);

    // Memoized rendered categories
    const renderedCategories = useMemo(() => {
      if (!categories || categories.length === 0) return null;

      return categories.map((category) => {
        const isActive = activeCategory === category._id;
        const styles = getCategoryStyles(category, isActive);

        return (
          <button
            key={category._id}
            className={`w-full lg:w-auto ${styles.className}`}
            style={styles.style}
            onClick={() => handleCategoryClick(category._id)}
          >
            <span className="font-semibold capitalize tracking-wide">
              {category.name}
            </span>
          </button>
        );
      });
    }, [categories, activeCategory, handleCategoryClick, getCategoryStyles]);

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:flex lg:flex-wrap gap-2 mb-5">
        {renderedCategories}
      </div>
    );
  }
);

CategoryTabs.displayName = "CategoryTabs";

export default CategoryTabs;
