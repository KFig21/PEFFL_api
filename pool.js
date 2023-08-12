const { Pool } = require('pg')

const pool = new Pool({
    dialect: "postgres",
    username: process.env.CDB_USERNAME,
    password: process.env.CDB_PASSWORD,
    host: process.env.CDB_HOST,
    port: process.env.CDB_PORT,
    database: process.env.CDB_DATABASE,
    ssl: {
      rejectUnauthorized: false, // For development purposes. Be cautious in production.
    },
})

module.exports = pool;