const router = require("express").Router();
// const mysql = require("mysql");

// mysql db connection
// const db = mysql.createConnection({
//   host: process.env.RDS_HOSTNAME,
//   user: process.env.RDS_USERNAME,
//   password: process.env.RDS_paSSWORD,
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

const { initializeDatabase } = require('../../database');
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
    sum(win) as "w",
    sum(loss) as "l",
    sum(win) + sum(loss) as "g",
    sum(win)/(sum(win) + sum(loss)) as "winp",
    opp,
    sum(pf) as "pf",
    sum(pa) as "pa",
    sum(pa) + sum(pf) as "tot",
    (sum(pa) + sum(pf) )/(sum(win) + sum(loss)) as "totpg",
    avg(pf) as "ppg",
    avg(pa) as "papg",
    sum(pf) - sum(pa)  as "dif",
    avg(pf) - avg(pa) as "difpg"
    FROM allGames ${where}
    team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
    group by team, opp
    Order By ${col} ${order}, tot DESC, code DESC, w DESC, ppg DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = [];
        let codes = [];
        if (col === "G" || col === "totpg" || col === "tot") {
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
router.get("/h2h/:team1/:team2/:table", async (req, res) => {
  try {
    let team1 = req.params.team1;
    let team2 = req.params.team2;
    let where = req.params.table === 'RS' ? `WHERE season = 'r' AND ` : req.params.table === 'playoffs' ? `WHERE season = 'p' AND ` : `WHERE`;

    const queries = [ `
      SELECT 
        team, 
        opp,
        SUM(win) as w,
        SUM(loss) as l,
        SUM(win) / (SUM(win) + SUM(loss)) as winp,
        SUM(win) + SUM(loss) as g,
        SUM(pf) as pf,
        SUM(pa) as pa,
        SUM(pa) + SUM(pf) as tot,
        (SUM(pa) + SUM(pf)) / (SUM(win) + SUM(loss)) as totpg,
        AVG(pf) as ppg,
        AVG(pa) as papg,
        SUM(pf) - SUM(pa) as dif,
        AVG(pf) - AVG(pa) as difpg
      FROM allGames
      ${where}
      (team = '${team1}' AND opp = '${team2}')
      GROUP BY team, opp
    `,

    `
      SELECT 
        team, 
        opp,
        SUM(win) as w,
        SUM(loss) as l,
        SUM(win) / (SUM(win) + SUM(loss)) as winp,
        SUM(win) + SUM(loss) as g,
        SUM(pf) as pf,
        SUM(pa) as pa,
        SUM(pa) + SUM(pf) as tot,
        (SUM(pa) + SUM(pf)) / (SUM(win) + SUM(loss)) as totpg,
        AVG(pf) as ppg,
        AVG(pa) as papg,
        SUM(pf) - SUM(pa) as dif,
        AVG(pf) - AVG(pa) as difpg
      FROM allGames
      ${where}
      (team = '${team2}' AND opp = '${team1}')
      GROUP BY team, opp
    `,

    `
      SELECT 
        team,
        SUM(win) as w,
        SUM(loss) as l,
        SUM(win) / (SUM(win) + SUM(loss)) as winp,
        SUM(win) + SUM(loss) as g,
        SUM(pf) as pf,
        SUM(pa) as pa,
        SUM(pa) + SUM(pf) as tot,
        (SUM(pa) + SUM(pf)) / (SUM(win) + SUM(loss)) as totpg,
        AVG(pf) as ppg,
        AVG(pa) as papg,
        SUM(pf) - SUM(pa) as dif,
        AVG(pf) - AVG(pa) as difpg
      FROM allGames
      ${where}
      (team = '${team1}')
      GROUP BY team
    `,

    `
      SELECT 
        team,
        SUM(win) as w,
        SUM(loss) as l,
        SUM(win) / (SUM(win) + SUM(loss)) as winp,
        SUM(win) + SUM(loss) as g,
        SUM(pf) as pf,
        SUM(pa) as pa,
        SUM(pa) + SUM(pf) as tot,
        (SUM(pa) + SUM(pf)) / (SUM(win) + SUM(loss)) as totpg,
        AVG(pf) as ppg,
        AVG(pa) as papg,
        SUM(pf) - SUM(pa) as dif,
        AVG(pf) - AVG(pa) as difpg
      FROM allGames
      ${where}
      (team = '${team2}')
      GROUP BY team`];

    db.serialize(() => {
      let combo = {
        'team1': {
          'team': team1,
          'h2h': {},
          "overall": {}
        },
        'team2': {
          'team': team2,
          'h2h': {},
          "overall": {}
        }
      };

      let floats = ['winp', 'totpg', 'ppg', 'papg', 'difpg']
      let ints = ['w', 'l', 'g', 'pf', 'pa', 'tot', 'dif']
      
      // function transformRows(rows) {
      //   rows.forEach(row => {
      //     Object.keys(row).forEach(key => {
      //       if (floats.includes(key)) { row[key] = parseFloat(parseFloat(row[key]).toFixed(3)); }
      //       if (ints.includes(key)) { row[key] = parseInt(row[key]); }
      //     });
      //   });
      // }
  
      queries.forEach((query, i) => {
        db.all(query, (err, result) => {
          if (err) {
            console.log(err);
          } else {
            if (i === 0) combo.team1.h2h = result[0]
            if (i === 1) combo.team2.h2h = result[0]
            if (i === 2) combo.team1.overall = result[0]
            if (i === 3) combo.team2.overall = result[0]
            if (i+1 === queries.length) {
              res.send(combo);
            }
          }
        });
      })
    });


    
    // transformRows(team1Result);
    // transformRows(team2Result);
    // transformRows(h2hResult_team1);
    // transformRows(h2hResult_team2);

  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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
        result.sort((a, b) => {
          const idA = parseInt(a.id);
          const idB = parseInt(b.id);
          return idB - idA; // Compare in descending order
        });
        res.send(result);
      }
    }
  );
});

