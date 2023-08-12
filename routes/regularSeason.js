const router = require("express").Router();
const pool = require("../pool");
// const mysql = require("mysql");

//// AWS RDS

// mysql db connection
// const db = mysql.createConnection({
//   host: process.env.RDS_HOSTNAME,
//   user: process.env.RDS_USERNAME,
//   password: process.env.RDS_PASSWORD,
//   port: process.env.RDS_PORT,
// });

// connect to db
// db.connect(function (err) {
//   if (err) {
//     console.error("Database connection failed: " + err.stack);
//     return;
//   }
// });

//// SQLITE DB BROWSER

// const { initializeDatabase } = require('../database');
// const db = initializeDatabase();


// get team names
router.get("/teams", async (req, res) => {
  try {
    const db = await pool.connect()
    db.query(
      `SELECT 'team' FROM allgames GROUP BY 'team' ORDER BY 'win' DESC`,
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          res.send(result);
        }
      }
    )
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get standings ( rs / playoff / ag )
router.get("/standings/:column/:order/:table", async (req, res) => {
  try {
    const db = await pool.connect()
    let col = req.params.column.toUpperCase();
    let order = req.params.order;
    let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``

    // the inner select does not include an 'A' (appearances) column
    // so I created a col2 variable that is set to 'W' if col === 'A'
    let col2 = col === "A" ? "W" : col;

    // const result = await db.query(
    //   `SELECT 
    //   a.team as "team", 
    //   a.L + COALESCE(b.C, 0) as "A", 
    //   a.G as "G", 
    //   a.W as "W", 
    //   a.L as "L", 
    //   a.PF as "PF", 
    //   a.PA as "PA", 
    //   a.PPG as "PPG", 
    //   a.PAPG as "PAPG", 
    //   a.DIF as "DIF", 
    //   a.DIFPG as "DIFPG", 
    //   a.TOT as "TOT", 
    //   a.TOTPG as "TOTPG", 
    //   COALESCE(b.C, 0) as "C", 
    //   COALESCE(b.R, 0) as "R" 
    //   FROM (
    //     SELECT 
    //     team, 
    //     sum(win) as "W", 
    //     sum(loss) as "L", 
    //     sum(win) + sum(loss) as "G",   
    //     sum(pf) as "PF", 
    //     sum(pa) as "PA", 
    //     AVG(pf) as "PPG", 
    //     AVG(pa) as "PAPG", 
    //     sum(pf) - sum(pa)  as "DIF",
    //     avg(pf) - avg(pa) as "DIFPG",
    //     sum(pa) + sum(pf) as "TOT",
    //     (sum(pa) + sum(pf))/(sum(win) + sum(loss)) as "TOTPG"
    //     FROM allgames ${where}
    //     GROUP BY team  
    //     ORDER BY "${col2}" ${order} ,PF DESC) as a
        
    //     LEFT JOIN 
        
    //     (SELECT  
    //       team,  
    //       sum(win) as "C", 
    //       sum(loss) as "R"
    //       FROM allgames
    //       WHERE week = 'DC'  
    //       GROUP BY team) as b 
          
    //       ON a.team = b.team 
          
    //       ORDER BY "${col}" ${order}, PF DESC`
    // );

    const result = await db.query(
      `SELECT 
      a.team as "team", 
      a.l + COALESCE(b.c, 0) as "a", 
      a.g as "g", 
      a.w as "w", 
      a.l as "l", 
      a.pf as "pf", 
      a.pa as "pa", 
      a.ppg as "ppg", 
      a.papg as "papg", 
      a.dif as "dif", 
      a.difpg as "difpg", 
      a.tot as "tot", 
      a.totpg as "totpg", 
      COALESCE(b.c, 0) as "C", 
      COALESCE(b.r, 0) as "R" 
      FROM (
        SELECT 
        team, 
        sum(win) as "w", 
        sum(loss) as "l", 
        sum(win) + sum(loss) as "g",   
        sum(pf) as "pf", 
        sum(pa) as "pa", 
        AVG(pf) as "ppg", 
        AVG(pa) as "papg", 
        sum(pf) - sum(pa)  as "dif",
        avg(pf) - avg(pa) as "difpg",
        sum(pa) + sum(pf) as "tot",
        (sum(pa) + sum(pf))/(sum(win) + sum(loss)) as "totpg"
        FROM allgames ${where}
        GROUP BY team  
        ORDER BY ${col2} ${order} ,pf DESC) as a
        
        LEFT JOIN 
        
        (SELECT  
          team,  
          sum(win) as "c", 
          sum(loss) as "r"
          FROM allgames
          WHERE week = 'DC'  
          GROUP BY team) as b 
          
          ON a.team = b.team 
          
          ORDER BY ${col} ${order}, pf DESC`
    );


    db.release();
    res.send(result.rows);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get all standings medals
router.get("/medals/:table/:column", async (req, res) => {
  try {
    const db = await pool.connect()
    const col = req.params.column;
    let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``

    const result = await db.query(
      `SELECT 
        team, 
        sum(win) as "W",
        sum(loss) as "L",
        sum(win) + sum(loss) as "G",
        sum(win)/(sum(win) + sum(loss)) as "WinP", 
        sum(pf) as "PF",
        sum(pa) as "PA",
        sum(pa) + sum(pf) as "TOT",
        (sum(pa) + sum(pf))/(sum(win) + sum(loss)) as "TOTPG",
        avg(pf) as "PPG",
        avg(pa) as "PAPG",
        sum(pf) - sum(pa) as "DIF",
        avg(pf) - avg(pa) as "DIFPG"
        FROM allgames ${where}
        GROUP BY team
        ORDER BY "${col}" DESC 
        LIMIT 3`
    );

    let arr = [];
    
    if (col === "PPG" || col === "PAPG" || col === "DIFPG" || col === "TOTPG") {
      result.rows.forEach((el) =>
        arr.push((Math.round(el[col] * 100) / 100).toFixed(1))
      );
    } else if (col === "WinP") {
      result.rows.forEach((el) => {
        if (el[col] === 1) {
          arr.push("1.000");
        } else {
          arr.push(
            (Math.round(el[col] * 1000) / 1000)
              .toFixed(3)
              .toString()
              .substring(1)
          );
        }
      });
    } else {
      result.rows.forEach((el) => arr.push(el[col]));
    }

    db.release();
    res.send(arr);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// MEDALS

// get regular season rank medals
router.get("/standingsRank/:table", async (req, res) => {
  try {
    const db = await pool.connect()
    let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``

    db.query(
      `SELECT 
      team 
      FROM allgames ${where}
      GROUP BY team 
      ORDER BY sum(win) DESC, sum(pf) DESC`,
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

module.exports = router;
