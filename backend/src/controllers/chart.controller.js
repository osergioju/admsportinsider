import { db } from "../config/db.js";

export async function getCountries(req, res) {
   try {
    const countriesQuery = await db.query(`
      SELECT id_country, name, flag_url FROM countries ORDER BY name ASC
    `);


    return res.json({
      countries: countriesQuery.rows,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao listar usuários" });
  }
}


export async function getLeaguesByCountry(req, res) {
  const { id_country } = req.params;

  try {
    const result = await db.query(`
      SELECT id_league, name
      FROM leagues
      WHERE id_country = $1
      ORDER BY name ASC
    `, [id_country]);

    return res.json({
      leagues: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao listar ligas" });
  }
}

export async function getClubsByCountry(req, res) {
  const { id_country } = req.params;

  try {
    const result = await db.query(`
      SELECT id_club, name
      FROM clubs
      WHERE id_country = $1
      ORDER BY name ASC
    `, [id_country]);

    return res.json({
      clubs: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao listar clubes" });
  }
}

export async function getRevenuesChart(req, res) {
  const { id_country, id_league, club_ids } = req.body;
  console.log(id_country, id_league, club_ids);
  if (!id_country || !id_league || !club_ids?.length) {
    return res.status(400).json({
      message: "Parâmetros inválidos"
    });
  }

  try {
    const result = await db.query(`
      SELECT
        cf.year,
        cf.value,
        c.name AS club_name
      FROM club_financials cf
      JOIN clubs c
        ON c.id_club = cf.id_club
      JOIN leagues l
        ON l.id_country = c.id_country
      WHERE
        cf.id_indicator = 1249
        AND c.id_country = $1
        AND l.id_league = $2
        AND cf.id_club = ANY($3)
      ORDER BY
        c.name,
        cf.year
    `, [
      id_country,
      id_league,
      club_ids
    ]);

    // 🔹 transformar para o formato do gráfico
    const yearsSet = new Set();
    const seriesMap = {};

    result.rows.forEach(row => {
      yearsSet.add(row.year);

      if (!seriesMap[row.club_name]) {
        seriesMap[row.club_name] = {};
      }

      seriesMap[row.club_name][row.year] = Number(row.value);
    });

    const years = Array.from(yearsSet).sort();

    const series = Object.entries(seriesMap).map(
      ([club, valuesByYear]) => ({
        club,
        values: years.map(
          year => valuesByYear[year] ?? 0
        )
      })
    );

    return res.json({ years, series });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Erro ao gerar gráfico"
    });
  }
}
