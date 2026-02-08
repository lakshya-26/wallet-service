const { Wallet, AssetType, User } = require('../models');
const { CustomException } = require('../utils/errorHandler');
const { generateId } = require('./idGenerator.helper');

const getWallet = async (userId, assetTypeId, transaction = null) => {
  const options = {
    where: { user_id: userId, asset_type_id: assetTypeId },
    include: [
      {
        model: AssetType,
        as: 'AssetType',
      },
      {
        model: User,
        as: 'User',
      },
    ],
  };

  if (transaction) {
    options.transaction = transaction;
    options.lock = transaction.LOCK.UPDATE; // Row-level lock for concurrency
  }

  return await Wallet.findOne(options);
};

const getWalletByUid = async (uid) => {
  return await Wallet.findOne({
    where: { uid },
    include: [
      {
        model: AssetType,
        as: 'AssetType',
      },
      {
        model: User,
        as: 'User',
      },
    ],
  });
};

const getWalletsByUserId = async (userId) => {
  return await Wallet.findAll({
    where: { user_id: userId },
    include: [
      {
        model: AssetType,
        as: 'AssetType',
      },
    ],
  });
};

const getWalletForUpdate = async (userId, assetTypeId, transaction) => {
  const wallet = await Wallet.findOne({
    where: { user_id: userId, asset_type_id: assetTypeId },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (!wallet) {
    throw new CustomException('Wallet not found', 404);
  }

  if (wallet.status !== 'ACTIVE') {
    throw new CustomException(`Wallet is ${wallet.status.toLowerCase()}`, 400);
  }

  return wallet;
};

const createWallet = async (userId, assetTypeId, transaction = null) => {
  const options = {
    user_id: userId,
    asset_type_id: assetTypeId,
    uid: generateId(12),
    balance: 0,
    version: 0,
    status: 'ACTIVE',
  };

  if (transaction) {
    return await Wallet.create(options, { transaction });
  }

  return await Wallet.create(options);
};

const getOrCreateWallet = async (userId, assetTypeId, transaction = null) => {
  let wallet = await getWallet(userId, assetTypeId, transaction);

  if (!wallet) {
    wallet = await createWallet(userId, assetTypeId, transaction);
  }

  return wallet;
};

module.exports = {
  getWallet,
  getWalletByUid,
  getWalletsByUserId,
  getWalletForUpdate,
  createWallet,
  getOrCreateWallet,
};
