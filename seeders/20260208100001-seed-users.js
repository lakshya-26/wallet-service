"use strict";
const { nanoid } = require("nanoid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Create system accounts and regular users
    const users = [
      {
        uid: "TREASURY0001", // hard coded uid required to seed wallet
        name: "Treasury",
        email: "treasury@system.wallet",
        user_type: "SYSTEM",
        status: "ACTIVE",
      },
      {
        uid: "REVENUE00001", // hard coded uid required to seed wallet
        name: "Revenue",
        email: "revenue@system.wallet",
        user_type: "SYSTEM",
        status: "ACTIVE",
      },
      {
        uid: "BONUS0000001", // hard coded uid required to seed wallet
        name: "Bonus Pool",
        email: "bonus@system.wallet",
        user_type: "SYSTEM",
        status: "ACTIVE",
      },
      {
        uid: nanoid(12),
        name: "John Doe",
        email: "john.doe@example.com",
        user_type: "USER",
        status: "ACTIVE",
      },
      {
        uid: nanoid(12),
        name: "Jane Smith",
        email: "jane.smith@example.com",
        user_type: "USER",
        status: "ACTIVE",
      },
    ];

    await queryInterface.bulkInsert("users", users, {
      ignoreDuplicates: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("users", null, {});
  },
};
