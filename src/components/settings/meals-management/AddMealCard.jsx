import { FaPlus } from "react-icons/fa";
import { useTranslation } from "react-i18next";

const AddMealCard = ({ onClick }) => {
  const { t } = useTranslation();

  return (
    <div className="cursor-pointer" onClick={onClick}>
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg shadow-sm hover:shadow-md hover:border-primary-300 active:scale-95 transition-all duration-75 h-full flex items-center justify-center min-h-[120px]">
        <div className="text-center p-4">
          <FaPlus className="mx-auto text-gray-400 mb-2" size={20} />
          <p className="text-sm font-medium text-gray-600">
            {t("addMeal.addMeal")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddMealCard;
