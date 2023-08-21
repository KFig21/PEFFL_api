const router = require("express").Router();
const pool = require("../pool");

const { initializeDatabase } = require('../database');
const db = initializeDatabase();

// get team stats
router.get("/stats/:team", async (req, res) => {
  try {
    const db_ = await pool.connect()
    let team = req.params.team;
    
    const awardsQuery = `
      SELECT  
        team, 
        sum(lc) as "awards_Championships", 
        sum(ru) as "awards_RunnerUps", 
        sum(rsc) as "awards_RSC", 
        sum(p) as "awards_MostPoints", 
        sum(dc) as "awards_DivisionTitles", 
        sum(money) as "awards_Money" 
      FROM awards
      WHERE team = '${team}'
      GROUP BY team
    `

    const playoffsQuery = `
      SELECT
        team,
        sum(win) as "playoffs_w",
        sum(loss) as "playoffs_l",
        sum(pf) as "playoffs_pf",
        sum(pa) as "playoffs_pa", 
        AVG(pf) as "playoffs_ppg", 
        AVG(pa) as "playoffs_paPG", 
        sum(pf-pa) as "playoffs_dif", 
        AVG(pf-pa) as "playoffs_difpg" 
      FROM allGames WHERE season = 'p'  
      AND team = '${team}'
      GROUP BY team
    `

    const rsQuery = `
      SELECT 
        team,
        sum(win) as "rs_w",
        sum(loss) as "rs_l",
        sum(pf) as "rs_pf",
        sum(pa) as "rs_pa", 
        AVG(pf) as "rs_ppg", 
        AVG(pa) as "rs_paPG", 
        sum(pf-pa) as "rs_dif", 
        AVG(pf-pa) as "rs_difpg" 
      FROM allGames WHERE season = 'r'   
      AND team = '${team}'
      GROUP BY team
    `

    const [awardsResult, playoffsResult, rsResult] = await Promise.all([
      db_.query(awardsQuery),
      db_.query(playoffsQuery),
      db_.query(rsQuery),
    ]);

    let floats = ['playoffs_difpg', 'playoffs_paPG', 'playoffs_ppg', 'rs_difpg', 'rs_paPG', 'rs_ppg']
    let ints = ['awards_Championships', 'awards_RunnerUps', 'awards_RSC', 'awards_MostPoints', 'awards_DivisionTitles', 'awards_Money', 'playoffs_A', 'playoffs_dif', 'playoffs_l', 'playoffs_pf', 'playoffs_pa', 'playoffs_w', 'rs_dif', 'rs_l', 'rs_pf', 'rs_pa', 'rs_w']
    
    function transformRows(rows) {
      rows.forEach(row => {
        Object.keys(row).forEach(key => {
          if (floats.includes(key)) { row[key] = parseFloat(parseFloat(row[key]).toFixed(3)); }
          if (ints.includes(key)) { row[key] = parseInt(row[key]); }
        });
      });
    }
    
    transformRows(awardsResult.rows);
    transformRows(playoffsResult.rows);
    transformRows(rsResult.rows);

    let obj = {...awardsResult.rows[0], ...playoffsResult.rows[0], ...rsResult.rows[0]}
    res.send(obj)
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get team H2H table
router.get("/headToHead/:team/:column/:order/:table", async (req, res) => {
  try {
    const db = await pool.connect()
    let team = req.params.team;
    let col = req.params.column;
    let order = req.params.order;
    let where =
      req.params.table === "RS"
        ? `WHERE season = 'r' AND`
        : req.params.table === "playoffs"
        ? `WHERE season = 'p' AND`
        : `WHERE`;

    db.query(
      `
      SELECT 
        team,
        avg(pf) as "ppg",
        avg(pa) as "papg",
        sum(pf) as "pf",
        sum(pa) as "pa",
        opp,
        sum(win) as "w",
        sum(loss) as "l",
        sum(win) / (sum(win) + sum(loss)) as "winp",
        sum(win) + sum(loss) as "g",
        sum(pf) - sum(pa)  as "dif",
        avg(pf) - avg(pa) as "difpg",
        sum(pf) + sum(pa) as "tot",
        avg(pf) + avg(pa) as "totpg"
      FROM allGames
      ${where}
        team = '${team}'
      GROUP BY opp, team
      ORDER BY ${col} ${order};
    `,
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          let floats = ['difpg', 'papg', 'ppg', 'winp', 'totpg']
          let ints = ['dif', 'l', 'pf', 'pa', 'w', 'g', 'tot']

          result.rows.forEach(row => {
            Object.keys(row).forEach(key => {
              if (floats.includes(key)) { row[key] = parseFloat(parseFloat(row[key]).toFixed(3)); }
              if (ints.includes(key)) { row[key] = parseInt(row[key]); }
            });
          });

          res.send(result.rows);
        }
      }
    );
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// get team seasons table
router.get("/seasons/:team/:column/:order/:table", async (req, res) => {
  try {
    const db_ = await pool.connect()
    let col = req.params.column;
    let order = req.params.order;
    let team = req.params.team;
    let where = 'where'

    db_.query(`   
      SELECT
        team as "team_",
        year as "year_",
        sum(win) AS "w",
        sum(loss) AS "l",
        sum(pf) AS "pf",
        sum(pa) AS "pa",
        avg(pf) AS "ppg",
        avg(pa) AS "papg",
        sum(pf) - sum(pa) AS "dif",
        avg(pf) - avg(pa) AS "difpg",
        sum(pa) + sum(pf) AS "tot",
        (sum(pa) + sum(pf)) / (sum(win) + sum(loss)) AS "totpg",

        MAX(CASE WHEN week = '1' THEN pf END) AS week1,
        MAX(CASE WHEN week = '1' THEN win END) AS week1_outcome,
        MAX(CASE WHEN week = '1' THEN opp END) AS week1_opp,
        MAX(CASE WHEN week = '1' THEN pa END) AS week1_pa,

        MAX(CASE WHEN week = '2' THEN pf END) AS week2,
        MAX(CASE WHEN week = '2' THEN win END) AS week2_outcome,
        MAX(CASE WHEN week = '2' THEN opp END) AS week2_opp,
        MAX(CASE WHEN week = '2' THEN pa END) AS week2_pa,

        MAX(CASE WHEN week = '3' THEN pf END) AS week3,
        MAX(CASE WHEN week = '3' THEN win END) AS week3_outcome,
        MAX(CASE WHEN week = '3' THEN opp END) AS week3_opp,
        MAX(CASE WHEN week = '3' THEN pa END) AS week3_pa,

        MAX(CASE WHEN week = '4' THEN pf END) AS week4,
        MAX(CASE WHEN week = '4' THEN win END) AS week4_outcome,
        MAX(CASE WHEN week = '4' THEN opp END) AS week4_opp,
        MAX(CASE WHEN week = '4' THEN pa END) AS week4_pa,

        MAX(CASE WHEN week = '5' THEN pf END) AS week5,
        MAX(CASE WHEN week = '5' THEN win END) AS week5_outcome,
        MAX(CASE WHEN week = '5' THEN opp END) AS week5_opp,
        MAX(CASE WHEN week = '5' THEN pa END) AS week5_pa,

        MAX(CASE WHEN week = '6' THEN pf END) AS week6,
        MAX(CASE WHEN week = '6' THEN win END) AS week6_outcome,
        MAX(CASE WHEN week = '6' THEN opp END) AS week6_opp,
        MAX(CASE WHEN week = '6' THEN pa END) AS week6_pa,

        MAX(CASE WHEN week = '7' THEN pf END) AS week7,
        MAX(CASE WHEN week = '7' THEN win END) AS week7_outcome,
        MAX(CASE WHEN week = '7' THEN opp END) AS week7_opp,
        MAX(CASE WHEN week = '7' THEN pa END) AS week7_pa,

        MAX(CASE WHEN week = '8' THEN pf END) AS week8,
        MAX(CASE WHEN week = '8' THEN win END) AS week8_outcome,
        MAX(CASE WHEN week = '8' THEN opp END) AS week8_opp,
        MAX(CASE WHEN week = '8' THEN pa END) AS week8_pa,

        MAX(CASE WHEN week = '9' THEN pf END) AS week9,
        MAX(CASE WHEN week = '9' THEN win END) AS week9_outcome,
        MAX(CASE WHEN week = '9' THEN opp END) AS week9_opp,
        MAX(CASE WHEN week = '9' THEN pa END) AS week9_pa,

        MAX(CASE WHEN week = '10' THEN pf END) AS week10,
        MAX(CASE WHEN week = '10' THEN win END) AS week10_outcome,
        MAX(CASE WHEN week = '10' THEN opp END) AS week10_opp,
        MAX(CASE WHEN week = '10' THEN pa END) AS week10_pa,

        MAX(CASE WHEN week = '11' THEN pf END) AS week11,
        MAX(CASE WHEN week = '11' THEN win END) AS week11_outcome,
        MAX(CASE WHEN week = '11' THEN opp END) AS week11_opp,
        MAX(CASE WHEN week = '11' THEN pa END) AS week11_pa,

        MAX(CASE WHEN week = '12' THEN pf END) AS week12,
        MAX(CASE WHEN week = '12' THEN win END) AS week12_outcome,
        MAX(CASE WHEN week = '12' THEN opp END) AS week12_opp,
        MAX(CASE WHEN week = '12' THEN pa END) AS week12_pa,

        MAX(CASE WHEN week = '13' THEN pf END) AS week13,
        MAX(CASE WHEN week = '13' THEN win END) AS week13_outcome,
        MAX(CASE WHEN week = '13' THEN opp END) AS week13_opp,
        MAX(CASE WHEN week = '13' THEN pa END) AS week13_pa,

        MAX(CASE WHEN week = '14' THEN pf END) AS week14,
        MAX(CASE WHEN week = '14' THEN win END) AS week14_outcome,
        MAX(CASE WHEN week = '14' THEN opp END) AS week14_opp,
        MAX(CASE WHEN week = '14' THEN pa END) AS week14_pa,

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
        MAX(CASE WHEN week = 'DC' THEN pa END) AS weekDc_pa

      FROM allGames
      ${where}
      team = '${team}'
      GROUP BY year, team
      ORDER BY ${col} ${order}
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result.rows)
      }
    });
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get all team seasons table
router.get("/allteams/:column/:order/:table", async (req, res) => {
  try {
    const db_ = await pool.connect()
    let col = req.params.column;
    let order = req.params.order;
    let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
    db_.query(
      `
      SELECT 
      team,
      year,
      sum(win) as w,
      sum(loss) as l,
      sum(pf) as pf,
      sum(pa) as pa,
      avg(pf) as ppg,
      avg(pa) as papg,
      sum(pf) - sum(pa)  as dif,
      avg(pf) - avg(pa) as difpg,
      sum(pa) + sum(pf) as tot,
      (sum(pa) + sum(pf))/(sum(win) + sum(loss)) as totpg
      FROM allGames ${where}
      group by team, year
      order by ${col} ${order}`,
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          let floats = ['difpg', 'papg', 'ppg', 'winp', 'totpg']
          let ints = ['year', 'dif', 'l', 'pf', 'pa', 'w', 'g', 'tot']

          result.rows.forEach(row => {
            Object.keys(row).forEach(key => {
              if (floats.includes(key)) { row[key] = parseFloat(parseFloat(row[key]).toFixed(3)); }
              if (ints.includes(key)) { row[key] = parseInt(row[key]); }
            });
          });
          res.send(result.rows);
        }
      }
    );
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// MEDALS allteams

// get allTeams medals
router.get("/allMedals/:table/:column", async (req, res) => {
  try {
    const col = req.params.column.toLowerCase();
    let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``;

    const query = `
      SELECT 
        team, 
        sum(win) as w,
        sum(loss) as l,
        sum(win) + sum(loss) as g,
        sum(win)/(sum(win) + sum(loss)) as winp, 
        sum(pf) as pf,
        sum(pa) as pa,
        sum(pa) + sum(pf) as tot,
        (sum(pa) + sum(pf))/(sum(win) + sum(loss)) as totpg,
        avg(pf) as ppg,
        avg(pa) as papg,
        sum(pf) - sum(pa) as dif,
        avg(pf) - avg(pa) as difpg
      FROM allGames ${where} 
      GROUP BY team, year
      ORDER BY ${col} DESC 
      LIMIT 3
    `;

    const { rows } = await pool.query(query);

    let arr = [];
    rows.forEach(el => {
      if (col === "ppg" || col === "papg" || col === "difpg" || col === "totpg") {
        arr.push((Math.round(parseFloat(el[col]) * 100) / 100).toFixed(1));
      } else {
        arr.push(parseInt(el[col]));
      }
    });
    res.send(arr);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred.");
  }
});

module.exports = router;
