require("dotenv").config({ path: "./.env" });
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require("helmet");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const createError = require("http-errors");

// Import routes
const authRouter = require("./routes/auth");
const regularSeasonRouter = require("./routes/neon/regularSeason"); // done
const seasonsRouter = require("./routes/neon/seasons"); // done
const ranksRouter = require("./routes/neon/ranks"); // done
const recordsRouter = require("./routes/sqlite/records"); // in progress
const teamsRouter = require("./routes/sqlite/teams");
const matchupsRouter = require("./routes/sqlite/matchups");
const allRanksRouter = require("./routes/sqlite/allRanks");

// MongoDB setup
const mongoDB = process.env.DB_CONNECTION_STRING;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));

// Use routes
app.use("/peffl/auth", authRouter);
app.use("/peffl/rs", regularSeasonRouter);
app.use("/peffl/records", recordsRouter);
app.use("/peffl/teams", teamsRouter);
app.use("/peffl/matchups", matchupsRouter);
app.use("/peffl/ranks", ranksRouter);
app.use("/peffl/seasons", seasonsRouter);
app.use("/peffl/allRanks", allRanksRouter);

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // Send error response
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: req.app.get("env") === "development" ? err : {}
  });
});

module.exports = app;
