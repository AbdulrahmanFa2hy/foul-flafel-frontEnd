import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FaSearch } from "react-icons/fa";

const UserFilters = ({
  searchTerm,
  roleFilter,
  statusFilter,
  onSearchChange,
  onRoleFilterChange,
  onStatusFilterChange,
}) => {
  const { t } = useTranslation();
  const handleSearchChange = useCallback(
    (e) => {
      onSearchChange(e.target.value);
    },
    [onSearchChange]
  );

  const handleRoleChange = useCallback(
    (e) => {
      onRoleFilterChange(e.target.value);
    },
    [onRoleFilterChange]
  );

  const handleStatusChange = useCallback(
    (e) => {
      onStatusFilterChange(e.target.value);
    },
    [onStatusFilterChange]
  );

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-grow">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder={t("users.searchUsers")}
          value={searchTerm}
          onChange={handleSearchChange}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-800/50 focus:border-primary-800 pl-10 w-full"
        />
      </div>

      <select
        value={roleFilter}
        onChange={handleRoleChange}
        className="px-3 py-2 border border-gray-300 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-800/50 focus:border-primary-800 sm:w-40"
      >
        <option value="">{t("users.allRoles")}</option>
        <option value="manager">{t("users.manager")}</option>
        <option value="cashier">{t("users.cashier")}</option>
      </select>

      <select
        value={statusFilter}
        onChange={handleStatusChange}
        className="px-3 py-2 border border-gray-300 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-800/50 focus:border-primary-800 sm:w-40"
      >
        <option value="">{t("users.allStatus")}</option>
        <option value="active">{t("users.active")}</option>
        <option value="inactive">{t("users.inactive")}</option>
      </select>
    </div>
  );
};

export default memo(UserFilters);
