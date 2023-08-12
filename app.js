require("dotenv").config({ path: "./.env" });
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require("helmet");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const createError = require("http-errors");
const path = require("path");

// import routes
const authRouter = require("./routes/auth");
const regularSeasonRouter = require("./routes/regularSeason");
const recordsRouter = require("./routes/records");
const teamsRouter = require("./routes/teams");
const matchupsRouter = require("./routes/matchups");
const ranksRouter = require("./routes/ranks");
const seasonsRouter = require("./routes/seasons");
const allRanksRouter = require("./routes/allRanks");

// mongoDB setup
const mongoDB = process.env.DB_CONNECTION_STRING;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// cors middleware
const corsOptions = {
  origin: "*",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
  origin: true,
};
app.use(cors(corsOptions)); // Use this after the variable declaration
app.options("*", cors());
// Middleware to set CORS headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://kfig21.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
// If you are receiving this error:
//
// access to xmlhttprequest at 'https://peffl-api.herokuapp.com/peffl/auth/teams/' from origin 'https://kfig21.github.io' has been blocked by cors policy: no 'access-control-allow-origin' header is present on the requested resource.
//
// remember to set your mongodb database accessible from anywhere

//middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));

// use routes
app.use("/peffl/auth", authRouter);
app.use("/peffl/rs", regularSeasonRouter);
app.use("/peffl/records", recordsRouter);
app.use("/peffl/teams", teamsRouter);
app.use("/peffl/matchups", matchupsRouter);
app.use("/peffl/ranks", ranksRouter);
app.use("/peffl/seasons", seasonsRouter);
app.use("/peffl/allRanks", allRanksRouter);

// view engine setup needed to keep from erroring out - ignore
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

// const port = 3000;
// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}!`);
// });

module.exports = app;
