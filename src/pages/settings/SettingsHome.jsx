import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaUsers,
  FaBoxes,
  FaUtensils,
  FaClock,
  FaPrint,
  FaTable,
} from "react-icons/fa";

function SettingsHome() {
  const { t } = useTranslation();

  const settingCategories = [
    {
      id: "users",
      title: t("settings.usersManagement"),
      description: t("settings.usersManagementDesc"),
      icon: <FaUsers size={28} className="text-primary-800" />,
      path: "/settings/users",
    },
    {
      id: "stock",
      title: t("settings.stockManagement"),
      description: t("settings.stockManagementDesc"),
      icon: <FaBoxes size={28} className="text-[#09AE94]" />,
      path: "/settings/stock",
    },
    {
      id: "meals",
      title: t("settings.mealsManagement"),
      description: t("settings.mealsManagementDesc"),
      icon: <FaUtensils size={28} className="text-[#EEAA42]" />,
      path: "/settings/meals",
    },
    {
      id: "shifts",
      title: t("settings.shiftsManagement"),
      description: t("settings.shiftsManagementDesc"),
      icon: <FaClock size={28} className="text-[#8B5CF6]" />,
      path: "/settings/shifts",
    },
    {
      id: "printers",
      title: t("settings.printerManagement"),
      description: t("settings.printerManagementDesc"),
      icon: <FaPrint size={28} className="text-[#F97316]" />,
      path: "/settings/printers",
    },
    {
      id: "tables",
      title: t("settings.tablesManagement"),
      description: t("settings.tablesManagementDesc"),
      icon: <FaTable size={28} className="text-[#6366F1]" />,
      path: "/settings/tables",
    },
  ];

  return (
    <div className="animate-fade-in p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {t("settings.title")}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingCategories.map((category) => (
          <Link
            key={category.id}
            to={category.path}
            className="bg-white rounded-lg shadow-md p-6 animate-fade-in hover:shadow-lg transition-all group"
          >
            <div className="flex items-start">
              <div className="p-3 rounded-lg bg-gray-100 mr-4 group-hover:bg-primary-800/10 transition-colors">
                {category.icon}
              </div>
              <div>
                <h2 className="font-semibold text-lg text-gray-800 group-hover:text-primary-800">
                  {category.title}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {category.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default SettingsHome;
