const { sequelize, Sequelize, Wallet } = require('../models');
const { CustomException } = require('../utils/errorHandler');
const {
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  ENTRY_TYPES,
  SYSTEM_ACCOUNTS,
  MAX_RETRY_ATTEMPTS,
  RETRY_DELAY_MS,
} = require('../constants/wallet.constant');
const userHelper = require('../helpers/users.helper');
const walletHelper = require('../helpers/wallets.helper');
const assetTypeHelper = require('../helpers/assetTypes.helper');
const transactionHelper = require('../helpers/transactions.helper');
const {
  serializeTransaction,
  serializeBalance,
} = require('../serializers/wallet.serializer');
const { generateId } = require('../helpers/idGenerator.helper');

/**
 * Sleep utility for retry logic
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Execute transaction with deadlock avoidance
 * Uses ordered locking to prevent deadlocks
 */
const executeWithDeadlockAvoidance = async (
  fromUserId,
  toUserId,
  assetTypeId,
  operation,
  retryCount = 0
) => {
  const t = await sequelize.transaction({
    isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
  });

  try {
    // Acquire locks in consistent order (lower ID first) to prevent deadlocks
    const [firstId, secondId] =
      fromUserId < toUserId ? [fromUserId, toUserId] : [toUserId, fromUserId];

    // Get wallets with ordered locks
    const firstWallet = await walletHelper.getWalletForUpdate(
      firstId,
      assetTypeId,
      t
    );
    const secondWallet = await walletHelper.getWalletForUpdate(
      secondId,
      assetTypeId,
      t
    );

    // Map wallets back to from/to
    const fromWallet = fromUserId === firstId ? firstWallet : secondWallet;
    const toWallet = toUserId === firstId ? firstWallet : secondWallet;

    // Execute the operation
    const result = await operation(fromWallet, toWallet, t);

    await t.commit();
    return result;
  } catch (error) {
    await t.rollback();

    // Check if this is a serialization or deadlock error
    const isSerializationError =
      (error.name === 'SequelizeDatabaseError' &&
        (error.parent?.code === '40001' ||
          error.parent?.code === '40P01' ||
          error.original?.code === '40001' ||
          error.original?.code === '40P01')) ||
      error.name === 'SequelizeTimeoutError' ||
      (error.message && error.message.includes('could not serialize access'));

    // Retry on deadlock or serialization error
    if (isSerializationError) {
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        await sleep(RETRY_DELAY_MS * (retryCount + 1));
        return executeWithDeadlockAvoidance(
          fromUserId,
          toUserId,
          assetTypeId,
          operation,
          retryCount + 1
        );
      }
    }

    throw error;
  }
};

/**
 * Execute single wallet transaction (for top-up/bonus from system)
 */
const _executeSingleWalletTransaction = async (
  userId,
  assetTypeId,
  operation,
  retryCount = 0
) => {
  const t = await sequelize.transaction({
    isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
  });

  try {
    // Get wallet with lock
    const wallet = await walletHelper.getWalletForUpdate(
      userId,
      assetTypeId,
      t
    );

    // Execute the operation
    const result = await operation(wallet, t);

    await t.commit();
    return result;
  } catch (error) {
    await t.rollback();

    // Check if this is a serialization or deadlock error
    const isSerializationError =
      (error.name === 'SequelizeDatabaseError' &&
        (error.parent?.code === '40001' ||
          error.parent?.code === '40P01' ||
          error.original?.code === '40001' ||
          error.original?.code === '40P01')) ||
      error.name === 'SequelizeTimeoutError' ||
      (error.message && error.message.includes('could not serialize access'));

    // Retry on serialization error
    if (isSerializationError) {
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        await sleep(RETRY_DELAY_MS * (retryCount + 1));
        return _executeSingleWalletTransaction(
          userId,
          assetTypeId,
          operation,
          retryCount + 1
        );
      }
    }

    throw error;
  }
};

/**
 * Update wallet balance with optimistic locking
 */
const updateWalletBalance = async (wallet, amount, entryType, transaction) => {
  const currentVersion = wallet.version;
  const currentBalance = parseFloat(wallet.balance);
  let newBalance;

  if (entryType === ENTRY_TYPES.CREDIT) {
    newBalance = currentBalance + parseFloat(amount);
  } else {
    newBalance = currentBalance - parseFloat(amount);
  }

  // Check for negative balance
  if (newBalance < 0) {
    throw new CustomException('Insufficient balance', 400);
  }

  // Optimistic locking - only update if version matches
  const [affectedRows] = await Wallet.update(
    {
      balance: newBalance,
      version: currentVersion + 1,
    },
    {
      where: {
        id: wallet.id,
        version: currentVersion,
      },
      transaction,
    }
  );

  if (affectedRows === 0) {
    throw new CustomException(
      'Concurrent modification detected, please retry',
      409
    );
  }

  return { balanceBefore: currentBalance, balanceAfter: newBalance };
};

/**
 * Create ledger entries for double-entry bookkeeping
 */
