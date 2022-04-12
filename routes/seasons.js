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
  console.log("Connected to database.");
});

// get single season stats
router.get("/table/:year/:sortBy/:sortOrder/:table", (req, res) => {
  let year = req.params.year;
  let sortBy = req.params.sortBy;
  let sortOrder = req.params.sortOrder;
  let table = req.params.table;

  let week14 =
    year > 2020
      ? `(SELECT 
    pf
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 14
    AND team = team_) as week14,
  
    (SELECT 
      win
      FROM peffl_data.PEFFL_RS
      WHERE year = ${year}
      AND week = 14
      AND team = team_) as week14_outcome,
      
    (SELECT 
      opp
      FROM peffl_data.PEFFL_RS
      WHERE year = ${year}
      AND week = 14
      AND team = team_) as week14_opp,

    (SELECT 
      pa
      FROM peffl_data.PEFFL_RS
      WHERE year = ${year}
      AND week = 14
      AND team = team_) as week14_pa,
      `
      : ``;

  db.query(
    `
SELECT 
team as "team_", 

(SELECT 
  pf
  FROM peffl_data.PEFFL_RS
  WHERE year = ${year}
  AND week = 1
  AND team = team_) as week1,

  (SELECT 
    win
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 1
    AND team = team_) as week1_outcome,

  (SELECT 
    opp
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 1
    AND team = team_) as week1_opp,

  (SELECT 
    pa
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 1
    AND team = team_) as week1_pa,

(SELECT 
  pf
  FROM peffl_data.PEFFL_RS
  WHERE year = ${year}
  AND week = 2
  AND team = team_) as week2,

  (SELECT 
    win
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 2
    AND team = team_) as week2_outcome,

  (SELECT 
    opp
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 2
    AND team = team_) as week2_opp,

  (SELECT 
    pa
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 2
    AND team = team_) as week2_pa,

(SELECT 
  pf
  FROM peffl_data.PEFFL_RS
  WHERE year = ${year}
  AND week = 3
  AND team = team_) as week3,

  (SELECT 
    win
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 3
    AND team = team_) as week3_outcome,
    
  (SELECT 
    opp
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 3
    AND team = team_) as week3_opp,

  (SELECT 
    pa
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 3
    AND team = team_) as week3_pa,

(SELECT 
  pf
  FROM peffl_data.PEFFL_RS
  WHERE year = ${year}
  AND week = 4
  AND team = team_) as week4,

  (SELECT 
    win
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 4
    AND team = team_) as week4_outcome,
    
  (SELECT 
    opp
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 4
    AND team = team_) as week4_opp,

  (SELECT 
    pa
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 4
    AND team = team_) as week4_pa,

(SELECT 
  pf
  FROM peffl_data.PEFFL_RS
  WHERE year = ${year}
  AND week = 5
  AND team = team_) as week5,

  (SELECT 
    win
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 5
    AND team = team_) as week5_outcome,
    
  (SELECT 
    opp
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 5
    AND team = team_) as week5_opp,

  (SELECT 
    pa
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 5
    AND team = team_) as week5_pa,

(SELECT 
  pf
  FROM peffl_data.PEFFL_RS
  WHERE year = ${year}
  AND week = 6
  AND team = team_) as week6,

  (SELECT 
    win
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 6
    AND team = team_) as week6_outcome,
    
  (SELECT 
    opp
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 6
    AND team = team_) as week6_opp,

  (SELECT 
    pa
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 6
    AND team = team_) as week6_pa,

(SELECT 
  pf
  FROM peffl_data.PEFFL_RS
  WHERE year = ${year}
  AND week = 7
  AND team = team_) as week7,

  (SELECT 
    win
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 7
    AND team = team_) as week7_outcome,
    
  (SELECT 
    opp
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 7
    AND team = team_) as week7_opp,

  (SELECT 
    pa
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 7
    AND team = team_) as week7_pa,

(SELECT 
  pf
  FROM peffl_data.PEFFL_RS
  WHERE year = ${year}
  AND week = 8
  AND team = team_) as week8,

  (SELECT 
    win
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 8
    AND team = team_) as week8_outcome,
    
  (SELECT 
    opp
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 8
    AND team = team_) as week8_opp,

  (SELECT 
    pa
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 8
    AND team = team_) as week8_pa,

(SELECT 
  pf
  FROM peffl_data.PEFFL_RS
  WHERE year = ${year}
  AND week = 9
  AND team = team_) as week9,

  (SELECT 
    win
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 9
    AND team = team_) as week9_outcome,
    
  (SELECT 
    opp
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 9
    AND team = team_) as week9_opp,

  (SELECT 
    pa
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 9
    AND team = team_) as week9_pa,

(SELECT 
  pf
  FROM peffl_data.PEFFL_RS
  WHERE year = ${year}
  AND week = 10
  AND team = team_) as week10,

  (SELECT 
    win
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 10
    AND team = team_) as week10_outcome,
    
  (SELECT 
    opp
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 10
    AND team = team_) as week10_opp,

  (SELECT 
    pa
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 10
    AND team = team_) as week10_pa,

(SELECT 
  pf
  FROM peffl_data.PEFFL_RS
  WHERE year = ${year}
  AND week = 11
  AND team = team_) as week11,

  (SELECT 
    win
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 11
    AND team = team_) as week11_outcome,
    
  (SELECT 
    opp
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 11
    AND team = team_) as week11_opp,

  (SELECT 
    pa
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 11
    AND team = team_) as week11_pa,

(SELECT 
  pf
  FROM peffl_data.PEFFL_RS
  WHERE year = ${year}
  AND week = 12
  AND team = team_) as week12,

  (SELECT 
    win
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 12
    AND team = team_) as week12_outcome,
    
  (SELECT 
    opp
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 12
    AND team = team_) as week12_opp,

  (SELECT 
    pa
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 12
    AND team = team_) as week12_pa,

(SELECT 
  pf
  FROM peffl_data.PEFFL_RS
  WHERE year = ${year}
  AND week = 13
  AND team = team_) as week13,

  (SELECT 
    win
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 13
    AND team = team_) as week13_outcome,
    
  (SELECT 
    opp
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 13
    AND team = team_) as week13_opp,

  (SELECT 
    pa
    FROM peffl_data.PEFFL_RS
    WHERE year = ${year}
    AND week = 13
    AND team = team_) as week13_pa,

(SELECT 
  pf
  FROM peffl_data.PEFFL_playoffs
  WHERE year = ${year}
  AND week = "wc"
  AND team = team_) as weekWc,

  (SELECT 
    win
    FROM peffl_data.PEFFL_playoffs
    WHERE year = ${year}
    AND week = "wc"
    AND team = team_) as weekWc_outcome,
    
  (SELECT 
    opp
    FROM peffl_data.PEFFL_playoffs
    WHERE year = ${year}
    AND week = "wc"
    AND team = team_) as weekWc_opp,

  (SELECT 
    pa
    FROM peffl_data.PEFFL_playoffs
    WHERE year = ${year}
    AND week = "wc"
    AND team = team_) as weekWc_pa,

(SELECT 
  pf
  FROM peffl_data.PEFFL_playoffs
  WHERE year = ${year}
  AND week = "sf"
  AND team = team_) as weekSf,

  (SELECT 
    win
    FROM peffl_data.PEFFL_playoffs
    WHERE year = ${year}
    AND week = "sf"
    AND team = team_) as weekSf_outcome,
    
  (SELECT 
    opp
    FROM peffl_data.PEFFL_playoffs
    WHERE year = ${year}
    AND week = "sf"
    AND team = team_) as weekSf_opp,

  (SELECT 
    pa
    FROM peffl_data.PEFFL_playoffs
    WHERE year = ${year}
    AND week = "sf"
    AND team = team_) as weekSf_pa,

(SELECT 
  pf
  FROM peffl_data.PEFFL_playoffs
  WHERE year = ${year}
  AND week = "dc"
  AND team = team_) as weekDc,

  (SELECT 
    win
    FROM peffl_data.PEFFL_playoffs
    WHERE year = ${year}
    AND week = "dc"
    AND team = team_) as weekDc_outcome,
    
  (SELECT 
    opp
    FROM peffl_data.PEFFL_playoffs
    WHERE year = ${year}
    AND week = "dc"
    AND team = team_) as weekDc_opp,

  (SELECT 
    pa
    FROM peffl_data.PEFFL_playoffs
    WHERE year = ${year}
    AND week = "dc"
    AND team = team_) as weekDc_pa,

${week14}
 

avg(pf) as 'PPG',
avg(pa) as'PAPG',
sum(pf) as 'PF',
sum(pa) as 'PA', 
sum(win) as 'W',
sum(loss) as 'L',
sum(win) + sum(loss) as 'G',
sum(pf) - sum(pa)  as 'DIF',
avg(pf) - avg(pa) as 'DIFPG'
FROM peffl_data.PEFFL_${table}
WHERE year = ${year}
GROUP BY team
ORDER BY ${sortBy} ${sortOrder}
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

// get single season trophies
router.get("/trophies/:year", (req, res) => {
  let year = req.params.year;

  db.query(
    `
    SELECT  
    (SELECT 
      team
      FROM peffl_data.PEFFL_awards
      WHERE year = ${year}
      AND lc = 1) as lc,
      
    (SELECT 
      team
      FROM peffl_data.PEFFL_awards
      WHERE year = ${year}
      AND ru = 1) as ru,
      
    (SELECT 
      team
      FROM peffl_data.PEFFL_awards
      WHERE year = ${year}
      AND rsc = 1) as rsc,
      
    (SELECT 
      team
      FROM peffl_data.PEFFL_awards
      WHERE year = ${year}
      AND p = 1) as p,
      
      (SELECT 
      team
      FROM peffl_data.PEFFL_awards
      WHERE year = ${year}
      AND dc = 1
      ORDER BY team DESC
      LIMIT 1) as dc1,
      
       
      (SELECT 
      team
      FROM peffl_data.PEFFL_awards
      WHERE year = ${year}
      AND dc = 1
      ORDER BY team ASC
      LIMIT 1) as dc2
      
    FROM peffl_data.PEFFL_awards
    WHERE year = ${year}
    LIMIT 1;
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(...result);
      }
    }
  );
});

module.exports = router;