// MEDALS

// get all matchups medals
router.get("/medals/:table/:column", (req, res) => {
  let col = req.params.column.toLowerCase();
  let where = req.params.table === 'RS' ? `WHERE season = 'r' AND ` : req.params.table === 'playoffs' ? `WHERE season = 'p' AND ` : `WHERE`
  let lim = col !== "totpg" && col !== "tot" ? 3 : 6;

  db.all(
    `
    SELECT 
    (MIN(team, opp) || MAX(team, opp)) as code, 
    team,
    sum(win) as "w",
    sum(loss) as "l",
    sum(win) + sum(loss) as "g",
    sum(win)/(sum(win) + sum(loss)) as "winp",
    opp,
    sum(pf) as "pf",
    sum(pa) as "pa",
    sum(pa) + sum(pf) as "tot",
    (sum(pa) + sum(pf) )/(sum(win) + sum(loss)) as "totpg",
    avg(pf) as "ppg",
    avg(pa) as "papg",
    sum(pf) - sum(pa)  as "dif",
    avg(pf) - avg(pa) as "difpg"
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
        if (col === "totpg" || col === "tot") {
          // need to round off per game stats
          if (col === "totpg") {
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
        } else if (col === "ppg" || col === "papg" || col === "difpg") {
          result.forEach((el) =>
            arr.push((Math.round(el[col] * 100) / 100).toFixed(1))
          );
          // format for winp
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
          result.forEach((el) => arr.push(el[col]));
        }
        res.send(arr);
      }
    }
  );
});

// get all medals for all matchups medals - BROKEN FOR WINP
router.get("/medals/:table", (req, res) => {
    const table = req.params.table;
    let where = 'WHERE';

    if (table === 'RS') {
      where = `WHERE season = 'r' AND `;
    } else if (table === 'playoffs') {
      where = `WHERE season = 'p' AND `;
    }

    const queries = [`
      SELECT 
        (MIN(team, opp) || MAX(team, opp)) as code, 
        team,
        opp,
        (sum(win)/(sum(win) + sum(loss))) * 100 as "winp"
      FROM allGames ${where}
      team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
      GROUP BY team, opp
      ORDER BY "winp" DESC
      LIMIT 3;
    `, 
    
    `
      SELECT 
        (MIN(team, opp) || MAX(team, opp)) as code, 
        team,
        opp,
        avg(pf) as "ppg"
      FROM allGames ${where}
      team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
      GROUP BY team, opp
      ORDER BY "ppg" DESC
      LIMIT 3;
    `, 
    
    `
      SELECT 
        (MIN(team, opp) || MAX(team, opp)) as code, 
        team,
        opp,
        avg(pa) as "papg"
      FROM allGames ${where}
      team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
      GROUP BY team, opp
      ORDER BY "papg" DESC
      LIMIT 3;
    `, 
    
    `
      SELECT 
        (MIN(team, opp) || MAX(team, opp)) as code, 
        team,
        opp,
        avg(pf) - avg(pa) as "difpg"
      FROM allGames ${where}
      team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
      GROUP BY team, opp
      ORDER BY "difpg" DESC
      LIMIT 3;
    `, 
    
    `
      SELECT 
        (MIN(team, opp) || MAX(team, opp)) as code, 
        team,
        opp,
        (sum(pa) + sum(pf) )/(sum(win) + sum(loss)) as "totpg"
      FROM allGames ${where}
      team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
      GROUP BY team, opp
      ORDER BY "totpg" DESC
      LIMIT 6;
    `, 
    
    `
      SELECT 
        (MIN(team, opp) || MAX(team, opp)) as code, 
        team,
        opp,
        sum(pa) + sum(pf) as "tot"
      FROM allGames ${where}
      team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
      GROUP BY team, opp
      ORDER BY "tot" DESC
      LIMIT 6;
    `, 
    
    `
      SELECT 
        (MIN(team, opp) || MAX(team, opp)) as code, 
        team,
        opp,
        sum(pf) as "pf"
      FROM allGames ${where}
      team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
      GROUP BY team, opp
      ORDER BY "pf" DESC
      LIMIT 3;
    `, 
    
    `
      SELECT 
        (MIN(team, opp) || MAX(team, opp)) as code, 
        team,
        opp,
        sum(pa) as "pa"
      FROM allGames ${where}
      team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
      GROUP BY team, opp
      ORDER BY "pa" DESC
      LIMIT 3;
    `, 
    
    `
      SELECT 
        (MIN(team, opp) || MAX(team, opp)) as code, 
        team,
        opp,
        sum(pf) - sum(pa) as "dif"
      FROM allGames ${where}
      team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
      GROUP BY team, opp
      ORDER BY "dif" DESC
      LIMIT 3;
    `];

    db.serialize(() => {
      let combinedStats = {
        'winp': [],
        'ppg': [],
        'papg': [],
        'difpg': [],
        'totpg': [],
        'tot': [],
        'pf': [],
        'pa': [],
        'dif': [],
      };
      let keys = ['winp', 'ppg', 'papg', 'difpg', 'totpg', 'tot', 'pf', 'pa', 'dif']
  
      queries.forEach((query, i) => {
        db.all(query, (err, result) => {
          if (err) {
            console.log(err);
          } else {
            processResults(keys[i], result, combinedStats);
            if (i+1 === queries.length) {
              res.send(combinedStats);
            }
          }
        });
      })
    });
});

function processResults(key, result, combinedStats) {
  let floats = ['ppg', 'papg', 'difpg', 'totpg']
  let ints = ['pf', 'pa', 'dif', 'tot']
  
  if (key === 'winp') { 
    let res = result.map((row) => {
      if (row[key] === 1) {
        return "1.000"
      } else {
        return (Math.round(row[key] * 1000) / 1000)
            .toFixed(3)
            .toString()
            .substring(1)
      }
    });
    combinedStats[key] = res
  }
  if (floats.includes(key) && result[0].hasOwnProperty(key)) { 
    let res = result.map(row => parseFloat(row[key]).toFixed(1))
    combinedStats[key] = res
  }
  if (ints.includes(key) && result[0].hasOwnProperty(key)) { 
    let res = result.map(row => parseInt(row[key]))
    combinedStats[key] = res
  }
  return
}

module.exports = router;
