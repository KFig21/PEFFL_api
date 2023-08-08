const router = require("express").Router();
// const mysql = require("mysql");

// // mysql db connection
// const db = mysql.createConnection({
//   host: process.env.RDS_HOSTNAME,
//   user: process.env.RDS_USERNAME,
//   password: process.env.RDS_PASSWORD,
//   port: process.env.RDS_PORT,
// });

// // connect to db
// db.connect(function (err) {
//   if (err) {
//     console.error("Database connection failed: " + err.stack);
//     return;
//   }
// });

const { initializeDatabase } = require('../database');
const db = initializeDatabase();

// get team stats
router.get("/stats/:team", (req, res) => {
  let team = req.params.team;
  db.all(
    `
    SELECT *
    FROM 
    (SELECT 
    team,
    sum(win) as 'rs_W',
    sum(loss) as 'rs_L',
    sum(pf) as 'rs_PF',
    sum(pa) as 'rs_PA', 
    AVG(pf) as 'rs_PPG', 
    AVG(pa) as 'rs_PAPG', 
    sum(pf-pa) as 'rs_DIF', 
    AVG(pf-pa) as 'rs_DIFPG' 
    FROM allGames WHERE season = 'r'   
    AND team = '${team}'
    GROUP BY team) as rs
    
    JOIN
    
    (SELECT
    a.team,
    a.playoffs_W,
    a.playoffs_L,
    a.playoffs_PF,
    a.playoffs_PA,
    a.playoffs_PPG,
    a.playoffs_PAPG,
    a.playoffs_DIF,
    a.playoffs_DIFPG,
    a.playoffs_L + IFNULL(b.C, 0) as 'playoffs_A' 
    FROM (
		SELECT
		team,
		sum(win) as 'playoffs_W',
		sum(loss) as 'playoffs_L',
		sum(pf) as 'playoffs_PF',
		sum(pa) as 'playoffs_PA', 
		AVG(pf) as 'playoffs_PPG', 
		AVG(pa) as 'playoffs_PAPG', 
		sum(pf-pa) as 'playoffs_DIF', 
		AVG(pf-pa) as 'playoffs_DIFPG' 
		FROM allGames WHERE season = 'p'  
		AND team = '${team}'
		GROUP BY team) as a
        
        LEFT JOIN 
      
      (SELECT  
        team,  
        sum(win) as 'C', 
        sum(loss) as 'R'
        FROM allGames WHERE season = 'p' 
        AND week = 'DC'  
        GROUP BY team) as b
        
        ON a.team = b.team 
    
    ) as playoffs
    
    on rs.team = playoffs.team
    
    JOIN
    
    (SELECT  
    team, 
    sum(lc) as 'awards_Championships', 
    sum(ru) as 'awards_RunnerUps', 
    sum(rsc) as 'awards_RSC', 
    sum(p) as 'awards_MostPoints', 
    sum(dc) as 'awards_DivisionTitles', 
    sum(money) as 'awards_Money' 
    FROM awards
    WHERE team = '${team}') as awards

    on

    rs.team = awards.team
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

// get team stats IF NEVER MADE PLAYOFFS
router.get("/statsIfNeverMadePlayoffs/:team", (req, res) => {
  let team = req.params.team;
  db.all(
    `
    SELECT *
    FROM 
    (SELECT 
    team,
    sum(win) as 'rs_W',
    sum(loss) as 'rs_L',
    sum(pf) as 'rs_PF',
    sum(pa) as 'rs_PA', 
    AVG(pf) as 'rs_PPG', 
    AVG(pa) as 'rs_PAPG', 
    sum(pf-pa) as 'rs_DIF', 
    AVG(pf-pa) as 'rs_DIFPG' 
    FROM allGames WHERE season = 'r'   
    AND team = '${team}'
    GROUP BY team) as rs
    
    JOIN
    
    (SELECT  
    team, 
    sum(lc) as 'awards_Championships', 
    sum(ru) as 'awards_RunnerUps', 
    sum(rsc) as 'awards_RSC', 
    sum(p) as 'awards_MostPoints', 
    sum(dc) as 'awards_DivisionTitles', 
    sum(money) as 'awards_Money' 
    FROM awards
    WHERE team = '${team}') as awards

    on

    rs.team = awards.team
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

// get team H2H table
router.get("/headToHead/:team/:column/:order/:table", (req, res) => {
  let team = req.params.team;
  let col = req.params.column;
  let order = req.params.order;
  let where = req.params.table === 'RS' ? `WHERE season = 'r' AND` : req.params.table === 'playoffs' ? `WHERE season = 'p' AND` : `WHERE`

  db.all(
    `
    SELECT 
    team,
    avg(pf) as 'PPG',
    avg(pa) as'PAPG',
    sum(pf) as 'PF',
    sum(pa) as 'PA',
    opp,
    sum(win) as 'W',
    sum(loss) as 'L',
    sum(win)/(sum(win) + sum(loss)) as 'WinP',
    sum(win) + sum(loss) as 'G',
    sum(pf) - sum(pa)  as 'DIF',
    avg(pf) - avg(pa) as 'DIFPG',
    sum(pf) + sum(pa) as 'TOT',
    avg(pf) + avg(pa) as 'TOTPG'
    FROM allGames ${where}
    team = '${team}'
    group by opp
    order by ${col} ${order};`,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

// get team seasons table
router.get("/seasons/:team/:column/:order/:table", (req, res) => {
  let team = req.params.team;
  let col = req.params.column;
  let order = req.params.order;
  let where =
    req.params.table === "RS"
      ? "WHERE season = 'r' AND"
      : req.params.table === "playoffs"
      ? "WHERE season = 'p' AND"
      : "WHERE";

  db.all(
    `
    WITH week_data AS (
      SELECT
        year,
        team,
        week,
        pf,
        win,
        opp,
        pa
      FROM allGames
      ${where}
      team = ?
    )
    SELECT
      team AS 'team_',
      year AS 'year_',
      sum(win) AS 'W',
      sum(loss) AS 'L',
      sum(pf) AS 'PF',
      sum(pa) AS 'PA',
      avg(pf) AS 'PPG',
      avg(pa) AS 'PAPG',
      sum(pf) - sum(pa) AS 'DIF',
      avg(pf) - avg(pa) AS 'DIFPG',
      sum(pa) + sum(pf) AS 'TOT',
      (sum(pa) + sum(pf)) / (sum(win) + sum(loss)) AS 'TOTPG',

      MAX(CASE WHEN week = 1 THEN pf END) AS week1,
      MAX(CASE WHEN week = 1 THEN win END) AS week1_outcome,
      MAX(CASE WHEN week = 1 THEN opp END) AS week1_opp,
      MAX(CASE WHEN week = 1 THEN pa END) AS week1_pa,

      MAX(CASE WHEN week = 2 THEN pf END) AS week2,
      MAX(CASE WHEN week = 2 THEN win END) AS week2_outcome,
      MAX(CASE WHEN week = 2 THEN opp END) AS week2_opp,
      MAX(CASE WHEN week = 2 THEN pa END) AS week2_pa,

      MAX(CASE WHEN week = 3 THEN pf END) AS week3,
      MAX(CASE WHEN week = 3 THEN win END) AS week3_outcome,
      MAX(CASE WHEN week = 3 THEN opp END) AS week3_opp,
      MAX(CASE WHEN week = 3 THEN pa END) AS week3_pa,

      MAX(CASE WHEN week = 4 THEN pf END) AS week4,
      MAX(CASE WHEN week = 4 THEN win END) AS week4_outcome,
      MAX(CASE WHEN week = 4 THEN opp END) AS week4_opp,
      MAX(CASE WHEN week = 4 THEN pa END) AS week4_pa,

      MAX(CASE WHEN week = 5 THEN pf END) AS week5,
      MAX(CASE WHEN week = 5 THEN win END) AS week5_outcome,
      MAX(CASE WHEN week = 5 THEN opp END) AS week5_opp,
      MAX(CASE WHEN week = 5 THEN pa END) AS week5_pa,

      MAX(CASE WHEN week = 6 THEN pf END) AS week6,
      MAX(CASE WHEN week = 6 THEN win END) AS week6_outcome,
      MAX(CASE WHEN week = 6 THEN opp END) AS week6_opp,
      MAX(CASE WHEN week = 6 THEN pa END) AS week6_pa,

      MAX(CASE WHEN week = 7 THEN pf END) AS week7,
      MAX(CASE WHEN week = 7 THEN win END) AS week7_outcome,
      MAX(CASE WHEN week = 7 THEN opp END) AS week7_opp,
      MAX(CASE WHEN week = 7 THEN pa END) AS week7_pa,

      MAX(CASE WHEN week = 8 THEN pf END) AS week8,
      MAX(CASE WHEN week = 8 THEN win END) AS week8_outcome,
      MAX(CASE WHEN week = 8 THEN opp END) AS week8_opp,
      MAX(CASE WHEN week = 8 THEN pa END) AS week8_pa,

      MAX(CASE WHEN week = 9 THEN pf END) AS week9,
      MAX(CASE WHEN week = 9 THEN win END) AS week9_outcome,
      MAX(CASE WHEN week = 9 THEN opp END) AS week9_opp,
      MAX(CASE WHEN week = 9 THEN pa END) AS week9_pa,

      MAX(CASE WHEN week = 10 THEN pf END) AS week10,
      MAX(CASE WHEN week = 10 THEN win END) AS week10_outcome,
      MAX(CASE WHEN week = 10 THEN opp END) AS week10_opp,
      MAX(CASE WHEN week = 10 THEN pa END) AS week10_pa,

      MAX(CASE WHEN week = 11 THEN pf END) AS week11,
      MAX(CASE WHEN week = 11 THEN win END) AS week11_outcome,
      MAX(CASE WHEN week = 11 THEN opp END) AS week11_opp,
      MAX(CASE WHEN week = 11 THEN pa END) AS week11_pa,

      MAX(CASE WHEN week = 12 THEN pf END) AS week12,
      MAX(CASE WHEN week = 12 THEN win END) AS week12_outcome,
      MAX(CASE WHEN week = 12 THEN opp END) AS week12_opp,
      MAX(CASE WHEN week = 12 THEN pa END) AS week12_pa,

      MAX(CASE WHEN week = 13 THEN pf END) AS week13,
      MAX(CASE WHEN week = 13 THEN win END) AS week13_outcome,
      MAX(CASE WHEN week = 13 THEN opp END) AS week13_opp,
      MAX(CASE WHEN week = 13 THEN pa END) AS week13_pa,

      MAX(CASE WHEN week = 14 THEN pf END) AS week14,
      MAX(CASE WHEN week = 14 THEN win END) AS week14_outcome,
      MAX(CASE WHEN week = 14 THEN opp END) AS week14_opp,
      MAX(CASE WHEN week = 14 THEN pa END) AS week14_pa,

      MAX(CASE WHEN week = 'WC' THEN pf END) AS wc,
      MAX(CASE WHEN week = 'WC' THEN win END) AS weekWc_outcome,
      MAX(CASE WHEN week = 'WC' THEN opp END) AS weekWc_opp,
      MAX(CASE WHEN week = 'WC' THEN pa END) AS weekWc_pa,

      MAX(CASE WHEN week = 'SF' THEN pf END) AS sf,
      MAX(CASE WHEN week = 'SF' THEN win END) AS weekSf_outcome,
      MAX(CASE WHEN week = 'SF' THEN opp END) AS weekSf_opp,
      MAX(CASE WHEN week = 'SF' THEN pa END) AS weekSf_pa,

      MAX(CASE WHEN week = 'DC' THEN pf END) AS dc,
      MAX(CASE WHEN week = 'DC' THEN win END) AS weekDc_outcome,
      MAX(CASE WHEN week = 'DC' THEN opp END) AS weekDc_opp,
      MAX(CASE WHEN week = 'DC' THEN pa END) AS weekDc_pa

    FROM allGames
    ${where}
    team = ?
    GROUP BY year
    ORDER BY ${col} ${order}
  `,
    [team, team], // Pass team as a parameter value twice
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

// get all team seasons table
router.get("/allteams/:column/:order/:table", (req, res) => {
  let col = req.params.column;
  let order = req.params.order;
  let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
  db.all(
    `
    SELECT 
    team,
    year,
    sum(win) as 'W',
    sum(loss) as 'L',
    sum(pf) as 'PF',
    sum(pa) as 'PA',
    avg(pf) as 'PPG',
    avg(pa) as 'PAPG',
    sum(pf) - sum(pa)  as 'DIF',
    avg(pf) - avg(pa) as 'DIFPG',
    sum(pa) + sum(pf) as 'TOT',
    (sum(pa) + sum(pf))/(sum(win) + sum(loss)) as 'TOTPG'
    FROM allGames ${where}
    group by team, year
    order by ${col} ${order}`,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

// MEDALS allteams

// get allTeams medals
router.get("/allMedals/:table/:column", (req, res) => {
  const col = req.params.column;
  let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``

  db.all(
    `SELECT 
    team, 
    sum(win) as 'W',
    sum(loss) as 'L',
    sum(win) + sum(loss) as 'G',
    sum(win)/(sum(win) + sum(loss)) as 'WinP', 
    sum(pf) as 'PF',
    sum(pa) as 'PA',
    sum(pa) + sum(pf) as 'TOT',
    (sum(pa) + sum(pf))/(sum(win) + sum(loss)) as 'TOTPG',
    avg(pf) as 'PPG',
    avg(pa) as 'PAPG',
    sum(pf) - sum(pa)  as 'DIF',
    avg(pf) - avg(pa) as 'DIFPG'
    FROM allGames ${where} 
    group by team, year
    ORDER BY ${col} DESC 
    LIMIT 3`,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = [];
        // format for per game stats
        if (
          col === "PPG" ||
          col === "PAPG" ||
          col === "DIFPG" ||
          col === "TOTPG"
        ) {
          result.forEach((el) =>
            arr.push((Math.round(el[col] * 100) / 100).toFixed(1))
          );
          // format for counting stats
        } else {
          result.forEach((el) => arr.push(el[col]));
        }
        res.send(arr);
      }
    }
  );
});

module.exports = router;
