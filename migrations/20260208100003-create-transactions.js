"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("transactions", {
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
      idempotency_key: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      transaction_type: {
        type: Sequelize.ENUM(
          "TOP_UP",
          "BONUS",
          "PURCHASE",
          "REFUND",
          "TRANSFER",
        ),
        allowNull: false,
      },
      from_user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      to_user_id: {
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
      amount: {
        type: Sequelize.DECIMAL(20, 4),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("PENDING", "COMPLETED", "FAILED", "REVERSED"),
        defaultValue: "PENDING",
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      processed_at: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex("transactions", ["idempotency_key"], {
      unique: true,
    });
    await queryInterface.addIndex("transactions", ["from_user_id"]);
    await queryInterface.addIndex("transactions", ["to_user_id"]);
    await queryInterface.addIndex("transactions", [
      "transaction_type",
      "status",
    ]);
    await queryInterface.addIndex("transactions", ["created_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("transactions");
  },
};
