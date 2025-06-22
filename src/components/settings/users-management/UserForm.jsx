import { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { FaUser, FaLock, FaImage } from "react-icons/fa";
import Modal from "../../common/Modal";
import { createUser, updateUser, clearError } from "../../../store/userSlice";
import { updateCurrentUser } from "../../../store/authSlice";
import toast from "react-hot-toast";

const UserForm = ({ user, onClose }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const isEditing = !!user;
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.users);
  const { user: currentUser } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    username: user?.username || "",
    password: "",
    confirmPassword: "",
    role: user?.role || "cashier",
    active: user?.active !== undefined ? user.active : true,
    image: null,
  });

  const [imagePreview, setImagePreview] = useState(user?.image?.url || null);
  const [formErrors, setFormErrors] = useState({});

  // Helper function to get user initials
  const getInitials = useCallback((name) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  }, []);

  // Clear messages when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear specific error when user starts typing
    setFormErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  }, []);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors((prev) => ({
          ...prev,
          image: t("forms.userForm.imageSize"),
        }));
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setFormErrors((prev) => ({
          ...prev,
          image: t("forms.userForm.imageType"),
        }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData((prev) => ({
          ...prev,
          image: file,
        }));
        // Clear image error if any
        setFormErrors((prev) => ({
          ...prev,
          image: "",
        }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const validateForm = useCallback(() => {
    const errors = {};

    // Validate name
    if (!formData.name.trim()) {
      errors.name = t("forms.userForm.nameRequired");
    }

    // Validate username
    if (!formData.username.trim()) {
      errors.username = t("forms.userForm.usernameRequired");
    } else if (formData.username.length < 3) {
      errors.username = t("forms.userForm.usernameMinLength");
    }

    // Validate password (only for new users)
    if (!isEditing) {
      if (!formData.password) {
        errors.password = t("forms.userForm.passwordRequired");
      } else if (formData.password.length < 6) {
        errors.password = t("forms.userForm.passwordMinLength");
      }

      // Validate password confirmation
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = t("forms.userForm.passwordsDoNotMatch");
      }
    }

    return errors;
  }, [formData, isEditing]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      // Validate form
      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      try {
        // Prepare data for API
        const userData = {
          name: formData.name,
          username: formData.username,
          role: formData.role,
          active: formData.active,
        };

        // Add password for new users
        if (!isEditing && formData.password) {
          userData.password = formData.password;
        }

        // Add image if selected
        if (formData.image) {
          userData.image = formData.image;
        }

        // Dispatch appropriate action
        let updatedUserData;
        if (isEditing) {
          const result = await dispatch(
            updateUser({ userId: user._id, userData })
          ).unwrap();
          updatedUserData = result.data;
          toast.success(t("users.userUpdated"));

          // If the updated user is the current logged-in user, update the auth state
          if (currentUser && user._id === currentUser._id) {
            dispatch(updateCurrentUser(updatedUserData));
          }
        } else {
          await dispatch(createUser(userData)).unwrap();
          toast.success(t("users.userCreated"));
        }

        // Close the form after successful operation and trigger refresh
        onClose(true);
      } catch (error) {
        // Error handling is done in the useEffect above
        console.error("Form submission error:", error);
      }
    },
    [formData, isEditing, user, currentUser, dispatch, validateForm, onClose]
  );

  const isFormValid = useMemo(() => {
    const errors = validateForm();
    return Object.keys(errors).length === 0;
  }, [validateForm]);

  return (
    <div dir={isRTL ? "rtl" : "ltr"}>
      <Modal
        title={
          isEditing ? t("forms.userForm.editUser") : t("forms.userForm.addUser")
        }
        onClose={onClose}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Image */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div
                className="h-24 w-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center mb-2 cursor-pointer border-2 border-dashed border-gray-300 hover:border-primary-500 transition-colors"
                onClick={() => document.getElementById("imageInput").click()}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt={t("forms.userForm.profileImage")}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    {isEditing && formData.name ? (
                      // Show user initials in edit mode when name is available
                      <div className="w-full h-full bg-primary-50 rounded-full flex items-center justify-center">
                        <span className="text-primary-800 text-lg font-medium">
                          {getInitials(formData.name)}
                        </span>
                      </div>
                    ) : (
                      // Show upload prompt for new users or when no name yet
                      <>
                        <FaImage
                          size={24}
                          className="text-gray-400 mx-auto mb-1"
                        />
                        <span className="text-xs text-gray-500">
                          {t("users.imageUpload")}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <input
                id="imageInput"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            {formErrors.image && (
              <p className="text-red-500 text-xs mt-1">{formErrors.image}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaUser className={`inline ${isRTL ? "ml-2" : "mr-2"}`} />
                {t("forms.userForm.fullName")} *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-800/50 focus:border-primary-800 w-full ${
                  formErrors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder={t("forms.userForm.enterFullName")}
                required
              />
              {formErrors.name && (
                <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("forms.userForm.username")} *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-800/50 focus:border-primary-800 w-full ${
                  formErrors.username ? "border-red-500" : "border-gray-300"
                }`}
                placeholder={t("forms.userForm.enterUsername")}
                required
              />
              {formErrors.username && (
                <p className="text-red-500 text-xs mt-1">
                  {formErrors.username}
                </p>
              )}
            </div>
          </div>

          {/* Password fields (only for new users) */}
          {!isEditing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaLock className={`inline ${isRTL ? "ml-2" : "mr-2"}`} />
                  {t("forms.userForm.password")} *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-800/50 focus:border-primary-800 w-full ${
                    formErrors.password ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder={t("forms.userForm.enterPassword")}
                  required
                />
                {formErrors.password && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("forms.userForm.confirmPassword")} *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-800/50 focus:border-primary-800 w-full ${
                    formErrors.confirmPassword
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder={t("forms.userForm.confirmPasswordText")}
                  required
                />
                {formErrors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("forms.userForm.role")} *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-800/50 focus:border-primary-800 w-full"
                required
              >
                <option value="cashier">{t("forms.userForm.cashier")}</option>
                <option value="manager">{t("forms.userForm.manager")}</option>
              </select>
            </div>

            {/* Active Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("forms.userForm.status")}
              </label>
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary rounded focus:ring-primary-800"
                />
                <span className={`${isRTL ? "mr-2" : "ml-2"} text-gray-700`}>
                  {t("forms.userForm.activeUser")}
                </span>
              </div>
            </div>
          </div>

          {/* Form actions */}
          <div
            className={`flex justify-end space-x-3 pt-4 border-t border-gray-200 ${
              isRTL ? "space-x-reverse" : ""
            }`}
          >
            <button
              type="button"
              className="btn-outline"
              onClick={onClose}
              disabled={loading}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="px-4 py-2 rounded-md text-white font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 bg-primary-800 hover:bg-primary-800 focus:ring-primary-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? isEditing
                  ? t("forms.userForm.updating")
                  : t("forms.userForm.creating")
                : isEditing
                ? t("forms.userForm.updateUser")
                : t("forms.userForm.createUser")}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserForm;
