"use strict";
const { Model } = require("sequelize");
const { nanoid } = require("nanoid");

module.exports = (sequelize, DataTypes) => {
  class AssetType extends Model {
    static associate(models) {
      AssetType.hasMany(models.Wallet, {
        foreignKey: "asset_type_id",
        as: "Wallets",
      });
      AssetType.hasMany(models.LedgerEntry, {
        foreignKey: "asset_type_id",
        as: "LedgerEntries",
      });
    }
  }

  AssetType.init(
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
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "AssetType",
      tableName: "asset_types",
      indexes: [
        {
          fields: ["code"],
          unique: true,
        },
      ],
    },
  );

  return AssetType;
};
