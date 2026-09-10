// Setas + dots, mesmo padrão do carrossel de Notas (NotasSection.jsx) —
// reaproveitado por FinanceCarousel e PublicationsCarousel.
export default function CarouselNavBar({ total, active, onDotClick, onPrev, onNext }) {
  if (total === 0) return null;
  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <button
        onClick={onPrev}
        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:border-[#7f34d9] hover:text-[#7f34d9] transition disabled:opacity-30"
      >
        ‹
      </button>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            onClick={() => onDotClick(i)}
            className={`rounded-full transition-all ${i === active ? "w-5 h-2 bg-[#7f34d9]" : "w-2 h-2 bg-gray-300"}`}
          />
        ))}
      </div>
      <button
        onClick={onNext}
        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:border-[#7f34d9] hover:text-[#7f34d9] transition"
      >
        ›
      </button>
    </div>
  );
}
