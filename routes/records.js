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

// AWARDS

// get awards
router.get("/awards/:column/:order", (req, res) => {
  let col = req.params.column;
  let order = req.params.order;
  db.query(
    `SELECT  
    team, 
    sum(lc) as 'C', 
    sum(ru) as 'R', 
    sum(rsc) as 'RSC', 
    sum(p) as 'P', 
    sum(dc) as 'DT', 
    sum(money) as 'money' 
    FROM peffl_data.PEFFL_awards 
    GROUP BY team 
    ORDER BY ${col} ${order}, 
    money DESC, 
    C DESC, 
    R DESC, 
    RSC DESC, 
    DT DESC, 
    P DESC`,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

// get awards rank
router.get("/awardsRank", (req, res) => {
  db.query(
    `SELECT  
    team, 
    sum(lc) as 'C', 
    sum(ru) as 'R', 
    sum(rsc) as 'RSC', 
    sum(p) as 'P', 
    sum(dc) as 'DT', 
    sum(money) as 'money' 
    FROM peffl_data.PEFFL_awards 
    GROUP BY team 
    ORDER BY money DESC, C DESC, R DESC, RSC DESC, DT DESC, P DESC`,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.team);
        res.send(arr);
      }
    }
  );
});

// RECORDS

// single game most PF
router.get("/single-game-most-pf", (req, res) => {
  db.query(
    `SELECT 
    year, 
    week, 
    team, 
    pf, 
    pa, 
    opp 
    FROM peffl_data.PEFFL_AG 
    ORDER BY pf DESC 
    LIMIT 10`,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

// single season most PF
router.get("/single-season-most-pf", (req, res) => {
  db.query(
    `SELECT 
    year, 
    team, 
    sum(pf) as 'pf', 
    sum(pf)/(sum(win) + sum(loss)) as 'ppg', 
    sum(win) as 'W', 
    sum(loss) as 'L' 
    FROM peffl_data.PEFFL_RS 
    GROUP BY team, year 
    ORDER BY ppg DESC 
    LIMIT 10`,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

// highest scoring game
router.get("/highest-scoring-game", (req, res) => {
  db.query(
    `SELECT 
    year, 
    week, 
    team, 
    pf, 
    pa, 
    opp, 
    pf + pa as 'total' 
    FROM peffl_data.PEFFL_AG 
    ORDER BY total DESC, year DESC, week DESC 
    LIMIT 20`,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = [];
        for (let i = 0; i < result.length; i++) {
          if (i % 2 === 0) {
            arr.push(result[i]);
          }
        }
        res.send(arr);
      }
    }
  );
});

// highest margin of victory
router.get("/highest-margin-of-victory", (req, res) => {
  db.query(
    `SELECT 
    year, 
    week, 
    team, 
    pf, 
    pa, 
    opp, 
    pf - pa as 'margin' 
    FROM peffl_data.PEFFL_AG 
    ORDER BY margin DESC, year DESC, week DESC 
    LIMIT 10`,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

// weekly records
router.get("/weekly-records/:column/:order", (req, res) => {
  let col = req.params.column;
  let order = req.params.order;
  db.query(
    `
SELECT teams.team, PF, PA, LeastPF, LeastPA
FROM

(SELECT
team
FROM peffl_data.PEFFL_RS
GROUP BY team) as teams

LEFT OUTER JOIN

(SELECT 
t.*
FROM (
        SELECT
        team as 'team',
        COUNT(*) as 'PF'
        FROM(SELECT a.year, a.week, b.team, a.pf
			FROM(
                SELECT
                year,
                week,
                MAX(pf) as pf
                FROM(SELECT
                year,
                week,
                pf
                FROM peffl_data.PEFFL_RS
                ORDER BY 
                    year ASC, 
                    week ASC, 
                    pf desc) t
                GROUP BY year, week) as a,

                (SELECT
                year,
                week,
                team,
                pf
                FROM peffl_data.PEFFL_RS
                ORDER BY 
                    year ASC, 
                    week ASC, 
                    pf desc) as b
    
        WHERE a.pf = b.pf
        AND a.year = b.year
        AND a.week = b.week
        ORDER BY a.year ASC, a.week ASC) as c
        
GROUP BY team
ORDER BY PF DESC
LIMIT 10) as t) as pfTable

ON
    pfTable.team = teams.team
    
LEFT OUTER JOIN

(SELECT 
t.*
FROM (
        SELECT
        team as 'team',
        COUNT(*) as 'PA'
        FROM(SELECT a.year, a.week, b.team, a.pa
        FROM(
                SELECT
                year,
                week,
                MAX(pa) as pa
                FROM(SELECT
                year,
                week,
                pa
                FROM peffl_data.PEFFL_RS
                ORDER BY 
                    year ASC, 
                    week ASC, 
                    pa desc) t
                GROUP BY year, week) as a,

                (SELECT
                year,
                week,
                team,
                pa
                FROM peffl_data.PEFFL_RS
                ORDER BY 
                    year ASC, 
                    week ASC, 
                    pa desc) as b
    
        WHERE a.pa = b.pa
        AND a.year = b.year
        AND a.week = b.week
        ORDER BY a.year ASC, a.week ASC) as c
GROUP BY team
ORDER BY PA DESC
LIMIT 10) as t) as paTable

ON
    teams.team = paTable.team
    
LEFT OUTER JOIN
    
(SELECT
t.*
FROM (
SELECT
team as 'team',
COUNT(*) as 'LeastPF'
FROM(SELECT a.year, a.week, b.team, a.pf
FROM
(SELECT
year,
week,
MIN(pf) as pf
FROM(SELECT
year,
week,
pf
FROM peffl_data.PEFFL_RS
ORDER BY 
	year ASC, 
    week ASC, 
    pf desc) t
GROUP BY year, week) as a,

(SELECT
year,
week,
team,
pf
FROM peffl_data.PEFFL_RS
ORDER BY 
	year ASC, 
    week ASC, 
    pf desc) as b
    
WHERE a.pf = b.pf
AND a.year = b.year
AND a.week = b.week
ORDER BY a.year ASC, a.week ASC) as c
GROUP BY team
ORDER BY LeastPF ASC ) t) as leastPfTable

ON
    teams.team = leastPfTable.team
    
    LEFT OUTER JOIN

(SELECT
t.*
FROM (
SELECT
team as 'team',
COUNT(*) as 'LeastPA'
FROM(SELECT a.year, a.week, b.team, a.pa
FROM
(SELECT
year,
week,
MIN(pa) as pa
FROM(SELECT
year,
week,
pa
FROM peffl_data.PEFFL_RS
ORDER BY 
	year ASC, 
    week ASC, 
    pa desc) t
GROUP BY year, week) as a,

(SELECT
year,
week,
team,
pa
FROM peffl_data.PEFFL_RS
ORDER BY 
	year ASC, 
    week ASC, 
    pa desc) as b
    
WHERE a.pa = b.pa
AND a.year = b.year
AND a.week = b.week
ORDER BY a.year ASC, a.week ASC) as c
GROUP BY team
ORDER BY LeastPA ASC ) t) as leastPaTable

ON
    teams.team = leastPaTable.team
    
order by ${col} ${order}, PF DESC, LeastPF ASC, PA DESC, LeastPA ASC

  `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
        let arr = [];
        let taylor;
        let aj;
        for (let i = 0; i < result.length; i++) {
          if (result[i].team !== "AJ" && result[i].team !== "Taylor") {
            arr.push(result[i]);
          } else if (result[i].team === "AJ") {
            aj = result[i];
          } else if (result[i].team === "Taylor") {
            taylor = result[i];
          }
        }

        arr.push(aj);
        arr.push(taylor);

        res.send(arr);
      }
    }
  );
});

// weekly records for a single team
router.get("/weekly-records/:team", (req, res) => {
  let team = req.params.team;

  db.query(
    `
SELECT teams.team, PF, PA, LeastPF, LeastPA
FROM

(SELECT
team
FROM peffl_data.PEFFL_RS
WHERE team = '${team}'
GROUP BY team) as teams

LEFT OUTER JOIN

(SELECT 
t.*
FROM (
        SELECT
        team as 'team',
        COUNT(*) as 'PF'
        FROM(SELECT a.year, a.week, b.team, a.pf
			FROM(
                SELECT
                year,
                week,
                MAX(pf) as pf
                FROM(SELECT
                year,
                week,
                pf
                FROM peffl_data.PEFFL_RS
                ORDER BY 
                    year ASC, 
                    week ASC, 
                    pf desc) t
                GROUP BY year, week) as a,

                (SELECT
                year,
                week,
                team,
                pf
                FROM peffl_data.PEFFL_RS
                ORDER BY 
                    year ASC, 
                    week ASC, 
                    pf desc) as b
    
        WHERE a.pf = b.pf
        AND a.year = b.year
        AND a.week = b.week
        ORDER BY a.year ASC, a.week ASC) as c
        
GROUP BY team
ORDER BY PF DESC
LIMIT 10) as t) as pfTable

ON
    pfTable.team = teams.team
    
LEFT OUTER JOIN

(SELECT 
t.*
FROM (
        SELECT
        team as 'team',
        COUNT(*) as 'PA'
        FROM(SELECT a.year, a.week, b.team, a.pa
        FROM(
                SELECT
                year,
                week,
                MAX(pa) as pa
                FROM(SELECT
                year,
                week,
                pa
                FROM peffl_data.PEFFL_RS
                ORDER BY 
                    year ASC, 
                    week ASC, 
                    pa desc) t
                GROUP BY year, week) as a,

                (SELECT
                year,
                week,
                team,
                pa
                FROM peffl_data.PEFFL_RS
                ORDER BY 
                    year ASC, 
                    week ASC, 
                    pa desc) as b
    
        WHERE a.pa = b.pa
        AND a.year = b.year
        AND a.week = b.week
        ORDER BY a.year ASC, a.week ASC) as c
GROUP BY team
ORDER BY PA DESC
LIMIT 10) as t) as paTable

ON
    teams.team = paTable.team
    
LEFT OUTER JOIN
    
(SELECT
t.*
FROM (
SELECT
team as 'team',
COUNT(*) as 'LeastPF'
FROM(SELECT a.year, a.week, b.team, a.pf
FROM
(SELECT
year,
week,
MIN(pf) as pf
FROM(SELECT
year,
week,
pf
FROM peffl_data.PEFFL_RS
ORDER BY 
	year ASC, 
    week ASC, 
    pf desc) t
GROUP BY year, week) as a,

(SELECT
year,
week,
team,
pf
FROM peffl_data.PEFFL_RS
ORDER BY 
	year ASC, 
    week ASC, 
    pf desc) as b
    
WHERE a.pf = b.pf
AND a.year = b.year
AND a.week = b.week
ORDER BY a.year ASC, a.week ASC) as c
GROUP BY team
ORDER BY LeastPF ASC ) t) as leastPfTable

ON
    teams.team = leastPfTable.team
    
    LEFT OUTER JOIN

(SELECT
t.*
FROM (
SELECT
team as 'team',
COUNT(*) as 'LeastPA'
FROM(SELECT a.year, a.week, b.team, a.pa
FROM
(SELECT
year,
week,
MIN(pa) as pa
FROM(SELECT
year,
week,
pa
FROM peffl_data.PEFFL_RS
ORDER BY 
	year ASC, 
    week ASC, 
    pa desc) t
GROUP BY year, week) as a,

(SELECT
year,
week,
team,
pa
FROM peffl_data.PEFFL_RS
ORDER BY 
	year ASC, 
    week ASC, 
    pa desc) as b
    
WHERE a.pa = b.pa
AND a.year = b.year
AND a.week = b.week
ORDER BY a.year ASC, a.week ASC) as c
GROUP BY team
ORDER BY LeastPA ASC ) t) as leastPaTable

ON
    teams.team = leastPaTable.team
    
order by PF DESC, LeastPF ASC, PA DESC, LeastPA ASC

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

// MEDALS

// weeks with most PF medal
router.get("/weeksMostPFmedals", (req, res) => {
  db.query(
    `
SELECT 
t.*
FROM (
        SELECT
        team as 'team',
        COUNT(*) as 'PF'
        FROM(SELECT a.year, a.week, b.team, a.pf
			FROM(
                SELECT
                year,
                week,
                MAX(pf) as pf
                FROM(SELECT
                year,
                week,
                pf
                FROM peffl_data.PEFFL_RS
                ORDER BY 
                    year ASC, 
                    week ASC, 
                    pf desc) t
                GROUP BY year, week) as a,

                (SELECT
                year,
                week,
                team,
                pf
                FROM peffl_data.PEFFL_RS
                ORDER BY 
                    year ASC, 
                    week ASC, 
                    pf desc) as b
    
        WHERE a.pf = b.pf
        AND a.year = b.year
        AND a.week = b.week
        ORDER BY a.year ASC, a.week ASC) as c
        
GROUP BY team
ORDER BY PF DESC) as t
`,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.PF);
        res.send(arr);
      }
    }
  );
});

// weeks with most PA medal
router.get("/weeksMostPAmedals", (req, res) => {
  db.query(
    `
SELECT 
t.*
FROM (
        SELECT
        team as 'team',
        COUNT(*) as 'PA'
        FROM(SELECT a.year, a.week, b.team, a.pa
			FROM(
                SELECT
                year,
                week,
                MAX(pa) as pa
                FROM(SELECT
                year,
                week,
                pa
                FROM peffl_data.PEFFL_RS
                ORDER BY 
                    year ASC, 
                    week ASC, 
                    pa desc) t
                GROUP BY year, week) as a,

                (SELECT
                year,
                week,
                team,
                pa
                FROM peffl_data.PEFFL_RS
                ORDER BY 
                    year ASC, 
                    week ASC, 
                    pa desc) as b
    
        WHERE a.pa = b.pa
        AND a.year = b.year
        AND a.week = b.week
        ORDER BY a.year ASC, a.week ASC) as c
        
GROUP BY team
ORDER BY PA DESC) as t
`,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.PA);
        res.send(arr);
      }
    }
  );
});

// weeks vs least PF medal
router.get("/weeksLeastPFmedals", (req, res) => {
  db.query(
    `
    SELECT
    t.*
    FROM (
    SELECT
    team as 'team',
    COUNT(*) as 'LeastPF'
    FROM(SELECT a.year, a.week, b.team, a.pf
    FROM
    (SELECT
    year,
    week,
    MIN(pf) as pf
    FROM(SELECT
    year,
    week,
    pf
    FROM peffl_data.PEFFL_RS
    ORDER BY 
      year ASC, 
        week ASC, 
        pf desc) t
    GROUP BY year, week) as a,
    
    (SELECT
    year,
    week,
    team,
    pf
    FROM peffl_data.PEFFL_RS
    ORDER BY 
      year ASC, 
        week ASC, 
        pf desc) as b
        
    WHERE a.pf = b.pf
    AND a.year = b.year
    AND a.week = b.week
    ORDER BY a.year ASC, a.week ASC) as c
    WHERE team != 'Taylor'
    AND team != 'AJ'
    GROUP BY team
    ORDER BY LeastPF ASC ) t
`,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.LeastPF);
        res.send(arr);
      }
    }
  );
});

// weeks vs least PA medal
router.get("/weeksLeastPAmedals", (req, res) => {
  db.query(
    `
SELECT
t.*
FROM (
SELECT
team as 'team',
COUNT(*) as 'LeastPA'
FROM(SELECT a.year, a.week, b.team, a.pa
FROM
(SELECT
year,
week,
MIN(pa) as pa
FROM(SELECT
year,
week,
pa
FROM peffl_data.PEFFL_RS
ORDER BY 
	year ASC, 
    week ASC, 
    pa desc) t
GROUP BY year, week) as a,

(SELECT
year,
week,
team,
pa
FROM peffl_data.PEFFL_RS
ORDER BY 
	year ASC, 
    week ASC, 
    pa desc) as b
    
WHERE a.pa = b.pa
AND a.year = b.year
AND a.week = b.week
ORDER BY a.year ASC, a.week ASC) as c
WHERE team != 'Taylor'
AND team != 'AJ'
GROUP BY team
ORDER BY LeastPA ASC) t
`,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.LeastPA);
        res.send(arr);
      }
    }
  );
});

module.exports = router;
