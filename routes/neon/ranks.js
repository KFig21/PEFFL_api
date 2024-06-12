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

// delete when done with neon integration
const { initializeDatabase } = require('../../database');
const db = initializeDatabase();

// OVERALL

// get ranks for Win%
router.get("/win/:table", async (req, res) => {
  try {
    const table = req.params.table;
    let whereClause = "";

    if (table === 'RS') { whereClause = `WHERE season = 'r'` } else if (table === 'playoffs') { whereClause = `WHERE season = 'p'` }

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
router.get("/ppg/:table", (req, res) => {
  let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
  db.all(
    `
    SELECT 
    AVG(pf) as "ppg"
    FROM allGames ${where}
    group by team
    order by ppg DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.ppg);
        res.send(arr);
      }
    }
  );
});

// get ranks for PAPG
router.get("/papg/:table", (req, res) => {
  let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
  db.all(
    `
    SELECT 
    AVG(pa) as "papg"
    FROM allGames ${where}
    group by team
    order by papg DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.papg);
        res.send(arr);
      }
    }
  );
});

// get ranks for DIFPG
router.get("/difpg/:table", (req, res) => {
  let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
  db.all(
    `
    SELECT 
    avg(pf) - avg(pa) as "difpg"
    FROM allGames ${where}
    group by team
    order by difpg DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.difpg);
        res.send(arr);
      }
    }
  );
});

// get ranks for PF
router.get("/pf/:table", (req, res) => {
  let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
  db.all(
    `
    SELECT 
    sum(pf) as "pf"
    FROM allGames ${where}
    group by team
    order by pf DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.pf);
        res.send(arr);
      }
    }
  );
});

// get ranks for PA
router.get("/pa/:table", (req, res) => {
  let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
  db.all(
    `
    SELECT 
    sum(pa) as "pa"
    FROM allGames ${where}
    group by team
    order by pa DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.pa);
        res.send(arr);
      }
    }
  );
});

// get ranks for DIF
router.get("/dif/:table", (req, res) => {
  let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
  db.all(
    `
    SELECT 
    sum(pf) - sum(pa) as "dif"
    FROM allGames ${where}
    group by team
    order by dif DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.dif);
        res.send(arr);
      }
    }
  );
});

//H2H

// get ranks for wins
router.get("/h2h/wins/:table", (req, res) => {
  let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
  db.all(
    `
    SELECT 
    (MIN(team, opp) || MAX(team, opp)) as code,
    team,
    opp,
    sum(win) as "w"
    FROM allGames ${where}
    group by team, opp
    Order By w DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.w);
        res.send(arr);
      }
    }
  );
});

// get ranks for ppg
router.get("/h2h/ppg/:table", (req, res) => {
  let where = req.params.table === 'RS' ? `WHERE season = 'r' AND` : req.params.table === 'playoffs' ? `WHERE season = 'p' AND` : `WHERE`
  db.all(
    `
    SELECT 
    (MIN(team, opp) || MAX(team, opp)) as code,
    team,
    opp,
    avg(pf) as "ppg"
    FROM allGames ${where}
    team != 'Taylor' AND team != 'AJ'
    and opp != 'Taylor' AND opp != 'AJ'
    group by team, opp
    Order By ppg DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.ppg);
        res.send(arr);
      }
    }
  );
});

// get ranks for ppg with AJ or Taylor
router.get("/h2h/filter/ppg/:table", (req, res) => {
  let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
  db.all(
    `
    SELECT 
    (MIN(team, opp) || MAX(team, opp)) as code,
    team,
    opp,
    avg(pf) as "ppg"
    FROM allGames ${where}
    group by team, opp
    Order By ppg DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.ppg);
        res.send(arr);
      }
    }
  );
});

// get ranks for pf
router.get("/h2h/pf/:table", (req, res) => {
  let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
  db.all(
    `
    SELECT 
    (MIN(team, opp) || MAX(team, opp)) as code,
    team,
    opp,
    sum(pf) as "pf"
    FROM allGames ${where}
    group by team, opp
    Order By pf DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.pf);
        res.send(arr);
      }
    }
  );
});

// get ranks for difpg
router.get("/h2h/difpg/:table", (req, res) => {
  let where = req.params.table === 'RS' ? `WHERE season = 'r' AND` : req.params.table === 'playoffs' ? `WHERE season = 'p' AND` : `WHERE`
  db.all(
    `
    SELECT 
    (MIN(team, opp) || MAX(team, opp)) as code,
    team,
    opp,
    avg(pf) - avg(pa)  as "difpg"
    FROM allGames ${where}
    team != 'Taylor' AND team != 'AJ'
    and opp != 'Taylor' AND opp != 'AJ'
    group by team, opp
    Order By difpg DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.difpg);
        res.send(arr);
      }
    }
  );
});

// get ranks for difpg with aj and taylor
router.get("/h2h/filter/difpg/:table", (req, res) => {
  let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
  db.all(
    `
    SELECT 
    (MIN(team, opp) || MAX(team, opp)) as code,
    team,
    opp,
    avg(pf) - avg(pa)  as "difpg"
    FROM allGames ${where}
    group by team, opp
    Order By difpg DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.difpg);
        res.send(arr);
      }
    }
  );
});

// get ranks for dif
router.get("/h2h/dif/:table", (req, res) => {
  let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
  db.all(
    `
    SELECT 
    (MIN(team, opp) || MAX(team, opp)) as code,
    team,
    opp,
    sum(pf) - sum(pa)  as "dif"
    FROM allGames ${where}
    group by team, opp
    Order By dif DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.dif);
        res.send(arr);
      }
    }
  );
});

module.exports = router;
