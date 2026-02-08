"use strict";
const { Model } = require("sequelize");
const { nanoid } = require("nanoid");

module.exports = (sequelize, DataTypes) => {
  class Wallet extends Model {
    static associate(models) {
      Wallet.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "User",
      });
      Wallet.belongsTo(models.AssetType, {
        foreignKey: "asset_type_id",
        as: "AssetType",
      });
    }
  }

  Wallet.init(
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
      balance: {
        type: DataTypes.DECIMAL(20, 4),
        defaultValue: 0,
        allowNull: false,
      },
      version: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("ACTIVE", "FROZEN", "CLOSED"),
        defaultValue: "ACTIVE",
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Wallet",
      tableName: "wallets",
      indexes: [
        {
          fields: ["user_id", "asset_type_id"],
          unique: true,
          where: { deleted_at: null },
        },
        {
          fields: ["uid"],
          unique: true,
        },
      ],
    },
  );

  return Wallet;
};
