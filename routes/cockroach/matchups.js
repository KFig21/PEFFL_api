const router = require("express").Router();
const pool = require("../pool");

// get all matchups
router.get("/all/:column/:order/:table", async (req, res) => {
  try {
    const db = await pool.connect();
    const col = req.params.column.toLowerCase();
    const order = req.params.order;
    const table = req.params.table;
    let where = '';

    if (table === 'RS') {
      where = `WHERE season = 'r' AND `;
    } else if (table === 'playoffs') {
      where = `WHERE season = 'p' AND `;
    }

    const query = `
      SELECT 
        (LEAST(team, opp) || GREATEST(team, opp)) as code,
        team,
        sum(win) as "w",
        sum(loss) as "l",
        sum(win) + sum(loss) as "g",
        sum(win) / (sum(win) + sum(loss)) as "winp",
        opp,
        sum(pf) as "pf",
        sum(pa) as "pa",
        sum(pa) + sum(pf) as "tot",
        (sum(pa) + sum(pf)) / (sum(win) + sum(loss)) as "totpg",
        avg(pf) as "ppg",
        avg(pa) as "papg",
        sum(pf) - sum(pa) as "dif",
        avg(pf) - avg(pa) as "difpg"
      FROM allGames ${where}
      team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
      GROUP BY team, opp
      ORDER BY ${col} ${order}, "tot" DESC, code DESC, "w" DESC, "ppg" DESC;
      `;

    db.query(query, (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        let arr = [];
        let codes = [];
        let floats = ['winp', 'totpg', 'ppg', 'papg', 'difpg']    
        let ints = ['w', 'l', 'g', 'pf', 'pa', 'tot', 'dif']    

        result.rows.forEach(row => {
          Object.keys(row).forEach(key => {
            if (floats.includes(key)) { row[key] = parseFloat(parseFloat(row[key]).toFixed(3)); }
            if (ints.includes(key)) { row[key] = parseInt(row[key]); }
          });
        })
        if (col === 'g' || col === 'totpg' || col === 'tot') {
          for (let i = 0; i < result.rows.length; i++) {
            if (!codes.includes(result.rows[i].code)) {
              arr.push(result.rows[i]);
              codes.push(result.rows[i].code);
            }
          }
          res.send(arr);
        } else {
          res.send(result.rows);
        }
      }
    });
  } catch (error) {
    console.error('Error executing queries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// get h2h
// had to use a bunch of IFNULLs because in the instance that 2 teams
// never played a playoff game the query would return nothing if
// searching for a playoff table
router.get("/h2h/:team1/:team2/:table", async (req, res) => {
  try {
    const db = await pool.connect();
    let team1 = req.params.team1;
    let team2 = req.params.team2;
    let where = req.params.table === 'RS' ? `WHERE season = 'r' AND ` : req.params.table === 'playoffs' ? `WHERE season = 'p' AND ` : `WHERE`;

    const h2hQuery_team1 = `
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
    `
    const h2hQuery_team2 = `
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
    `
    const team1Query = `
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
      GROUP BY team`

    const team2Query = `
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
      GROUP BY team`

    const [h2hResult_team1, h2hResult_team2, team1Result, team2Result] = await Promise.all([
      db.query(h2hQuery_team1),
      db.query(h2hQuery_team2),
      db.query(team1Query),
      db.query(team2Query),
    ]);

    let floats = ['winp', 'totpg', 'ppg', 'papg', 'difpg']
    let ints = ['w', 'l', 'g', 'pf', 'pa', 'tot', 'dif']

    function transformRows(rows) {
      rows.forEach(row => {
        Object.keys(row).forEach(key => {
          if (floats.includes(key)) { row[key] = parseFloat(parseFloat(row[key]).toFixed(3)); }
          if (ints.includes(key)) { row[key] = parseInt(row[key]); }
        });
      });
    }
    
    transformRows(team1Result.rows);
    transformRows(team2Result.rows);
    transformRows(h2hResult_team1.rows);
    transformRows(h2hResult_team2.rows);

    const combo = {
      team1: { 'team': team1, 'h2h': h2hResult_team1.rows[0], 'overall': team1Result.rows[0] },
      team2: { 'team': team2, 'h2h': h2hResult_team2.rows[0], 'overall': team2Result.rows[0] },
    };
    console.log(combo)
    res.send(combo)
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get all h2h games
router.get("/h2h/allmatchups/:team1/:team2/:table", async (req, res) => {
  try {
    const db = await pool.connect()
    let team1 = req.params.team1;
    let team2 = req.params.team2;
    let where = req.params.table === 'RS' ? `WHERE season = 'r' AND ` : req.params.table === 'playoffs' ? `WHERE season = 'p' AND ` : `WHERE`
    db.query(
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
          let matchups = result.rows
          let ints = ['id', 'year', 'pf', 'pa', 'win', 'loss']
          for(let i = 0; i < matchups.length; i++) {
            let temp = matchups[i]
            Object.keys(temp).forEach(key => { if (ints.includes(key)) { temp[key] = parseInt(temp[key]) } });
          }
          matchups.sort((a, b) => {
            return b.id - a.id; // Compare in descending order
          });
          res.send(matchups);
        }
      }
    );
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// MEDALS

// get all matchups medals -- NOT USED
router.get("/medals/:table/:column", async (req, res) => {
  try {
    const db = await pool.connect();
    let col = req.params.column.toLowerCase();
    let where = req.params.table === 'RS' ? `WHERE season = 'r' AND ` : req.params.table === 'playoffs' ? `WHERE season = 'p' AND ` : `WHERE`
    let lim = col !== "totpg" && col !== "tot" ? 3 : 6;

    db.query(
      `
      SELECT 
      (LEAST(team, opp) || GREATEST(team, opp)) as code, 
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
              for (let i = 0; i < result.rows.length; i++) {
                if (!codes.includes(result.rows[i].code)) {
                  arr.push((Math.round(result.rows[i][col] * 100) / 100).toFixed(1));
                  codes.push(result.rows[i].code);
                }
              }
            } else {
              for (let i = 0; i < result.rows.length; i++) {
                if (!codes.includes(result.rows[i].code)) {
                  arr.push(result.rows[i][col]);
                  codes.push(result.rows[i].code);
                }
              }
            }
            // need to round per game stats
          } else if (col === "ppg" || col === "papg" || col === "difpg") {
            result.rows.forEach((el) =>
              arr.push((Math.round(el[col] * 100) / 100).toFixed(1))
            );
            // format for WinP
          } else if (col === "winp") {
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
          res.send(arr);
        }
      }
    );
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get all medals for all matchups medals
router.get("/medals/:table", async (req, res) => {
  try {
    const db = await pool.connect();
    const table = req.params.table;
    let where = '';

    if (table === 'RS') {
      where = `WHERE season = 'r' AND `;
    } else if (table === 'playoffs') {
      where = `WHERE season = 'p' AND `;
    }

    const winpQuery = `
      SELECT 
        (LEAST(team, opp) || GREATEST(team, opp)) as code, 
        team,
        opp,
        sum(win)/(sum(win) + sum(loss)) as "winp"
      FROM allGames ${where}
      team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
      GROUP BY team, opp
      ORDER BY "winp" DESC
      LIMIT 3;
    `;

    const ppgQuery = `
      SELECT 
        (LEAST(team, opp) || GREATEST(team, opp)) as code, 
        team,
        opp,
        avg(pf) as "ppg"
      FROM allGames ${where}
      team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
      GROUP BY team, opp
      ORDER BY "ppg" DESC
      LIMIT 3;
    `;

    const papgQuery = `
      SELECT 
        (LEAST(team, opp) || GREATEST(team, opp)) as code, 
        team,
        opp,
        avg(pa) as "papg"
      FROM allGames ${where}
      team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
      GROUP BY team, opp
      ORDER BY "papg" DESC
      LIMIT 3;
    `;

    const difpgQuery = `
      SELECT 
        (LEAST(team, opp) || GREATEST(team, opp)) as code, 
        team,
        opp,
        avg(pf) - avg(pa) as "difpg"
      FROM allGames ${where}
      team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
      GROUP BY team, opp
      ORDER BY "difpg" DESC
      LIMIT 3;
    `;

    const totpgQuery = `
      SELECT 
        (LEAST(team, opp) || GREATEST(team, opp)) as code, 
        team,
        opp,
        (sum(pa) + sum(pf) )/(sum(win) + sum(loss)) as "totpg"
      FROM allGames ${where}
      team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
      GROUP BY team, opp
      ORDER BY "totpg" DESC
      LIMIT 6;
    `;

    const totQuery = `
      SELECT 
        (LEAST(team, opp) || GREATEST(team, opp)) as code, 
        team,
        opp,
        sum(pa) + sum(pf) as "tot"
      FROM allGames ${where}
      team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
      GROUP BY team, opp
      ORDER BY "tot" DESC
      LIMIT 6;
    `;

    const pfQuery = `
      SELECT 
        (LEAST(team, opp) || GREATEST(team, opp)) as code, 
        team,
        opp,
        sum(pf) as "pf"
      FROM allGames ${where}
      team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
      GROUP BY team, opp
      ORDER BY "pf" DESC
      LIMIT 3;
    `;

    const paQuery = `
      SELECT 
        (LEAST(team, opp) || GREATEST(team, opp)) as code, 
        team,
        opp,
        sum(pa) as "pa"
      FROM allGames ${where}
      team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
      GROUP BY team, opp
      ORDER BY "pa" DESC
      LIMIT 3;
    `;

    const difQuery = `
      SELECT 
        (LEAST(team, opp) || GREATEST(team, opp)) as code, 
        team,
        opp,
        sum(pf) - sum(pa) as "dif"
      FROM allGames ${where}
      team != 'Taylor' AND opp != 'Taylor' AND team != 'AJ' AND opp != 'AJ'
      GROUP BY team, opp
      ORDER BY "dif" DESC
      LIMIT 3;
    `;

    const [winpResult, ppgResult, papgResult, difpgResult, totpgResult, totResult, pfResult, paResult, difResult] = await Promise.all([
      db.query(winpQuery),
      db.query(ppgQuery),
      db.query(papgQuery),
      db.query(difpgQuery),
      db.query(totpgQuery),
      db.query(totQuery),
      db.query(pfQuery),
      db.query(paQuery),
      db.query(difQuery),
    ]);

    const combinedStats = {
      winp: winpResult.rows.map(obj => parseFloat(obj.winp)),
      ppg: ppgResult.rows.map(obj => parseFloat(obj.ppg).toFixed(1)),
      papg: papgResult.rows.map(obj => parseFloat(obj.papg).toFixed(1)),
      difpg: difpgResult.rows.map(obj => parseFloat(obj.difpg).toFixed(1)),
      totpg: totpgResult.rows.filter((_, index) => index % 2 === 0).map(obj => parseFloat(obj.totpg).toFixed(1)),
      tot: totResult.rows.filter((_, index) => index % 2 === 0).map((obj) => parseInt(obj.tot)),
      pf: pfResult.rows.map(obj => parseInt(obj.pf)),
      pa: paResult.rows.map(obj => parseInt(obj.pa)),
      dif: difResult.rows.map(obj => parseInt(obj.dif)),
    };
    res.send(combinedStats);
  } catch (error) {
    console.error('Error executing queries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
