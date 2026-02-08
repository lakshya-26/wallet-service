"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("wallets", {
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
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      asset_type_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "asset_types",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      balance: {
        type: Sequelize.DECIMAL(20, 4),
        defaultValue: 0,
        allowNull: false,
      },
      version: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("ACTIVE", "FROZEN", "CLOSED"),
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

    await queryInterface.addIndex("wallets", ["uid"], { unique: true });
    await queryInterface.addIndex("wallets", ["user_id", "asset_type_id"], {
      unique: true,
      where: { deleted_at: null },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("wallets");
  },
};