const createLedgerEntries = async (
  transactionId,
  fromUserId,
  toUserId,
  assetTypeId,
  amount,
  fromBalanceBefore,
  fromBalanceAfter,
  toBalanceBefore,
  toBalanceAfter,
  description,
  transaction
) => {
  // Debit entry (from account)
  await transactionHelper.createLedgerEntry(
    {
      uid: generateId(12),
      transaction_id: transactionId,
      user_id: fromUserId,
      asset_type_id: assetTypeId,
      entry_type: ENTRY_TYPES.DEBIT,
      amount: amount,
      balance_before: fromBalanceBefore,
      balance_after: fromBalanceAfter,
      description: `Debit: ${description}`,
    },
    transaction
  );

  // Credit entry (to account)
  await transactionHelper.createLedgerEntry(
    {
      uid: generateId(12),
      transaction_id: transactionId,
      user_id: toUserId,
      asset_type_id: assetTypeId,
      entry_type: ENTRY_TYPES.CREDIT,
      amount: amount,
      balance_before: toBalanceBefore,
      balance_after: toBalanceAfter,
      description: `Credit: ${description}`,
    },
    transaction
  );
};

/**
 * Top-up user wallet (credits from Treasury)
 */
const topUpWallet = async (payload) => {
  const { userUid, assetCode, amount, idempotencyKey, description, metadata } =
    payload;

  // Check idempotency
  const existingTx =
    await transactionHelper.getTransactionByIdempotencyKey(idempotencyKey);
  if (existingTx) {
    return serializeTransaction(existingTx);
  }

  // Validate inputs
  const user = await userHelper.getUserByUid(userUid);
  if (!user) {
    throw new CustomException('User not found', 404);
  }

  const assetType = await assetTypeHelper.getAssetTypeByCode(assetCode);
  if (!assetType) {
    throw new CustomException('Asset type not found', 404);
  }

  const treasury = await userHelper.getSystemAccount(SYSTEM_ACCOUNTS.TREASURY);

  // Execute transaction with deadlock avoidance
  const result = await executeWithDeadlockAvoidance(
    treasury.id,
    user.id,
    assetType.id,
    async (fromWallet, toWallet, t) => {
      // Update balances
      const fromResult = await updateWalletBalance(
        fromWallet,
        amount,
        ENTRY_TYPES.DEBIT,
        t
      );
      const toResult = await updateWalletBalance(
        toWallet,
        amount,
        ENTRY_TYPES.CREDIT,
        t
      );

      // Create transaction record
      const tx = await transactionHelper.createTransaction(
        {
          uid: generateId(12),
          idempotency_key: idempotencyKey,
          transaction_type: TRANSACTION_TYPES.TOP_UP,
          from_user_id: treasury.id,
          to_user_id: user.id,
          asset_type_id: assetType.id,
          amount: amount,
          status: TRANSACTION_STATUS.COMPLETED,
          description: description || 'Wallet top-up from purchase',
          metadata: metadata,
          processed_at: new Date(),
        },
        t
      );

      // Create ledger entries
      await createLedgerEntries(
        tx.id,
        treasury.id,
        user.id,
        assetType.id,
        amount,
        fromResult.balanceBefore,
        fromResult.balanceAfter,
        toResult.balanceBefore,
        toResult.balanceAfter,
        description || 'Wallet top-up',
        t
      );

      return tx;
    }
  );

  // Fetch complete transaction with associations
  const transaction = await transactionHelper.getTransactionByUid(result.uid);
  return serializeTransaction(transaction);
};

/**
 * Issue bonus to user wallet (credits from Bonus Pool)
 */
const issueBonus = async (payload) => {
  const { userUid, assetCode, amount, idempotencyKey, description, metadata } =
    payload;

  // Check idempotency
  const existingTx =
    await transactionHelper.getTransactionByIdempotencyKey(idempotencyKey);
  if (existingTx) {
    return serializeTransaction(existingTx);
  }

  // Validate inputs
  const user = await userHelper.getUserByUid(userUid);
  if (!user) {
    throw new CustomException('User not found', 404);
  }

  const assetType = await assetTypeHelper.getAssetTypeByCode(assetCode);
  if (!assetType) {
    throw new CustomException('Asset type not found', 404);
  }

  const bonusPool = await userHelper.getSystemAccount(
    SYSTEM_ACCOUNTS.BONUS_POOL
  );

  // Execute transaction with deadlock avoidance
  const result = await executeWithDeadlockAvoidance(
    bonusPool.id,
    user.id,
    assetType.id,
    async (fromWallet, toWallet, t) => {
      // Update balances
      const fromResult = await updateWalletBalance(
        fromWallet,
        amount,
        ENTRY_TYPES.DEBIT,
        t
      );
      const toResult = await updateWalletBalance(
        toWallet,
        amount,
        ENTRY_TYPES.CREDIT,
        t
      );

      // Create transaction record
      const tx = await transactionHelper.createTransaction(
        {
          uid: generateId(12),
          idempotency_key: idempotencyKey,
          transaction_type: TRANSACTION_TYPES.BONUS,
          from_user_id: bonusPool.id,
          to_user_id: user.id,
          asset_type_id: assetType.id,
          amount: amount,
          status: TRANSACTION_STATUS.COMPLETED,
          description: description || 'Bonus/incentive credit',
          metadata: metadata,
          processed_at: new Date(),
        },
        t
      );

      // Create ledger entries
      await createLedgerEntries(
        tx.id,
        bonusPool.id,
        user.id,
        assetType.id,
        amount,
        fromResult.balanceBefore,
        fromResult.balanceAfter,
        toResult.balanceBefore,
        toResult.balanceAfter,
        description || 'Bonus credit',
        t
      );

      return tx;
    }
  );

  // Fetch complete transaction with associations
  const transaction = await transactionHelper.getTransactionByUid(result.uid);
  return serializeTransaction(transaction);
};

