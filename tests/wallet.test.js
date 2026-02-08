const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');

describe('Wallet Service API Tests', () => {
  let testUserUid;

  beforeAll(async () => {
    // Wait for database connection
    await sequelize.authenticate();

    // Get a test user
    const [users] = await sequelize.query(
      `SELECT uid FROM users WHERE user_type = 'USER' LIMIT 1`
    );
    testUserUid = users[0]?.uid;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.database.connected).toBe(true);
    });
  });

  describe('Balance Endpoints', () => {
    it('should get balance for specific asset', async () => {
      const response = await request(app).get(
        `/api/v1/wallets/${testUserUid}/balance/GOLD`
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('balance');
      expect(response.body.data).toHaveProperty('asset');
      expect(response.body.data.asset.code).toBe('GOLD');
    });

    it('should get all balances for user', async () => {
      const response = await request(app).get(
        `/api/v1/wallets/${testUserUid}/balances`
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app).get(
        `/api/v1/wallets/NONEXISTENT/balance/GOLD`
      );

      expect(response.status).toBe(404);
    });

    it('should return 404 for non-existent asset', async () => {
      const response = await request(app).get(
        `/api/v1/wallets/${testUserUid}/balance/FAKEASSET`
      );

      expect(response.status).toBe(404);
    });
  });

  describe('Top-up Endpoint', () => {
    it('should top-up wallet successfully', async () => {
      const idempotencyKey = `topup-test-${uuidv4()}`;

      const response = await request(app).post('/api/v1/wallets/top-up').send({
        userUid: testUserUid,
        assetCode: 'GOLD',
        amount: 100,
        idempotencyKey: idempotencyKey,
        description: 'Test top-up',
      });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('uid');
      expect(response.body.data.type).toBe('TOP_UP');
      expect(response.body.data.status).toBe('COMPLETED');
      expect(response.body.data.amount).toBe(100);
    });

    it('should return same transaction for duplicate idempotency key', async () => {
      const idempotencyKey = `topup-idempotent-${uuidv4()}`;

      // First request
      const response1 = await request(app).post('/api/v1/wallets/top-up').send({
        userUid: testUserUid,
        assetCode: 'GOLD',
        amount: 50,
        idempotencyKey: idempotencyKey,
      });

      // Second request with same idempotency key
      const response2 = await request(app).post('/api/v1/wallets/top-up').send({
        userUid: testUserUid,
        assetCode: 'GOLD',
        amount: 50,
        idempotencyKey: idempotencyKey,
      });

      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
      expect(response1.body.data.uid).toBe(response2.body.data.uid);
    });

    it('should fail with invalid amount', async () => {
      const response = await request(app)
        .post('/api/v1/wallets/top-up')
        .send({
          userUid: testUserUid,
          assetCode: 'GOLD',
          amount: -100,
          idempotencyKey: `topup-invalid-${uuidv4()}`,
        });

      expect(response.status).toBe(400);
    });

    it('should fail without idempotency key', async () => {
      const response = await request(app).post('/api/v1/wallets/top-up').send({
        userUid: testUserUid,
        assetCode: 'GOLD',
        amount: 100,
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Bonus Endpoint', () => {
    it('should issue bonus successfully', async () => {
      const idempotencyKey = `bonus-test-${uuidv4()}`;

      const response = await request(app).post('/api/v1/wallets/bonus').send({
        userUid: testUserUid,
        assetCode: 'DIAMOND',
        amount: 10,
        idempotencyKey: idempotencyKey,
        description: 'Referral bonus',
      });

      expect(response.status).toBe(201);
      expect(response.body.data.type).toBe('BONUS');
      expect(response.body.data.status).toBe('COMPLETED');
    });
  });

  describe('Spend Endpoint', () => {
    it('should spend credits successfully', async () => {
      const idempotencyKey = `spend-test-${uuidv4()}`;

      const response = await request(app).post('/api/v1/wallets/spend').send({
        userUid: testUserUid,
        assetCode: 'GOLD',
        amount: 10,
        idempotencyKey: idempotencyKey,
        description: 'In-app purchase',
      });

      expect(response.status).toBe(201);
      expect(response.body.data.type).toBe('PURCHASE');
      expect(response.body.data.status).toBe('COMPLETED');
    });

    it('should fail when spending more than balance', async () => {
      const idempotencyKey = `spend-fail-${uuidv4()}`;

      const response = await request(app).post('/api/v1/wallets/spend').send({
        userUid: testUserUid,
        assetCode: 'GOLD',
        amount: 9999999999,
        idempotencyKey: idempotencyKey,
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Insufficient');
    });
  });

  describe('Transaction History', () => {
    it('should get transaction history', async () => {
      const response = await request(app).get(
        `/api/v1/wallets/${testUserUid}/transactions`
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('transactions');
      expect(response.body.data).toHaveProperty('total');
      expect(Array.isArray(response.body.data.transactions)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app).get(
        `/api/v1/wallets/${testUserUid}/transactions?limit=5&offset=0`
      );

      expect(response.status).toBe(200);
      expect(response.body.data.limit).toBe(5);
      expect(response.body.data.offset).toBe(0);
    });
  });

  describe('Get Transaction', () => {
    it('should get transaction by UID', async () => {
      // First create a transaction
      const idempotencyKey = `get-tx-${uuidv4()}`;
      const createResponse = await request(app)
        .post('/api/v1/wallets/top-up')
        .send({
          userUid: testUserUid,
          assetCode: 'LOYALTY',
          amount: 25,
          idempotencyKey: idempotencyKey,
        });

      const transactionUid = createResponse.body.data.uid;

      // Now get the transaction
      const response = await request(app).get(
        `/api/v1/transactions/${transactionUid}`
      );

      expect(response.status).toBe(200);
      expect(response.body.data.uid).toBe(transactionUid);
    });

    it('should return 404 for non-existent transaction', async () => {
      const response = await request(app).get(
        `/api/v1/transactions/NONEXISTENT`
      );

      expect(response.status).toBe(404);
    });
  });
});
