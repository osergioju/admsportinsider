import db from  "../config/db.js";

export async function getUsersInsights(req, res) {
  try {

    const [
      totalUsers,
      activeUsers,
      newUsersMonth,
      growthData,
      growthDaily,
      rolesDist,
      countriesDist,
      newDaily,
      heatmap,
      weeklyActive,
      recentUsers,
      activeRanking
    ] = await Promise.all([

      // TOTAL USERS
      db.query(`
        SELECT COUNT(*) AS total FROM users;
      `),

      // ACTIVE USERS (logaram nos últimos 30 dias)
      db.query(`
        SELECT COUNT(*) AS total
        FROM users
        WHERE last_login >= NOW() - INTERVAL '30 days';
      `),

      // NEW USERS THIS MONTH
      db.query(`
        SELECT COUNT(*) AS total
        FROM users
        WHERE created_at >= date_trunc('month', CURRENT_DATE);
      `),

      // GROWTH RATE (compare month with previous month)
      db.query(`
        SELECT
          (SELECT COUNT(*) 
           FROM users 
           WHERE created_at >= date_trunc('month', CURRENT_DATE)
          ) AS current,
            
          (SELECT COUNT(*) 
           FROM users 
           WHERE created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
             AND created_at < date_trunc('month', CURRENT_DATE)
          ) AS previous;
      `),

      // GROWTH DAILY — last 30 days
      db.query(`
        SELECT 
          date(created_at) AS day,
          COUNT(*) AS total
        FROM users
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY day
        ORDER BY day ASC;
      `),

      // DISTRIBUTION BY ROLE
      db.query(`
        SELECT role, COUNT(*) AS total
        FROM users
        GROUP BY role;
      `),

      // DISTRIBUTION BY COUNTRY
      db.query(`
        SELECT country, COUNT(*) AS total
        FROM users
        GROUP BY country
        ORDER BY total DESC;
      `),

      // NEW USERS PER DAY — last 7 days
      db.query(`
        SELECT
          date(created_at) AS day,
          COUNT(*) AS total
        FROM users
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY day
        ORDER BY day ASC;
      `),

      // HEATMAP — logins by hour (0–23)
      db.query(`
        SELECT
          EXTRACT(HOUR FROM last_login) AS hour,
          COUNT(*) AS total
        FROM users
        WHERE last_login IS NOT NULL
        GROUP BY hour
        ORDER BY hour ASC;
      `),

      // WEEKLY ACTIVE USERS (0=Sunday ... 6=Saturday)
      db.query(`
        SELECT
          EXTRACT(DOW FROM last_login) AS weekday,
          COUNT(*) AS total
        FROM users
        WHERE last_login IS NOT NULL
        GROUP BY weekday
        ORDER BY weekday ASC;
      `),

      // LAST REGISTERED USERS (for table)
      db.query(`
        SELECT id, name, email, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 10;
      `),

      // ACTIVE USERS RANKING (for table)
      db.query(`
        SELECT 
          u.id,
          u.name,
          u.email,
          COUNT(l.id) AS login_count
        FROM users u
        LEFT JOIN login_logs l ON l.user_id = u.id
        GROUP BY u.id
        ORDER BY login_count DESC
        LIMIT 10;
      `),

    ]);


    // ==========================
    // CALCULATE GROWTH RATE
    // ==========================

    let growthRate = 0;
    const g = growthData.rows[0];

    if (g.previous > 0) {
      growthRate = ((g.current - g.previous) / g.previous) * 100;
    }


    // ==========================
    // RETURN JSON
    // ==========================

    return res.json({
      success: true,

      kpis: {
        total_users: Number(totalUsers.rows[0].total),
        active_users: Number(activeUsers.rows[0].total),
        new_month: Number(newUsersMonth.rows[0].total),
        growth_rate: Number(growthRate.toFixed(2))
      },

      charts: {
        growth_daily: growthDaily.rows,
        roles_distribution: rolesDist.rows,
        country_distribution: countriesDist.rows,
        new_users_daily: newDaily.rows,
        heatmap: heatmap.rows,
        weekly_active: weeklyActive.rows
      },

      tables: {
        recent_users: recentUsers.rows,
        active_users: activeRanking.rows
      }

    });

  } catch (error) {
    console.error("Erro ao obter insights de usuários:", error);
    
    return res.status(500).json({
      success: false,
      error: "Erro ao carregar insights"
    });
  }
}

