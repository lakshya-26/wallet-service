const { Transaction, LedgerEntry, User, AssetType } = require("../models");

const getTransactionByIdempotencyKey = async (idempotencyKey) => {
  return await Transaction.findOne({
    where: { idempotency_key: idempotencyKey },
    include: [
      {
        model: LedgerEntry,
        as: "LedgerEntries",
      },
      {
        model: User,
        as: "FromUser",
      },
      {
        model: User,
        as: "ToUser",
      },
      {
        model: AssetType,
        as: "AssetType",
      },
    ],
  });
};

const getTransactionByUid = async (uid) => {
  return await Transaction.findOne({
    where: { uid },
    include: [
      {
        model: LedgerEntry,
        as: "LedgerEntries",
      },
      {
        model: User,
        as: "FromUser",
      },
      {
        model: User,
        as: "ToUser",
      },
      {
        model: AssetType,
        as: "AssetType",
      },
    ],
  });
};

const getTransactionsByUserId = async (userId, limit = 50, offset = 0) => {
  const { Op } = require("sequelize");

  return await Transaction.findAndCountAll({
    where: {
      [Op.or]: [{ from_user_id: userId }, { to_user_id: userId }],
      status: "COMPLETED",
    },
    include: [
      {
        model: User,
        as: "FromUser",
        attributes: ["uid", "name", "email", "user_type"],
      },
      {
        model: User,
        as: "ToUser",
        attributes: ["uid", "name", "email", "user_type"],
      },
      {
        model: AssetType,
        as: "AssetType",
        attributes: ["uid", "name", "code"],
      },
    ],
    order: [["created_at", "DESC"]],
    limit,
    offset,
  });
};

const createTransaction = async (data, transaction = null) => {
  const options = transaction ? { transaction } : {};
  return await Transaction.create(data, options);
};

const createLedgerEntry = async (data, transaction = null) => {
  const options = transaction ? { transaction } : {};
  return await LedgerEntry.create(data, options);
};

module.exports = {
  getTransactionByIdempotencyKey,
  getTransactionByUid,
  getTransactionsByUserId,
  createTransaction,
  createLedgerEntry,
};
