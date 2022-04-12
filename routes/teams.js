const router = require("express").Router();
const mysql = require("mysql");

// mysql db connection
const db = mysql.createConnection({
  host: process.env.RDS_HOSTNAME,
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  port: process.env.RDS_PORT,
});

// connect to db
db.connect(function (err) {
  if (err) {
    console.error("Database connection failed: " + err.stack);
    return;
  }
});

// get team stats
router.get("/stats/:team", (req, res) => {
  let team = req.params.team;
  db.query(
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
    FROM peffl_data.PEFFL_RS   
    WHERE team = '${team}'
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
		FROM peffl_data.PEFFL_playoffs   
		WHERE team = '${team}'
		GROUP BY team) as a
        
        LEFT JOIN 
      
      (SELECT  
        team,  
        sum(win) as 'C', 
        sum(loss) as 'R'
        FROM peffl_data.PEFFL_playoffs  
        WHERE week = 'DC'  
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
    FROM peffl_data.PEFFL_awards 
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
  db.query(
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
    FROM peffl_data.PEFFL_RS   
    WHERE team = '${team}'
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
    FROM peffl_data.PEFFL_awards 
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
  let table = req.params.table;
  db.query(
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
    FROM peffl_data.PEFFL_${table}
    where team = '${team}'
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
  let table = req.params.table;

  db.query(
    `
    SELECT 
    team as 'team_',
    year as 'year_',
    sum(win) as 'W',
    sum(loss) as 'L',
    sum(pf) as 'PF',
    sum(pa) as 'PA',
    avg(pf) as 'PPG',
    avg(pa) as 'PAPG',
    sum(pf) - sum(pa)  as 'DIF',
    avg(pf) - avg(pa) as 'DIFPG', 
    sum(pa) + sum(pf) as 'TOT',
    (sum(pa) + sum(pf))/(sum(win) + sum(loss)) as 'TOTPG',

      (SELECT 
        pf
        FROM peffl_data.PEFFL_RS
        WHERE year = year_
        AND week = 1
        AND team = team_) as week1,
      
        (SELECT 
          win
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 1
          AND team = team_) as week1_outcome,

        (SELECT 
          opp
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 1
          AND team = team_) as week1_opp,
    
        (SELECT 
          pa
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 1
          AND team = team_) as week1_pa,
      
      (SELECT 
        pf
        FROM peffl_data.PEFFL_RS
        WHERE year = year_
        AND week = 2
        AND team = team_) as week2,
      
        (SELECT 
          win
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 2
          AND team = team_) as week2_outcome,
          
        (SELECT 
          opp
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 2
          AND team = team_) as week2_opp,
    
        (SELECT 
          pa
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 2
          AND team = team_) as week2_pa,
      
      (SELECT 
        pf
        FROM peffl_data.PEFFL_RS
        WHERE year = year_
        AND week = 3
        AND team = team_) as week3,
      
        (SELECT 
          win
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 3
          AND team = team_) as week3_outcome,
          
        (SELECT 
          opp
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 3
          AND team = team_) as week3_opp,
    
        (SELECT 
          pa
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 3
          AND team = team_) as week3_pa,
      
      (SELECT 
        pf
        FROM peffl_data.PEFFL_RS
        WHERE year = year_
        AND week = 4
        AND team = team_) as week4,
      
        (SELECT 
          win
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 4
          AND team = team_) as week4_outcome,
          
        (SELECT 
          opp
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 4
          AND team = team_) as week4_opp,
    
        (SELECT 
          pa
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 4
          AND team = team_) as week4_pa,
      
      (SELECT 
        pf
        FROM peffl_data.PEFFL_RS
        WHERE year = year_
        AND week = 5
        AND team = team_) as week5,
      
        (SELECT 
          win
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 5
          AND team = team_) as week5_outcome,
          
        (SELECT 
          opp
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 5
          AND team = team_) as week5_opp,
    
        (SELECT 
          pa
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 5
          AND team = team_) as week5_pa,
      
      (SELECT 
        pf
        FROM peffl_data.PEFFL_RS
        WHERE year = year_
        AND week = 6
        AND team = team_) as week6,
      
        (SELECT 
          win
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 6
          AND team = team_) as week6_outcome,
          
        (SELECT 
          opp
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 6
          AND team = team_) as week6_opp,
    
        (SELECT 
          pa
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 6
          AND team = team_) as week6_pa,
      
      (SELECT 
        pf
        FROM peffl_data.PEFFL_RS
        WHERE year = year_
        AND week = 7
        AND team = team_) as week7,
      
        (SELECT 
          win
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 7
          AND team = team_) as week7_outcome,
          
        (SELECT 
          opp
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 7
          AND team = team_) as week7_opp,
    
        (SELECT 
          pa
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 7
          AND team = team_) as week7_pa,
      
      (SELECT 
        pf
        FROM peffl_data.PEFFL_RS
        WHERE year = year_
        AND week = 8
        AND team = team_) as week8,
      
        (SELECT 
          win
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 8
          AND team = team_) as week8_outcome,
          
        (SELECT 
          opp
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 8
          AND team = team_) as week8_opp,
    
        (SELECT 
          pa
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 8
          AND team = team_) as week8_pa,
      
      (SELECT 
        pf
        FROM peffl_data.PEFFL_RS
        WHERE year = year_
        AND week = 9
        AND team = team_) as week9,
      
        (SELECT 
          win
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 9
          AND team = team_) as week9_outcome,
          
        (SELECT 
          opp
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 9
          AND team = team_) as week9_opp,
    
        (SELECT 
          pa
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 9
          AND team = team_) as week9_pa,
      
      (SELECT 
        pf
        FROM peffl_data.PEFFL_RS
        WHERE year = year_
        AND week = 10
        AND team = team_) as week10,
      
        (SELECT 
          win
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 10
          AND team = team_) as week10_outcome,
          
        (SELECT 
          opp
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 10
          AND team = team_) as week10_opp,
    
        (SELECT 
          pa
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 10
          AND team = team_) as week10_pa,
      
      (SELECT 
        pf
        FROM peffl_data.PEFFL_RS
        WHERE year = year_
        AND week = 11
        AND team = team_) as week11,
      
        (SELECT 
          win
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 11
          AND team = team_) as week11_outcome,
          
        (SELECT 
          opp
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 11
          AND team = team_) as week11_opp,
    
        (SELECT 
          pa
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 11
          AND team = team_) as week11_pa,
      
      (SELECT 
        pf
        FROM peffl_data.PEFFL_RS
        WHERE year = year_
        AND week = 12
        AND team = team_) as week12,
      
        (SELECT 
          win
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 12
          AND team = team_) as week12_outcome,
          
        (SELECT 
          opp
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 12
          AND team = team_) as week12_opp,
    
        (SELECT 
          pa
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 12
          AND team = team_) as week12_pa,
      
      (SELECT 
        pf
        FROM peffl_data.PEFFL_RS
        WHERE year = year_
        AND week = 13
        AND team = team_) as week13,
      
        (SELECT 
          win
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 13
          AND team = team_) as week13_outcome,
          
        (SELECT 
          opp
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 13
          AND team = team_) as week13_opp,
    
        (SELECT 
          pa
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 13
          AND team = team_) as week13_pa,
      
      (SELECT 
        pf
        FROM peffl_data.PEFFL_RS
        WHERE year = year_
        AND week = 14
        AND team = team_) as week14,
      
        (SELECT 
          win
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 14
          AND team = team_) as week14_outcome,
          
        (SELECT 
          opp
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 14
          AND team = team_) as week14_opp,
    
        (SELECT 
          pa
          FROM peffl_data.PEFFL_RS
          WHERE year = year_
          AND week = 14
          AND team = team_) as week14_pa,
      
      (SELECT 
        pf
        FROM peffl_data.PEFFL_playoffs
        WHERE year = year_
        AND week = "wc"
        AND team = team_) as wc,
      
        (SELECT 
          win
          FROM peffl_data.PEFFL_playoffs
          WHERE year = year_
          AND week = "wc"
          AND team = team_) as weekWc_outcome,
          
        (SELECT 
          opp
          FROM peffl_data.PEFFL_playoffs
          WHERE year = year_
          AND week = "wc"
          AND team = team_) as weekWc_opp,
    
        (SELECT 
          pa
          FROM peffl_data.PEFFL_playoffs
          WHERE year = year_
          AND week = "wc"
          AND team = team_) as weekWc_pa,
      
      (SELECT 
        pf
        FROM peffl_data.PEFFL_playoffs
        WHERE year = year_
        AND week = "sf"
        AND team = team_) as sf,
      
        (SELECT 
          win
          FROM peffl_data.PEFFL_playoffs
          WHERE year = year_
          AND week = "sf"
          AND team = team_) as weekSf_outcome,

        (SELECT 
          opp
          FROM peffl_data.PEFFL_playoffs
          WHERE year = year_
          AND week = "sf"
          AND team = team_) as weekSf_opp,
    
        (SELECT 
          pa
          FROM peffl_data.PEFFL_playoffs
          WHERE year = year_
          AND week = "sf"
          AND team = team_) as weekSf_pa,
      
      (SELECT 
        pf
        FROM peffl_data.PEFFL_playoffs
        WHERE year = year_
        AND week = "dc"
        AND team = team_) as dc,
      
        (SELECT 
          win
          FROM peffl_data.PEFFL_playoffs
          WHERE year = year_
          AND week = "dc"
          AND team = team_) as weekDc_outcome,
          
        (SELECT 
          opp
          FROM peffl_data.PEFFL_playoffs
          WHERE year = year_
          AND week = "dc"
          AND team = team_) as weekDc_opp,
    
        (SELECT 
          pa
          FROM peffl_data.PEFFL_playoffs
          WHERE year = year_
          AND week = "dc"
          AND team = team_) as weekDc_pa
      
 

    FROM peffl_data.PEFFL_${table}
    where team = '${team}'
    group by Year
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

// get all team seasons table
router.get("/allteams/:column/:order/:table", (req, res) => {
  let col = req.params.column;
  let order = req.params.order;
  let table = req.params.table;
  db.query(
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
    FROM peffl_data.PEFFL_${table}
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
  const table = req.params.table;
  const col = req.params.column;

  db.query(
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
    FROM peffl_data.PEFFL_${table} 
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
