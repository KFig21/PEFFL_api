const router = require("express").Router();
// const mysql = require("mysql");

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
//   console.log("Connected to database.");
// });

const { initializeDatabase } = require('../database');
const db = initializeDatabase();

// get all matchups
router.get("/all/:column/:order/:table", (req, res) => {
  let col = req.params.column;
  let order = req.params.order;
  let where = req.params.table === 'RS' ? `WHERE season = 'r' AND ` : req.params.table === 'playoffs' ? `WHERE season = 'p' AND ` : `WHERE`
  db.all(
    `
    SELECT 
    (MIN(team, opp) || MAX(team, opp)) as code,
    team,
    sum(win) as 'W',
    sum(loss) as 'L',
    sum(win) + sum(loss) as 'G',
    sum(win)/(sum(win) + sum(loss)) as 'WinP',
    opp,
    sum(pf) as 'PF',
    sum(pa) as 'PA',
    sum(pa) + sum(pf) as 'TOT',
    (sum(pa) + sum(pf) )/(sum(win) + sum(loss)) as 'TOTPG',
    avg(pf) as 'PPG',
    avg(pa) as 'PAPG',
    sum(pf) - sum(pa)  as 'DIF',
    avg(pf) - avg(pa) as 'DIFPG'
    FROM allGames ${where}
    team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
    group by team, opp
    Order By ${col} ${order}, TOT DESC, code DESC, W DESC, PPG DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = [];
        let codes = [];
        if (col === "G" || col === "TOTPG" || col === "TOT") {
          for (let i = 0; i < result.length; i++) {
            if (!codes.includes(result[i].code)) {
              arr.push(result[i]);
              codes.push(result[i].code);
            }
          }
          res.send(arr);
        } else {
          res.send(result);
        }
      }
    }
  );
});

// get h2h
// had to use a bunch of IFNULLs because in the instance that 2 teams
// never played a playoff game the query would return nothing if
// searching for a playoff table
router.get("/h2h/:team1/:team2/:table", (req, res) => {
  let team1 = req.params.team1;
  let team2 = req.params.team2;
  let where = req.params.table === 'RS' ? `WHERE season = 'r' AND ` : req.params.table === 'playoffs' ? `WHERE season = 'p' AND ` : `WHERE`
  db.all(
    `    
    SELECT *
    FROM
      (SELECT 
        ifnull((SELECT ifnull(team, '${team1}') 
        FROM allGames ${where}
        team = "${team1}"
        AND opp = "${team2}"
        group by team, opp
        ),'${team1}') as 'team', 

        ifnull((SELECT ifnull(sum(win), 0) 
        FROM allGames ${where}
        team = "${team1}"
        AND opp = "${team2}"
        group by team, opp
        ), 0) as 'W_h2h', 

        ifnull((SELECT ifnull(sum(loss), 0) 
        FROM allGames ${where}
        team = "${team1}"
        AND opp = "${team2}"
        group by team, opp
        ), 0) as 'L_h2h',

        ifnull((SELECT ifnull((sum(win) / (sum(win) + sum(loss))), 0) 
        FROM allGames ${where}
        team = "${team1}"
        AND opp = "${team2}"
        group by team, opp
        ), 0) as 'WinP_h2h',

        ifnull((SELECT ifnull(sum(win) + sum(loss), 0) 
        FROM allGames ${where}
        team = "${team1}"
        AND opp = "${team2}"
        group by team, opp
        ), 0) as 'G_h2h',

        ifnull((SELECT ifnull(opp, '${team2}') 
        FROM allGames ${where}
        team = "${team1}"
        AND opp = "${team2}"
        group by team, opp
        ),'${team2}') as 'opp', 

        ifnull((SELECT ifnull(sum(pf), 0) 
        FROM allGames ${where}
        team = "${team1}"
        AND opp = "${team2}"
        group by team, opp
        ),0) as 'PF_h2h',

        ifnull((SELECT ifnull(sum(pa), 0) 
        FROM allGames ${where}
        team = "${team1}"
        AND opp = "${team2}"
        group by team, opp
        ), 0) as 'PA_h2h',

        ifnull((SELECT ifnull(sum(pa) + sum(pf), 0) 
        FROM allGames ${where}
        team = "${team1}"
        AND opp = "${team2}"
        group by team, opp
        ),0) as 'TOT_h2h',

        ifnull((SELECT ifnull((sum(pa) + sum(pf))/(sum(win) + sum(loss)), 0) 
        FROM allGames ${where}
        team = "${team1}"
        AND opp = "${team2}"
        group by team, opp
        ),0) as 'TOTPG_h2h',

        ifnull((SELECT ifnull(avg(pf), 0) 
        FROM allGames ${where}
        team = "${team1}"
        AND opp = "${team2}"
        group by team, opp
        ),0) as 'PPG_h2h',

        ifnull((SELECT ifnull(avg(pa), 0) 
        FROM allGames ${where}
        team = "${team1}"
        AND opp = "${team2}"
        group by team, opp
        ),0) as 'PAPG_h2h',

        ifnull((SELECT ifnull(sum(pf) - sum(pa), 0) 
        FROM allGames ${where}
        team = "${team1}"
        AND opp = "${team2}"
        group by team, opp
        ),0) as 'DIF_h2h',

        ifnull((SELECT ifnull(avg(pf) - avg(pa), 0) 
        FROM allGames ${where}
        team = "${team1}"
        AND opp = "${team2}"
        group by team, opp
        ),0) as 'DIFPG_h2h') as a

    JOIN

      (SELECT 
        ifnull((SELECT ifnull(team, '${team1}') 
        FROM allGames ${where}
        team = "${team1}"
        group by team),'${team1}') as 'team', 
       
        ifnull((SELECT ifnull(sum(win), 0) 
        FROM allGames ${where}
        team = "${team1}"
        group by team), 0) as 'W_at', 
       
        ifnull((SELECT ifnull(sum(loss), 0) 
        FROM allGames ${where}
        team = "${team1}"
        group by team), 0) as 'L_at', 
       
        ifnull((SELECT ifnull(sum(win) / (sum(win) + sum(loss)), 0) 
        FROM allGames ${where}
        team = "${team1}"
        group by team), 0) as 'WinP_at', 
       
        ifnull((SELECT ifnull(sum(win) + sum(loss), 0) 
        FROM allGames ${where}
        team = "${team1}"
        group by team), 0) as 'G_at', 
       
        ifnull((SELECT ifnull(sum(pf), 0) 
        FROM allGames ${where}
        team = "${team1}"
        group by team), 0) as 'PF_at', 
       
        ifnull((SELECT ifnull(sum(pa), 0) 
        FROM allGames ${where}
        team = "${team1}"
        group by team), 0) as 'PA_at', 
       
        ifnull((SELECT ifnull(sum(pa) + sum(pf), 0) 
        FROM allGames ${where}
        team = "${team1}"
        group by team), 0) as 'TOT_at',
       
        ifnull((SELECT ifnull((sum(pa) + sum(pf) )/(sum(win) + sum(loss)), 0) 
        FROM allGames ${where}
        team = "${team1}"
        group by team), 0) as 'TOTPG_at',
       
        ifnull((SELECT ifnull(avg(pf), 0) 
        FROM allGames ${where}
        team = "${team1}"
        group by team), 0) as 'PPG_at',
       
        ifnull((SELECT ifnull(avg(pa), 0) 
        FROM allGames ${where}
        team = "${team1}"
        group by team), 0) as 'PAPG_at',
       
        ifnull((SELECT ifnull(sum(pf) - sum(pa), 0) 
        FROM allGames ${where}
        team = "${team1}"
        group by team), 0) as 'DIF_at',
       
        ifnull((SELECT ifnull(avg(pf) - avg(pa), 0) 
        FROM allGames ${where}
        team = "${team1}"
        group by team), 0) as 'DIFPG_at') as b

    on a.team = b.team
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

// get all h2h games
router.get("/h2h/allmatchups/:team1/:team2/:table", (req, res) => {
  let team1 = req.params.team1;
  let team2 = req.params.team2;
  let where = req.params.table === 'RS' ? `WHERE season = 'r' AND ` : req.params.table === 'playoffs' ? `WHERE season = 'p' AND ` : `WHERE`
  db.all(
    `    
    SELECT * 
    FROM allGames ${where}
    team = '${team1}' and opp = '${team2}'
    order by id desc
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

// MEDALS

// get all matchups medals
router.get("/medals/:table/:column", (req, res) => {
  let col = req.params.column;
  let where = req.params.table === 'RS' ? `WHERE season = 'r' AND ` : req.params.table === 'playoffs' ? `WHERE season = 'p' AND ` : `WHERE`
  let lim = col !== "TOTPG" && col !== "TOT" ? 3 : 6;

  db.all(
    `
    SELECT 
    (MIN(team, opp) || MAX(team, opp)) as code, 
    team,
    sum(win) as 'W',
    sum(loss) as 'L',
    sum(win) + sum(loss) as 'G',
    sum(win)/(sum(win) + sum(loss)) as 'WinP',
    opp,
    sum(pf) as 'PF',
    sum(pa) as 'PA',
    sum(pa) + sum(pf) as 'TOT',
    (sum(pa) + sum(pf) )/(sum(win) + sum(loss)) as 'TOTPG',
    avg(pf) as 'PPG',
    avg(pa) as 'PAPG',
    sum(pf) - sum(pa)  as 'DIF',
    avg(pf) - avg(pa) as 'DIFPG'
    FROM allGames ${where}
    team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
    group by team, opp
    Order By ${col} DESC
    LIMIT ${lim}
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = [];
        let codes = [];
        // need to eliminate dupes for total column
        if (col === "TOTPG" || col === "TOT") {
          // need to round off per game stats
          if (col === "TOTPG") {
            for (let i = 0; i < result.length; i++) {
              if (!codes.includes(result[i].code)) {
                arr.push((Math.round(result[i][col] * 100) / 100).toFixed(1));
                codes.push(result[i].code);
              }
            }
          } else {
            for (let i = 0; i < result.length; i++) {
              if (!codes.includes(result[i].code)) {
                arr.push(result[i][col]);
                codes.push(result[i].code);
              }
            }
          }
          // need to round per game stats
        } else if (col === "PPG" || col === "PAPG" || col === "DIFPG") {
          result.forEach((el) =>
            arr.push((Math.round(el[col] * 100) / 100).toFixed(1))
          );
          // format for WinP
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
          result.forEach((el) => arr.push(el[col]));
        }
        res.send(arr);
      }
    }
  );
});

module.exports = router;
