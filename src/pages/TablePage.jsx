import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import TableHeader from "../components/table/TableHeader";
import TableGrid from "../components/table/TableGrid";
import { fetchTables, selectTable } from "../store/tableSlice";
import Loading from "../components/common/Loading";
import ErrorMessage from "../components/common/ErrorMessage";

const TablePage = () => {
  const { t } = useTranslation();
  const [seatingType, setSeatingType] = useState("inside");
  // Set tableSidebarOpen to false by default on small screens and true on large screens and up
  const [tableSidebarOpen, setTableSidebarOpen] = useState(
    window.innerWidth >= 1024
  );
  const location = useLocation();
  const dispatch = useDispatch();

  // Get tables data from Redux store
  const { tables, loading, error } = useSelector((state) => state.table);

  // Fetch tables when component mounts
  useEffect(() => {
    dispatch(fetchTables());
  }, [dispatch]);

  // Check window size on initial render and set sidebar state accordingly
  useEffect(() => {
    const handleResize = () => {
      // On large screens and up (lg breakpoint is typically 1024px), auto-open the sidebar
      setTableSidebarOpen(window.innerWidth >= 1024);
    };

    // Add event listener for window resize
    window.addEventListener("resize", handleResize);

    // Call handler right away to set initial state
    handleResize();

    // Clean up event listener on component unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close sidebar when location changes (page navigation)
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setTableSidebarOpen(false);
    }
  }, [location]);

  const handleSelectTable = (tableId) => {
    dispatch(selectTable(tableId));
  };

  const toggleRightSidebar = () => {
    setTableSidebarOpen(!tableSidebarOpen);
  };

  return (
    <div className="h-full flex justify-between relative">
      {/* Overlay for right sidebar when open on mobile */}
      {tableSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleRightSidebar}
        />
      )}

      <div className="flex flex-col w-full">
        <TableHeader
          seatingType={seatingType}
          setSeatingType={setSeatingType}
        />

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden ">
          <div className="flex-1 overflow-y-auto [scrollbar-width:none] [::-webkit-scrollbar]:hidden">
            {loading ? (
              <Loading />
            ) : error ? (
              <ErrorMessage message={error} />
            ) : (
              <TableGrid
                tables={tables}
                onSelectTable={handleSelectTable}
                seatingType={seatingType}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TablePage;
