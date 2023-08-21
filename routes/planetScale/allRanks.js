const router = require("express").Router();
const mysql = require('mysql2')
const db = mysql.createConnection(process.env.PS_DATABASE_URL)
db.connect()

router.get("/:table", async (req, res) => {
    try {
        const table = req.params.table;
        let where = '';
    
        if (table === 'RS') {
          where = `WHERE season = 'r'`;
        } else if (table === 'playoffs') {
          where = `WHERE season = 'p'`;
        }
    
        const overallResponses = await Promise.all([
          getRankData(db, where, 'win'),
          getRankData(db, where, 'ppg'),
          getRankData(db, where, 'papg'),
          getRankData(db, where, 'difpg'),
          getRankData(db, where, 'pf'),
          getRankData(db, where, 'pa'),
          getRankData(db, where, 'dif')
        ]);
    
        const h2hResponses = await Promise.all([
          getH2HRankData(db, where, 'wins'),
          getH2HRankData(db, where, 'ppg'),
          getH2HRankData(db, where, 'ppgfilter'),
          getH2HRankData(db, where, 'pf'),
          getH2HRankData(db, where, 'difpg'),
          getH2HRankData(db, where, 'difpgfilter'),
          getH2HRankData(db, where, 'dif')
        ]);
    
        const rankedData = {
          overall: {
            win: overallResponses[0],
            ppg: overallResponses[1],
            papg: overallResponses[2],
            difpg: overallResponses[3],
            pf: overallResponses[4],
            pa: overallResponses[5],
            dif: overallResponses[6]
          },
          h2h: {
            wins: h2hResponses[0],
            ppg: h2hResponses[1],
            ppgfilter: h2hResponses[2],
            pf: h2hResponses[3],
            difpg: h2hResponses[4],
            difpgfilter: h2hResponses[5],
            dif: h2hResponses[6]
          }
        };
    
        res.json(rankedData);
      } catch (error) {
        console.error('Error executing queries:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    async function getRankData(db, where, rankType) {
    return new Promise((resolve, reject) => {
        let query = '';

        switch (rankType) {
        case 'win':
            query = `
                SELECT 
                team,
                win_ratio as "win"
                FROM (
                    SELECT 
                        team,
                        sum(win) / (sum(win) + sum(loss)) as win_ratio
                    FROM allgames
                    ${where}
                    GROUP BY team
                ) AS win_subquery
                ORDER BY win_ratio DESC
            `;
            break;
        case 'ppg':
        case 'papg':
            query = `
            SELECT 
                team,
                AVG(${rankType === 'ppg' ? 'pf' : 'pa'}) as "${rankType}"
            FROM allgames ${where}
            GROUP BY team
            ORDER BY (AVG(${rankType === 'ppg' ? 'pf' : 'pa'})) DESC
            `;
            break;
        case 'difpg':
            query = `
            SELECT 
                team,
                avg(pf) - avg(pa) as "${rankType}"
            FROM allgames ${where}
            GROUP BY team
            ORDER BY (avg(pf) - avg(pa)) DESC
            `;
            break;
        case 'pf':
        case 'pa':
        case 'dif':
            query = `
            SELECT
                team,
                sum(${rankType === 'pf' ? 'pf' : rankType === 'pa' ? 'pa' : 'pf - pa'}) as "${rankType}"
            FROM allgames ${where}
            GROUP BY team
            ORDER BY (sum(${rankType === 'pf' ? 'pf' : rankType === 'pa' ? 'pa' : 'pf - pa'})) DESC
            `;
            break;
        }

        db.query(query, (err, result) => {
        if (err) {
            console.log(err);
            reject(err);
        } else {
            const arr = result.map((row) => {
            if (rankType === 'win' || rankType === 'ppg' || rankType === 'papg' || rankType === 'difpg') {
                return parseFloat(parseFloat(row[rankType]).toFixed(3));
            } else {
                return parseInt(row[rankType]);
            }
            });
            resolve(arr);
        }
        });
    });
    }

    async function getH2HRankData(db, where, rankType) {
        return new Promise((resolve, reject) => {
        let query = '';
    
        switch (rankType) {
            case 'wins':
                query = `
                    SELECT 
                    team,
                    opp,
                    sum(win) as "${rankType.toUpperCase()}"
                    FROM allgames
                    ${where}
                    GROUP BY team, opp
                    ORDER BY sum(win) DESC;
                `;
                break;
            case 'ppg':
                query = `
                    SELECT 
                    team,
                    opp,
                    avg(pf) as "${rankType.toUpperCase()}"
                    FROM allgames ${where}
                    group by team, opp
                    Order By avg(pf) DESC
                `;
                break;
            case 'ppgfilter':
                query = `
                    SELECT 
                    team,
                    opp,
                    avg(pf) as "${rankType.toUpperCase()}"
                    FROM allgames ${where}
                    ${where === '' ? 'WHERE' : 'AND'} team != 'Taylor' AND team != 'AJ'
                    AND opp != 'Taylor' AND opp != 'AJ'
                    group by team, opp
                    Order By avg(pf) DESC
                `;
                break;
            case 'pf':
                query = `
                    SELECT 
                    team,
                    opp,
                    sum(pf) as "${rankType.toUpperCase()}"
                    FROM allgames ${where}
                    group by team, opp
                    Order By sum(pf) DESC
                `;
                break;
            case 'difpg':
                query = `
                    SELECT 
                    team,
                    opp,
                    avg(pf) - avg(pa) as "${rankType.toUpperCase()}"
                    FROM allgames ${where}
                    group by team, opp
                    Order By (avg(pf) - avg(pa)) DESC
                `;
                break;
            case 'difpgfilter':
                query = `
                    SELECT 
                    team,
                    opp,
                    avg(pf) - avg(pa) as "${rankType.toUpperCase()}"
                    FROM allgames ${where}
                    ${where === '' ? 'WHERE' : 'AND'} team != 'Taylor' AND team != 'AJ'
                    AND opp != 'Taylor' AND opp != 'AJ'
                    group by team, opp
                    Order By (avg(pf) - avg(pa)) DESC
                `;
                break;
            case 'dif':
                query = `
                    SELECT 
                    team,
                    opp,
                    sum(pf) - sum(pa) as "${rankType.toUpperCase()}"
                    FROM allgames ${where}
                    group by team, opp
                    Order By (sum(pf) - sum(pa)) DESC
                `;
                break;
        }
    
        db.query(query, (err, result) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                const arr = result.map((row) => {
                    if (rankType === 'ppg' || rankType === 'difpg' || rankType === 'ppgfilter' || rankType === 'difpgfilter') {
                        return parseFloat(parseFloat(row[rankType.toUpperCase()]).toFixed(3));
                    } else {
                        return parseInt(row[rankType.toUpperCase()]);
                    }
                });
                resolve(arr);
            }
        });
        });
    }

module.exports = router;
