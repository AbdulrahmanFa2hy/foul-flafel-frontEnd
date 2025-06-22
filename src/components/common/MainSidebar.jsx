import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  // MdOutlineRestaurantMenu,
  // MdDashboard,
  MdReceiptLong,
  MdTableRestaurant,
} from "react-icons/md";
import { LuCakeSlice } from "react-icons/lu";
// import { TbBrandCakephp } from "react-icons/tb";
// import { MdOutlineBakeryDining } from "react-icons/md";

import { FaHistory, FaCog, FaSignOutAlt } from "react-icons/fa";

import { logout } from "../../store/authSlice";
import Tooltip from "./Tooltip";
import LanguageSwitcher from "./LanguageSwitcher";

// Cashier navigation links (can create orders)
const cashierNavigationLinks = [
  // {
  //   to: "/dashboard",
  //   icon: MdDashboard,
  //   label: "Dashboard",
  // },
  {
    to: "/menu",
    icon: LuCakeSlice,
    label: "Menu",
  },
  {
    to: "/tables",
    icon: MdTableRestaurant,
    label: "Tables",
  },
  {
    to: "/cashier",
    icon: MdReceiptLong,
    label: "Cashier",
  },
];

// Manager navigation links (no menu/order creation)
const managerNavigationLinks = [
  {
    to: "/tables",
    icon: MdTableRestaurant,
    label: "Tables",
  },
  {
    to: "/cashier",
    icon: MdReceiptLong,
    label: "Cashier",
  },
  {
    to: "/history",
    icon: FaHistory,
    label: "History",
  },
  {
    to: "/settings",
    icon: FaCog,
    label: "Settings",
  },
];

// NavLink component
const SidebarNavLink = ({ to, icon: Icon, label, t }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center justify-center p-3 rounded-xl transition-all duration-200 group relative
       ${
         isActive
           ? "bg-primary-800 text-white"
           : "text-primary-800 hover:bg-[#edf4fb] hover:text-primary-800"
       }`
    }
  >
    <Icon className="text-3xl lg:text-2xl" />
    <Tooltip>{t(`sidebar.${label.toLowerCase()}`)}</Tooltip>
  </NavLink>
);

// User Avatar component
const UserAvatar = ({ user }) => {
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
    <div className="relative">
      {hasValidImage && (
        <img
          src={user.image.url}
          alt={user.name}
          className="w-12 h-12 sm:w-9 sm:h-9 rounded-full object-cover"
          onError={(e) => {
            // Hide the image and show initials instead when image fails to load
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
        />
      )}
      <div
        className={`w-12 h-12 sm:w-9 sm:h-9 bg-[#edf4fb] rounded-full flex items-center justify-center ${
          hasValidImage ? "hidden" : "flex"
        }`}
      >
        <span className="text-primary-800 text-xs font-medium">
          {getInitials(user.name)}
        </span>
      </div>
    </div>
  );
};

const MainSidebar = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { hasActiveShift } = useSelector((state) => state.shift);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const isCashier = user?.role?.toLowerCase() === "cashier";
  const isManager = user?.role?.toLowerCase() === "manager";

  // Set navigation links based on user role
  const navigationLinks = isManager
    ? managerNavigationLinks
    : cashierNavigationLinks;

  if (!user) return null;

  return (
    <aside className="w-full h-dvh bg-white border-r border-neutral-200 flex flex-col items-center py-4">
      {/* Logo */}

      {/* Navigation */}
      <nav className="flex-1 w-full px-2 space-y-3">
        {navigationLinks.map((link) => (
          <SidebarNavLink key={link.to} {...link} t={t} />
        ))}
      </nav>

      {/* User Profile and Actions */}
      <div className="w-full px-2 space-y-3">
        {/* Language Switcher */}
        <div className="flex justify-center">
          <LanguageSwitcher />
        </div>

        <div className="flex justify-center group relative">
          <UserAvatar user={user} />
          <Tooltip>
            <p className="font-medium">{user.name}</p>
            <p className="text-xs text-gray-300">
              {t(`sidebar.${user.role?.toLowerCase()}`)}
            </p>
            {isCashier && hasActiveShift && (
              <p className="text-xs text-green-400 mt-1">
                {t("sidebar.shiftActive")}
              </p>
            )}
          </Tooltip>
        </div>
        <button
          className="w-full flex items-center justify-center p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group relative"
          onClick={handleLogout}
        >
          <FaSignOutAlt className="text-xl" />
          <Tooltip>{t("sidebar.logout")}</Tooltip>
        </button>
      </div>
    </aside>
  );
};

export default MainSidebar;
