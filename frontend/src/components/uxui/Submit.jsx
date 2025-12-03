export default function Submit({ value = "Enviar", type = "submit", ...props }) {
  return (
    <div className="w-full">
      <input
        type={type}
        value={value}
        className="cursor-pointer px-6 bg-[#440e6d] text-white py-4 rounded-full uppercase w-full"
        {...props}
      />
    </div>
  );
}