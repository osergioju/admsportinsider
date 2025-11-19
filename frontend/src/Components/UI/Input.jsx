export default function Input({ label, labelColor,  type = "text", ...props }) {
  return (
    <div className="flex flex-col gap-1 mb-4">
      {label && <label className={`${labelColor} text-sm font-medium`}>{label}</label>}
      <input
        type={type}
        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        {...props}
      />
    </div>
  );
}