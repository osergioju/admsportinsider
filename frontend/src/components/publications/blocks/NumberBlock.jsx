export default function NumberBlock({ slot }) {
  const { value, caption } = slot.content || {};
  return (
    <div className="w-full h-full bg-white border border-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
      <span className="text-3xl sm:text-4xl font-bold text-[#7F33D9] tracking-tight">{value}</span>
      {caption && <span className="text-sm text-gray-500 mt-2">{caption}</span>}
    </div>
  );
}