// ─────────────────────────────────────────────
// CLUBES
// ─────────────────────────────────────────────

export async function getClubsInsights(req, res) {
  try {
    const [
      totalClubs,
      clubsWithFinancials,
      clubsWithSports,
      topFavorited,
      clubsByCountry,
      financialsByYear,
      recentClubs
    ] = await Promise.all([

      db.query(`SELECT COUNT(*) AS total FROM clubs WHERE active = TRUE`),

      db.query(`
        SELECT COUNT(DISTINCT id_club) AS total
        FROM club_financials
      `),

      db.query(`
        SELECT COUNT(DISTINCT id_club) AS total
        FROM club_competition_stats
      `),

      db.query(`
        SELECT c.name, c.crest_url, COUNT(f.id) AS total
        FROM favorites f
        JOIN clubs c ON c.id_club = f.entity_id
        WHERE f.entity_type = 'club'
        GROUP BY c.id_club, c.name, c.crest_url
        ORDER BY total DESC
        LIMIT 10
      `),

      db.query(`
        SELECT co.name AS country, COUNT(c.id_club) AS total
        FROM clubs c
        JOIN countries co ON co.id_country = c.id_country
        WHERE c.active = TRUE
        GROUP BY co.name
        ORDER BY total DESC
        LIMIT 10
      `),

      db.query(`
        SELECT year, COUNT(DISTINCT id_club) AS clubs_count
        FROM club_financials
        GROUP BY year
        ORDER BY year ASC
      `),

      db.query(`
        SELECT c.id_club, c.name, c.crest_url, co.name AS country, c.created_at
        FROM clubs c
        LEFT JOIN countries co ON co.id_country = c.id_country
        WHERE c.active = TRUE
        ORDER BY c.created_at DESC
        LIMIT 10
      `)
    ]);

    return res.json({
      success: true,
      kpis: {
        total_clubs: Number(totalClubs.rows[0].total),
        clubs_with_financials: Number(clubsWithFinancials.rows[0].total),
        clubs_with_sports: Number(clubsWithSports.rows[0].total),
        coverage_pct: totalClubs.rows[0].total > 0
          ? Number(((clubsWithFinancials.rows[0].total / totalClubs.rows[0].total) * 100).toFixed(1))
          : 0
      },
      charts: {
        top_favorited: topFavorited.rows,
        clubs_by_country: clubsByCountry.rows,
        financials_by_year: financialsByYear.rows
      },
      tables: {
        recent_clubs: recentClubs.rows
      }
    });
  } catch (error) {
    console.error("Erro ao obter insights de clubes:", error);
    return res.status(500).json({ success: false, error: "Erro ao carregar insights" });
  }
}

// ─────────────────────────────────────────────
// LIGAS
// ─────────────────────────────────────────────

