const router = require("express").Router();
const pool = require("../pool");

// AWARDS

// get awards
router.get("/awards/:column/:order", async (req, res) => {
  try {
    const db = await pool.connect()
    let col = req.params.column;
    let order = req.params.order;
    db.query(
      `SELECT  
      team, 
      sum(lc) as "c", 
      sum(ru) as "r", 
      sum(rsc) as "rsc", 
      sum(p) as "p", 
      sum(dc) as "dt", 
      sum(money) as "money" 
      FROM awards 
      GROUP BY team 
      ORDER BY ${col} ${order}, 
      money DESC, 
      c DESC, 
      r DESC, 
      rsc DESC, 
      dt DESC, 
      p DESC`,
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          res.send(result.rows);
        }
      }
    );
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get awards rank
router.get("/awardsRank", async (req, res) => {
  try {
    const db = await pool.connect()
    db.query(
      `SELECT  
      team, 
      sum(lc) as "c", 
      sum(ru) as "r", 
      sum(rsc) as "rsc", 
      sum(p) as "p", 
      sum(dc) as "dt", 
      sum(money) as "money" 
      FROM awards 
      GROUP BY team 
      ORDER BY money DESC, c DESC, r DESC, rsc DESC, dt DESC, p DESC`,
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          let arr = result.rows.map((obj) => obj.team);
          res.send(arr);
        }
      }
    );
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// RECORDS

// single game most PF
router.get("/single-game-most-pf", async (req, res) => {
  try {
    const db = await pool.connect()
    db.query(
      `SELECT 
      year, 
      week, 
      team, 
      pf, 
      pa, 
      opp 
      FROM allGames 
      ORDER BY pf DESC 
      LIMIT 10`,
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          res.send(result.rows);
        }
      }
    );
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// single season most PF
router.get("/single-season-most-pf", async (req, res) => {
  try {
    const db = await pool.connect()
    db.query(
      `SELECT 
      year, 
      team, 
      sum(pf) as "pf", 
      sum(pf)/(sum(win) + sum(loss)) as "ppg", 
      sum(win) as "w", 
      sum(loss) as "l" 
      FROM allGames WHERE season = 'r'
      GROUP BY team, year 
      ORDER BY ppg DESC 
      LIMIT 10`,
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          res.send(result.rows);
        }
      }
    );
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// highest scoring game
router.get("/highest-scoring-game", async (req, res) => {
  try {
    const db = await pool.connect()
    db.query(
      `SELECT 
      year, 
      week, 
      team, 
      pf, 
      pa, 
      opp, 
      pf + pa as "total" 
      FROM allGames 
      ORDER BY total DESC, year DESC, week DESC 
      LIMIT 20`,
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          let arr = [];
          for (let i = 0; i < result.rows.length; i++) {
            if (i % 2 === 0) {
              arr.push(result.rows[i]);
            }
          }
          res.send(arr);
        }
      }
    );
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// highest margin of victory
router.get("/highest-margin-of-victory",  async (req, res) => {
  try {
    const db = await pool.connect()
    db.query(
      `SELECT 
      year, 
      week, 
      team, 
      pf, 
      pa, 
      opp, 
      pf - pa as "margin" 
      FROM allGames 
      ORDER BY margin DESC, year DESC, week DESC 
      LIMIT 10`,
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          res.send(result.rows);
        }
      }
    );
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// weekly records
router.get("/weekly-records/:column/:order", async (req, res) => {
  try {
    const db = await pool.connect()
    let col = req.params.column;
    let order = req.params.order;
    db.query(`
    SELECT teams.team, PF, PA, leastpf, leastpa
    FROM
    
    (SELECT
    team
    FROM allGames WHERE season = 'r'
    GROUP BY team) as teams
    
    LEFT OUTER JOIN
    
    (SELECT 
    t.*
    FROM (
            SELECT
            team as "team",
            COUNT(*) as "pf"
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
                    FROM allGames WHERE season = 'r'
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
                    FROM allGames WHERE season = 'r'
                    ORDER BY 
                        year ASC, 
                        week ASC, 
                        pf desc) as b
        
            WHERE a.pf = b.pf
            AND a.year = b.year
            AND a.week = b.week
            ORDER BY a.year ASC, a.week ASC) as c
            
    GROUP BY team
    ORDER BY pf DESC
    LIMIT 10) as t) as pfTable
    
    ON
        pfTable.team = teams.team
        
    LEFT OUTER JOIN
    
    (SELECT 
    t.*
    FROM (
            SELECT
            team as "team",
            COUNT(*) as "pa"
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
                    FROM allGames WHERE season = 'r'
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
                    FROM allGames WHERE season = 'r'
                    ORDER BY 
                        year ASC, 
                        week ASC, 
                        pa desc) as b
        
            WHERE a.pa = b.pa
            AND a.year = b.year
            AND a.week = b.week
            ORDER BY a.year ASC, a.week ASC) as c
    GROUP BY team
    ORDER BY pa DESC
    LIMIT 10) as t) as paTable
    
    ON
        teams.team = paTable.team
        
    LEFT OUTER JOIN
        
    (SELECT
    t.*
    FROM (
    SELECT
    team as "team",
    COUNT(*) as "leastpf"
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
    FROM allGames WHERE season = 'r'
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
    FROM allGames WHERE season = 'r'
    ORDER BY 
      year ASC, 
        week ASC, 
        pf desc) as b
        
    WHERE a.pf = b.pf
    AND a.year = b.year
    AND a.week = b.week
    ORDER BY a.year ASC, a.week ASC) as c
    GROUP BY team
    ORDER BY leastpf ASC ) t) as leastpfTable
    
    ON
        teams.team = leastpfTable.team
        
        LEFT OUTER JOIN
    
    (SELECT
    t.*
    FROM (
    SELECT
    team as "team",
    COUNT(*) as "leastpa"
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
    FROM allGames WHERE season = 'r'
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
    FROM allGames WHERE season = 'r'
    ORDER BY 
      year ASC, 
        week ASC, 
        pa desc) as b
        
    WHERE a.pa = b.pa
    AND a.year = b.year
    AND a.week = b.week
    ORDER BY a.year ASC, a.week ASC) as c
    GROUP BY team
    ORDER BY leastpa ASC ) t) as leastpaTable
    
    ON
        teams.team = leastpaTable.team
        
    order by ${col} ${order}, PF DESC, leastpf ASC, PA DESC, leastpa ASC`,
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          let arr = [];
          let taylor;
          let aj;
          let obj = result.rows
          for (let i = 0; i < obj.length; i++) {
            if (obj[i].team !== "AJ" && obj[i].team !== "Taylor") {
              arr.push(obj[i]);
            } else if (obj[i].team === "AJ") {
              aj = obj[i];
            } else if (obj[i].team === "Taylor") {
              taylor = obj[i];
            }
          }

          arr.push(aj);
          arr.push(taylor);

          res.send(arr);
        }
      }
    );
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// weekly records for a single team
router.get("/weekly-records/:team", async (req, res) => {
  try {
    const db = await pool.connect()
  let team = req.params.team;

  db.query(
    `
SELECT teams.team, pf, pa, leastpf, leastpa
FROM

(SELECT
team
FROM allGames WHERE season = 'r'
AND team = '${team}'
GROUP BY team) as teams

LEFT OUTER JOIN

(SELECT 
t.*
FROM (
        SELECT
        team as "team",
        COUNT(*) as "pf"
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
                FROM allGames WHERE season = 'r'
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
                FROM allGames WHERE season = 'r'
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
        team as "team",
        COUNT(*) as "pa"
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
                FROM allGames WHERE season = 'r'
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
                FROM allGames WHERE season = 'r'
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
team as "team",
COUNT(*) as "leastpf"
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
FROM allGames WHERE season = 'r'
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
FROM allGames WHERE season = 'r'
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
team as "team",
COUNT(*) as "leastpa"
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
FROM allGames WHERE season = 'r'
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
FROM allGames WHERE season = 'r'
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
    
order by pf DESC, leastpf ASC, pa DESC, leastpa ASC

  `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(...result.rows);
      }
    }
  );
} catch (error) {
  console.error('Error executing query:', error);
  res.status(500).json({ error: 'Internal server error' });
}
});

// MEDALS

// weeks with most PF medal
router.get("/weeksMostPFmedals", async (req, res) => {
  try {
    const db = await pool.connect()
    db.query(
      `
  SELECT 
  t.*
  FROM (
          SELECT
          team as "team",
          COUNT(*) as "pf"
          FROM(SELECT a.year, a.week, b.team, a.pf
        FROM(
                  SELECT
                  year,
                  week,
                  MAX(pf) as "pf"
                  FROM(SELECT
                  year,
                  week,
                  pf
                  FROM allGames WHERE season = 'r'
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
                  FROM allGames WHERE season = 'r'
                  ORDER BY 
                      year ASC, 
                      week ASC, 
                      pf desc) as b
      
          WHERE a.pf = b.pf
          AND a.year = b.year
          AND a.week = b.week
          ORDER BY a.year ASC, a.week ASC) as c
          
  GROUP BY team
  ORDER BY pf DESC) as t
  `,
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          let arr = result.rows.map((obj) => parseInt(obj.pf));
          arr.sort((a, b) => {
            return b - a; // Compare in descending order
          });
          res.send(arr);
        }
      }
    );
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// weeks with most PA medal
router.get("/weeksMostPAmedals", async (req, res) => {
  try {
    const db = await pool.connect()
    db.query(
      `
  SELECT 
  t.*
  FROM (
          SELECT
          team as "team",
          COUNT(*) as "pa"
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
                  FROM allGames WHERE season = 'r'
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
                  FROM allGames WHERE season = 'r'
                  ORDER BY 
                      year ASC, 
                      week ASC, 
                      pa desc) as b
      
          WHERE a.pa = b.pa
          AND a.year = b.year
          AND a.week = b.week
          ORDER BY a.year ASC, a.week ASC) as c
          
  GROUP BY team
  ORDER BY pa DESC) as t
  `,
  (err, result) => {
    if (err) {
      console.log(err);
    } else {
      let arr = result.rows.map((obj) => parseInt(obj.pa));
      arr.sort((a, b) =>  b - a );
      res.send(arr);
    }
  }
  );
  } catch (error) {
  console.error('Error executing query:', error);
  res.status(500).json({ error: 'Internal server error' });
  }
});

// weeks vs least PF medal
router.get("/weeksLeastPFmedals", async (req, res) => {
  try {
    const db = await pool.connect()
    db.query(
      `
      SELECT
      t.*
      FROM (
      SELECT
      team as "team",
      COUNT(*) as "leastpf"
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
      FROM allGames WHERE season = 'r'
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
      FROM allGames WHERE season = 'r'
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
      ORDER BY leastpf ASC ) t
  `,
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          let arr = result.rows.map((obj) => parseInt(obj.leastpf));
          arr.sort((a, b) =>  a - b );
          res.send(arr);
        }
      }
    );
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// weeks vs least PA medal
router.get("/weeksLeastPAmedals", async (req, res) => {
  try {
    const db = await pool.connect()
  db.query(
    `
SELECT
t.*
FROM (
SELECT
team as "team",
COUNT(*) as "leastpa"
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
FROM allGames WHERE season = 'r'
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
FROM allGames WHERE season = 'r'
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
ORDER BY leastpa ASC) t
`,
  (err, result) => {
    if (err) {
      console.log(err);
    } else {
      let arr = result.rows.map((obj) => parseInt(obj.leastpa));
      arr.sort((a, b) =>  b - a );
      res.send(arr);
    }
  }
  );
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
