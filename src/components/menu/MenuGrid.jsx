import MenuCard from "./MenuCard";

const MenuGrid = ({ menuItems, addToCart }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 xl:grid-cols-6 gap-3">
      {menuItems.length > 0 ? (
        menuItems.map((item) => (
          <MenuCard key={item._id} item={item} addToCart={addToCart} />
        ))
      ) : (
        <div className="col-span-full text-center py-8">
          <p className="text-neutral-500">
            No items found matching your search criteria.
          </p>
        </div>
      )}
    </div>
  );
};

export default MenuGrid;
