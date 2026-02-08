require("dotenv").config();

// Set test environment
process.env.NODE_ENV = "test";

// Increase timeout for database operations
jest.setTimeout(30000);

// Global setup
beforeAll(() => {
  console.log("Starting Wallet Service Tests...");
});

// Global teardown
afterAll(() => {
  console.log("Wallet Service Tests completed.");
});
