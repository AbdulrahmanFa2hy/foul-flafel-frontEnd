import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { login, clearError, clearSuccessMessage } from "../store/authSlice";
import { ROUTES } from "../utils/constants";

const LoginPage = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState({});

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, successMessage, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  // Redirect if user is already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.MENU);
    }
  }, [isAuthenticated, navigate]);

  // Clear messages on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
      dispatch(clearSuccessMessage());
    };
  }, [dispatch]);

  // Handle success message
  useEffect(() => {
    if (successMessage) {
      // Wait a bit to show the success message before redirecting
      const timer = setTimeout(() => {
        navigate(ROUTES.MENU);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [successMessage, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear specific error when user starts typing
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: "" });
    }
  };

  const validateForm = () => {
    const errors = {};

    // Validate username
    if (!formData.username) {
      errors.username = t("login.usernameRequired");
    }

    // Validate password
    if (!formData.password) {
      errors.password = t("login.passwordRequired");
    }

    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Dispatch login action
    dispatch(login(formData));
  };

  return (
    <div
      className="min-h-screen bg-neutral-50 flex items-center justify-center p-4"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1e62b3] mb-2">
            {t("login.title")}
          </h1>
          <p className="text-neutral-600">{t("login.subtitle")}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              className="block text-sm font-medium text-neutral-700 mb-1"
              htmlFor="username"
            >
              {t("login.username")}
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              className={`w-full p-3 border ${
                formErrors.username ? "border-red-500" : "border-neutral-300"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e62b3]`}
              placeholder={t("login.enterUsername")}
            />
            {formErrors.username && (
              <p className="mt-1 text-sm text-red-500">{formErrors.username}</p>
            )}
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <label
                className="block text-sm font-medium text-neutral-700"
                htmlFor="password"
              >
                {t("login.password")}
              </label>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full p-3 border ${
                formErrors.password ? "border-red-500" : "border-neutral-300"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e62b3]`}
              placeholder={t("login.enterPassword")}
            />
            {formErrors.password && (
              <p className="mt-1 text-sm text-red-500">{formErrors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1e62b3] text-white p-3 rounded-lg font-medium transition-colors hover:bg-[#174d8f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e62b3] disabled:opacity-70"
          >
            {loading ? t("login.signingIn") : t("login.signIn")}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-neutral-600">{t("login.contactManager")}</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
