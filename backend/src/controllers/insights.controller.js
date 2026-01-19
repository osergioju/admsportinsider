import db from  from "../config/db.js";

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
