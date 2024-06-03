const router = require("express").Router();

const postgres = require('postgres');
require('dotenv').config();

let { NEON_HOST, NEON_DATABASE, NEON_USER, NEON_PASSWORD, NEON_ENDPOINT_ID } = process.env;

const sql = postgres({
  host: NEON_HOST,
  database: NEON_DATABASE,
  username: NEON_USER,
  password: NEON_PASSWORD,
  port: 5432,
  ssl: 'require',
  connection: {
    options: `project=${NEON_ENDPOINT_ID}`,
  },
});

// delete when converted to neon
const { initializeDatabase } = require('../../database');
const db = initializeDatabase();

// get single season stats
router.get("/table/:year/:sortBy/:sortOrder/:table", async (req, res) => {
  try {
    const year = req.params.year;
    const sortBy = req.params.sortBy;
    const sortOrder = req.params.sortOrder;
    const season =
      req.params.table === "RS"
        ? `AND season = 'r'`
        : req.params.table === "playoffs"
        ? `AND season = 'p'`
        : "";

    const weeksColumns = Array.from({ length: 13 }, (_, i) => `
      MAX(CASE WHEN week = $${i + 2} THEN pf END) as week${i + 1},
      MAX(CASE WHEN week = $${i + 2} THEN win END) as week${i + 1}_outcome,
      MAX(CASE WHEN week = $${i + 2} THEN opp END) as week${i + 1}_opp,
      MAX(CASE WHEN week = $${i + 2} THEN pa END) as week${i + 1}_pa`
    ).join(",\n");

    const week14Column =
      year > 2020
        ? `MAX(CASE WHEN week = 14 THEN pf END) as week14,
           MAX(CASE WHEN week = 14 THEN win END) as week14_outcome,
           MAX(CASE WHEN week = 14 THEN opp END) as week14_opp,
           MAX(CASE WHEN week = 14 THEN pa END) as week14_pa,`
        : "";

    const query = sql`
      SELECT 
        team as "team",
        ${weeksColumns},
        ${week14Column}
        MAX(CASE WHEN week = 'WC' THEN pf END) as weekWc,
        MAX(CASE WHEN week = 'WC' THEN win END) as weekWc_outcome,
        MAX(CASE WHEN week = 'WC' THEN opp END) as weekWc_opp,
        MAX(CASE WHEN week = 'WC' THEN pa END) as weekWc_pa,
        MAX(CASE WHEN week = 'SF' THEN pf END) as weekSf,
        MAX(CASE WHEN week = 'SF' THEN win END) as weekSf_outcome,
        MAX(CASE WHEN week = 'SF' THEN opp END) as weekSf_opp,
        MAX(CASE WHEN week = 'SF' THEN pa END) as weekSf_pa,
        MAX(CASE WHEN week = 'DC' THEN pf END) as weekDc,
        MAX(CASE WHEN week = 'DC' THEN win END) as weekDc_outcome,
        MAX(CASE WHEN week = 'DC' THEN opp END) as weekDc_opp,
        MAX(CASE WHEN week = 'DC' THEN pa END) as weekDc_pa,
        AVG(pf) as ppg,
        AVG(pa) as papg,
        SUM(pf) as pf,
        SUM(pa) as pa, 
        SUM(win) as w,
        SUM(loss) as l,
        SUM(win + loss) as g,
        SUM(pf - pa) as dif,
        AVG(pf - pa) as difpg
      FROM allGames
      WHERE year = ${year} ${season}
      GROUP BY team
      ORDER BY ${sortBy} ${sortOrder}`;

    const result = await sql.unsafe(query, year);
    res.send(result);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});





// get single season trophies
router.get("/trophies/:year", async (req, res) => {
  const { year } = req.params;

  try {
    const result = await sql`
      SELECT  
        (SELECT 
          team
          FROM awards
          WHERE year = ${year}
          AND lc = 1) as lc,
          
        (SELECT 
          team
          FROM awards
          WHERE year = ${year}
          AND ru = 1) as ru,
          
        (SELECT 
          team
          FROM awards
          WHERE year = ${year}
          AND rsc = 1) as rsc,
          
        (SELECT 
          team
          FROM awards
          WHERE year = ${year}
          AND p = 1) as p,
          
        (SELECT 
          team
          FROM awards
          WHERE year = ${year}
          AND dc = 1
          ORDER BY team DESC
          LIMIT 1) as dc1,
          
        (SELECT 
          team
          FROM awards
          WHERE year = ${year}
          AND dc = 1
          ORDER BY team ASC
          LIMIT 1) as dc2
      FROM awards
      WHERE year = ${year}
      LIMIT 1;
    `;

    res.send(result[0]);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
