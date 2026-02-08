"use strict";
const { Model } = require("sequelize");
const { nanoid } = require("nanoid");

module.exports = (sequelize, DataTypes) => {
  class LedgerEntry extends Model {
    static associate(models) {
      LedgerEntry.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "User",
      });
      LedgerEntry.belongsTo(models.AssetType, {
        foreignKey: "asset_type_id",
        as: "AssetType",
      });
      LedgerEntry.belongsTo(models.Transaction, {
        foreignKey: "transaction_id",
        as: "Transaction",
      });
    }
  }

  LedgerEntry.init(
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
      transaction_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "transactions",
          key: "id",
        },
      },
      user_id: {
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
      entry_type: {
        type: DataTypes.ENUM("DEBIT", "CREDIT"),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(20, 4),
        allowNull: false,
      },
      balance_before: {
        type: DataTypes.DECIMAL(20, 4),
        allowNull: false,
      },
      balance_after: {
        type: DataTypes.DECIMAL(20, 4),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "LedgerEntry",
      tableName: "ledger_entries",
      indexes: [
        {
          fields: ["transaction_id"],
        },
        {
          fields: ["user_id", "asset_type_id"],
        },
        {
          fields: ["created_at"],
        },
      ],
    },
  );

  return LedgerEntry;
};
