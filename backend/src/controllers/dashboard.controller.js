import { db } from "../config/db.js";

export const getClubes = (req, res) => {
  const clubes = [
    "Athletico-PR", "Atlético-GO", "Atlético-MG", "Bahia", "Botafogo",
    "Corinthians", "Criciúma", "Cruzeiro", "Cuiabá", "Flamengo",
    "Fluminense", "Fortaleza", "Grêmio", "Internacional", "Juventude",
    "Palmeiras", "Red Bull Bragantino", "São Paulo", "Vasco", "Vitória"
  ];
  return res.json({ clubes });
};

export const getReceita = (req, res) => {
  const { clube } = req.query;

  const labels = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

  const series = [
    "Athletico-PR", "Atlético-GO", "Atlético-MG", "Bahia", "Botafogo",
    "Corinthians", "Criciúma", "Cruzeiro", "Cuiabá", "Flamengo",
    "Fluminense", "Fortaleza", "Grêmio", "Internacional", "Juventude",
    "Palmeiras", "Red Bull Bragantino", "São Paulo", "Vasco", "Vitória"
  ];


  const data = [
    [22,30,28,40,55,60,72,80,78,88,95,110], // Athletico-PR
    [10,15,18,22,30,35,40,48,52,55,60,68], // Atlético-GO
    [40,45,48,55,60,66,70,78,82,90,95,100], // Atlético-MG
    [18,22,25,28,30,38,45,50,52,58,60,65], // Bahia
    [30,35,40,50,65,70,80,90,92,100,110,115], // Botafogo
    [20,25,28,34,40,45,52,60,64,70,75,80], // Corinthians
    [12,18,20,26,30,34,38,42,48,50,55,60], // Criciúma
    [28,33,36,40,45,52,58,64,70,78,84,90], // Cruzeiro
    [15,20,24,26,30,32,36,40,44,48,52,55], // Cuiabá
    [50,55,60,68,75,80,90,100,110,115,120,118], // Flamengo
    [25,28,32,36,40,45,50,55,60,66,70,75], // Fluminense
    [22,26,30,34,38,42,48,55,60,64,70,78], // Fortaleza
    [35,40,44,48,52,60,64,70,78,82,88,95], // Grêmio
    [32,38,42,48,52,58,60,66,72,80,85,90], // Internacional
    [14,18,22,26,30,33,37,40,44,48,50,55], // Juventude
    [45,50,55,60,68,72,80,90,100,110,114,120], // Palmeiras
    [26,30,34,36,40,45,52,60,65,70,75,82], // Red Bull Bragantino
    [34,36,38,42,46,50,55,60,66,70,72,78], // São Paulo
    [20,24,30,32,36,40,45,50,55,60,64,70], // Vasco
    [12,16,20,25,28,32,36,40,45,48,52,58], // Vitória
  ];


  // filtro simples (mock)
  if (clube) {
    const index = series.indexOf(clube);
    return res.json({
      labels,
      series: [series[index]],
      data: [data[index]],
    });
  }

  return res.json({ labels, series, data });
};


// Retorna evolução da receita de todas as ligas
export async function getRevenueEvolutionByLeague(req, res) {
  try {
    // 1. Buscar dados agregados por ano e liga
    const result = await db.query(`
      SELECT 
        l.id_league,
        l.name AS league_name,
        lf.year,
        SUM(lf.value) AS total
      FROM league_financials lf
      JOIN leagues l ON l.id_league = lf.id_league
      JOIN financial_indicators fi ON fi.id = lf.id_indicator
      WHERE fi.category = 'revenue'
      GROUP BY l.id_league, l.name, lf.year
      ORDER BY lf.year ASC, l.id_league ASC;
    `);

    const rows = result.rows;

    // Extrair anos únicos
    const years = [...new Set(rows.map(r => r.year))].sort();

    // Extrair ligas únicas
    const leagues = [...new Set(rows.map(r => r.league_name))];

    // Montar matriz de dados [liga][anos...]
    const data = leagues.map(league => {
      return years.map(year => {
        const row = rows.find(r => r.league_name === league && r.year === year);
        return row ? Math.round(Number(row.total)).toLocaleString("pt-BR") : "0";
      });
    });

    return res.json({
      labels: years,
      series: leagues,
      data
    });

  } catch (err) {
    console.error("Erro ao carregar gráfico:", err);
    return res.status(500).json({ message: "Erro ao gerar gráfico." });
  }
}