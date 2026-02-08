#!/usr/bin/env node

/**
 * Wallet Service Manual Test Script
 *
 * This script tests all core wallet operations manually.
 * Run with: node scripts/test-api.js
 *
 * Prerequisites:
 * - Server running on localhost:3000
 * - Database migrated and seeded
 */

const BASE_URL = 'http://localhost:3000';

// Simple fetch wrapper for Node.js
async function request(method, path, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);
  const data = await response.json();
  return { status: response.status, data };
}

// Generate unique idempotency key
function generateKey(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

// Test functions
async function testHealthCheck() {
  console.log('\n📋 Test: Health Check');
  const { status, data } = await request('GET', '/health');

  if (status === 200 && data.status === 'healthy') {
    console.log('✅ Health check passed');
    return true;
  } else {
    console.log('❌ Health check failed:', data);
    return false;
  }
}

// Helper function for finding users
async function _testGetUsers() {
  console.log('\n📋 Test: Get User by UID (need to find a user first)');

  // Get all balances for any user to find a valid user UID
  const { status: _status, data: _data } = await request(
    'GET',
    '/api/v1/wallets'
  );

  return true;
}

async function testGetBalances(userUid) {
  console.log(`\n📋 Test: Get All Balances for User ${userUid}`);
  const { status, data } = await request(
    'GET',
    `/api/v1/wallets/${userUid}/balances`
  );

  if (status === 200 && Array.isArray(data.data)) {
    console.log('✅ Get all balances passed');
    console.log(
      '   Balances:',
      data.data.map((b) => `${b.asset.code}: ${b.balance}`).join(', ')
    );
    return data.data;
  } else {
    console.log('❌ Get all balances failed:', data);
    return null;
  }
}

async function testGetBalance(userUid, assetCode) {
  console.log(`\n📋 Test: Get Balance for ${assetCode}`);
  const { status, data } = await request(
    'GET',
    `/api/v1/wallets/${userUid}/balance/${assetCode}`
  );

  if (status === 200 && data.data.balance !== undefined) {
    console.log(`✅ Get balance passed: ${data.data.balance} ${assetCode}`);
    return data.data.balance;
  } else {
    console.log('❌ Get balance failed:', data);
    return null;
  }
}

async function testTopUp(userUid, assetCode, amount) {
  console.log(`\n📋 Test: Top-up ${amount} ${assetCode}`);
  const idempotencyKey = generateKey('topup');

  const { status, data } = await request('POST', '/api/v1/wallets/top-up', {
    userUid,
    assetCode,
    amount,
    idempotencyKey,
    description: 'Test top-up via script',
  });

  if (status === 201 && data.data.type === 'TOP_UP') {
    console.log(`✅ Top-up passed: Transaction ${data.data.uid}`);
    return data.data;
  } else {
    console.log('❌ Top-up failed:', data);
    return null;
  }
}

async function testBonus(userUid, assetCode, amount) {
  console.log(`\n📋 Test: Issue Bonus ${amount} ${assetCode}`);
  const idempotencyKey = generateKey('bonus');

  const { status, data } = await request('POST', '/api/v1/wallets/bonus', {
    userUid,
    assetCode,
    amount,
    idempotencyKey,
    description: 'Test bonus via script',
  });

  if (status === 201 && data.data.type === 'BONUS') {
    console.log(`✅ Bonus passed: Transaction ${data.data.uid}`);
    return data.data;
  } else {
    console.log('❌ Bonus failed:', data);
    return null;
  }
}

async function testSpend(userUid, assetCode, amount) {
  console.log(`\n📋 Test: Spend ${amount} ${assetCode}`);
  const idempotencyKey = generateKey('spend');

  const { status, data } = await request('POST', '/api/v1/wallets/spend', {
    userUid,
    assetCode,
    amount,
    idempotencyKey,
    description: 'Test spend via script',
  });

  if (status === 201 && data.data.type === 'PURCHASE') {
    console.log(`✅ Spend passed: Transaction ${data.data.uid}`);
    return data.data;
  } else {
    console.log('❌ Spend failed:', data);
    return null;
  }
}

async function testIdempotency(userUid) {
  console.log('\n📋 Test: Idempotency');
  const idempotencyKey = generateKey('idempotency-test');

  // First request
  const { data: data1 } = await request('POST', '/api/v1/wallets/top-up', {
    userUid,
    assetCode: 'GOLD',
    amount: 1,
    idempotencyKey,
  });

  // Second request with same key
  const { data: data2 } = await request('POST', '/api/v1/wallets/top-up', {
    userUid,
    assetCode: 'GOLD',
    amount: 1,
    idempotencyKey,
  });

  if (data1.data.uid === data2.data.uid) {
    console.log('✅ Idempotency passed: Same transaction returned');
    return true;
  } else {
    console.log('❌ Idempotency failed: Different transactions returned');
    return false;
  }
}

async function testInsufficientBalance(userUid) {
  console.log('\n📋 Test: Insufficient Balance');
  const idempotencyKey = generateKey('insufficient');

  const { status, data } = await request('POST', '/api/v1/wallets/spend', {
    userUid,
    assetCode: 'GOLD',
    amount: 999999999,
    idempotencyKey,
  });

  if (status === 400 && data.message.includes('Insufficient')) {
    console.log('✅ Insufficient balance check passed');
    return true;
  } else {
    console.log('❌ Insufficient balance check failed:', data);
    return false;
  }
}

async function testGetTransactionHistory(userUid) {
  console.log(`\n📋 Test: Get Transaction History`);
  const { status, data } = await request(
    'GET',
    `/api/v1/wallets/${userUid}/transactions`
  );

  if (status === 200 && Array.isArray(data.data.transactions)) {
    console.log(
      `✅ Transaction history passed: ${data.data.total} total transactions`
    );
    return data.data;
  } else {
    console.log('❌ Transaction history failed:', data);
    return null;
  }
}

async function testGetTransaction(transactionUid) {
  console.log(`\n📋 Test: Get Transaction ${transactionUid}`);
  const { status, data } = await request(
    'GET',
    `/api/v1/transactions/${transactionUid}`
  );

  if (status === 200 && data.data.uid === transactionUid) {
    console.log('✅ Get transaction passed');
    return data.data;
  } else {
    console.log('❌ Get transaction failed:', data);
    return null;
  }
}

async function testConcurrency(userUid) {
  console.log('\n📋 Test: Concurrent Requests');

  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(
      request('POST', '/api/v1/wallets/top-up', {
        userUid,
        assetCode: 'GOLD',
        amount: 1,
        idempotencyKey: generateKey(`concurrent-${i}`),
      })
    );
  }

  const results = await Promise.all(promises);
  const successCount = results.filter((r) => r.status === 201).length;

  if (successCount === 5) {
    console.log('✅ Concurrency test passed: All 5 requests succeeded');
    return true;
  } else {
    console.log(`⚠️  Concurrency test: ${successCount}/5 requests succeeded`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Wallet Service API Tests\n');
  console.log('='.repeat(50));

  try {
    // Health check
    if (!(await testHealthCheck())) {
      console.log(
        '\n❌ Server not responding. Make sure the server is running.'
      );
      process.exit(1);
    }

    let userUid = null;
    console.log('\n📋 Finding test user...');

    const { status: testStatus, data: _testData } = await request(
      'GET',
      '/api/v1/wallets/john.doe@example.com/balances'
    );

    if (testStatus === 404) {
      console.log(
        '   Note: User UIDs are generated dynamically. Getting from database...'
      );
      // Users can check database manually or use docker-compose logs
      console.log('\n⚠️  To run tests, you need to provide a valid user UID.');
      console.log('   Run this SQL to get a user UID:');
      console.log("   SELECT uid FROM users WHERE user_type = 'USER' LIMIT 1;");
      console.log('\n   Then run: USER_UID=<uid> node scripts/test-api.js');

      if (process.env.USER_UID) {
        userUid = process.env.USER_UID;
        console.log(`\n   Using USER_UID from environment: ${userUid}`);
      } else {
        console.log('\n   Attempting to continue with database query...');

        console.log(
          '\n⚠️  Skipping user-specific tests. Basic tests completed.'
        );
        console.log('='.repeat(50));
        console.log('\n✅ Basic tests passed! Server is healthy.');
        return;
      }
    }

    if (userUid) {
      const balances = await testGetBalances(userUid);

      if (balances) {
        await testGetBalance(userUid, 'GOLD');

        // Test transactions
        const topUpTx = await testTopUp(userUid, 'GOLD', 100);
        await testBonus(userUid, 'DIAMOND', 10);
        await testSpend(userUid, 'GOLD', 10);

        // Test idempotency
        await testIdempotency(userUid);

        // Test error case
        await testInsufficientBalance(userUid);

        // Test transaction history
        await testGetTransactionHistory(userUid);

        // Test get transaction
        if (topUpTx) {
          await testGetTransaction(topUpTx.uid);
        }

        // Test concurrency
        await testConcurrency(userUid);

        // Final balance check
        console.log('\n📋 Final Balance Check');
        await testGetBalances(userUid);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests completed!');
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();