export async function getLeaguesInsights(req, res) {
  try {
    const [
      totalLeagues,
      leaguesWithFinancials,
      formatDist,
      topFavorited,
      leaguesByCountry,
      financialsByYear,
      leaguesClubCount
    ] = await Promise.all([

      db.query(`SELECT COUNT(*) AS total FROM leagues`),

      db.query(`
        SELECT COUNT(DISTINCT id_league) AS total
        FROM league_financials
      `),

      db.query(`
        SELECT COALESCE(format, 'nao_definido') AS format, COUNT(*) AS total
        FROM leagues
        GROUP BY format
        ORDER BY total DESC
      `),

      db.query(`
        SELECT l.name, COUNT(f.id) AS total
        FROM favorites f
        JOIN leagues l ON l.id_league = f.entity_id
        WHERE f.entity_type = 'league'
        GROUP BY l.id_league, l.name
        ORDER BY total DESC
        LIMIT 10
      `),

      db.query(`
        SELECT co.name AS country, COUNT(l.id_league) AS total
        FROM leagues l
        JOIN countries co ON co.id_country = l.id_country
        GROUP BY co.name
        ORDER BY total DESC
        LIMIT 10
      `),

      db.query(`
        SELECT year, COUNT(DISTINCT id_league) AS leagues_count
        FROM league_financials
        GROUP BY year
        ORDER BY year ASC
      `),

      db.query(`
        SELECT l.name, COUNT(DISTINCT cs.id_club) AS clubs_count
        FROM leagues l
        LEFT JOIN club_seasons cs ON cs.id_league = l.id_league
        GROUP BY l.id_league, l.name
        ORDER BY clubs_count DESC
        LIMIT 10
      `)
    ]);

    return res.json({
      success: true,
      kpis: {
        total_leagues: Number(totalLeagues.rows[0].total),
        leagues_with_financials: Number(leaguesWithFinancials.rows[0].total),
        coverage_pct: totalLeagues.rows[0].total > 0
          ? Number(((leaguesWithFinancials.rows[0].total / totalLeagues.rows[0].total) * 100).toFixed(1))
          : 0
      },
      charts: {
        format_distribution: formatDist.rows,
        top_favorited: topFavorited.rows,
        leagues_by_country: leaguesByCountry.rows,
        financials_by_year: financialsByYear.rows,
        leagues_club_count: leaguesClubCount.rows
      }
    });
  } catch (error) {
    console.error("Erro ao obter insights de ligas:", error);
    return res.status(500).json({ success: false, error: "Erro ao carregar insights" });
  }
}

// ─────────────────────────────────────────────
// FINANCEIRO
// ─────────────────────────────────────────────

export async function getFinanceiroInsights(req, res) {
  try {
    const [
      statusBreakdown,
      planRevenue,
      paidUsersPerMonth,
      totalPaid,
      totalFree,
      totalActive
    ] = await Promise.all([

      db.query(`
        SELECT COALESCE(subscription_status, 'free') AS status, COUNT(*) AS total
        FROM users
        GROUP BY subscription_status
        ORDER BY total DESC
      `),

      db.query(`
        SELECT p.name AS plan, p.price, COUNT(u.id) AS users_count,
               COALESCE(p.price * COUNT(u.id), 0) AS estimated_mrr
        FROM users u
        JOIN plans p ON p.id = u.plan_id
        WHERE u.subscription_status = 'active'
        GROUP BY p.id, p.name, p.price
        ORDER BY estimated_mrr DESC
      `),

      db.query(`
        SELECT
          date_trunc('month', created_at) AS month,
          COUNT(*) FILTER (WHERE subscription_status = 'active') AS paid_count
        FROM users
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY month
        ORDER BY month ASC
      `),

      db.query(`
        SELECT COUNT(*) AS total FROM users WHERE subscription_status = 'active'
      `),

      db.query(`
        SELECT COUNT(*) AS total FROM users WHERE plan_id = 1 OR subscription_status IS NULL OR subscription_status = 'free'
      `),

      db.query(`
        SELECT COUNT(*) AS total FROM users WHERE subscription_status IN ('active', 'trialing')
      `)
    ]);

    const mrr = planRevenue.rows.reduce((sum, r) => sum + Number(r.estimated_mrr), 0);

    return res.json({
      success: true,
      kpis: {
        mrr: Number(mrr.toFixed(2)),
        total_paid: Number(totalPaid.rows[0].total),
        total_free: Number(totalFree.rows[0].total),
        total_active_subscriptions: Number(totalActive.rows[0].total)
      },
      charts: {
        status_breakdown: statusBreakdown.rows,
        plan_revenue: planRevenue.rows,
        paid_users_per_month: paidUsersPerMonth.rows
      }
    });
  } catch (error) {
    console.error("Erro ao obter insights financeiros:", error);
    return res.status(500).json({ success: false, error: "Erro ao carregar insights" });
  }
}

// ─────────────────────────────────────────────
// PLANOS
// ─────────────────────────────────────────────

