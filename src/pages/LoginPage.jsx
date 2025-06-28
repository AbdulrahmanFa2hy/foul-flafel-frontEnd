import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, User, Lock } from "lucide-react";
import { login, clearError, clearSuccessMessage } from "../store/authSlice";
import { ROUTES } from "../utils/constants";
import infoImg from "../assets/card-payment-53.png";

const LoginPage = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen bg-gray-50 flex" dir={isRTL ? "rtl" : "ltr"}>
      {/* Left Panel - System Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-1000 via-primary-900 to-primary-1000 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 w-full flex flex-col justify-start  text-white ">
          <div className="w-80 h-80 2xl:w-96 2xl:h-96 mx-auto mb-4">
            <img
              src={infoImg}
              alt="Card Payment"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-3xl xl:text-4xl font-bold mb-4 text-center px-4">
            {t("login.companyName")} - {t("login.systemTitle")}
          </h1>
          <p className="text-xl text-center opacity-90 mb-6 xl:mb-8">
            {t("login.systemSubtitle")}
          </p>
          <div className="grid grid-cols-1 gap-3 text-sm opacity-80 px-6">
            <div className="flex items-start">
              <div
                className={`w-2 h-2 bg-white rounded-full ${
                  isRTL ? "ml-3 mt-2" : "mr-3 mt-2"
                }`}
              ></div>
              <div>{t("login.feature1")}</div>
            </div>
            <div className="flex items-start">
              <div
                className={`w-2 h-2 bg-white rounded-full ${
                  isRTL ? "ml-3 mt-2" : "mr-3 mt-2"
                }`}
              ></div>
              <div>{t("login.feature2")}</div>
            </div>
            <div className="flex items-start">
              <div
                className={`w-2 h-2 bg-white rounded-full ${
                  isRTL ? "ml-3 mt-2" : "mr-3 mt-2"
                }`}
              ></div>
              <div>{t("login.feature3")}</div>
            </div>
            <div className="flex items-start">
              <div
                className={`w-2 h-2 bg-white rounded-full ${
                  isRTL ? "ml-3 mt-2" : "mr-3 mt-2"
                }`}
              ></div>
              <div>{t("login.feature4")}</div>
            </div>
            <div className="flex items-start">
              <div
                className={`w-2 h-2 bg-white rounded-full ${
                  isRTL ? "ml-3 mt-2" : "mr-3 mt-2"
                }`}
              ></div>
              <div>{t("login.feature5")}</div>
            </div>
          </div>
        </div>

        {/* Geometric patterns */}
        <div className="absolute top-0 right-0 w-64 h-64 border border-white/20 rounded-full transform translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 border border-white/20 rounded-full transform -translate-x-24 translate-y-24"></div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-3 sm:p-4 pb-0">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-4">
            <img
              src="/transparent-color2.png"
              alt="Company Logo"
              className="w-36 object-cover mx-auto mb-4"
            />
            <h2 className="text-2xl lg:hidden font-bold text-primary-1000 mb-2">
              {t("login.companyName")}
            </h2>
          </div>
          {/* Login Form */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 py-6 md:p-8">
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

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div>
                <label
                  className={`block text-primary-1000 font-medium mb-2 ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  {t("login.username")}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder={t("login.enterUsername")}
                    className={`w-full px-4 py-3 ${
                      isRTL ? "pr-12 text-right" : "pl-12 text-left"
                    } bg-gray-50 border ${
                      formErrors.username ? "border-red-500" : "border-gray-300"
                    } rounded-md focus:ring-2 focus:ring-primary-900 focus:border-transparent transition-all duration-20 outline-none text-gray-900`}
                    required
                  />
                  <User
                    className={`absolute ${
                      isRTL ? "right-4" : "left-4"
                    } top-1/2 transform -translate-y-1/2 text-gray-400`}
                    size={18}
                  />
                </div>
                {formErrors.username && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.username}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label
                  className={`block text-primary-1000 font-medium mb-2 ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  {t("login.password")}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={t("login.enterPassword")}
                    className={`w-full px-4 py-3 ${
                      isRTL ? "pr-12 pl-12 text-right" : "pl-12 pr-12 text-left"
                    } bg-gray-50 border ${
                      formErrors.password ? "border-red-500" : "border-gray-300"
                    } rounded-md focus:ring-2 focus:ring-primary-900 focus:border-transparent transition-all duration-20 outline-none text-gray-900`}
                    required
                  />
                  <Lock
                    className={`absolute ${
                      isRTL ? "right-4" : "left-4"
                    } top-1/2 transform -translate-y-1/2 text-gray-400`}
                    size={18}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute ${
                      isRTL ? "left-4" : "right-4"
                    } top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors`}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.password}
                  </p>
                )}
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-tl from-primary-900 via-primary-800  to-primary-1000 text-white py-3 px-4 rounded-md font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div
                      className={`w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin ${
                        isRTL ? "ml-2" : "mr-2"
                      }`}
                    ></div>
                    {t("login.signingIn")}
                  </>
                ) : (
                  t("login.signIn")
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-3 pt-3 text-center text-sm text-gray-600">
              {t("login.contactManager")}
            </div>
          </div>

          {/* System Info */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>{t("login.version")}</p>
            <p className="mt-1">{t("login.copyright")}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
