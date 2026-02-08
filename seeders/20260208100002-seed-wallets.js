"use strict";
const { nanoid } = require("nanoid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Get all users
    const users = await queryInterface.sequelize.query(
      `SELECT id, uid, user_type FROM users`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );

    // Get all asset types
    const assetTypes = await queryInterface.sequelize.query(
      `SELECT id, code FROM asset_types`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );

    const wallets = [];

    // Create wallets for each user and each asset type
    for (const user of users) {
      for (const assetType of assetTypes) {
        // Set initial balances based on user type
        let balance = 0;

        // System accounts start with large balances
        if (user.user_type === "SYSTEM") {
          if (user.uid === "TREASURY0001") {
            balance = 10000000; // 10 million for treasury
          } else if (user.uid === "BONUS0000001") {
            balance = 1000000; // 1 million for bonus pool
          }
        } else {
          // Regular users start with initial balance
          if (assetType.code === "GOLD") {
            balance = 1000; // 1000 Gold Coins
          } else if (assetType.code === "DIAMOND") {
            balance = 100; // 100 Diamonds
          } else if (assetType.code === "LOYALTY") {
            balance = 500; // 500 Loyalty Points
          }
        }

        wallets.push({
          uid: nanoid(12),
          user_id: user.id,
          asset_type_id: assetType.id,
          balance: balance,
          version: 0,
          status: "ACTIVE",
        });
      }
    }

    await queryInterface.bulkInsert("wallets", wallets, {
      ignoreDuplicates: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("wallets", null, {});
  },
};