export async function getPlanosInsights(req, res) {
  try {
    const [
      planDist,
      planDetails,
      statusByPlan,
      conversionRate,
      churnData
    ] = await Promise.all([

      db.query(`
        SELECT p.name AS plan, COUNT(u.id) AS total
        FROM users u
        LEFT JOIN plans p ON p.id = u.plan_id
        GROUP BY p.name
        ORDER BY total DESC
      `),

      db.query(`
        SELECT
          p.id,
          p.name,
          COALESCE(p.price, 0) AS price,
          COUNT(u.id) AS total_users,
          COUNT(u.id) FILTER (WHERE u.subscription_status = 'active') AS active_users,
          COUNT(u.id) FILTER (WHERE u.subscription_status = 'canceled') AS canceled_users
        FROM plans p
        LEFT JOIN users u ON u.plan_id = p.id
        GROUP BY p.id, p.name, p.price
        ORDER BY p.id ASC
      `),

      db.query(`
        SELECT
          p.name AS plan,
          COALESCE(u.subscription_status, 'free') AS status,
          COUNT(*) AS total
        FROM users u
        LEFT JOIN plans p ON p.id = u.plan_id
        GROUP BY p.name, subscription_status
        ORDER BY p.name, status
      `),

      db.query(`
        SELECT
          COUNT(*) FILTER (WHERE plan_id > 1 AND subscription_status = 'active') AS converted,
          COUNT(*) AS total
        FROM users
      `),

      db.query(`
        SELECT
          date_trunc('month', updated_at) AS month,
          COUNT(*) AS canceled
        FROM users
        WHERE subscription_status = 'canceled'
          AND updated_at >= NOW() - INTERVAL '12 months'
        GROUP BY month
        ORDER BY month ASC
      `)
    ]);

    const conv = conversionRate.rows[0];
    const rate = conv.total > 0 ? ((conv.converted / conv.total) * 100).toFixed(1) : 0;

    return res.json({
      success: true,
      kpis: {
        total_plans: planDetails.rows.length,
        conversion_rate: Number(rate),
        total_paid_users: Number(conv.converted)
      },
      charts: {
        plan_distribution: planDist.rows,
        plan_details: planDetails.rows,
        status_by_plan: statusByPlan.rows,
        churn_monthly: churnData.rows
      }
    });
  } catch (error) {
    console.error("Erro ao obter insights de planos:", error);
    return res.status(500).json({ success: false, error: "Erro ao carregar insights" });
  }
}

// ─────────────────────────────────────────────
// IMPORTAÇÕES
// ─────────────────────────────────────────────

export async function getImportacoesInsights(req, res) {
  try {
    const [
      totalClubFinancials,
      totalLeagueFinancials,
      totalPlayers,
      totalMatches,
      clubFinancialsByYear,
      leagueFinancialsByYear,
      indicatorsCount,
      topClubsByRecords
    ] = await Promise.all([

      db.query(`SELECT COUNT(*) AS total FROM club_financials`),
      db.query(`SELECT COUNT(*) AS total FROM league_financials`),
      db.query(`SELECT COUNT(*) AS total FROM players`),
      db.query(`SELECT COUNT(*) AS total FROM matches`),

      db.query(`
        SELECT year, COUNT(*) AS records
        FROM club_financials
        GROUP BY year
        ORDER BY year ASC
      `),

      db.query(`
        SELECT year, COUNT(*) AS records
        FROM league_financials
        GROUP BY year
        ORDER BY year ASC
      `),

      db.query(`
        SELECT level, COUNT(*) AS total
        FROM financial_indicators
        GROUP BY level
      `),

      db.query(`
        SELECT c.name, COUNT(cf.id) AS records_count
        FROM club_financials cf
        JOIN clubs c ON c.id_club = cf.id_club
        GROUP BY c.id_club, c.name
        ORDER BY records_count DESC
        LIMIT 10
      `)
    ]);

    const totalFinancialRecords = Number(totalClubFinancials.rows[0].total) + Number(totalLeagueFinancials.rows[0].total);

    return res.json({
      success: true,
      kpis: {
        total_financial_records: totalFinancialRecords,
        total_club_financials: Number(totalClubFinancials.rows[0].total),
        total_league_financials: Number(totalLeagueFinancials.rows[0].total),
        total_players: Number(totalPlayers.rows[0].total),
        total_matches: Number(totalMatches.rows[0].total)
      },
      charts: {
        club_financials_by_year: clubFinancialsByYear.rows,
        league_financials_by_year: leagueFinancialsByYear.rows,
        indicators_by_level: indicatorsCount.rows,
        top_clubs_by_records: topClubsByRecords.rows
      }
    });
  } catch (error) {
    console.error("Erro ao obter insights de importações:", error);
    return res.status(500).json({ success: false, error: "Erro ao carregar insights" });
  }
}

