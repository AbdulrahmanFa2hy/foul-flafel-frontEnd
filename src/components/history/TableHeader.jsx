import { RiArrowUpDownLine } from "react-icons/ri";

const TableHeader = ({ label, field, sortConfig, onSort, className }) => (
  <th
    className="px-4 py-5 text-left text-xl text-primary-800 cursor-pointer hover:text-primary-900"
    onClick={() => onSort(field)}
  >
    <div className={`flex items-center space-x-1 ${className}`}>
      <span>{label}</span>
      <RiArrowUpDownLine
        className={`transition-colors ${
          sortConfig.key === field ? "text-primary-800" : "text-neutral-400"
        } `}
      />
    </div>
  </th>
);

export default TableHeader;
