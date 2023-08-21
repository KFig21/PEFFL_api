const router = require("express").Router();
const mysql = require('mysql2')
const db = mysql.createConnection(process.env.PS_DATABASE_URL)
db.connect()

// get single season stats
router.get("/table/:year/:sortBy/:sortOrder/:table", (req, res) => {
  const year = req.params.year;
  const sortBy = req.params.sortBy;
  const sortOrder = req.params.sortOrder;
  const season = req.params.table === 'RS' ? `AND season = 'r'` : req.params.table === 'playoffs' ? `AND season = 'p'` : '';

  const query = `
    SELECT 
      team as "team",
      ${Array.from({ length: 13 }, (_, i) => `MAX(CASE WHEN week = ${i + 1} THEN pf END) as week${i + 1},
                                              MAX(CASE WHEN week = ${i + 1} THEN win END) as week${i + 1}_outcome,
                                              MAX(CASE WHEN week = ${i + 1} THEN opp END) as week${i + 1}_opp,
                                              MAX(CASE WHEN week = ${i + 1} THEN pa END) as week${i + 1}_pa`).join(',\n')},
      ${year > 2020 ? `MAX(CASE WHEN week = 14 THEN pf END) as week14,
                       MAX(CASE WHEN week = 14 THEN win END) as week14_outcome,
                       MAX(CASE WHEN week = 14 THEN opp END) as week14_opp,
                       MAX(CASE WHEN week = 14 THEN pa END) as week14_pa,` : ''}
      MAX(CASE WHEN week = "WC" THEN pf END) as weekWc,
      MAX(CASE WHEN week = "WC" THEN win END) as weekWc_outcome,
      MAX(CASE WHEN week = "WC" THEN opp END) as weekWc_opp,
      MAX(CASE WHEN week = "WC" THEN pa END) as weekWc_pa,
      MAX(CASE WHEN week = "SF" THEN pf END) as weekSf,
      MAX(CASE WHEN week = "SF" THEN win END) as weekSf_outcome,
      MAX(CASE WHEN week = "SF" THEN opp END) as weekSf_opp,
      MAX(CASE WHEN week = "SF" THEN pa END) as weekSf_pa,
      MAX(CASE WHEN week = "DC" THEN pf END) as weekDc,
      MAX(CASE WHEN week = "DC" THEN win END) as weekDc_outcome,
      MAX(CASE WHEN week = "DC" THEN opp END) as weekDc_opp,
      MAX(CASE WHEN week = "DC" THEN pa END) as weekDc_pa,
      AVG(pf) as ppg,
      AVG(pa) as papg,
      SUM(pf) as pf,
      SUM(pa) as pa, 
      SUM(win) as w,
      SUM(loss) as l,
      SUM(win + loss) as g,
      SUM(pf - pa) as dif,
      AVG(pf - pa) as difpg
    FROM allgames
    WHERE year = ${year} ${season}
    GROUP BY team
    ORDER BY ${sortBy} ${sortOrder}`;

  db.query(query, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

// get single season trophies
router.get("/trophies/:year", (req, res) => {
  let year = req.params.year;

  db.query(
    `
    SELECT  
    (SELECT 
      team
      FROM awards
      WHERE year = ${year}
      AND lc = 1) as lc,
      
    (SELECT 
      team
      FROM awards
      WHERE year = ${year}
      AND ru = 1) as ru,
      
    (SELECT 
      team
      FROM awards
      WHERE year = ${year}
      AND rsc = 1) as rsc,
      
    (SELECT 
      team
      FROM awards
      WHERE year = ${year}
      AND p = 1) as p,
      
      (SELECT 
      team
      FROM awards
      WHERE year = ${year}
      AND dc = 1
      ORDER BY team DESC
      LIMIT 1) as dc1,
      
       
      (SELECT 
      team
      FROM awards
      WHERE year = ${year}
      AND dc = 1
      ORDER BY team ASC
      LIMIT 1) as dc2
      
    FROM awards
    WHERE year = ${year}
    LIMIT 1;
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

module.exports = router;