/**
 * Spend credits from user wallet (debits to Revenue)
 */
const spendCredits = async (payload) => {
  const { userUid, assetCode, amount, idempotencyKey, description, metadata } =
    payload;

  // Check idempotency
  const existingTx =
    await transactionHelper.getTransactionByIdempotencyKey(idempotencyKey);
  if (existingTx) {
    return serializeTransaction(existingTx);
  }

  // Validate inputs
  const user = await userHelper.getUserByUid(userUid);
  if (!user) {
    throw new CustomException('User not found', 404);
  }

  const assetType = await assetTypeHelper.getAssetTypeByCode(assetCode);
  if (!assetType) {
    throw new CustomException('Asset type not found', 404);
  }

  const revenue = await userHelper.getSystemAccount(SYSTEM_ACCOUNTS.REVENUE);

  // Execute transaction with deadlock avoidance
  const result = await executeWithDeadlockAvoidance(
    user.id,
    revenue.id,
    assetType.id,
    async (fromWallet, toWallet, t) => {
      // Update balances
      const fromResult = await updateWalletBalance(
        fromWallet,
        amount,
        ENTRY_TYPES.DEBIT,
        t
      );
      const toResult = await updateWalletBalance(
        toWallet,
        amount,
        ENTRY_TYPES.CREDIT,
        t
      );

      // Create transaction record
      const tx = await transactionHelper.createTransaction(
        {
          uid: generateId(12),
          idempotency_key: idempotencyKey,
          transaction_type: TRANSACTION_TYPES.PURCHASE,
          from_user_id: user.id,
          to_user_id: revenue.id,
          asset_type_id: assetType.id,
          amount: amount,
          status: TRANSACTION_STATUS.COMPLETED,
          description: description || 'In-app purchase',
          metadata: metadata,
          processed_at: new Date(),
        },
        t
      );

      // Create ledger entries
      await createLedgerEntries(
        tx.id,
        user.id,
        revenue.id,
        assetType.id,
        amount,
        fromResult.balanceBefore,
        fromResult.balanceAfter,
        toResult.balanceBefore,
        toResult.balanceAfter,
        description || 'In-app purchase',
        t
      );

      return tx;
    }
  );

  // Fetch complete transaction with associations
  const transaction = await transactionHelper.getTransactionByUid(result.uid);
  return serializeTransaction(transaction);
};

/**
 * Get user balance for specific asset
 */
const getBalance = async (userUid, assetCode) => {
  const user = await userHelper.getUserByUid(userUid);
  if (!user) {
    throw new CustomException('User not found', 404);
  }

  const assetType = await assetTypeHelper.getAssetTypeByCode(assetCode);
  if (!assetType) {
    throw new CustomException('Asset type not found', 404);
  }

  const wallet = await walletHelper.getWallet(user.id, assetType.id);
  if (!wallet) {
    throw new CustomException('Wallet not found', 404);
  }

  return serializeBalance(wallet, assetType, user);
};

/**
 * Get all balances for a user
 */
const getAllBalances = async (userUid) => {
  const user = await userHelper.getUserByUid(userUid);
  if (!user) {
    throw new CustomException('User not found', 404);
  }

  const wallets = await walletHelper.getWalletsByUserId(user.id);

  return wallets.map((wallet) =>
    serializeBalance(wallet, wallet.AssetType, user)
  );
};

/**
 * Get transaction history for a user
 */
const getTransactionHistory = async (userUid, limit = 50, offset = 0) => {
  const user = await userHelper.getUserByUid(userUid);
  if (!user) {
    throw new CustomException('User not found', 404);
  }

  const { rows, count } = await transactionHelper.getTransactionsByUserId(
    user.id,
    limit,
    offset
  );

  return {
    transactions: rows.map(serializeTransaction),
    total: count,
    limit,
    offset,
  };
};

/**
 * Get transaction by UID
 */
const getTransaction = async (transactionUid) => {
  const transaction =
    await transactionHelper.getTransactionByUid(transactionUid);
  if (!transaction) {
    throw new CustomException('Transaction not found', 404);
  }

  return serializeTransaction(transaction);
};

module.exports = {
  topUpWallet,
  issueBonus,
  spendCredits,
  getBalance,
  getAllBalances,
  getTransactionHistory,
  getTransaction,
};
