import { memo } from "react";
import { useTranslation } from "react-i18next";
import {
  FaUsers,
  FaUserCheck,
  FaUserTimes,
  FaCrown,
  FaCashRegister,
} from "react-icons/fa";

const StatCard = memo(
  ({ icon: Icon, label, value, color = "text-gray-600" }) => (
    <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center space-x-3">
      <div
        className={`p-2 rounded-lg ${
          color === "text-green-600"
            ? "bg-green-100"
            : color === "text-red-600"
            ? "bg-red-100"
            : color === "text-blue-600"
            ? "bg-blue-100"
            : color === "text-purple-600"
            ? "bg-purple-100"
            : "bg-gray-100"
        }`}
      >
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-lg font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  )
);

StatCard.displayName = "StatCard";

const UserStats = ({ stats }) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      <StatCard
        icon={FaUsers}
        label={t("users.totalUsers")}
        value={stats.total}
        color="text-gray-600"
      />
      <StatCard
        icon={FaUserCheck}
        label={t("users.active")}
        value={stats.active}
        color="text-green-600"
      />
      <StatCard
        icon={FaUserTimes}
        label={t("users.inactive")}
        value={stats.inactive}
        color="text-red-600"
      />
      <StatCard
        icon={FaCrown}
        label={t("users.managers")}
        value={stats.managers}
        color="text-purple-600"
      />
      <StatCard
        icon={FaCashRegister}
        label={t("users.cashiers")}
        value={stats.cashiers}
        color="text-blue-600"
      />
    </div>
  );
};

export default memo(UserStats);
