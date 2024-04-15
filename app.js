const ThermalPrinter = require("node-thermal-printer").printer;
const PrinterTypes = require("node-thermal-printer").types;
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const winston = require('winston');

const app = express();
const port = process.env.PORT || 8080;
app.use(bodyParser.urlencoded({ extended: true }));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

// Logging configuration
const logger = winston.createLogger({
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
});

// sendFile will go here
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "/index.html"));
});

app.post("/print", async function (req, res) {
  const { printerName, ipText } = req.body;
  try {
    let printer = new ThermalPrinter({
      type: PrinterTypes[printerName],
      interface: `tcp://${ipText}`,
      timeout: 10000, // 10 seconds timeout
    });
    printer.alignCenter();
    printer.println("Hello world");
    printer.println("Blazing Burger Double");
    printer.cut();
    let execute = await printer.execute();
    console.log("Print done!");
    res.send("working");
  } catch (error) {
    console.error("Socket timeout error:", error);
    logger.error('Socket timeout error:', error);
    res.status(500).send("Socket timeout error");
  }
});

// Graceful shutdown
const server = app.listen(port, () => {
  console.log("Server started at http://localhost:" + port);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT. Closing server gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});
