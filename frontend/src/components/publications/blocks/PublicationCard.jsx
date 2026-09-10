// Card no estilo visual real do site noticioso (sportinsider.com.br) —
// levantado direto do HTML/CSS de produção em 2026-09-05: overlay diagonal
// (63°) na cor de marca #0C0718 (não preto puro, não vertical), título em
// font-light (não bold), data "DD • MM • AAAA", CTA em pílula clara com
// texto/borda roxos (não a pílula translúcida branca que a v1 usava).
function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return { dd, mm, yyyy: d.getFullYear() };
}

export default function PublicationCard({ title, link, image, date, ctaLabel = "Leia aqui" }) {
  const dateParts = formatDate(date);

  return (
    <article className="relative flex flex-col overflow-hidden rounded-2xl lg:rounded-3xl shadow-md select-none h-[340px] sm:h-[380px] bg-[#0C0718]">
      {image ? (
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${image}')` }} />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#7F33D9]/40 to-[#0C0718]" />
      )}

      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(63deg, #0C0718 20%, rgba(0,0,0,0) 80%)" }} />

      <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-start gap-3 max-w-[90%]">
        {dateParts && (
          <span className="flex items-center text-xs text-white">
            {dateParts.dd}
            <i className="inline-block w-[3px] h-[3px] bg-white rounded-full mx-2" />
            {dateParts.mm}
            <i className="inline-block w-[3px] h-[3px] bg-white rounded-full mx-2" />
            {dateParts.yyyy}
          </span>
        )}

        <h3 className="text-base lg:text-xl font-light text-white leading-snug line-clamp-3">{title}</h3>

        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs font-semibold text-[#7F33D9] bg-gradient-to-l from-[#E7D3FF] to-white border border-[#D8B5FF] rounded-full px-6 py-2 hover:brightness-95 transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {ctaLabel}
            <svg viewBox="0 0 6 6" className="w-2 h-2" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M5.34115 4.59265L5.33032 0.416957L1.15462 0.406123C1.11112 0.400232 1.06686 0.403758 1.02483 0.416461C0.982811 0.429164 0.944007 0.450748 0.911051 0.479752C0.878094 0.508755 0.851754 0.544501 0.833814 0.584569C0.815873 0.624637 0.80675 0.668092 0.807064 0.711992C0.807378 0.755893 0.81712 0.799213 0.835631 0.839021C0.854142 0.878829 0.88099 0.914194 0.914358 0.942724C0.947725 0.971254 0.986833 0.992281 1.02903 1.00438C1.07123 1.01648 1.11554 1.01938 1.15896 1.01287L4.28802 1.02587L0.142663 5.17122C0.0851925 5.22869 0.0529055 5.30664 0.0529055 5.38792C0.0529056 5.46919 0.0851923 5.54714 0.142663 5.60461C0.200134 5.66208 0.278082 5.69437 0.359358 5.69437C0.440634 5.69437 0.51858 5.66208 0.576051 5.60461L4.72141 1.45926L4.73441 4.58832C4.7347 4.66964 4.76728 4.74751 4.82498 4.80481C4.88269 4.86211 4.96079 4.89414 5.04212 4.89386C5.12344 4.89357 5.20131 4.86099 5.25861 4.80328C5.31591 4.74558 5.34794 4.66747 5.34765 4.58615L5.34115 4.59265Z"
                fill="#7F33D9"
              />
            </svg>
          </a>
        ) : (
          <span className="text-xs text-white/40 font-medium">Indisponível</span>
        )}
      </div>
    </article>
  );
}
