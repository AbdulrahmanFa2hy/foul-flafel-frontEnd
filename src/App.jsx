import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import store from "./store";
import { useState, useEffect } from "react";
import { FaArrowRight } from "react-icons/fa";
import MainSidebar from "./components/common/MainSidebar";
import MenuPage from "./pages/MenuPage";
import TablePage from "./pages/TablePage";
import HistoryPage from "./pages/HistoryPage";
import Users from "./pages/settings/UsersManagement";
import Stock from "./pages/settings/StocksManagement";
import Meals from "./pages/settings/MealsManagement";
import Shifts from "./pages/settings/ShiftsManagement";
import Printers from "./pages/settings/PrintersManagement";
import Tables from "./pages/settings/TablesManagement";
import SettingsHome from "./pages/settings/SettingsHome";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/common/ProtectedRoute";
import ShiftGuard from "./components/shift/ShiftGuard";
import CashierPage from "./pages/CashierPage";
// import Dashboard from "./pages/Dashboard";
import { ROUTES } from "./utils/constants";

// Wrapper component to handle sidebar state and location changes
const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Toggle sidebar function
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar when location changes (page navigation)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  return (
    <div className="flex h-screen bg-neutral-50 relative">
      {/* Overlay when sidebar is open on small screens */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar - overlays content on small screens */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } w-28 lg:w-20 lg:translate-x-0 fixed lg:relative z-50 h-full transition-transform duration-300 ease-in-out`}
      >
        <MainSidebar />
      </div>

      {/* Sidebar toggle button - only visible on small screens when sidebar is closed */}
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="lg:hidden fixed top-2/3 left-0 z-10 bg-white h-16 p-[5px] text-lg border border-primary-200 rounded-tr-lg rounded-br-lg shadow-xl text-primary-800"
        >
          <FaArrowRight />
        </button>
      )}

      <main className="flex-1 overflow-auto w-full">
        <Routes>
          <Route
            path={ROUTES.HOME}
            element={<Navigate to={ROUTES.TABLES} replace />}
          />
          {/* <Route path={ROUTES.DASHBOARD} element={<Dashboard />} /> */}
          <Route
            path="/menu"
            element={
              <MenuPage
                sidebarOpen={sidebarOpen}
                toggleSidebar={toggleSidebar}
              />
            }
          />
          <Route path="/tables" element={<TablePage />} />
          <Route path="/cashier" element={<CashierPage />} />
          <Route path="/history" element={<HistoryPage />} />

          {/* Settings Routes */}
          <Route
            path="/settings"
            element={<Navigate to="/settings/home" replace />}
          />
          <Route path="/settings/home" element={<SettingsHome />} />
          <Route path="/settings/users" element={<Users />} />
          <Route path="/settings/stock" element={<Stock />} />
          <Route path="/settings/meals" element={<Meals />} />
          <Route path="/settings/shifts" element={<Shifts />} />
          <Route path="/settings/printers" element={<Printers />} />
          <Route path="/settings/tables" element={<Tables />} />
        </Routes>
      </main>

      {/* React Hot Toast Notifications */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          // Define default options
          className: "",
          duration: 3000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          // Default options for specific types
          success: {
            duration: 3000,
            theme: {
              primary: "green",
              secondary: "black",
            },
          },
        }}
      />
    </div>
  );
};

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          {/* Auth routes - no sidebar */}
          <Route path="/login" element={<LoginPage />} />

          {/* Layout with sidebar for authenticated routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <ShiftGuard>
                  <AppLayout />
                </ShiftGuard>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;
