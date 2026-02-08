const app = require("./app");
const { sequelize } = require("./models");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("✔ Database connected successfully");

    app.listen(PORT, () => {
      console.log(`✔ Wallet Service is running on port ${PORT}`);
      console.log(`✔ API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`✔ Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);
  }
};

startServer();
