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
  console.log("Connected to database.");
});

// OVERALL

// get ranks for Win%
router.get("/win/:table", (req, res) => {
  let table = req.params.table;
  db.query(
    `
    SELECT 
    sum(win) / (sum(win) + sum(loss)) as 'W'
    FROM peffl_data.PEFFL_${table}
    group by team
    order by W DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.W);
        res.send(arr);
      }
    }
  );
});

// get ranks for PPG
router.get("/ppg/:table", (req, res) => {
  let table = req.params.table;
  db.query(
    `
    SELECT 
    AVG(pf) as 'PPG'
    FROM peffl_data.PEFFL_${table}
    group by team
    order by PPG DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.PPG);
        res.send(arr);
      }
    }
  );
});

// get ranks for PAPG
router.get("/papg/:table", (req, res) => {
  let table = req.params.table;
  db.query(
    `
    SELECT 
    AVG(pa) as 'PAPG'
    FROM peffl_data.PEFFL_${table}
    group by team
    order by PAPG DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.PAPG);
        res.send(arr);
      }
    }
  );
});

// get ranks for DIFPG
router.get("/difpg/:table", (req, res) => {
  let table = req.params.table;
  db.query(
    `
    SELECT 
    avg(pf) - avg(pa) as 'DIFPG'
    FROM peffl_data.PEFFL_${table}
    group by team
    order by DIFPG DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.DIFPG);
        res.send(arr);
      }
    }
  );
});

// get ranks for PF
router.get("/pf/:table", (req, res) => {
  let table = req.params.table;
  db.query(
    `
    SELECT 
    sum(pf) as 'PF'
    FROM peffl_data.PEFFL_${table}
    group by team
    order by PF DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.PF);
        res.send(arr);
      }
    }
  );
});

// get ranks for PA
router.get("/pa/:table", (req, res) => {
  let table = req.params.table;
  db.query(
    `
    SELECT 
    sum(pa) as 'PA'
    FROM peffl_data.PEFFL_${table}
    group by team
    order by PA DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.PA);
        res.send(arr);
      }
    }
  );
});

// get ranks for DIF
router.get("/dif/:table", (req, res) => {
  let table = req.params.table;
  db.query(
    `
    SELECT 
    sum(pf) - sum(pa) as 'DIF'
    FROM peffl_data.PEFFL_${table}
    group by team
    order by DIF DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.DIF);
        res.send(arr);
      }
    }
  );
});

//H2H

// get ranks for wins
router.get("/h2h/wins/:table", (req, res) => {
  let table = req.params.table;
  db.query(
    `
    SELECT 
    concat(LEAST(team, opp), GREATEST(team, opp)) as code,
    team,
    opp,
    sum(win) as 'W'
    FROM peffl_data.PEFFL_${table}
    group by team, opp
    Order By W DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.W);
        res.send(arr);
      }
    }
  );
});

// get ranks for ppg
router.get("/h2h/ppg/:table", (req, res) => {
  let table = req.params.table;
  db.query(
    `
    SELECT 
    concat(LEAST(team, opp), GREATEST(team, opp)) as code,
    team,
    opp,
    avg(pf) as 'PPG'
    FROM peffl_data.PEFFL_${table}
    WHERE team != 'Taylor' AND team != 'AJ'
    and opp != 'Taylor' AND opp != 'AJ'
    group by team, opp
    Order By PPG DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.PPG);
        res.send(arr);
      }
    }
  );
});

// get ranks for ppg with AJ or Taylor
router.get("/h2h/filter/ppg/:table", (req, res) => {
  let table = req.params.table;
  db.query(
    `
    SELECT 
    concat(LEAST(team, opp), GREATEST(team, opp)) as code,
    team,
    opp,
    avg(pf) as 'PPG'
    FROM peffl_data.PEFFL_${table}
    group by team, opp
    Order By PPG DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.PPG);
        res.send(arr);
      }
    }
  );
});

// get ranks for pf
router.get("/h2h/pf/:table", (req, res) => {
  let table = req.params.table;
  db.query(
    `
    SELECT 
    concat(LEAST(team, opp), GREATEST(team, opp)) as code,
    team,
    opp,
    sum(pf) as 'PF'
    FROM peffl_data.PEFFL_${table}
    group by team, opp
    Order By PF DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.PF);
        res.send(arr);
      }
    }
  );
});

// get ranks for difpg
router.get("/h2h/difpg/:table", (req, res) => {
  let table = req.params.table;
  db.query(
    `
    SELECT 
    concat(LEAST(team, opp), GREATEST(team, opp)) as code,
    team,
    opp,
    avg(pf) - avg(pa)  as 'DIFPG'
    FROM peffl_data.PEFFL_${table}
    WHERE team != 'Taylor' AND team != 'AJ'
    and opp != 'Taylor' AND opp != 'AJ'
    group by team, opp
    Order By DIFPG DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.DIFPG);
        res.send(arr);
      }
    }
  );
});

// get ranks for difpg with aj and taylor
router.get("/h2h/filter/difpg/:table", (req, res) => {
  let table = req.params.table;
  db.query(
    `
    SELECT 
    concat(LEAST(team, opp), GREATEST(team, opp)) as code,
    team,
    opp,
    avg(pf) - avg(pa)  as 'DIFPG'
    FROM peffl_data.PEFFL_${table}
    group by team, opp
    Order By DIFPG DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.DIFPG);
        res.send(arr);
      }
    }
  );
});

// get ranks for dif
router.get("/h2h/dif/:table", (req, res) => {
  let table = req.params.table;
  db.query(
    `
    SELECT 
    concat(LEAST(team, opp), GREATEST(team, opp)) as code,
    team,
    opp,
    sum(pf) - sum(pa)  as 'DIF'
    FROM peffl_data.PEFFL_${table}
    group by team, opp
    Order By DIF DESC
    `,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        let arr = result.map((obj) => obj.DIF);
        res.send(arr);
      }
    }
  );
});

module.exports = router;
