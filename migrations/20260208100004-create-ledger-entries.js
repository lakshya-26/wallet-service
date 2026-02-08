"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ledger_entries", {
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
      transaction_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "transactions",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
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
      entry_type: {
        type: Sequelize.ENUM("DEBIT", "CREDIT"),
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(20, 4),
        allowNull: false,
      },
      balance_before: {
        type: Sequelize.DECIMAL(20, 4),
        allowNull: false,
      },
      balance_after: {
        type: Sequelize.DECIMAL(20, 4),
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING(500),
        allowNull: true,
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

    await queryInterface.addIndex("ledger_entries", ["transaction_id"]);
    await queryInterface.addIndex("ledger_entries", [
      "user_id",
      "asset_type_id",
    ]);
    await queryInterface.addIndex("ledger_entries", ["created_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("ledger_entries");
  },
};
