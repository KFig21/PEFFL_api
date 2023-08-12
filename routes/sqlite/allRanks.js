const router = require("express").Router();

const { initializeDatabase } = require('../../database');
const db = initializeDatabase();

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
                sum(win) / (sum(win) + sum(loss)) as "${rankType.toUpperCase()}"
            FROM allGames
            ${where}
            GROUP BY team
            ORDER BY "${rankType.toUpperCase()}" DESC
            `;
            break;
        case 'ppg':
        case 'papg':
            query = `
            SELECT 
                team,
                AVG(${rankType === 'ppg' ? 'pf' : 'pa'}) as "${rankType.toUpperCase()}"
            FROM allGames ${where}
            GROUP BY team
            ORDER BY "${rankType.toUpperCase()}" DESC
            `;
            break;
        case 'difpg':
            query = `
            SELECT 
                team,
                avg(pf) - avg(pa) as "${rankType.toUpperCase()}"
            FROM allGames ${where}
            GROUP BY team
            ORDER BY "${rankType.toUpperCase()}" DESC
            `;
            break;
        case 'pf':
        case 'pa':
        case 'dif':
            query = `
            SELECT
                team,
                sum(${rankType === 'pf' ? 'pf' : rankType === 'pa' ? 'pa' : 'pf - pa'}) as "${rankType.toUpperCase()}"
            FROM allGames ${where}
            GROUP BY team
            ORDER BY "${rankType.toUpperCase()}" DESC
            `;
            break;
        }

        db.all(query, (err, result) => {
        if (err) {
            console.log(err);
            reject(err);
        } else {
            const arr = result.map((row) => {
            if (rankType === 'win' || rankType === 'ppg' || rankType === 'papg' || rankType === 'difpg') {
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

    async function getH2HRankData(db, where, rankType) {
        return new Promise((resolve, reject) => {
        let query = '';
    
        switch (rankType) {
            case 'wins':
                query = `
                    SELECT 
                    (MIN(team, opp) || MAX(team, opp)) as code,
                    team,
                    opp,
                    sum(win) as "${rankType.toUpperCase()}"
                    FROM allGames
                    ${where}
                    GROUP BY team, opp
                    ORDER BY "${rankType.toUpperCase()}" DESC;
                `;
                break;
            case 'ppg':
                query = `
                    SELECT 
                    (MIN(team, opp) || MAX(team, opp)) as code,
                    team,
                    opp,
                    avg(pf) as "${rankType.toUpperCase()}"
                    FROM allGames ${where}
                    group by team, opp
                    Order By "${rankType.toUpperCase()}" DESC
                `;
                break;
            case 'ppgfilter':
                query = `
                    SELECT 
                    (MIN(team, opp) || MAX(team, opp)) as code,
                    team,
                    opp,
                    avg(pf) as "${rankType.toUpperCase()}"
                    FROM allGames ${where}
                    ${where === '' ? 'WHERE' : 'AND'} team != 'Taylor' AND team != 'AJ'
                    AND opp != 'Taylor' AND opp != 'AJ'
                    group by team, opp
                    Order By "${rankType.toUpperCase()}" DESC
                `;
                break;
            case 'pf':
                query = `
                    SELECT 
                    (MIN(team, opp) || MAX(team, opp)) as code,
                    team,
                    opp,
                    sum(pf) as "${rankType.toUpperCase()}"
                    FROM allGames ${where}
                    group by team, opp
                    Order By "${rankType.toUpperCase()}" DESC
                `;
                break;
            case 'difpg':
                query = `
                    SELECT 
                    (MIN(team, opp) || MAX(team, opp)) as code,
                    team,
                    opp,
                    avg(pf) - avg(pa) as "${rankType.toUpperCase()}"
                    FROM allGames ${where}
                    group by team, opp
                    Order By "${rankType.toUpperCase()}" DESC
                `;
                break;
            case 'difpgfilter':
                query = `
                    SELECT 
                    (MIN(team, opp) || MAX(team, opp)) as code,
                    team,
                    opp,
                    avg(pf) - avg(pa) as "${rankType.toUpperCase()}"
                    FROM allGames ${where}
                    ${where === '' ? 'WHERE' : 'AND'} team != 'Taylor' AND team != 'AJ'
                    AND opp != 'Taylor' AND opp != 'AJ'
                    group by team, opp
                    Order By "${rankType.toUpperCase()}" DESC
                `;
                break;
            case 'dif':
                query = `
                    SELECT 
                    (MIN(team, opp) || MAX(team, opp)) as code,
                    team,
                    opp,
                    sum(pf) - sum(pa) as "${rankType.toUpperCase()}"
                    FROM allGames ${where}
                    group by team, opp
                    Order By "${rankType.toUpperCase()}" DESC
                `;
                break;
        }
    
        db.all(query, (err, result) => {
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
