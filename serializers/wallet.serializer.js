const serializeTransaction = (transaction) => {
  if (!transaction) return null;

  return {
    uid: transaction.uid,
    type: transaction.transaction_type,
    status: transaction.status,
    amount: parseFloat(transaction.amount),
    description: transaction.description,
    metadata: transaction.metadata,
    processedAt: transaction.processed_at,
    createdAt: transaction.created_at,
    fromUser: transaction.FromUser
      ? {
          uid: transaction.FromUser.uid,
          name: transaction.FromUser.name,
          type: transaction.FromUser.user_type,
        }
      : {},
    toUser: transaction.ToUser
      ? {
          uid: transaction.ToUser.uid,
          name: transaction.ToUser.name,
          type: transaction.ToUser.user_type,
        }
      : {},
    asset: transaction.AssetType
      ? {
          uid: transaction.AssetType.uid,
          name: transaction.AssetType.name,
          code: transaction.AssetType.code,
        }
      : {},
    ledgerEntries: transaction.LedgerEntries
      ? transaction.LedgerEntries.map((entry) => ({
          uid: entry.uid,
          entryType: entry.entry_type,
          amount: parseFloat(entry.amount),
          balanceBefore: parseFloat(entry.balance_before),
          balanceAfter: parseFloat(entry.balance_after),
          description: entry.description,
          createdAt: entry.created_at,
        }))
      : [],
  };
};

const serializeWallet = (wallet) => {
  if (!wallet) return null;

  return {
    uid: wallet.uid,
    balance: parseFloat(wallet.balance),
    status: wallet.status,
    version: wallet.version,
    createdAt: wallet.created_at,
    updatedAt: wallet.updated_at,
    asset: wallet.AssetType
      ? {
          uid: wallet.AssetType.uid,
          name: wallet.AssetType.name,
          code: wallet.AssetType.code,
        }
      : {},
    user: wallet.User
      ? {
          uid: wallet.User.uid,
          name: wallet.User.name,
          type: wallet.User.user_type,
        }
      : {},
  };
};

const serializeBalance = (wallet, assetType, user) => {
  return {
    balance: parseFloat(wallet.balance),
    walletUid: wallet.uid,
    status: wallet.status,
    asset: {
      uid: assetType.uid,
      name: assetType.name,
      code: assetType.code,
    },
    user: {
      uid: user.uid,
      name: user.name,
    },
    lastUpdated: wallet.updated_at,
  };
};

const serializeUser = (user) => {
  if (!user) return null;

  return {
    uid: user.uid,
    name: user.name,
    email: user.email,
    type: user.user_type,
    status: user.status,
    createdAt: user.created_at,
    wallets: user.Wallets
      ? user.Wallets.map((wallet) => ({
          uid: wallet.uid,
          balance: parseFloat(wallet.balance),
          status: wallet.status,
          asset: wallet.AssetType
            ? {
                uid: wallet.AssetType.uid,
                name: wallet.AssetType.name,
                code: wallet.AssetType.code,
              }
            : {},
        }))
      : [],
  };
};

const serializeAssetType = (assetType) => {
  if (!assetType) return null;

  return {
    uid: assetType.uid,
    name: assetType.name,
    code: assetType.code,
    description: assetType.description,
    isActive: assetType.is_active,
  };
};

module.exports = {
  serializeTransaction,
  serializeWallet,
  serializeBalance,
  serializeUser,
  serializeAssetType,
};
