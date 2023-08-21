const router = require("express").Router();
const mysql = require('mysql2')
const db = mysql.createConnection(process.env.PS_DATABASE_URL)
db.connect()

// get all matchups
router.get("/all/:column/:order/:table", (req, res) => {
  let col = req.params.column.toLowerCase();
  let order = req.params.order;
  let where = req.params.table === 'RS' ? `WHERE season = 'r' AND ` : req.params.table === 'playoffs' ? `WHERE season = 'p' AND ` : `WHERE`
  db.query(
    ` SELECT 
    team,
    sum(win) as "w",
    sum(loss) as "l",
    sum(win) + sum(loss) as "g",
    sum(win)/(sum(win) + sum(loss)) as "winp",
    opp,
    sum(pf) as "pf",
    sum(pa) as "pa",
    sum(pa) + sum(pf) as "tot",
    (sum(pa) + sum(pf))/(sum(win) + sum(loss)) as "totpg",
    avg(pf) as "ppg",
    avg(pa) as "papg",
    sum(pf) - sum(pa)  as "dif",
    avg(pf) - avg(pa) as "difpg"
    FROM allgames ${where}
    team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
    group by team, opp
    Order By ${col} ${order}, tot DESC, w DESC, ppg DESC`,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = [];
        let codes = [];
        if (col === "g" || col === "totpg" || col === "tot") {
          for (let i = 0; i < result.length; i++) {
            let code1 = result[i].team + result[i].opp
            let code2 = result[i].opp + result[i].team
            if (!codes.includes(code1)) {
              arr.push(result[i]);
              codes.push(code1);
              codes.push(code2);
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
      FROM allgames
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
      FROM allgames
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
      FROM allgames
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
      FROM allgames
      ${where}
      (team = '${team2}')
      GROUP BY team`];

      const results = await Promise.all(queries.map(query => {
        return new Promise((resolve, reject) => {
          db.query(query, (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        });
      }));

      const combo = {
        'team1': {
          'team': team1,
          'h2h': {},
          'overall': {},
        },
        'team2': {
          'team': team2,
          'h2h': {},
          'overall': {},
        },
      };
    
      results.forEach((result, i) => {
        if (i === 0) combo.team1.h2h = result[0];
        if (i === 1) combo.team2.h2h = result[0];
        if (i === 2) combo.team1.overall = result[0];
        if (i === 3) combo.team2.overall = result[0];
      });
    
      res.send(combo)
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
  db.query(
    `    
    SELECT * 
    FROM allgames ${where}
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

// get all matchups medals - NOT USED
router.get("/medals/:table/:column", (req, res) => {
  let col = req.params.column.toLowerCase();
  let where = req.params.table === 'RS' ? `WHERE season = 'r' AND ` : req.params.table === 'playoffs' ? `WHERE season = 'p' AND ` : `WHERE`
  let lim = col !== "totpg" && col !== "tot" ? 3 : 6;

  db.query(
    `SELECT 
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
    FROM allgames ${where}
    team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
    group by team, opp
    Order By ${col} DESC
    LIMIT ${lim}`,
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

// get all medals for all matchups medals
router.get("/medals/:table", async (req, res) => {
  try {
    const table = req.params.table;
    let where = 'WHERE';

    if (table === 'RS') {
      where = `WHERE season = 'r' AND `;
    } else if (table === 'playoffs') {
      where = `WHERE season = 'p' AND `;
    }

    const queries = [`
    SELECT 
      team,
      opp,
      (sum(win)/(sum(win) + sum(loss))) as "winp"
    FROM allgames ${where}
    team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
    GROUP BY team, opp
    ORDER BY ((sum(win)/(sum(win) + sum(loss))) * 100) DESC
    LIMIT 3;
  `, 
  
  `
    SELECT 
      team,
      opp,
      avg(pf) as "ppg"
    FROM allgames ${where}
    team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
    GROUP BY team, opp
    ORDER BY (avg(pf)) DESC
    LIMIT 3;
  `, 
  
  `
    SELECT 
      team,
      opp,
      avg(pa) as "papg"
    FROM allgames ${where}
    team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
    GROUP BY team, opp
    ORDER BY (avg(pa)) DESC
    LIMIT 3;
  `, 
  
  `
    SELECT 
      team,
      opp,
      avg(pf) - avg(pa) as "difpg"
    FROM allgames ${where}
    team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
    GROUP BY team, opp
    ORDER BY (avg(pf) - avg(pa)) DESC
    LIMIT 3;
  `, 
  
  `
    SELECT 
      team,
      opp,
      (sum(pa) + sum(pf) )/(sum(win) + sum(loss)) as "totpg"
    FROM allgames ${where}
    team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
    GROUP BY team, opp
    ORDER BY ((sum(pa) + sum(pf) )/(sum(win) + sum(loss))) DESC
    LIMIT 6;
  `, 
  
  `
    SELECT 
      team,
      opp,
      sum(pa) + sum(pf) as "tot"
    FROM allgames ${where}
    team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
    GROUP BY team, opp
    ORDER BY (sum(pa) + sum(pf)) DESC
    LIMIT 6;
  `, 
  
  `
    SELECT 
      team,
      opp,
      sum(pf) as "pf"
    FROM allgames ${where}
    team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
    GROUP BY team, opp
    ORDER BY sum(pf) DESC
    LIMIT 3;
  `, 
  
  `
    SELECT 
      team,
      opp,
      sum(pa) as "pa"
    FROM allgames ${where}
    team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
    GROUP BY team, opp
    ORDER BY sum(pa) DESC
    LIMIT 3;
  `, 
  
  `
    SELECT 
      team,
      opp,
      sum(pf) - sum(pa) as "dif"
    FROM allgames ${where}
    team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
    GROUP BY team, opp
    ORDER BY (sum(pf) - sum(pa)) DESC
    LIMIT 3;
  `];

    const results = await Promise.all(queries.map(query => executeQuery(query)));
    const combinedStats = processResults(results);
    
    res.send(combinedStats);
  } catch (error) {
    console.error('Error executing queries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function executeQuery(query) {
  return new Promise((resolve, reject) => {
    db.query(query, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

function processResults(results) {
  const combinedStats = {
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

  const keys = ['winp', 'ppg', 'papg', 'difpg', 'totpg', 'tot', 'pf', 'pa', 'dif'];

  results.forEach((result, i) => {
    processResult(keys[i], result, combinedStats);
  });
  return combinedStats;
}

function processResult(key, result, combinedStats) {
  let floats = ['ppg', 'papg', 'difpg', 'totpg'];
  let ints = ['pf', 'pa', 'dif', 'tot'];

  if (key === 'winp') {
    let res = result.map((row) => {
      console.log(row[key])
      if (row[key] === '1.0000') {
        return (Math.round(row[key] * 1000) / 1000)
        .toFixed(3)
        .toString();
      } else {
        return (Math.round(row[key] * 1000) / 1000)
          .toFixed(3)
          .toString()
          .substring(1);
      }
    });
    combinedStats[key] = res;
  }
  function deleteEveryOtherItem(arr) {
    if (arr.length === 6) {
      arr = arr.filter((_, index) => index % 2 === 0);
    }
  }
  if (floats.includes(key) && result[0].hasOwnProperty(key)) {
    let res = result.map((row) => parseFloat(row[key]).toFixed(1));
    deleteEveryOtherItem(res)
    combinedStats[key] = res;
  }
  if (ints.includes(key) && result[0].hasOwnProperty(key)) {
    let res = result.map((row) => parseInt(row[key]));
    deleteEveryOtherItem(res)
    combinedStats[key] = res;
  }
}



module.exports = router;
