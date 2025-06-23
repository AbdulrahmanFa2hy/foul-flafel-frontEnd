import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FaCalendarAlt, FaClock } from "react-icons/fa";

const TableHeader = ({ seatingType, setSeatingType }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  // Get and format current date and time
  useEffect(() => {
    // Set current date
    const now = new Date();
    const options = { year: "numeric", month: "short", day: "numeric" };
    setCurrentDate(now.toLocaleDateString(isRTL ? "ar-AE" : "en-US", options));

    // Update time immediately and then every minute
    const updateTime = () => {
      const timeNow = new Date();
      const timeOptions = { hour: "numeric", minute: "2-digit", hour12: true };
      setCurrentTime(
        timeNow.toLocaleTimeString(isRTL ? "ar-AE" : "en-US", timeOptions)
      );
    };

    updateTime(); // Call immediately

    // Update time every minute
    const intervalId = setInterval(updateTime, 60000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [isRTL]);

  return (
    <div className="px-2 lg:px-10 pt-2 pb-1" dir={isRTL ? "rtl" : "ltr"}>
      <div
        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
          isRTL ? "sm:flex-row-reverse" : ""
        }`}
      >
        {/* Seating type selection */}
        <div
          className={`flex gap-2 justify-center md:justify-start ${
            isRTL ? "md:justify-end" : ""
          }`}
        >
          <button
            className={`py-4 px-6 rounded-lg transition-colors ${
              seatingType === "inside"
                ? "bg-primary-700 text-white"
                : "bg-white text-primary-800 border border-primary-800"
            }`}
            onClick={() => setSeatingType("inside")}
          >
            {t("table.indoor")}
          </button>
          <button
            className={`py-4 px-6 rounded-lg transition-colors ${
              seatingType === "outside"
                ? "bg-primary-700 text-white"
                : "bg-white text-primary-800 border border-primary-800"
            }`}
            onClick={() => setSeatingType("outside")}
          >
            {t("table.outdoor")}
          </button>
        </div>

        {/* Date and time display */}
        <div
          className={`hidden md:flex flex-wrap items-center justify-center md:justify-start gap-2 ${
            isRTL ? "md:justify-end" : ""
          }`}
        >
          <div
            className={`bg-neutral-100 text-primary-800 border border-primary-800 rounded-lg px-4 py-2 flex items-center gap-2 ${
              isRTL ? "flex-row-reverse" : ""
            }`}
            title={t("table.currentDate")}
          >
            <FaCalendarAlt className="text-primary-800" />
            <span>{currentDate}</span>
          </div>

          <div
            className={`bg-neutral-100 text-primary-800 border border-primary-800 rounded-lg px-4 py-2 flex items-center gap-2 ${
              isRTL ? "flex-row-reverse" : ""
            }`}
            title={t("table.currentTime")}
          >
            <FaClock className="text-primary-800" />
            <span>{currentTime}</span>
          </div>
        </div>

        {/* Status Indicators */}
        {/* <div className="flex justify-center gap-2 sm:gap-3">
          <div className="inline-flex items-center px-2 sm:px-3 py-1 bg-danger-50 text-danger-600 opacity-90 text-sm font-medium rounded-full">
            Reserved (3)
          </div>
          <div className="inline-flex items-center px-2 sm:px-3 py-1 bg-warning-50 text-warning-600 opacity-90 text-sm font-medium rounded-full">
            In progress (3)
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default TableHeader;
