const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Wallet Service API",
      version: "1.0.0",
      description:
        "Internal Wallet Service for high-traffic gaming/loyalty platform. Handles virtual currencies like Gold Coins, Diamonds, and Loyalty Points with full ACID compliance and double-entry bookkeeping.",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    tags: [
      {
        name: "Wallets",
        description: "Wallet operations - top-up, bonus, spend, balance",
      },
      {
        name: "Transactions",
        description: "Transaction history and details",
      },
    ],
  },
  apis: ["./routes/*.js", "./app.js"],
};

const openapiSpecification = swaggerJsdoc(options);

module.exports = openapiSpecification;
