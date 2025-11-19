export default function Submit({ value = "Enviar", type = "submit", ...props }) {
  return (
    <div className="w-full">
      <input
        type={type}
        value={value}
        className="px-6 bg-[#440e6d] text-white py-2 rounded w-full"
        {...props}
      />
    </div>
  );
}