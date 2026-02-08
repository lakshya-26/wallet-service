const express = require("express");
const router = express.Router();
const walletController = require("../controllers/wallet.controller");
const walletValidator = require("../validators/wallet.validator");

/**
 * @swagger
 * /api/v1/transactions/{transactionUid}:
 *   get:
 *     summary: Get transaction by UID
 *     tags: [Transactions]
 */
router.get(
  "/:transactionUid",
  walletValidator.validateTransactionParams,
  walletController.getTransaction,
);

module.exports = router;
