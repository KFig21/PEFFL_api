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

// get team names
router.get("/teams", async (req, res) => {
  try {
    const result = await sql`
      SELECT team
      FROM allgames
      GROUP BY team
      ORDER BY SUM(win) DESC
    `;
    res.send(result);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get standings ( rs / playoff / ag )
router.get("/standings/:column/:order/:table", async (req, res) => {
  const { column, order, table } = req.params;
  const upperTable = table.toUpperCase();
  const whereClause = upperTable === 'RS' ? `WHERE season = 'r'` : upperTable === 'PLAYOFFS' ? `WHERE season = 'p'` : '';

  // Handling the 'A' column case
  const col2 = column === 'A' ? 'SUM(win)' : column;

  try {
    const baseQuery = `
      SELECT 
        a.team as team, 
        a.l + COALESCE(b.c, 0) as a, 
        a.g as g, 
        a.w as w, 
        a.l as l, 
        a.pf as pf, 
        a.pa as pa, 
        a.ppg as ppg, 
        a.papg as papg, 
        a.dif as dif, 
        a.difpg as difpg, 
        a.tot as tot, 
        a.totpg as totpg, 
        COALESCE(b.c, 0) as c, 
        COALESCE(b.r, 0) as r 
      FROM (
        SELECT 
          team, 
          SUM(win) as w, 
          SUM(loss) as l, 
          SUM(win) + SUM(loss) as g,   
          SUM(pf) as pf, 
          SUM(pa) as pa, 
          AVG(pf) as ppg, 
          AVG(pa) as papg, 
          SUM(pf) - SUM(pa) as dif,
          AVG(pf) - AVG(pa) as difpg,
          SUM(pa) + SUM(pf) as tot,
          (SUM(pa) + SUM(pf)) / (SUM(win) + SUM(loss)) as totpg
        FROM allgames ${whereClause}
        GROUP BY team
      ) as a
      LEFT JOIN (
        SELECT  
          team,  
          SUM(win) as c, 
          SUM(loss) as r
        FROM allgames
        WHERE week = 'DC'  
        GROUP BY team
      ) as b ON a.team = b.team
    `;

    // Adding dynamic ORDER BY clause
    const orderQuery = `
      ORDER BY ${col2} ${order.toUpperCase()}, pf DESC
    `;

    const finalQuery = baseQuery + orderQuery;

    // Execute the query
    const result = await sql.unsafe(finalQuery);
    res.send(result);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get all standings medals
router.get("/medals/:table/:column", async (req, res) => {
  const { column, table } = req.params;
  const validColumns = ["W", "L", "G", "WinP", "PF", "PA", "TOT", "TOTPG", "PPG", "PAPG", "DIF", "DIFPG"];

  if (!validColumns.includes(column)) {
    return res.status(400).json({ error: 'Invalid column parameter' });
  }

  const whereClause = table.toUpperCase() === 'RS' ? `season = 'r'` : table.toUpperCase() === 'PLAYOFFS' ? `season = 'p'` : '';
  const columnLowerCase = column.toLowerCase();

  try {
    const baseQuery = `
      SELECT 
        team, 
        SUM(win) as w,
        SUM(loss) as l,
        SUM(win) + SUM(loss) as g,
        SUM(win)/(SUM(win) + SUM(loss)) as winp, 
        SUM(pf) as pf,
        SUM(pa) as pa,
        SUM(pa) + SUM(pf) as tot,
        (SUM(pa) + SUM(pf))/(SUM(win) + SUM(loss)) as totpg,
        AVG(pf) as ppg,
        AVG(pa) as papg,
        SUM(pf) - SUM(pa) as dif,
        AVG(pf) - AVG(pa) as difpg
      FROM allgames
      ${whereClause ? `WHERE ${whereClause}` : ''}
      GROUP BY team
      ORDER BY ${columnLowerCase} DESC 
      LIMIT 3
    `;

    // Execute the query
    const result = await sql.unsafe(baseQuery);
    const arr = result.map(el => {
      if (["ppg", "papg", "difpg", "totpg"].includes(columnLowerCase)) {
        return (Math.round(el[columnLowerCase] * 100) / 100).toFixed(1);
      } else if (columnLowerCase === "winp") {
        return el[columnLowerCase] === 1 ? "1.000" : (Math.round(el[columnLowerCase] * 1000) / 1000).toFixed(3).toString().substring(1);
      } else {
        return el[columnLowerCase];
      }
    });
    
    res.send(arr);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// MEDALS

// get regular season rank medals
router.get("/standingsRank/:table", async (req, res) => {
  const { table } = req.params;
  // idk why but neon/postgres wont let me use a template literal here, it's annoying
  const where = table.toUpperCase() === 'RS' ? `WHERE season = 'r'` : table.toUpperCase() === 'PLAYOFFS' ? `WHERE season = 'p'` : '';

  try {
    const result = table.toUpperCase() === 'RS' ? 
    await sql`
      SELECT 
        team 
      FROM allgames 
      WHERE season = 'r'
      GROUP BY team 
      ORDER BY sum(win) DESC, sum(pf) DESC
    ` : table.toUpperCase() === 'PLAYOFFS' ? 
    await sql`
      SELECT 
        team 
      FROM allgames 
      WHERE season = 'p'
      GROUP BY team 
      ORDER BY sum(win) DESC, sum(pf) DESC
    ` :
    await sql`
      SELECT 
        team 
      FROM allgames
      GROUP BY team 
      ORDER BY sum(win) DESC, sum(pf) DESC
    `;
    
    const arr = result.map(obj => obj.team);
    res.send(arr);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
