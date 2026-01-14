export default function RevenuesFilters({
  countries,
  leagues,
  clubsOptions,
  country,
  league,
  clubs,
  onCountryChange,
  onLeagueChange,
  onClubsChange
}) {
  
  function toggleClub(club) {
    const exists = clubs.some(
      c => c.id_club === club.id_club
    );

    if (exists) {
      onClubsChange(clubs.filter(c => c.id !== club.id));
    } else if (clubs.length < 100) {
      onClubsChange([...clubs, club]);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* 🌍 PAÍS */}
      <select
        value={country?.id_country || ""}
        onChange={e => {
          const selected = countries.find(
            c => c.id_country === Number(e.target.value)
          );
          onCountryChange(selected || null);
        }}
        className="border rounded-lg px-3 py-2"
      >
        <option value="">Selecione o país</option>
        {countries.map(c => (
          <option key={c.id_country} value={c.id_country}>
            {c.name}
          </option>
        ))}
      </select>

      {/* 🏆 LIGA */}
      <select
        value={league?.id_league || ""}
        onChange={e => {
          const selected = leagues.find(
            l => l.id_league === Number(e.target.value)
          );
          onLeagueChange(selected || null);
        }}
        disabled={!country}
        className="border rounded-lg px-3 py-2 disabled:opacity-50"
      >
        <option value="">
          {country
            ? "Selecione a liga"
            : "Selecione um país primeiro"}
        </option>

        {leagues.map(l => (
          <option key={l.id_league} value={l.id_league}>
            {l.name}
          </option>
        ))}
      </select>

      {/* ⚽ CLUBES */}
      <div className="flex flex-wrap gap-2 w-full">
        {clubsOptions.map(club => {
          const active = clubs.some(
            c => c.id_club === club.id_club
          );

          return (
            <button
              key={club.id_club}
              type="button"
              onClick={() => toggleClub(club)}
              disabled={!league}
              className={`px-3 py-1 rounded-full text-sm border
                ${active ? "bg-black text-white" : "bg-white"}
                ${!league ? "opacity-50" : ""}
              `}
            >
              {club.name}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-500">
        {clubs.length}/5 clubes selecionados
      </p>
    </div>
  );
}
