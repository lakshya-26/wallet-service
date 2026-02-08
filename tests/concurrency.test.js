const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');

describe('Concurrency Tests', () => {
  let testUserUid;

  beforeAll(async () => {
    await sequelize.authenticate();
    const [users] = await sequelize.query(
      `SELECT uid FROM users WHERE user_type = 'USER' LIMIT 1`
    );
    testUserUid = users[0]?.uid;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Concurrent Transactions', () => {
    it('should handle concurrent top-ups correctly', async () => {
      // Get initial balance
      const initialBalanceResponse = await request(app).get(
        `/api/v1/wallets/${testUserUid}/balance/GOLD`
      );
      const initialBalance = initialBalanceResponse.body.data.balance;

      // Execute 5 concurrent top-ups of 10 each
      const numRequests = 5;
      const topUpAmount = 10;
      const promises = [];

      for (let i = 0; i < numRequests; i++) {
        promises.push(
          request(app)
            .post('/api/v1/wallets/top-up')
            .send({
              userUid: testUserUid,
              assetCode: 'GOLD',
              amount: topUpAmount,
              idempotencyKey: `concurrent-topup-${uuidv4()}`,
            })
        );
      }

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(201);
        expect(response.body.data.status).toBe('COMPLETED');
      });

      // Check final balance
      const finalBalanceResponse = await request(app).get(
        `/api/v1/wallets/${testUserUid}/balance/GOLD`
      );
      const finalBalance = finalBalanceResponse.body.data.balance;

      // Final balance should equal initial + (numRequests * topUpAmount)
      expect(finalBalance).toBe(initialBalance + numRequests * topUpAmount);
    });

    it('should handle concurrent spends correctly with insufficient balance', async () => {
      // Get current balance
      const balanceResponse = await request(app).get(
        `/api/v1/wallets/${testUserUid}/balance/DIAMOND`
      );
      const currentBalance = balanceResponse.body.data.balance;

      // Try to spend more than balance concurrently
      const numRequests = 3;
      const spendAmount = currentBalance + 1; // More than available

      const promises = [];
      for (let i = 0; i < numRequests; i++) {
        promises.push(
          request(app)
            .post('/api/v1/wallets/spend')
            .send({
              userUid: testUserUid,
              assetCode: 'DIAMOND',
              amount: spendAmount,
              idempotencyKey: `concurrent-spend-fail-${uuidv4()}`,
            })
        );
      }

      const responses = await Promise.all(promises);

      // All should fail with insufficient balance
      responses.forEach((response) => {
        expect(response.status).toBe(400);
      });

      // Balance should remain unchanged
      const finalBalanceResponse = await request(app).get(
        `/api/v1/wallets/${testUserUid}/balance/DIAMOND`
      );
      expect(finalBalanceResponse.body.data.balance).toBe(currentBalance);
    });

    it('should handle race condition on spend correctly', async () => {
      // First top-up to ensure we have some balance
      await request(app)
        .post('/api/v1/wallets/top-up')
        .send({
          userUid: testUserUid,
          assetCode: 'LOYALTY',
          amount: 100,
          idempotencyKey: `race-setup-${uuidv4()}`,
        });

      // Get current balance
      const balanceResponse = await request(app).get(
        `/api/v1/wallets/${testUserUid}/balance/LOYALTY`
      );
      const currentBalance = balanceResponse.body.data.balance;

      // Execute multiple spends that together exceed the balance
      // Each spend is less than balance, but together they exceed it
      const spendAmount = Math.floor(currentBalance * 0.6);
      const numRequests = 3;

      const promises = [];
      for (let i = 0; i < numRequests; i++) {
        promises.push(
          request(app)
            .post('/api/v1/wallets/spend')
            .send({
              userUid: testUserUid,
              assetCode: 'LOYALTY',
              amount: spendAmount,
              idempotencyKey: `race-spend-${uuidv4()}`,
            })
        );
      }

      const responses = await Promise.all(promises);

      // Some should succeed, some should fail
      const successCount = responses.filter((r) => r.status === 201).length;
      const failCount = responses.filter((r) => r.status === 400).length;

      // At least one should succeed (the first to acquire the lock)
      expect(successCount).toBeGreaterThanOrEqual(1);

      // The sum of successes and failures should equal total requests
      expect(successCount + failCount).toBe(numRequests);

      // Final balance should never be negative
      const finalBalanceResponse = await request(app).get(
        `/api/v1/wallets/${testUserUid}/balance/LOYALTY`
      );
      expect(finalBalanceResponse.body.data.balance).toBeGreaterThanOrEqual(0);
    });
  });
});
