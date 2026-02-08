require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
const { registerRoutes } = require("./routes");
const { commonErrorHandler } = require("./utils/errorHandler");
const { sequelize } = require("./models");

const app = express();

// Middlewares
app.use(bodyParser.json({ limit: "10mb" }));
app.use(
  bodyParser.urlencoded({
    limit: "10mb",
    extended: true,
    parameterLimit: 50000,
  }),
);

app.use(cors({ origin: "*", optionsSuccessStatus: 200, maxAge: 600 }));
app.use(compression());
app.use(helmet());
app.disable("x-powered-by");

// Swagger setup
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.use("/health", async (_req, res) => {
  try {
    const [results] = await sequelize.query("SELECT NOW() as current_time");
    const currentTime = results[0].current_time;

    return res.send({
      status: "healthy",
      message: "Wallet Service is running",
      uptime: process.uptime(),
      database: {
        connected: true,
        currentTime: currentTime,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.log(`Error in health check API :: ${error}`);
    return commonErrorHandler(_req, res, error.message, 503);
  }
});

// Register Routes
registerRoutes(app);

// 404 Error Handling
app.use((req, res) => {
  res.status(404).json({
    statusCode: 404,
    data: {},
    message: "Invalid endpoint",
  });
});

// Global Error Handler
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err);
  return commonErrorHandler(req, res, err.message, err.statusCode || 500, err);
});

module.exports = app;
