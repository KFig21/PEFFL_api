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

// OVERALL

// get ranks for Win%
router.get("/win/:table", async (req, res) => {
  try {
    const table = req.params.table;
    let whereClause = table === 'RS' ? `WHERE season = 'r'` : table === 'playoffs' ? `WHERE season = 'p'` : '';

    const query = `
      SELECT 
        team,
        SUM(win) / (SUM(win) + SUM(loss)) AS w
      FROM allGames
      ${whereClause}
      GROUP BY team
      ORDER BY w DESC
    `;

    const result = await sql.unsafe(query);
    const arr = result.map(obj => obj.w);
    res.send(arr);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// get ranks for PPG
router.get("/ppg/:table", async (req, res) => {
  try {
    const table = req.params.table;
    let whereClause = table === 'RS' ? `WHERE season = 'r'` : table === 'playoffs' ? `WHERE season = 'p'` : '';

    const query = `
      SELECT 
        team,
        AVG(pf) AS ppg
      FROM allGames
      ${whereClause}
      GROUP BY team
      ORDER BY ppg DESC
    `;

    const result = await sql.unsafe(query);
    const arr = result.map(obj => obj.ppg);
    res.send(arr);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// get ranks for PAPG
router.get("/papg/:table", async (req, res) => {
  try {
    const table = req.params.table;
    let whereClause = table === 'RS' ? `WHERE season = 'r'` : table === 'playoffs' ? `WHERE season = 'p'` : '';

    const query = `
      SELECT 
        team,
        AVG(pa) AS papg
      FROM allGames
      ${whereClause}
      GROUP BY team
      ORDER BY papg DESC
    `;

    const result = await sql.unsafe(query);
    const arr = result.map(obj => obj.papg);
    res.send(arr);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// get ranks for DIFPG
router.get("/difpg/:table", async (req, res) => {
  try {
    const table = req.params.table;
    let whereClause = table === 'RS' ? `WHERE season = 'r'` : table === 'playoffs' ? `WHERE season = 'p'` : '';

    const query = `
      SELECT 
        team,
        AVG(pf) - AVG(pa) AS difpg
      FROM allGames
      ${whereClause}
      GROUP BY team
      ORDER BY difpg DESC
    `;

    const result = await sql.unsafe(query);
    const arr = result.map(obj => obj.difpg);
    res.send(arr);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// get ranks for PF
router.get("/pf/:table", async (req, res) => {
  try {
    const table = req.params.table;
    let whereClause = table === 'RS' ? `WHERE season = 'r'` : table === 'playoffs' ? `WHERE season = 'p'` : '';

    const query = `
      SELECT 
        team,
        SUM(pf) AS pf
      FROM allGames
      ${whereClause}
      GROUP BY team
      ORDER BY pf DESC
    `;

    const result = await sql.unsafe(query);
    const arr = result.map(obj => obj.pf);
    res.send(arr);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// get ranks for PA
router.get("/pa/:table", async (req, res) => {
  try {
    const table = req.params.table;
    let whereClause = table === 'RS' ? `WHERE season = 'r'` : table === 'playoffs' ? `WHERE season = 'p'` : '';

    const query = `
      SELECT 
        team,
        SUM(pa) AS pa
      FROM allGames
      ${whereClause}
      GROUP BY team
      ORDER BY pa DESC
    `;

    const result = await sql.unsafe(query);
    const arr = result.map(obj => obj.pa);
    res.send(arr);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// get ranks for DIF
router.get("/dif/:table", async (req, res) => {
  try {
    const table = req.params.table;
    let whereClause = table === 'RS' ? `WHERE season = 'r'` : table === 'playoffs' ? `WHERE season = 'p'` : '';

    const query = `
      SELECT 
        team,
        SUM(pf) - SUM(pa) AS dif
      FROM allGames
      ${whereClause}
      GROUP BY team
      ORDER BY dif DESC
    `;

    const result = await sql.unsafe(query);
    const arr = result.map(obj => obj.dif);
    res.send(arr);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// get ranks for H2H wins
router.get("/h2h/wins/:table", async (req, res) => {
  try {
    const table = req.params.table;
    let whereClause = table === 'RS' ? `WHERE season = 'r'` : table === 'playoffs' ? `WHERE season = 'p'` : '';

    const query = `
      SELECT 
        (LEAST(team, opp) || GREATEST(team, opp)) AS code,
        team,
        opp,
        SUM(win) AS w
      FROM allGames
      ${whereClause}
      GROUP BY team, opp
      ORDER BY w DESC
    `;

    const result = await sql.unsafe(query);
    const arr = result.map(obj => obj.w);
    res.send(arr);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// get ranks for H2H ppg
router.get("/h2h/ppg/:table", async (req, res) => {
  try {
    const table = req.params.table;
    let whereClause = table === 'RS' ? `WHERE season = 'r' AND` : table === 'playoffs' ? `WHERE season = 'p' AND` : 'WHERE';

    const query = `
      SELECT 
        (LEAST(team, opp) || GREATEST(team, opp)) AS code,
        team,
        opp,
        AVG(pf) AS ppg
      FROM allGames
      ${whereClause}
      team != 'Taylor' AND team != 'AJ' AND opp != 'Taylor' AND opp != 'AJ'
      GROUP BY team, opp
      ORDER BY ppg DESC
    `;

    const result = await sql.unsafe(query);
    const arr = result.map(obj => obj.ppg);
    res.send(arr);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// get ranks for H2H ppg with AJ or Taylor
router.get("/h2h/filter/ppg/:table", async (req, res) => {
  try {
    const table = req.params.table;
    let whereClause = table === 'RS' ? `WHERE season = 'r'` : table === 'playoffs' ? `WHERE season = 'p'` : '';

    const query = `
      SELECT 
        (LEAST(team, opp) || GREATEST(team, opp)) AS code,
        team,
        opp,
        AVG(pf) AS ppg
      FROM allGames
      ${whereClause}
      GROUP BY team, opp
      ORDER BY ppg DESC
    `;

    const result = await sql.unsafe(query);
    const arr = result.map(obj => obj.ppg);
    res.send(arr);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// get ranks for H2H pf
router.get("/h2h/pf/:table", async (req, res) => {
  try {
    const table = req.params.table;
    let whereClause = table === 'RS' ? `WHERE season = 'r'` : table === 'playoffs' ? `WHERE season = 'p'` : '';

    const query = `
      SELECT 
        (LEAST(team, opp) || GREATEST(team, opp)) AS code,
        team,
        opp,
        SUM(pf) AS pf
      FROM allGames
      ${whereClause}
      GROUP BY team, opp
      ORDER BY pf DESC
    `;

    const result = await sql.unsafe(query);
    const arr = result.map(obj => obj.pf);
    res.send(arr);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// get ranks for H2H difpg
router.get("/h2h/difpg/:table", async (req, res) => {
  try {
    const table = req.params.table;
    let whereClause = table === 'RS' ? `WHERE season = 'r' AND` : table === 'playoffs' ? `WHERE season = 'p' AND` : 'WHERE';

    const query = `
      SELECT 
        (LEAST(team, opp) || GREATEST(team, opp)) AS code,
        team,
        opp,
        AVG(pf) - AVG(pa) AS difpg
      FROM allGames
      ${whereClause}
      team != 'Taylor' AND team != 'AJ' AND opp != 'Taylor' AND opp != 'AJ'
      GROUP BY team, opp
      ORDER BY difpg DESC
    `;

    const result = await sql.unsafe(query);
    const arr = result.map(obj => obj.difpg);
    res.send(arr);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// get ranks for H2H difpg with AJ and Taylor
router.get("/h2h/filter/difpg/:table", async (req, res) => {
  try {
    const table = req.params.table;
    let whereClause = table === 'RS' ? `WHERE season = 'r'` : table === 'playoffs' ? `WHERE season = 'p'` : '';

    const query = `
      SELECT 
        (LEAST(team, opp) || GREATEST(team, opp)) AS code,
        team,
        opp,
        AVG(pf) - AVG(pa) AS difpg
      FROM allGames
      ${whereClause}
      GROUP BY team, opp
      ORDER BY difpg DESC
    `;

    const result = await sql.unsafe(query);
    const arr = result.map(obj => obj.difpg);
    res.send(arr);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// get ranks for H2H dif
router.get("/h2h/dif/:table", async (req, res) => {
  try {
    const table = req.params.table;
    let whereClause = table === 'RS' ? `WHERE season = 'r'` : table === 'playoffs' ? `WHERE season = 'p'` : '';

    const query = `
      SELECT 
        (LEAST(team, opp) || GREATEST(team, opp)) AS code,
        team,
        opp,
        SUM(pf) - SUM(pa) AS dif
      FROM allGames
      ${whereClause}
      GROUP BY team, opp
      ORDER BY dif DESC
    `;

    const result = await sql.unsafe(query);
    const arr = result.map(obj => obj.dif);
    res.send(arr);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
