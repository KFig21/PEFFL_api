const router = require("express").Router();
const mysql = require('mysql2')
const db = mysql.createConnection(process.env.PS_DATABASE_URL)
db.connect()

// OVERALL

// get ranks for Win%
router.get("/win/:table", (req, res) => {
  let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
  db.query(
    `
    SELECT 
    sum(win) / (sum(win) + sum(loss)) as "w"
    FROM allgames ${where}
    group by team
    order by w DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.w);
        res.send(arr);
      }
    }
  );
});

// get ranks for PPG
router.get("/ppg/:table", (req, res) => {
  let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
  db.query(
    `
    SELECT 
    AVG(pf) as "ppg"
    FROM allgames ${where}
    group by team
    order by ppg DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.ppg);
        res.send(arr);
      }
    }
  );
});

// get ranks for PAPG
router.get("/papg/:table", (req, res) => {
  let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
  db.query(
    `
    SELECT 
    AVG(pa) as "papg"
    FROM allgames ${where}
    group by team
    order by papg DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.papg);
        res.send(arr);
      }
    }
  );
});

// get ranks for DIFPG
router.get("/difpg/:table", (req, res) => {
  let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
  db.query(
    `
    SELECT 
    avg(pf) - avg(pa) as "difpg"
    FROM allgames ${where}
    group by team
    order by difpg DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.difpg);
        res.send(arr);
      }
    }
  );
});

// get ranks for PF
router.get("/pf/:table", (req, res) => {
  let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
  db.query(
    `
    SELECT 
    sum(pf) as "pf"
    FROM allgames ${where}
    group by team
    order by pf DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.pf);
        res.send(arr);
      }
    }
  );
});

// get ranks for PA
router.get("/pa/:table", (req, res) => {
  let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
  db.query(
    `
    SELECT 
    sum(pa) as "pa"
    FROM allgames ${where}
    group by team
    order by pa DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.pa);
        res.send(arr);
      }
    }
  );
});

// get ranks for DIF
router.get("/dif/:table", (req, res) => {
  let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
  db.query(
    `
    SELECT 
    sum(pf) - sum(pa) as "dif"
    FROM allgames ${where}
    group by team
    order by dif DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.dif);
        res.send(arr);
      }
    }
  );
});

//H2H

// get ranks for wins
router.get("/h2h/wins/:table", (req, res) => {
  let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
  db.query(
    `
    SELECT 
    (MIN(team, opp) || MAX(team, opp)) as code,
    team,
    opp,
    sum(win) as "w"
    FROM allgames ${where}
    group by team, opp
    Order By w DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.w);
        res.send(arr);
      }
    }
  );
});

// get ranks for ppg
router.get("/h2h/ppg/:table", (req, res) => {
  let where = req.params.table === 'RS' ? `WHERE season = 'r' AND` : req.params.table === 'playoffs' ? `WHERE season = 'p' AND` : `WHERE`
  db.query(
    `
    SELECT 
    (MIN(team, opp) || MAX(team, opp)) as code,
    team,
    opp,
    avg(pf) as "ppg"
    FROM allgames ${where}
    team != 'Taylor' AND team != 'AJ'
    and opp != 'Taylor' AND opp != 'AJ'
    group by team, opp
    Order By ppg DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.ppg);
        res.send(arr);
      }
    }
  );
});

// get ranks for ppg with AJ or Taylor
router.get("/h2h/filter/ppg/:table", (req, res) => {
  let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
  db.query(
    `
    SELECT 
    (MIN(team, opp) || MAX(team, opp)) as code,
    team,
    opp,
    avg(pf) as "ppg"
    FROM allgames ${where}
    group by team, opp
    Order By ppg DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.ppg);
        res.send(arr);
      }
    }
  );
});

// get ranks for pf
router.get("/h2h/pf/:table", (req, res) => {
  let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
  db.query(
    `
    SELECT 
    (MIN(team, opp) || MAX(team, opp)) as code,
    team,
    opp,
    sum(pf) as "pf"
    FROM allgames ${where}
    group by team, opp
    Order By pf DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.pf);
        res.send(arr);
      }
    }
  );
});

// get ranks for difpg
router.get("/h2h/difpg/:table", (req, res) => {
  let where = req.params.table === 'RS' ? `WHERE season = 'r' AND` : req.params.table === 'playoffs' ? `WHERE season = 'p' AND` : `WHERE`
  db.query(
    `
    SELECT 
    (MIN(team, opp) || MAX(team, opp)) as code,
    team,
    opp,
    avg(pf) - avg(pa)  as "difpg"
    FROM allgames ${where}
    team != 'Taylor' AND team != 'AJ'
    and opp != 'Taylor' AND opp != 'AJ'
    group by team, opp
    Order By difpg DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.difpg);
        res.send(arr);
      }
    }
  );
});

// get ranks for difpg with aj and taylor
router.get("/h2h/filter/difpg/:table", (req, res) => {
  let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
  db.query(
    `
    SELECT 
    (MIN(team, opp) || MAX(team, opp)) as code,
    team,
    opp,
    avg(pf) - avg(pa)  as "difpg"
    FROM allgames ${where}
    group by team, opp
    Order By difpg DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.difpg);
        res.send(arr);
      }
    }
  );
});

// get ranks for dif
router.get("/h2h/dif/:table", (req, res) => {
  let where = req.params.table === 'RS' ? `WHERE season = 'r'` : req.params.table === 'playoffs' ? `WHERE season = 'p'` : ``
  db.query(
    `
    SELECT 
    (MIN(team, opp) || MAX(team, opp)) as code,
    team,
    opp,
    sum(pf) - sum(pa)  as "dif"
    FROM allgames ${where}
    group by team, opp
    Order By dif DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.dif);
        res.send(arr);
      }
    }
  );
});

module.exports = router;
