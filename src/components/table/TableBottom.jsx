import { useTranslation } from "react-i18next";

const TableBottom = ({ freeTables, occupiedTables }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-4 bg-neutral-50 w-full pb-4 pt-8">
      {/* Status Legend */}
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 sm:w-6 sm:h-6 rounded bg-free"></div>
        <span className="text-sm">
          {t("table.available")} ({freeTables.length})
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 sm:w-6 sm:h-6 rounded bg-completed"></div>
        <span className="text-sm">
          {t("table.occupied")} ({occupiedTables.length})
        </span>
      </div>
    </div>
  );
};

export default TableBottom;
