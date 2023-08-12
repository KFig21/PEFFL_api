const router = require("express").Router();
const pool = require("../pool");

// get single season stats
router.get("/table/:year/:sortBy/:sortOrder/:table", async (req, res) => {
  try {
    const db = await pool.connect()
    const year = req.params.year;
    const sortBy = req.params.sortBy;
    const sortOrder = req.params.sortOrder;
    const season = req.params.table === 'RS' ? ` AND ag.season = 'r'` : req.params.table === 'playoffs' ? ` AND ag.season = 'p'` : '';

    const weeksColumns = Array.from({ length: 14 }, (_, i) => `
      (SELECT pf FROM allGames WHERE year = ${year} AND week = '${i + 1}' AND team = ag.team) as "week${i + 1}",
      (SELECT win FROM allGames WHERE year = ${year} AND week = '${i + 1}' AND team = ag.team) as "week${i + 1}_outcome",
      (SELECT opp FROM allGames WHERE year = ${year} AND week = '${i + 1}' AND team = ag.team) as "week${i + 1}_opp",
      (SELECT pa FROM allGames WHERE year = ${year} AND week = '${i + 1}' AND team = ag.team) as "week${i + 1}_pa"`).join(',\n');

    const query = `
      SELECT 
        ag.team,
        ${weeksColumns},
        (SELECT pf FROM allGames WHERE year = ${year} AND week = 'WC' AND team = ag.team) as "weekWc",
        (SELECT win FROM allGames WHERE year = ${year} AND week = 'WC' AND team = ag.team) as "weekWc_outcome",
        (SELECT opp FROM allGames WHERE year = ${year} AND week = 'WC' AND team = ag.team) as "weekWc_opp",
        (SELECT pa FROM allGames WHERE year = ${year} AND week = 'WC' AND team = ag.team) as "weekWc_pa",
        (SELECT pf FROM allGames WHERE year = ${year} AND week = 'SF' AND team = ag.team) as "weekSf",
        (SELECT win FROM allGames WHERE year = ${year} AND week = 'SF' AND team = ag.team) as "weekSf_outcome",
        (SELECT opp FROM allGames WHERE year = ${year} AND week = 'SF' AND team = ag.team) as "weekSf_opp",
        (SELECT pa FROM allGames WHERE year = ${year} AND week = 'SF' AND team = ag.team) as "weekSf_pa",
        (SELECT pf FROM allGames WHERE year = ${year} AND week = 'DC' AND team = ag.team) as "weekDc",
        (SELECT win FROM allGames WHERE year = ${year} AND week = 'DC' AND team = ag.team) as "weekDc_outcome",
        (SELECT opp FROM allGames WHERE year = ${year} AND week = 'DC' AND team = ag.team) as "weekDc_opp",
        (SELECT pa FROM allGames WHERE year = ${year} AND week = 'DC' AND team = ag.team) as "weekDc_pa",
        avg(ag.pf) as "ppg",
        avg(ag.pa) as "papg",
        sum(ag.pf) as "pf",
        sum(ag.pa) as "pa", 
        sum(ag.win) as "w",
        sum(ag.loss) as "l",
        sum(ag.win + ag.loss) as "g",
        sum(ag.pf - ag.pa) as "dif",
        avg(ag.pf - ag.pa) as "difpg"
      FROM allGames ag
      WHERE ag.year = ${year} ${season}
      GROUP BY ag.team
      ORDER BY ${sortBy} ${sortOrder}`;

    const result = await db.query(query);
    res.send(result.rows);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// get single season trophies
router.get("/trophies/:year", async (req, res) => {
  try {
    const db = await pool.connect()
    let year = req.params.year;

    const query = `
      SELECT  
        (SELECT team FROM awards WHERE year = ${year} AND lc = 1) as lc,
        (SELECT team FROM awards WHERE year = ${year} AND ru = 1) as ru,
        (SELECT team FROM awards WHERE year = ${year} AND rsc = 1) as rsc,
        (SELECT team FROM awards WHERE year = ${year} AND p = 1) as p,
        (SELECT team FROM awards WHERE year = ${year} AND dc = 1 ORDER BY team DESC LIMIT 1) as dc1,
        (SELECT team FROM awards WHERE year = ${year} AND dc = 1 ORDER BY team ASC LIMIT 1) as dc2
      LIMIT 1;
    `;

    db.query(query, (err, result) => {
      if (err) {
        console.error('Error executing query:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.send(result.rows[0]);
      }
    });
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
