import { RiArrowUpDownLine } from "react-icons/ri";

const TableHeader = ({ label, field, sortConfig, onSort, className }) => (
  <th
    className="px-4 py-3 sm:py-5 text-left text-sm sm:text-xl text-primary-800 cursor-pointer hover:text-primary-900"
    onClick={() => onSort(field)}
  >
    <div className={`flex items-center gap-1 ${className}`}>
      <span className="whitespace-nowrap">{label}</span>
      <RiArrowUpDownLine
        className={`transition-colors ${
          sortConfig.key === field ? "text-primary-800" : "text-neutral-400"
        } `}
      />
    </div>
  </th>
);

export default TableHeader;
