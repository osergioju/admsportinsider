import { api } from "../../../../services/api"

export async function fetchCountries() {
  const { data } = await api.get("/chart/countries");
  return data;
}

export async function fetchLeaguesByCountry(countryId) {
  const { data } = await api.get(
    `/chart/countries/${countryId}/leagues`
  );

  return data.leagues; 
}

export async function fetchClubsByCountry(countryId) {
  const { data } = await api.get(
    `/chart/countries/${countryId}/clubs`
  );

  return data.clubs;
}

export async function fetchRevenuesChart({
  countryId,
  leagueId,
  clubIds
}) {
  const { data } = await api.post(
    "/chart/revenues",
    {
      id_country: countryId,
      id_league: leagueId,
      club_ids: clubIds
    }
  );

  return data;
}
