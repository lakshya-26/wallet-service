const express = require("express");
const router = express.Router();
const walletController = require("../controllers/wallet.controller");
const walletValidator = require("../validators/wallet.validator");

/**
 * @swagger
 * /api/v1/wallets/top-up:
 *   post:
 *     summary: Top-up user wallet with credits
 *     tags: [Wallets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userUid
 *               - assetCode
 *               - amount
 *               - idempotencyKey
 *             properties:
 *               userUid:
 *                 type: string
 *               assetCode:
 *                 type: string
 *                 enum: [GOLD, DIAMOND, LOYALTY]
 *               amount:
 *                 type: number
 *               idempotencyKey:
 *                 type: string
 *               description:
 *                 type: string
 *               metadata:
 *                 type: object
 */
router.post("/top-up", walletValidator.validateTopUp, walletController.topUp);

/**
 * @swagger
 * /api/v1/wallets/bonus:
 *   post:
 *     summary: Issue bonus credits to user
 *     tags: [Wallets]
 */
router.post(
  "/bonus",
  walletValidator.validateBonus,
  walletController.issueBonus,
);

/**
 * @swagger
 * /api/v1/wallets/spend:
 *   post:
 *     summary: Spend credits from user wallet
 *     tags: [Wallets]
 */
router.post("/spend", walletValidator.validateSpend, walletController.spend);

/**
 * @swagger
 * /api/v1/wallets/{userUid}/balance/{assetCode}:
 *   get:
 *     summary: Get user balance for specific asset
 *     tags: [Wallets]
 */
router.get(
  "/:userUid/balance/:assetCode",
  walletValidator.validateBalanceParams,
  walletController.getBalance,
);

/**
 * @swagger
 * /api/v1/wallets/{userUid}/balances:
 *   get:
 *     summary: Get all balances for a user
 *     tags: [Wallets]
 */
router.get(
  "/:userUid/balances",
  walletValidator.validateUserParams,
  walletController.getAllBalances,
);

/**
 * @swagger
 * /api/v1/wallets/{userUid}/transactions:
 *   get:
 *     summary: Get transaction history for a user
 *     tags: [Wallets]
 */
router.get(
  "/:userUid/transactions",
  walletValidator.validateUserParams,
  walletValidator.validatePagination,
  walletController.getTransactionHistory,
);

module.exports = router;
