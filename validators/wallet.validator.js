const Joi = require("joi");
const { commonErrorHandler } = require("../utils/errorHandler");

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");
      return commonErrorHandler(req, res, errorMessage, 400);
    }

    next();
  };
};

const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params, { abortEarly: false });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");
      return commonErrorHandler(req, res, errorMessage, 400);
    }

    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query, { abortEarly: false });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");
      return commonErrorHandler(req, res, errorMessage, 400);
    }

    next();
  };
};

// Transaction schemas
const topUpSchema = Joi.object({
  userUid: Joi.string().required().messages({
    "string.empty": "User UID is required",
    "any.required": "User UID is required",
  }),
  assetCode: Joi.string().required().messages({
    "string.empty": "Asset code is required",
    "any.required": "Asset code is required",
  }),
  amount: Joi.number().positive().required().messages({
    "number.base": "Amount must be a number",
    "number.positive": "Amount must be positive",
    "any.required": "Amount is required",
  }),
  idempotencyKey: Joi.string().required().max(100).messages({
    "string.empty": "Idempotency key is required",
    "string.max": "Idempotency key must be at most 100 characters",
    "any.required": "Idempotency key is required",
  }),
  description: Joi.string().max(500).optional(),
  metadata: Joi.object().optional(),
});

const bonusSchema = Joi.object({
  userUid: Joi.string().required().messages({
    "string.empty": "User UID is required",
    "any.required": "User UID is required",
  }),
  assetCode: Joi.string().required().messages({
    "string.empty": "Asset code is required",
    "any.required": "Asset code is required",
  }),
  amount: Joi.number().positive().required().messages({
    "number.base": "Amount must be a number",
    "number.positive": "Amount must be positive",
    "any.required": "Amount is required",
  }),
  idempotencyKey: Joi.string().required().max(100).messages({
    "string.empty": "Idempotency key is required",
    "string.max": "Idempotency key must be at most 100 characters",
    "any.required": "Idempotency key is required",
  }),
  description: Joi.string().max(500).optional(),
  metadata: Joi.object().optional(),
});

const spendSchema = Joi.object({
  userUid: Joi.string().required().messages({
    "string.empty": "User UID is required",
    "any.required": "User UID is required",
  }),
  assetCode: Joi.string().required().messages({
    "string.empty": "Asset code is required",
    "any.required": "Asset code is required",
  }),
  amount: Joi.number().positive().required().messages({
    "number.base": "Amount must be a number",
    "number.positive": "Amount must be positive",
    "any.required": "Amount is required",
  }),
  idempotencyKey: Joi.string().required().max(100).messages({
    "string.empty": "Idempotency key is required",
    "string.max": "Idempotency key must be at most 100 characters",
    "any.required": "Idempotency key is required",
  }),
  description: Joi.string().max(500).optional(),
  metadata: Joi.object().optional(),
});

// Balance query schemas
const balanceParamsSchema = Joi.object({
  userUid: Joi.string().required().messages({
    "string.empty": "User UID is required",
    "any.required": "User UID is required",
  }),
  assetCode: Joi.string().required().messages({
    "string.empty": "Asset code is required",
    "any.required": "Asset code is required",
  }),
});

const userParamsSchema = Joi.object({
  userUid: Joi.string().required().messages({
    "string.empty": "User UID is required",
    "any.required": "User UID is required",
  }),
});

const transactionParamsSchema = Joi.object({
  transactionUid: Joi.string().required().messages({
    "string.empty": "Transaction UID is required",
    "any.required": "Transaction UID is required",
  }),
});

const paginationQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0),
});

module.exports = {
  validateTopUp: validateRequest(topUpSchema),
  validateBonus: validateRequest(bonusSchema),
  validateSpend: validateRequest(spendSchema),
  validateBalanceParams: validateParams(balanceParamsSchema),
  validateUserParams: validateParams(userParamsSchema),
  validateTransactionParams: validateParams(transactionParamsSchema),
  validatePagination: validateQuery(paginationQuerySchema),
};
