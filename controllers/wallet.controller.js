const walletService = require("../services/wallet.service");
const { commonErrorHandler } = require("../utils/errorHandler");
const { sendResponse } = require("../middlewares/reqRes.middleware");

const topUp = async (req, res) => {
  try {
    const transaction = await walletService.topUpWallet(req.body);

    req.statusCode = 201;
    req.data = transaction;
    req.message = "Wallet topped up successfully";
    return sendResponse(req, res);
  } catch (error) {
    return commonErrorHandler(req, res, error.message, error.statusCode, error);
  }
};

const issueBonus = async (req, res) => {
  try {
    const transaction = await walletService.issueBonus(req.body);

    req.statusCode = 201;
    req.data = transaction;
    req.message = "Bonus issued successfully";
    return sendResponse(req, res);
  } catch (error) {
    return commonErrorHandler(req, res, error.message, error.statusCode, error);
  }
};

const spend = async (req, res) => {
  try {
    const transaction = await walletService.spendCredits(req.body);

    req.statusCode = 201;
    req.data = transaction;
    req.message = "Credits spent successfully";
    return sendResponse(req, res);
  } catch (error) {
    return commonErrorHandler(req, res, error.message, error.statusCode, error);
  }
};

const getBalance = async (req, res) => {
  try {
    const { userUid, assetCode } = req.params;
    const balance = await walletService.getBalance(userUid, assetCode);

    req.statusCode = 200;
    req.data = balance;
    return sendResponse(req, res);
  } catch (error) {
    return commonErrorHandler(req, res, error.message, error.statusCode, error);
  }
};

const getAllBalances = async (req, res) => {
  try {
    const { userUid } = req.params;
    const balances = await walletService.getAllBalances(userUid);

    req.statusCode = 200;
    req.data = balances;
    return sendResponse(req, res);
  } catch (error) {
    return commonErrorHandler(req, res, error.message, error.statusCode, error);
  }
};

const getTransactionHistory = async (req, res) => {
  try {
    const { userUid } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const history = await walletService.getTransactionHistory(
      userUid,
      parseInt(limit),
      parseInt(offset),
    );

    req.statusCode = 200;
    req.data = history;
    return sendResponse(req, res);
  } catch (error) {
    return commonErrorHandler(req, res, error.message, error.statusCode, error);
  }
};

const getTransaction = async (req, res) => {
  try {
    const { transactionUid } = req.params;
    const transaction = await walletService.getTransaction(transactionUid);

    req.statusCode = 200;
    req.data = transaction;
    return sendResponse(req, res);
  } catch (error) {
    return commonErrorHandler(req, res, error.message, error.statusCode, error);
  }
};

module.exports = {
  topUp,
  issueBonus,
  spend,
  getBalance,
  getAllBalances,
  getTransactionHistory,
  getTransaction,
};
