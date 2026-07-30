const SelectField = ({
  field,
  label,
  icon: Icon,
  value,
  onChange,
  onFocus,
  onBlur,
  isFocused,
  error,
  disabled,
  options = [],
  placeholder = "Select...",
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-bold text-gray-900 tracking-wide">
      {label} <span className="text-red-500">*</span>
    </label>
    <div
      className={`relative rounded-2xl transition-all duration-300 ${
        error
          ? "ring-2 ring-red-500 shadow-lg shadow-red-500/20"
          : isFocused
          ? "ring-2 ring-[#ffbe2a] shadow-lg shadow-[#ffbe2a]/20"
          : "ring-1 ring-gray-200 hover:ring-gray-300"
      }`}
    >
      <div className="flex items-center px-4 py-3 bg-white rounded-2xl">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
            error ? "bg-red-500 shadow-md" : isFocused ? "bg-[#fff1c6] shadow-md" : "bg-[#fff8e8]"
          }`}
        >
          <Icon className={`w-5 h-5 ${error ? "text-white" : isFocused ? "text-black" : "text-gray-400"}`} />
        </div>
        <select
          value={value}
          onChange={(event) => onChange(field, event.target.value)}
          onFocus={() => onFocus(field, true)}
          onBlur={() => onBlur(field, false)}
          className="flex-1 ml-4 bg-transparent text-gray-900 outline-none font-medium cursor-pointer text-base"
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
    {error && <p className="text-red-500 text-xs font-medium mt-1 ml-1">{error}</p>}
  </div>
);

export default SelectField;
