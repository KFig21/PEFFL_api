const router = require("express").Router();
const pool = require("../pool");

// OVERALL

// get ranks for Win%
router.get("/win/:table", async (req, res) => {
  try {
    const db = await pool.connect()
    let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : '';
    
    db.query(
      `
      SELECT 
        team,
        sum(win) / (sum(win) + sum(loss)) as "W"
      FROM allGames
      ${where}
      GROUP BY team
      ORDER BY "W" DESC
      `,
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          let arr = result.rows.map((row) => parseFloat(row.W));
          res.send(arr);
        }
      }
    );
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// get ranks for PPG
router.get("/ppg/:table", async (req, res) => {
  try {
    const db = await pool.connect()
    let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
    db.query(
      `
      SELECT 
        team,
        AVG(pf) as "PPG"
      FROM allGames ${where}
      group by team
      order by "PPG" DESC
      `,
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          let arr = result.rows.map((row) => parseFloat(row.PPG));
          res.send(arr);
        }
      }
    );
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get ranks for PAPG
router.get("/papg/:table", async (req, res) => {
  try {
    const db = await pool.connect()
    let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
    db.query(
      `
      SELECT 
        team,
        AVG(pa) as "PAPG"
      FROM allGames ${where}
      group by team
      order by "PAPG" DESC
      `,
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          let arr = result.rows.map((row) => parseFloat(row.PAPG));
          res.send(arr);
        }
      }
    );
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get ranks for DIFPG
router.get("/difpg/:table", async (req, res) => {
  try {
    const db = await pool.connect()
    let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
    db.query(
      `
      SELECT 
        team,
        avg(pf) - avg(pa) as "DIFPG"
      FROM allGames ${where}
      group by team
      order by "DIFPG" DESC
      `,
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          let arr = result.rows.map((obj) => parseFloat(parseFloat(obj.DIFPG).toFixed(3)));
          res.send(arr);
        }
      }
    );
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get ranks for PF
router.get("/pf/:table", async (req, res) => {
  try {
    const db = await pool.connect()
    let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
    db.query(
      `
      SELECT
        team, 
        sum(pf) as "PF"
      FROM allGames ${where}
      group by team
      order by "PF" DESC
      `,
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          let arr = result.rows.map((obj) => parseInt(obj.PF));
          res.send(arr);
        }
      }
    );
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get ranks for PA
router.get("/pa/:table", async (req, res) => {
  try {
    const db = await pool.connect()
    let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
    db.query(
      `
      SELECT
        team,
        sum(pa) as "PA"
      FROM allGames ${where}
      group by team
      order by "PA" DESC
      `,
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          let arr = result.rows.map((obj) => parseInt(obj.PA));
          res.send(arr);
        }
      }
    );
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get ranks for DIF
router.get("/dif/:table", async (req, res) => {
  try {
    const db = await pool.connect()
    let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
    db.query(
      `
      SELECT 
        team,
        sum(pf) - sum(pa) as "DIF"
      FROM allGames ${where}
      group by team
      order by "DIF" DESC
      `,
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          let arr = result.rows.map((obj) => parseInt(obj.DIF));
          res.send(arr);
        }
      }
    );
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//H2H

// get ranks for wins
router.get("/h2h/wins/:table", async (req, res) => {
  try {
    const db = await pool.connect()
    let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
    db.query(
      `
      SELECT 
        (LEAST(team, opp) || GREATEST(team, opp)) as code,
        team,
        opp,
        sum(win) as "W"
      FROM allGames
      ${where}
      GROUP BY team, opp
      ORDER BY "W" DESC;
      `,
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          let arr = result.rows.map((obj) => parseInt(obj.W));
          res.send(arr);
        }
      }
    );
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get ranks for ppg
router.get("/h2h/ppg/:table", async (req, res) => {
  try {
    const db = await pool.connect()
    let where = req.params.table === 'RS' ? `WHERE season = 'r' AND` : req.params.table === 'playoffs' ? `WHERE season = 'p' AND` : `WHERE`
    db.query(
      `
      SELECT 
        (LEAST(team, opp) || GREATEST(team, opp)) as code,
        team,
        opp,
        avg(pf) as "PPG"
      FROM allGames ${where}
      team != 'Taylor' AND team != 'AJ'
      and opp != 'Taylor' AND opp != 'AJ'
      group by team, opp
      Order By "PPG" DESC
      `,
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          let arr = result.rows.map((obj) => parseFloat(parseFloat(obj.PPG).toFixed(3)));
          res.send(arr);
        }
      }
    );
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get ranks for ppg with AJ or Taylor
router.get("/h2h/filter/ppg/:table", async (req, res) => {
  try {
    const db = await pool.connect()
    let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
    db.query(
      `
      SELECT 
        (LEAST(team, opp) || GREATEST(team, opp)) as code,
        team,
        opp,
        avg(pf) as "PPG"
      FROM allGames ${where}
      group by team, opp
      Order By "PPG" DESC
      `,
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          let arr = result.rows.map((obj) => parseFloat(parseFloat(obj.PPG).toFixed(3)));
          res.send(arr);
        }
      }
    );
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get ranks for pf
router.get("/h2h/pf/:table", async (req, res) => {
  try {
    const db = await pool.connect()
    let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
    db.query(
      `
      SELECT 
        (LEAST(team, opp) || GREATEST(team, opp)) as code,
        team,
        opp,
        sum(pf) as "PF"
      FROM allGames ${where}
      group by team, opp
      Order By "PF" DESC
      `,
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          let arr = result.rows.map((obj) => parseInt(obj.PF));
          res.send(arr);
        }
      }
    );
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get ranks for difpg
router.get("/h2h/difpg/:table", async (req, res) => {
  try {
    const db = await pool.connect()
    let where = req.params.table === 'RS' ? `WHERE season = 'r' AND` : req.params.table === 'playoffs' ? `WHERE season = 'p' AND` : `WHERE`
    db.query(
      `
      SELECT 
        (LEAST(team, opp) || GREATEST(team, opp)) as code,
        team,
        opp,
        avg(pf) - avg(pa) as "DIFPG"
      FROM allGames ${where}
      team != 'Taylor' AND team != 'AJ'
      and opp != 'Taylor' AND opp != 'AJ'
      group by team, opp
      Order By "DIFPG" DESC
      `,
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          let arr = result.rows.map((obj) => parseFloat(parseFloat(obj.DIFPG).toFixed(3)));
          res.send(arr);
        }
      }
    );
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get ranks for difpg with aj and taylor
router.get("/h2h/filter/difpg/:table", async (req, res) => {
  try {
    const db = await pool.connect()
    let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
    db.query(
      `
      SELECT 
        (LEAST(team, opp) || GREATEST(team, opp)) as code,
        team,
        opp,
        avg(pf) - avg(pa)  as "DIFPG"
      FROM allGames ${where}
      group by team, opp
      Order By "DIFPG" DESC
      `,
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          let arr = result.rows.map((obj) => parseFloat(obj.DIFPG));
          res.send(arr);
        }
      }
    );
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get ranks for dif
router.get("/h2h/dif/:table", async (req, res) => {
  try {
    const db = await pool.connect()
    let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
    db.query(
      `
      SELECT 
        (LEAST(team, opp) || GREATEST(team, opp)) as code,
        team,
        opp,
        sum(pf) - sum(pa)  as "DIF
      FROM allGames ${where}
      group by team, opp
      Order By "DIF" DESC
      `,
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          let arr = result.rows.map((obj) => parseInt(obj.DIF));
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
