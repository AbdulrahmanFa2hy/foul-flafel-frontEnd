import { useTranslation } from "react-i18next";
import SearchInput from "../common/SearchInput";
import CategoryTabs from "../common/CategoryTabs";

// Utility function to get category title
const getCategoryTitle = (activeCategory, categories, t) => {
  if (!categories || !activeCategory) return t("menu.title");

  const category = categories.find((cat) => cat._id === activeCategory);
  return category
    ? category.name.charAt(0).toUpperCase() + category.name.slice(1)
    : t("menu.title");
};

const MenuHeader = ({
  categories,
  activeCategory,
  setActiveCategory,
  searchQuery,
  setSearchQuery,
}) => {
  const { t } = useTranslation();

  return (
    <div className="pl-1">
      {/* Categories */}
      {categories && categories.length > 0 && (
        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />
      )}
      {/* Header and Search */}
      <div className="flex justify-between items-center pe-1">
        <h2 className="hidden sm:block sm:text-2xl font-bold mb-3 w-1/2">
          {getCategoryTitle(activeCategory, categories, t)}
        </h2>
        <SearchInput value={searchQuery} onChange={setSearchQuery} />
      </div>
    </div>
  );
};

export default MenuHeader;
