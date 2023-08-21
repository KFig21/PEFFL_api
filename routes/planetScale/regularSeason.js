const router = require("express").Router();
const mysql = require('mysql2')
const db = mysql.createConnection(process.env.PS_DATABASE_URL)
db.connect()

// get team names
router.get("/teams", (req, res) => {
  db.query(
    `SELECT 'team' FROM allgames GROUP BY 'team' ORDER BY 'win' DESC`,
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
  let where = req.params.table === 'RS' ? `WHERE season = "r"` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``

  // the inner select does not include an 'A' (appearances) column
  // so i created a col2 variable that is set to "w" if col === 'A'
  let col2 = col === "A" ? "W" : col;

  db.query(
    `SELECT 
    a.team as 'team', 
    a.L + IFNULL(b.C, 0) as 'A', 
    a.G as "g", 
    a.W as "w", 
    a.L as "l", 
    a.PF as "pf", 
    a.PA as "pa", 
    a.PPG as "ppg", 
    a.PAPG as "papg", 
    a.DIF as "dif", 
    a.DIFPG as "difpg", 
    a.TOT as "tot", 
    a.TOTPG as "totpg", 
    IFNULL(b.C, 0) as "c", 
    IFNULL(b.R, 0) as "r" 
    FROM (
      SELECT 
      team, 
      sum(win) as "w", 
      sum(loss) as "l", 
      sum(win) + sum(loss) as "g",   
      sum(pf) as "pf" , 
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
        WHERE week = "DC"  
        GROUP BY team) as b 
        
        ON a.team = b.team 
        
        ORDER BY ${col} ${order}, pf DESC`,
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
  const col = req.params.column.toLowerCase();
  let where = req.params.table === 'RS' ? `WHERE season = "r"` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``

  db.query(
    `SELECT 
    team, 
    sum(win) as "w",
    sum(loss) as "l",
    sum(win) + sum(loss) as "g",
    sum(win)/(sum(win) + sum(loss)) as 'WinP', 
    sum(pf) as "pf",
    sum(pa) as "pa",
    sum(pa) + sum(pf) as "tot",
    (sum(pa) + sum(pf))/(sum(win) + sum(loss)) as "totpg",
    avg(pf) as "ppg",
    avg(pa) as "papg",
    sum(pf) - sum(pa)  as "dif",
    avg(pf) - avg(pa) as "difpg"
    FROM allgames ${where}
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
          col === "ppg" ||
          col === "papg" ||
          col === "difpg" ||
          col === "totpg"
        ) {
          result.forEach((el) =>
            arr.push((Math.round(el[col] * 100) / 100).toFixed(1))
          );
        } else if (col === "winp") {
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
  let where = req.params.table === 'RS' ? `WHERE season = "r"` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``

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
        let arr = result.map((obj) => obj.team);
        res.send(arr);
      }
    }
  );
});

module.exports = router;
