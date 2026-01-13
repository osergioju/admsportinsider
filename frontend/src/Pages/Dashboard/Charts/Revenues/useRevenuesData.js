import { useEffect, useState } from "react";
import {
  fetchCountries,
  fetchLeaguesByCountry,
  fetchClubsByCountry,
  fetchRevenuesChart
} from "./services";

export function useRevenuesData() {
  const [countries, setCountries] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [clubsOptions, setClubsOptions] = useState([]);

  const [country, setCountry] = useState(null);
  const [league, setLeague] = useState(null);
  const [clubs, setClubs] = useState([]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔹 carregar países
  useEffect(() => {
    fetchCountries()
      .then(response => {
        const list = response.countries || [];
        setCountries(list);
      })
      .catch(() => setError("Erro ao carregar países"));
  }, []);

  // 🔹 ao mudar país
  useEffect(() => {
    if (!country) {
      setLeagues([]);
      setClubsOptions([]);
      setLeague(null);
      setClubs([]);
      return;
    }

    fetchLeaguesByCountry(country.id_country).then(setLeagues);
    fetchClubsByCountry(country.id_country).then(setClubsOptions);
  }, [country]);

  useEffect(() => {
    if (!country) {
      setClubsOptions([]);
      setClubs([]);
      return;
    }

    fetchClubsByCountry(country.id_country)
      .then(setClubsOptions)
      .catch(() =>
        setError("Erro ao carregar clubes")
      );
  }, [country]);

  // 🔹 carregar gráfico
  useEffect(() => {
    if (!country || !league || clubs.length === 0) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetchRevenuesChart({
      countryId: country.id_country,
      leagueId: league.id_league,
      clubIds: clubs.map(c => c.id_club)
    })
      .then(setData)
      .catch(() =>
        setError("Erro ao carregar gráfico")
      )
      .finally(() => setLoading(false));
  }, [country, league, clubs]);

  return {
    countries,
    leagues,
    clubsOptions,
    country,
    league,
    clubs,
    data,
    loading,
    error,
    setCountry,
    setLeague,
    setClubs
  };
}
