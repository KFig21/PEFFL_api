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

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "GET");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requrested-With, Content-Type, Accept, content-type"
  );
  next();
});

// import routes
const authRouter = require("./routes/auth");
const regularSeasonRouter = require("./routes/regularSeason");
const recordsRouter = require("./routes/records");
const teamsRouter = require("./routes/teams");
const matchupsRouter = require("./routes/matchups");
const ranksRouter = require("./routes/ranks");
const seasonsRouter = require("./routes/seasons");

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
};
app.use(cors(corsOptions)); // Use this after the variable declaration
app.options("*", cors());
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
