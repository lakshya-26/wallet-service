"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT,
      },
      uid: {
        type: Sequelize.STRING(12),
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      user_type: {
        type: Sequelize.ENUM("USER", "SYSTEM"),
        defaultValue: "USER",
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("ACTIVE", "DISABLED"),
        defaultValue: "ACTIVE",
        allowNull: false,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex("users", ["uid"], { unique: true });
    await queryInterface.addIndex("users", ["email"], { unique: true });
    await queryInterface.addIndex("users", ["user_type"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("users");
  },
};
