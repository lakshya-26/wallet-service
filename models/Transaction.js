"use strict";
const { Model } = require("sequelize");
const { nanoid } = require("nanoid");

module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    static associate(models) {
      Transaction.hasMany(models.LedgerEntry, {
        foreignKey: "transaction_id",
        as: "LedgerEntries",
      });
      Transaction.belongsTo(models.User, {
        foreignKey: "from_user_id",
        as: "FromUser",
      });
      Transaction.belongsTo(models.User, {
        foreignKey: "to_user_id",
        as: "ToUser",
      });
      Transaction.belongsTo(models.AssetType, {
        foreignKey: "asset_type_id",
        as: "AssetType",
      });
    }
  }

  Transaction.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      uid: {
        type: DataTypes.STRING(12),
        allowNull: false,
        unique: true,
        defaultValue: () => nanoid(12),
      },
      idempotency_key: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      transaction_type: {
        type: DataTypes.ENUM(
          "TOP_UP",
          "BONUS",
          "PURCHASE",
          "REFUND",
          "TRANSFER",
        ),
        allowNull: false,
      },
      from_user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      to_user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      asset_type_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "asset_types",
          key: "id",
        },
      },
      amount: {
        type: DataTypes.DECIMAL(20, 4),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("PENDING", "COMPLETED", "FAILED", "REVERSED"),
        defaultValue: "PENDING",
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      processed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Transaction",
      tableName: "transactions",
      indexes: [
        {
          fields: ["idempotency_key"],
          unique: true,
        },
        {
          fields: ["from_user_id"],
        },
        {
          fields: ["to_user_id"],
        },
        {
          fields: ["transaction_type", "status"],
        },
        {
          fields: ["created_at"],
        },
      ],
    },
  );

  return Transaction;
};
