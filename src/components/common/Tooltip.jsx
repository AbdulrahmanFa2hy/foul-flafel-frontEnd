const Tooltip = ({ children }) => {
  return (
    <span className="absolute left-full ml-2 bg-gray-800 text-white text-sm py-1 px-2 rounded opacity-0 invisible lg:group-hover:opacity-100 lg:group-hover:visible transition-all duration-200 whitespace-nowrap">
      {children}
    </span>
  );
};

export default Tooltip;
