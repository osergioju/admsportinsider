export default function Select({ label, labelColor, options, variant = "default", ...props}) {
  const variants = {
    default:
      "text-black bg-white border border-gray-300",
    dark:
      "text-white bg-transparent border border-gray-600",
    light:
      "text-black bg-gray-100 border border-gray-300"
  };

  return (
    <div className="flex flex-col gap-1 mb-4">
      {label && (
        <label className={`${labelColor} text-sm font-medium`}>
          {label}
        </label>
      )}

      <select
        className={`${variants[variant]} rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary`}
        {...props}
      >
        <option selected disabled>Selecione</option>
        {options.map((option) => (
            <option
                key={option.cca2}
                value={option.cca2}
                data-flag={`https://flagcdn.com/w640/${option.cca2.toLowerCase()}.png`}
                data-name={option.name.common}
            >
                {option.name.common}
            </option>
        ))}
      </select>
    </div>
  );
}
