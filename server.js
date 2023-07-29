const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");

const { createLogger, format, transports } = require("winston");

const logLevels = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
};

const logger = createLogger({
  levels: logLevels,
  format: format.combine(
    format.colorize({ all: true }),
    format.timestamp({
      format: "YYYY-MM-DD hh:mm:ss.SSS A",
    }),
    format.align(),
    format.printf(
      (info) => `[${info.timestamp}] ${info.level}: ${info.message}`
    )
  ),
  transports: [new transports.Console()],
});

const app = express();

// Add Body Parder to support JSON Payloads (Post, Put, etc)
app.use(express.json());

require("dotenv").config({ path: `./.env.${process.env.ENV}` });

// Margon for Access Log
const morgan = require("morgan");
var fs = require("fs");
var path = require("path");

// create a write stream (in append mode)
var accessLogStream = fs.createWriteStream(path.join(__dirname, "access.log"), {
  flags: "a",
});

// setup the logger
app.use(morgan("combined", { stream: accessLogStream }));

// Get env vars
const program_name = process.argv[0];
const script_path = process.argv[1];
const port_string = process.argv[2];

logger.info("program_name: " + program_name);
logger.info("script_path: " + script_path);
logger.info("port_string: " + port_string);

var port_value = process.env.SERVER_PORT;

if (typeof port_string !== "undefined" && port_string.length > 0) {
  port_value = port_string;
}

logger.info("port_value: " + port_value);

app.get("/health", async (req, res) => {
  logger.info("/health call. Life is Good");
  res.status(200);
  res.send("OK");
});

const mongodbURL = process.env.MONGODB_URL;

// Get ready for connection to DB
const client = new MongoClient(mongodbURL, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function launchMainApplication() {
  try {
    const dbConnection = client.db("noddy");

    // Set logger for everyone to use
    app.set("logger", logger);

    app.set("dbConnection", dbConnection);

    require("./routes/things")(app);

    app.listen(Number(port_value));
    logger.info("Server Running on port " + port_value);
  } catch (err) {
    logger.error("Something wen wrong");
  }
}

launchMainApplication();
