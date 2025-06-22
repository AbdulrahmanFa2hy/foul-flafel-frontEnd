import { useTranslation } from "react-i18next";
import Modal from "./Modal";

const DeleteConfirmation = ({
  title,
  message,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const { t } = useTranslation();

  return (
    <Modal title={title} onClose={onCancel} size="md">
      <div className="space-y-4">
        <p className="text-gray-600 text-start">{message}</p>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            className="btn-outline"
            onClick={onCancel}
            disabled={loading}
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-md text-white font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 bg-red-600 hover:bg-red-700 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? t("common.deleting") : t("common.delete")}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmation;
