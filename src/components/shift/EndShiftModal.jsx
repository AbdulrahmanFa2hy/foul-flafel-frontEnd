import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { FaCheck, FaExclamationTriangle } from "react-icons/fa";
import Modal from "../common/Modal";
import { endShift } from "../../store/shiftSlice";

function EndShiftModal({ onClose }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { loading, error, currentShift } = useSelector((state) => state.shift);

  const [endBalance, setEndBalance] = useState("");
  const [formError, setFormError] = useState("");

  if (!currentShift) {
    return null;
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Validation
    if (!endBalance || endBalance < 0) {
      setFormError(t("endShift.balanceError"));
      return;
    }

    try {
      await dispatch(endShift({ endBalance: Number(endBalance) })).unwrap();

      // Close modal immediately after successful shift end
      onClose();
    } catch (error) {
      console.error("Error ending shift:", error);
    }
  };

  const handleChange = (e) => {
    setEndBalance(e.target.value);
    if (formError) {
      setFormError("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Modal title={t("endShift.title")} onClose={onClose} size="lg">
      <div className="p-2 sm:p-4">
        <div className="space-y-6">
          {/* Cash Input */}
          <div className="space-y-4">
            {(error || formError) && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm flex items-center gap-2">
                <FaExclamationTriangle />
                {error || formError}
              </div>
            )}

            <div>
              <input
                type="number"
                value={endBalance}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                className={`w-full px-4 py-4 text-2xl font-bold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center ${
                  formError ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
                autoFocus
              />
              {formError && (
                <p className="text-red-500 text-xs mt-1">{formError}</p>
              )}
              <p className="text-xs text-gray-500 mt-1 text-center">
                {t("endShift.instruction")}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              className="px-6 py-3 rounded-lg text-gray-700 font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
              onClick={onClose}
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-3 rounded-lg text-white font-medium bg-red-600 hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <FaCheck />
              {loading ? t("endShift.ending") : t("endShift.endShift")}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default EndShiftModal;
