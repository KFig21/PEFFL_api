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

// get single season stats
router.get("/table/:year/:sortBy/:sortOrder/:table", async (req, res) => {
  try {
    const { year, sortBy, sortOrder, table } = req.params;

    // Determine season condition based on table parameter
    let seasonCondition = "";
    if (table === "RS") {
      seasonCondition = "AND season = 'r'";
    } else if (table === "playoffs") {
      seasonCondition = "AND season = 'p'";
    }

    // Generate dynamic week columns for regular weeks
    const weeksColumns = Array.from({ length: 13 }, (_, i) => `
        MAX(CASE WHEN week = ${i + 1}::varchar THEN pf END) AS week${i + 1},
        MAX(CASE WHEN week = ${i + 1}::varchar THEN win END) AS week${i + 1}_outcome,
        MAX(CASE WHEN week = ${i + 1}::varchar THEN opp END) AS week${i + 1}_opp,
        MAX(CASE WHEN week = ${i + 1}::varchar THEN pa END) AS week${i + 1}_pa`
    ).join(",\n");

    // Conditional week 14 column based on the year
    const week14Column = parseInt(year) > 2020 ? `
        MAX(CASE WHEN week = 14::varchar THEN pf END) AS week14,
        MAX(CASE WHEN week = 14::varchar THEN win END) AS week14_outcome,
        MAX(CASE WHEN week = 14::varchar THEN opp END) AS week14_opp,
        MAX(CASE WHEN week = 14::varchar THEN pa END) AS week14_pa,` : "";

    // Construct the complete query
    const query = `
      SELECT 
        team AS "team",
        ${weeksColumns},
        ${week14Column}
        MAX(CASE WHEN week = 'WC' THEN pf END) AS weekWc,
        MAX(CASE WHEN week = 'WC' THEN win END) AS weekWc_outcome,
        MAX(CASE WHEN week = 'WC' THEN opp END) AS weekWc_opp,
        MAX(CASE WHEN week = 'WC' THEN pa END) AS weekWc_pa,

        MAX(CASE WHEN week = 'SF' THEN pf END) AS weekSf,
        MAX(CASE WHEN week = 'SF' THEN win END) AS weekSf_outcome,
        MAX(CASE WHEN week = 'SF' THEN opp END) AS weekSf_opp,
        MAX(CASE WHEN week = 'SF' THEN pa END) AS weekSf_pa,

        MAX(CASE WHEN week = 'DC' THEN pf END) AS weekDc,
        MAX(CASE WHEN week = 'DC' THEN win END) AS weekDc_outcome,
        MAX(CASE WHEN week = 'DC' THEN opp END) AS weekDc_opp,
        MAX(CASE WHEN week = 'DC' THEN pa END) AS weekDc_pa,
        
        AVG(pf) AS ppg,
        AVG(pa) AS papg,
        SUM(pf) AS pf,
        SUM(pa) AS pa,
        SUM(win) AS w,
        SUM(loss) AS l,
        SUM(win + loss) AS g,
        SUM(pf - pa) AS dif,
        AVG(pf - pa) AS difpg
      FROM allGames
      WHERE year = ${parseInt(year)} ${seasonCondition}
      GROUP BY team
      ORDER BY ${sortBy} ${sortOrder}`;
      
    // Execute the query with the postgres library
    const result = await sql.unsafe(query);
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
