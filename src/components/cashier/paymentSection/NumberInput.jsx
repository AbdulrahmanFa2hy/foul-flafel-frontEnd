const NumberInput = ({
  label,
  value,
  onChange,
  placeholder = "0",
  min = "0",
  max,
  step = "0.01",
  className = "",
}) => {
  const handleFocus = (e) => {
    e.target.select();
  };

  const handleChange = (e) => {
    const inputValue = e.target.value;
    if (inputValue === "") {
      onChange("");
    } else {
      const numValue =
        step === "1" ? parseInt(inputValue) : parseFloat(inputValue);
      onChange(isNaN(numValue) ? "" : numValue);
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <input
        type="number"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        value={value ?? ""}
        onChange={handleChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
};

export default NumberInput;
