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

// get team names
router.get("/teams", (req, res) => {
  db.query(
    "SELECT `team` FROM peffl_data.PEFFL_RS GROUP BY `team` ORDER BY `win` DESC",
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

// get standings ( rs / playoff / ag )
router.get("/standings/:column/:order/:table", (req, res) => {
  let col = req.params.column;
  let order = req.params.order;
  let table = req.params.table;

  // the inner select does not include an 'A' (appearances) column
  // so i created a col2 variable that is set to 'W' if col === 'A'
  let col2 = col === "A" ? "W" : col;

  db.query(
    `SELECT 
    a.team as 'team', 
    a.L + IFNULL(b.C, 0) as 'A', 
    a.G as 'G', 
    a.W as 'W', 
    a.L as 'L', 
    a.PF as 'PF', 
    a.PA as 'PA', 
    a.PPG as 'PPG', 
    a.PAPG as 'PAPG', 
    a.DIF as 'DIF', 
    a.DIFPG as 'DIFPG', 
    a.TOT as 'TOT', 
    a.TOTPG as 'TOTPG', 
    IFNULL(b.C, 0) as 'C', 
    IFNULL(b.R, 0) as 'R' 
    FROM (
      SELECT 
      team, 
      sum(win) as 'W', 
      sum(loss) as 'L', 
      sum(win) + sum(loss) as 'G',   
      sum(pf) as 'PF' , 
      sum(pa) as 'PA', 
      AVG(pf) as 'PPG', 
      AVG(pa) as 'PAPG', 
      sum(pf) - sum(pa)  as 'DIF',
      avg(pf) - avg(pa) as 'DIFPG',
      sum(pa) + sum(pf) as 'TOT',
      (sum(pa) + sum(pf))/(sum(win) + sum(loss)) as 'TOTPG'
      FROM peffl_data.PEFFL_${table}  
      GROUP BY team   
      ORDER BY ${col2} ${order} ,PF DESC) as a
      
      LEFT JOIN 
      
      (SELECT  
        team,  
        sum(win) as 'C', 
        sum(loss) as 'R'
        FROM peffl_data.PEFFL_playoffs  
        WHERE week = 'DC'  
        GROUP BY team) as b 
        
        ON a.team = b.team 
        
        ORDER BY ${col} ${order}, PF DESC`,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

// get all standings medals
router.get("/medals/:table/:column", (req, res) => {
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
    group by team
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
        } else if (col === "WinP") {
          result.forEach((el) => {
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
          // format for counting stats
          result.forEach((el) => arr.push(el[col]));
        }
        res.send(arr);
      }
    }
  );
});

// MEDALS

// get regular season rank medals
router.get("/standingsRank/:table", (req, res) => {
  const table = req.params.table;

  db.query(
    `SELECT 
    team 
    FROM peffl_data.PEFFL_${table}   
    GROUP BY team 
    ORDER BY sum(win) DESC, sum(pf) DESC`,
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

module.exports = router;
