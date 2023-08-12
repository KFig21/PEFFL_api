const router = require("express").Router();
const pool = require("../pool");

router.get("/:table", async (req, res) => {
    try {
        const db_ = await pool.connect();
        const table = req.params.table;
        let where = '';
    
        if (table === 'RS') {
          where = `WHERE season = 'r'`;
        } else if (table === 'playoffs') {
          where = `WHERE season = 'p'`;
        }
    
        const overallResponses = await Promise.all([
          getRankData(db_, where, 'win'),
          getRankData(db_, where, 'ppg'),
          getRankData(db_, where, 'papg'),
          getRankData(db_, where, 'difpg'),
          getRankData(db_, where, 'pf'),
          getRankData(db_, where, 'pa'),
          getRankData(db_, where, 'dif')
        ]);
    
        const h2hResponses = await Promise.all([
          getH2HRankData(db_, where, 'wins'),
          getH2HRankData(db_, where, 'ppg'),
          getH2HRankData(db_, where, 'ppgfilter'),
          getH2HRankData(db_, where, 'pf'),
          getH2HRankData(db_, where, 'difpg'),
          getH2HRankData(db_, where, 'difpgfilter'),
          getH2HRankData(db_, where, 'dif')
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

    async function getRankData(db_, where, rankType) {
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

        db_.query(query, (err, result) => {
        if (err) {
            console.log(err);
            reject(err);
        } else {
            const arr = result.rows.map((row) => {
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

    async function getH2HRankData(db_, where, rankType) {
        return new Promise((resolve, reject) => {
        let query = '';
    
        switch (rankType) {
            case 'wins':
                query = `
                    SELECT 
                    (LEAST(team, opp) || GREATEST(team, opp)) as code,
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
                    (LEAST(team, opp) || GREATEST(team, opp)) as code,
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
                    (LEAST(team, opp) || GREATEST(team, opp)) as code,
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
                    (LEAST(team, opp) || GREATEST(team, opp)) as code,
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
                    (LEAST(team, opp) || GREATEST(team, opp)) as code,
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
                    (LEAST(team, opp) || GREATEST(team, opp)) as code,
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
                    (LEAST(team, opp) || GREATEST(team, opp)) as code,
                    team,
                    opp,
                    sum(pf) - sum(pa) as "${rankType.toUpperCase()}"
                    FROM allGames ${where}
                    group by team, opp
                    Order By "${rankType.toUpperCase()}" DESC
                `;
                break;
        }
    
        db_.query(query, (err, result) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                const arr = result.rows.map((row) => {
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