// ─────────────────────────────────────────────
// USO DO SISTEMA
// ─────────────────────────────────────────────

export async function getUsoInsights(req, res) {
  try {
    const [
      totalClubs,
      clubsWithSports,
      clubsWithFinancials,
      totalLeagues,
      leaguesWithFinancials,
      totalPlayers,
      totalMatches,
      sportsPerSeason,
      financialsPerSeason,
      topClubsByMatches,
      topLeaguesByClubs,
      totalFavorites,
      favoritesByType,
      topFavoritedClubs,
      topFavoritedLeagues
    ] = await Promise.all([

      db.query(`SELECT COUNT(*) AS total FROM clubs WHERE active = TRUE`),

      db.query(`SELECT COUNT(DISTINCT id_club) AS total FROM club_competition_stats`),

      db.query(`SELECT COUNT(DISTINCT id_club) AS total FROM club_financials`),

      db.query(`SELECT COUNT(*) AS total FROM leagues`),

      db.query(`SELECT COUNT(DISTINCT id_league) AS total FROM league_financials`),

      db.query(`SELECT COUNT(*) AS total FROM players`),

      db.query(`SELECT COUNT(*) AS total FROM matches`),

      db.query(`
        SELECT s.year, COUNT(*) AS records
        FROM club_competition_stats ccs
        JOIN competition_seasons cs ON cs.id_competition_season = ccs.id_competition_season
        JOIN seasons s ON s.id_season = cs.id_season
        GROUP BY s.year
        ORDER BY s.year ASC
      `),

      db.query(`
        SELECT year, COUNT(*) AS records
        FROM club_financials
        GROUP BY year
        ORDER BY year ASC
      `),

      db.query(`
        SELECT c.name, c.crest_url, COUNT(*) AS matches_count
        FROM (
          SELECT home_club_id AS id_club FROM matches
          UNION ALL
          SELECT away_club_id FROM matches
        ) m
        JOIN clubs c ON c.id_club = m.id_club
        GROUP BY c.id_club, c.name, c.crest_url
        ORDER BY matches_count DESC
        LIMIT 10
      `),

      db.query(`
        SELECT l.name, COUNT(DISTINCT cs.id_club) AS clubs_count
        FROM leagues l
        LEFT JOIN club_seasons cs ON cs.id_league = l.id_league
        GROUP BY l.id_league, l.name
        ORDER BY clubs_count DESC
        LIMIT 10
      `),

      db.query(`SELECT COUNT(*) AS total FROM favorites`),

      db.query(`
        SELECT entity_type, COUNT(*) AS total
        FROM favorites
        GROUP BY entity_type
      `),

      db.query(`
        SELECT c.name, c.crest_url, COUNT(f.id) AS favorites_count
        FROM favorites f
        JOIN clubs c ON c.id_club = f.entity_id
        WHERE f.entity_type = 'club'
        GROUP BY c.id_club, c.name, c.crest_url
        ORDER BY favorites_count DESC
        LIMIT 10
      `),

      db.query(`
        SELECT l.name, COUNT(f.id) AS favorites_count
        FROM favorites f
        JOIN leagues l ON l.id_league = f.entity_id
        WHERE f.entity_type = 'league'
        GROUP BY l.id_league, l.name
        ORDER BY favorites_count DESC
        LIMIT 10
      `)
    ]);

    return res.json({
      success: true,
      kpis: {
        total_clubs: Number(totalClubs.rows[0].total),
        clubs_with_sports: Number(clubsWithSports.rows[0].total),
        clubs_with_financials: Number(clubsWithFinancials.rows[0].total),
        total_leagues: Number(totalLeagues.rows[0].total),
        leagues_with_financials: Number(leaguesWithFinancials.rows[0].total),
        total_players: Number(totalPlayers.rows[0].total),
        total_matches: Number(totalMatches.rows[0].total),
        total_favorites: Number(totalFavorites.rows[0].total)
      },
      charts: {
        sports_per_season: sportsPerSeason.rows,
        financials_per_season: financialsPerSeason.rows,
        top_clubs_by_matches: topClubsByMatches.rows,
        top_leagues_by_clubs: topLeaguesByClubs.rows,
        favorites_by_type: favoritesByType.rows,
        top_favorited_clubs: topFavoritedClubs.rows,
        top_favorited_leagues: topFavoritedLeagues.rows
      }
    });
  } catch (error) {
    console.error("Erro ao obter insights de uso:", error);
    return res.status(500).json({ success: false, error: "Erro ao carregar insights" });
  }
}

