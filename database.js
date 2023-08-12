const fs = require('fs');
const csvParser = require('csv-parser');
const sqlite3 = require('sqlite3').verbose();

function initializeDatabase() {
  const db = new sqlite3.Database(':memory:');

  db.serialize(() => {
    // Create the "allGames" table
    db.run('CREATE TABLE allGames (id TEXT, year TEXT, week TEXT, season TEXT, team TEXT, pf INTEGER, pa INTEGER, opp TEXT, win INTEGER, loss INTEGER)', (err) => {
      if (err) {
        console.error('Error creating allGames table:', err.message);
      } else {
        // Read data from the CSV file and insert it into the "allGames" table
        const allGamesData = [];
        fs.createReadStream('tables/allGames.csv')
          .pipe(csvParser())
          .on('data', (row) => {
            allGamesData.push(row);
          })
          .on('end', () => {
            const insertQuery = db.prepare('INSERT INTO allGames (id, year, week, season, team, pf, pa, opp, win, loss) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            allGamesData.forEach((row) => {
              insertQuery.run(row.id, row.year, row.week, row.season, row.team, row.pf, row.pa, row.opp, row.win, row.loss, (err) => {
                if (err) {
                  console.error('Error inserting data into allGames:', err.message);
                }
              });
            });
            insertQuery.finalize(() => {
              
            });
          });
      }
    });

    // Create the "awards" table
    db.run('CREATE TABLE awards (id TEXT, year TEXT, team TEXT, lc TEXT, ru TEXT, rsc TEXT, p TEXT, dc TEXT, money TEXT)', (err) => {
      if (err) {
        console.error('Error creating awards table:', err.message);
      } else {
        // Read data from the CSV file and insert it into the "awards" table
        const awardsData = [];
        fs.createReadStream('tables/awards.csv')
          .pipe(csvParser())
          .on('data', (row) => {
            awardsData.push(row);
          })
          .on('end', () => {
            const insertQuery = db.prepare('INSERT INTO awards (id, year, team, lc, ru, rsc, p, dc, money) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
            awardsData.forEach((row) => {
              insertQuery.run(row.id, row.year, row.team, row.lc, row.ru, row.rsc, row.p, row.dc, row.money, (err) => {
                if (err) {
                  console.error('Error inserting data into awards:', err.message);
                }
              });
            });
            insertQuery.finalize(() => {

            });
          });
      }
    });
  });

  return db;
}

module.exports = {
  initializeDatabase,
};
