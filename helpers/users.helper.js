const { User, Wallet, AssetType } = require("../models");
const { CustomException } = require("../utils/errorHandler");

const getUserByUid = async (uid) => {
  return await User.findOne({
    where: { uid },
    include: [
      {
        model: Wallet,
        as: "Wallets",
        include: [
          {
            model: AssetType,
            as: "AssetType",
          },
        ],
      },
    ],
  });
};

const getUserById = async (id) => {
  return await User.findByPk(id, {
    include: [
      {
        model: Wallet,
        as: "Wallets",
        include: [
          {
            model: AssetType,
            as: "AssetType",
          },
        ],
      },
    ],
  });
};

const getUserByEmail = async (email) => {
  return await User.findOne({
    where: { email },
    include: [
      {
        model: Wallet,
        as: "Wallets",
        include: [
          {
            model: AssetType,
            as: "AssetType",
          },
        ],
      },
    ],
  });
};

const getSystemAccount = async (uid) => {
  const user = await User.findOne({
    where: { uid, user_type: "SYSTEM" },
  });

  if (!user) {
    throw new CustomException(`System account ${uid} not found`, 404);
  }

  return user;
};

const getAllUsers = async () => {
  return await User.findAll({
    where: { user_type: "USER" },
    include: [
      {
        model: Wallet,
        as: "Wallets",
        include: [
          {
            model: AssetType,
            as: "AssetType",
          },
        ],
      },
    ],
  });
};

module.exports = {
  getUserByUid,
  getUserById,
  getUserByEmail,
  getSystemAccount,
  getAllUsers,
};
