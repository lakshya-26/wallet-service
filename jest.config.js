module.exports = {
  testEnvironment: "node",
  testTimeout: 30000,
  verbose: true,
  collectCoverageFrom: [
    "controllers/**/*.js",
    "services/**/*.js",
    "helpers/**/*.js",
    "middlewares/**/*.js",
    "!**/node_modules/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  testMatch: ["**/tests/**/*.test.js"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
};
