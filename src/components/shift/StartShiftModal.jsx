import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import Modal from "../common/Modal";
import { startShift, clearShiftError } from "../../store/shiftSlice";
import { logout } from "../../store/authSlice";

function StartShiftModal({ onClose }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const dispatch = useDispatch();
  const { loading, error, hasActiveShift } = useSelector(
    (state) => state.shift
  );

  const [startBalance, setStartBalance] = useState("");
  const [formError, setFormError] = useState("");

  // Clear any existing errors when component mounts
  useEffect(() => {
    dispatch(clearShiftError());
  }, [dispatch]);

  // Close modal when shift is successfully started
  useEffect(() => {
    if (hasActiveShift) {
      onClose();
    }
  }, [hasActiveShift, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!startBalance || startBalance <= 0) {
      setFormError(t("startShift.balanceError"));
      return;
    }

    try {
      await dispatch(
        startShift({ startBalance: Number(startBalance) })
      ).unwrap();
      // Modal will close automatically via useEffect when hasActiveShift becomes true
    } catch (error) {
      console.error("Error starting shift:", error);

      // Handle authorization errors specifically
      if (error?.statusCode === 401 || error?.status === "fail") {
        if (error.message?.includes("Unauthorized")) {
          setFormError(
            "You don't have permission to start shifts. Please contact your administrator."
          );
        } else {
          setFormError(
            error.message || "Failed to start shift. Please try again."
          );
        }
      } else {
        setFormError(
          "Failed to start shift. Please check your connection and try again."
        );
      }
    }
  };

  const handleChange = (e) => {
    setStartBalance(e.target.value);
    if (formError) {
      setFormError("");
    }
    // Clear any Redux errors when user starts typing
    if (error) {
      dispatch(clearShiftError());
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <Modal title={t("startShift.title")} onClose={null} showCloseButton={false}>
      <div className="p-6" dir={isRTL ? "rtl" : "ltr"}>
        <div className="text-center mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("startShift.welcome")}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error display */}
          {formError && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
              {formError}
            </div>
          )}
          {/* Start Balance Input */}
          <div>
            <input
              type="number"
              value={startBalance}
              onChange={handleChange}
              className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-800/50 focus:border-primary-800 w-full ${
                formError ? "border-red-500" : "border-gray-300"
              }`}
              placeholder={t("startShift.enterBalance")}
              min="0"
              step="1"
              required
              disabled={loading}
            />
            {formError && (
              <p className="text-red-500 text-xs mt-1">{formError}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {t("startShift.balanceInstruction")}
            </p>
          </div>
          {/* Submit Button */}
          <div className="pt-4 space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 rounded-md text-white font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 bg-primary-800 hover:bg-primary-900 focus:ring-primary-800/50 disabled:opacity-50"
            >
              {loading ? t("startShift.starting") : t("startShift.startShift")}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full px-4 py-2 rounded-md text-gray-700 font-medium border border-gray-300 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
            >
              {t("sidebar.logout")}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export default StartShiftModal;
