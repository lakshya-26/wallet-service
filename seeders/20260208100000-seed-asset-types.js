"use strict";
const { nanoid } = require("nanoid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const assetTypes = [
      {
        uid: nanoid(12),
        name: "Gold Coins",
        code: "GOLD",
        description:
          "Premium virtual currency for purchasing exclusive items and features",
        is_active: true,
      },
      {
        uid: nanoid(12),
        name: "Diamonds",
        code: "DIAMOND",
        description: "Rare currency for special in-game upgrades and cosmetics",
        is_active: true,
      },
      {
        uid: nanoid(12),
        name: "Loyalty Points",
        code: "LOYALTY",
        description: "Reward points earned through gameplay and engagement",
        is_active: true,
      },
    ];

    await queryInterface.bulkInsert("asset_types", assetTypes, {
      ignoreDuplicates: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("asset_types", null, {});
  },
};
