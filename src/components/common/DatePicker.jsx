import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isWithinInterval,
  isSameMonth,
} from "date-fns";
import { ar } from "date-fns/locale";
import {
  RiCalendarLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiArrowDownSLine,
} from "react-icons/ri";

function DatePicker({ onDateChange }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const locale = i18n.language === "ar" ? ar : undefined;
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [hoverDate, setHoverDate] = useState(null);
  const calendarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateClick = (date) => {
    if (!startDate || (startDate && endDate)) {
      // Start new range
      setStartDate(date);
      setEndDate(null);
      handleDateChange(date, null);
    } else {
      // Complete the range
      if (date < startDate) {
        setStartDate(date);
        setEndDate(startDate);
        handleDateChange(date, startDate);
      } else {
        setEndDate(date);
        handleDateChange(startDate, date);
      }
    }
  };

  const handleDateChange = (start, end) => {
    if (start && end) {
      const formattedStart = format(start, "d MMM, yyyy", { locale });
      const formattedEnd = format(end, "d MMM, yyyy", { locale });
      onDateChange(`${formattedStart} - ${formattedEnd}`);
    } else if (start) {
      onDateChange(format(start, "d MMM, yyyy", { locale }));
    } else {
      onDateChange("");
    }
  };

  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
    onDateChange("");
  };

  const handleClose = () => {
    setIsCalendarOpen(false);
  };

  const getDisplayDate = () => {
    if (!startDate) return t("datePicker.selectDate");
    if (!endDate) return format(startDate, "d MMM, yyyy", { locale });
    return `${format(startDate, "d MMM", { locale })} - ${format(
      endDate,
      "d MMM",
      { locale }
    )}`;
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const isInRange = (date) => {
    if (!startDate) return false;
    if (!endDate && hoverDate) {
      return isWithinInterval(date, {
        start: startDate < hoverDate ? startDate : hoverDate,
        end: startDate < hoverDate ? hoverDate : startDate,
      });
    }
    if (endDate) {
      return isWithinInterval(date, {
        start: startDate,
        end: endDate,
      });
    }
    return false;
  };

  const getDayClassName = (date) => {
    const baseClass =
      "w-9 h-9 rounded-full flex items-center justify-center text-sm transition-colors";
    const isSelected =
      (startDate && isSameDay(date, startDate)) ||
      (endDate && isSameDay(date, endDate));
    const isInCurrentMonth = isSameMonth(date, currentDate);

    if (isSelected) {
      return `${baseClass} bg-primary-700 text-white font-medium`;
    }
    if (isInRange(date)) {
      return `${baseClass} bg-primary-100 text-primary-700`;
    }
    if (!isInCurrentMonth) {
      return `${baseClass} text-neutral-300`;
    }
    return `${baseClass} hover:bg-neutral-100 text-primary-800`;
  };

  return (
    <div className="relative" ref={calendarRef} dir={isRTL ? "rtl" : "ltr"}>
      <button
        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
        className={`flex items-center border border-primary-700 rounded-lg sm:px-4 p-2 sm:py-2 bg-white hover:bg-neutral-100 transition-colors md:min-w-[200px] ${
          isRTL ? "flex-row-reverse" : ""
        }`}
      >
        <RiCalendarLine className="text-primary-800 text-xl" />
        <span
          className={`text-primary-800 flex-1 hidden md:block ${
            isRTL ? "text-right mr-2" : "text-left ml-2"
          }`}
        >
          {getDisplayDate()}
        </span>
        <RiArrowDownSLine
          className={`text-primary-800 transition-transform duration-200 hidden md:block ${
            isCalendarOpen ? "rotate-180" : ""
          } ${isRTL ? "mr-2" : "ml-2"}`}
        />
      </button>

      {isCalendarOpen && (
        <div
          className={`absolute mt-2 p-4 bg-white rounded-lg shadow-lg border border-neutral-200 z-10 animate-fade-in min-w-[280px] ${
            isRTL ? "right-0" : "left-0"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={isRTL ? handleNextMonth : handlePrevMonth}
              className="p-1 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <RiArrowLeftSLine className="w-5 h-5 text-primary-700" />
            </button>
            <span className="text-primary-800 font-medium">
              {format(currentDate, "MMMM yyyy", { locale })}
            </span>
            <button
              onClick={isRTL ? handlePrevMonth : handleNextMonth}
              className="p-1 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <RiArrowRightSLine className="w-5 h-5 text-primary-700" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {[
              t("datePicker.sunday"),
              t("datePicker.monday"),
              t("datePicker.tuesday"),
              t("datePicker.wednesday"),
              t("datePicker.thursday"),
              t("datePicker.friday"),
              t("datePicker.saturday"),
            ].map((day, index) => (
              <div
                key={index}
                className="w-9 h-9 flex items-center justify-center text-xs font-medium text-primary-600"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((date) => (
              <button
                key={date.toISOString()}
                onClick={() => handleDateClick(date)}
                onMouseEnter={() => setHoverDate(date)}
                onMouseLeave={() => setHoverDate(null)}
                className={getDayClassName(date)}
              >
                {format(date, "d")}
              </button>
            ))}
          </div>

          <div className="mt-4 flex justify-between">
            <button
              onClick={handleClear}
              className="text-sm text-primary-700 hover:text-primary-800 font-medium"
            >
              {t("datePicker.clear")}
            </button>
            <button
              onClick={handleClose}
              className="text-sm text-primary-700 hover:text-primary-800 font-medium"
            >
              {t("datePicker.done")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DatePicker;
