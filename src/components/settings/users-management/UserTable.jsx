import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FaEdit, FaTrash } from "react-icons/fa";

const UserRow = memo(({ user, onEdit, onDelete }) => {
  const { t } = useTranslation();

  const handleEdit = useCallback(() => {
    onEdit(user);
  }, [user, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete(user);
  }, [user, onDelete]);

  const getInitials = (name) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const hasValidImage =
    user.image && user.image.url && user.image.url.trim() !== "";

  return (
    <tr className="hover:bg-gray-50">
      <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
        <div className="flex items-center">
          <div className="relative h-10 w-10 mr-3">
            {hasValidImage && (
              <img
                src={user.image.url}
                alt={user.name}
                className="h-10 w-10 rounded-full object-cover"
                onError={(e) => {
                  // Hide the image and show initials instead when image fails to load
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
            )}
            <div
              className={`h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center ${
                hasValidImage ? "hidden" : "flex"
              }`}
            >
              <span className="text-primary-800 text-sm font-medium">
                {getInitials(user.name)}
              </span>
            </div>
          </div>
          <span className="font-medium">{user.name}</span>
        </div>
      </td>
      <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
        {user.username}
      </td>
      <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
        <span className="capitalize">{user.role}</span>
      </td>
      <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            user.active
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {user.active ? t("users.active") : t("users.inactive")}
        </span>
      </td>
      <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
        <div className="flex justify-center space-x-2">
          <button
            onClick={handleEdit}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
            title={t("users.editUser")}
          >
            <FaEdit size={16} />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
            title={t("users.deleteUserAction")}
          >
            <FaTrash size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
});

UserRow.displayName = "UserRow";

const EmptyState = memo(({ hasUsers }) => {
  const { t } = useTranslation();

  return (
    <tr>
      <td colSpan="5" className="py-8 text-center text-gray-500">
        {!hasUsers ? t("users.noUsers") : t("users.noUsersMatch")}
      </td>
    </tr>
  );
});

EmptyState.displayName = "EmptyState";

const UserTable = ({ users, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const hasUsers = users && users.length > 0;

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
              {t("users.user")}
            </th>
            <th className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
              {t("users.username")}
            </th>
            <th className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
              {t("users.role")}
            </th>
            <th className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
              {t("common.status")}
            </th>
            <th className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4 text-center">
              {t("common.actions")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {hasUsers ? (
            users.map((user) => (
              <UserRow
                key={user._id}
                user={user}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          ) : (
            <EmptyState hasUsers={hasUsers} />
          )}
        </tbody>
      </table>
    </div>
  );
};

export default memo(UserTable);