// ─────────────────────────────────────────────
// PERFORMANCE
// ─────────────────────────────────────────────

export async function getPerformanceInsights(req, res) {
  try {
    const [
      loginsByDay,
      loginsByHour,
      loginsByWeekday,
      retentionData,
      usersLastSeen,
      newVsReturning
    ] = await Promise.all([

      db.query(`
        SELECT date(last_login) AS day, COUNT(*) AS logins
        FROM users
        WHERE last_login >= NOW() - INTERVAL '30 days'
        GROUP BY day
        ORDER BY day ASC
      `),

      db.query(`
        SELECT EXTRACT(HOUR FROM last_login) AS hour, COUNT(*) AS total
        FROM users
        WHERE last_login IS NOT NULL
        GROUP BY hour
        ORDER BY hour ASC
      `),

      db.query(`
        SELECT
          EXTRACT(DOW FROM last_login) AS weekday,
          COUNT(*) AS total
        FROM users
        WHERE last_login IS NOT NULL
        GROUP BY weekday
        ORDER BY weekday ASC
      `),

      db.query(`
        SELECT
          COUNT(*) FILTER (WHERE last_login >= NOW() - INTERVAL '1 day')   AS last_1d,
          COUNT(*) FILTER (WHERE last_login >= NOW() - INTERVAL '7 days')  AS last_7d,
          COUNT(*) FILTER (WHERE last_login >= NOW() - INTERVAL '30 days') AS last_30d,
          COUNT(*) FILTER (WHERE last_login >= NOW() - INTERVAL '90 days') AS last_90d,
          COUNT(*) AS total
        FROM users
        WHERE last_login IS NOT NULL
      `),

      db.query(`
        SELECT
          CASE
            WHEN last_login >= NOW() - INTERVAL '7 days' THEN 'Ativo (7d)'
            WHEN last_login >= NOW() - INTERVAL '30 days' THEN 'Ativo (30d)'
            WHEN last_login >= NOW() - INTERVAL '90 days' THEN 'Inativo (90d)'
            ELSE 'Dormente'
          END AS segment,
          COUNT(*) AS total
        FROM users
        WHERE last_login IS NOT NULL
        GROUP BY segment
        ORDER BY total DESC
      `),

      db.query(`
        SELECT
          date_trunc('month', created_at) AS month,
          COUNT(*) AS new_users,
          COUNT(*) FILTER (WHERE last_login >= NOW() - INTERVAL '30 days') AS returned
        FROM users
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY month
        ORDER BY month ASC
      `)
    ]);

    const r = retentionData.rows[0] ?? {};

    return res.json({
      success: true,
      kpis: {
        active_last_1d: Number(r.last_1d ?? 0),
        active_last_7d: Number(r.last_7d ?? 0),
        active_last_30d: Number(r.last_30d ?? 0),
        active_last_90d: Number(r.last_90d ?? 0)
      },
      charts: {
        logins_by_day: loginsByDay.rows,
        logins_by_hour: loginsByHour.rows,
        logins_by_weekday: loginsByWeekday.rows,
        user_segments: usersLastSeen.rows,
        new_vs_returning: newVsReturning.rows
      }
    });
  } catch (error) {
    console.error("Erro ao obter insights de performance:", error);
    return res.status(500).json({ success: false, error: "Erro ao carregar insights" });
  }
}
