// Skeleton de carregamento das páginas de dados — substitui o "miolo branco"
// durante o fetch, seguindo o visual do site (cards rounded-2xl com pulse).
export default function PageLoader() {
  return (
    <div className="w-full space-y-4 animate-pulse pb-16" aria-busy="true" aria-label="Carregando">
      {/* Testeira */}
      <div className="h-36 sm:h-44 rounded-2xl bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 relative overflow-hidden">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/50" />
          <div className="space-y-2">
            <div className="h-5 w-48 rounded-full bg-white/60" />
            <div className="h-3 w-32 rounded-full bg-white/40" />
          </div>
        </div>
      </div>

      {/* Cards de conteúdo */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="h-64 bg-white rounded-2xl border border-gray-100" />
        <div className="h-64 bg-white rounded-2xl border border-gray-100" />
      </div>
      <div className="h-64 bg-white rounded-2xl border border-gray-100" />
    </div>
  );
}
