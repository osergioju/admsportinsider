export default function Input({ label, labelColor, type = "text", variant = "default", ...props
}) {
  const variants = {
    default:
      "text-black bg-white border border-gray-300",
    dark:
      "text-white bg-gradient-to-l from-[#241c3a8a] to-[#29204288] border border-[#665494] rounded-full p-5",
    light:
      "text-black bg-gray-100 border border-gray-300"
  };

  return (
    <div className="flex flex-col gap-1 mb-1">
      {label && (
        <label className={`${labelColor} bg-linear-to-l from-[#ffffff1f] to-[#ffffff] bg-clip-text text-lg mb-0 text-transparent`}>
          {label}
        </label>
      )}

      <input
        type={type}
        className={`${variants[variant]} focus:outline-none focus:ring-2 focus:ring-primary font-light`}
        {...props}
      />
    </div>
  );
}
