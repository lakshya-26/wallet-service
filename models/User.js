"use strict";
const { Model } = require("sequelize");
const { nanoid } = require("nanoid");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Wallet, {
        foreignKey: "user_id",
        as: "Wallets",
      });
      User.hasMany(models.LedgerEntry, {
        foreignKey: "user_id",
        as: "LedgerEntries",
      });
    }
  }

  User.init(
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
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      user_type: {
        type: DataTypes.ENUM("USER", "SYSTEM"),
        defaultValue: "USER",
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("ACTIVE", "DISABLED"),
        defaultValue: "ACTIVE",
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      indexes: [
        {
          fields: ["uid"],
          unique: true,
        },
        {
          fields: ["email"],
          unique: true,
        },
        {
          fields: ["user_type"],
        },
      ],
    },
  );

  return User;
};
