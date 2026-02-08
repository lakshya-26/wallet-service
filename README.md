# Wallet Service

A high-performance internal wallet service for gaming platforms and loyalty reward systems. This service manages virtual currencies (Gold Coins, Diamonds, Loyalty Points) with full ACID compliance, double-entry bookkeeping, and robust concurrency handling.

## 🏗️ Architecture

### Technology Stack

| Component      | Technology       | Why                                                                          |
| -------------- | ---------------- | ---------------------------------------------------------------------------- |
| **Runtime**    | Node.js 20+      | Event-driven, excellent for I/O-bound operations like database transactions  |
| **Framework**  | Express.js 5     | Battle-tested, lightweight, and highly extensible                            |
| **Database**   | PostgreSQL 16    | ACID compliant, excellent locking mechanisms, SERIALIZABLE isolation support |
| **ORM**        | Sequelize 6      | Mature ORM with transaction support and migration tools                      |
| **Validation** | Joi              | Declarative schema validation                                                |
| **Testing**    | Jest + Supertest | Comprehensive testing with async support                                     |

### Database Schema

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ asset_types │     │    users    │     │   wallets   │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id          │     │ id          │     │ id          │
│ uid         │     │ uid         │     │ uid         │
│ name        │     │ name        │     │ user_id     │──▶ users.id
│ code        │     │ email       │     │ asset_type  │──▶ asset_types.id
│ description │     │ user_type   │     │ balance     │
│ is_active   │     │ status      │     │ version     │◀── Optimistic Lock
└─────────────┘     └─────────────┘     │ status      │
                                        └─────────────┘
                                              │
                                              ▼
┌───────────────┐                    ┌─────────────────┐
│ transactions  │                    │ ledger_entries  │
├───────────────┤                    ├─────────────────┤
│ id            │                    │ id              │
│ uid           │                    │ transaction_id  │──▶ transactions.id
│ idempotency_  │◀── Unique Key      │ user_id         │
│ key           │                    │ asset_type_id   │
│ type          │                    │ entry_type      │ (DEBIT/CREDIT)
│ from_user_id  │                    │ amount          │
│ to_user_id    │                    │ balance_before  │
│ asset_type_id │                    │ balance_after   │
│ amount        │                    └─────────────────┘
│ status        │
│ metadata      │
└───────────────┘
```

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone and start with Docker
docker-compose up --build

# The service will automatically:
# 1. Start PostgreSQL
# 2. Run migrations
# 3. Seed initial data
# 4. Start the API server

# Access the API at http://localhost:3000
# API Docs at http://localhost:3000/api-docs
```

### Option 2: Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.sample .env
# Edit .env with your database credentials

# 3. Setup database (creates DB if needed, runs migrations & seeds)
npm run db:setup

# 4. Start the server
npm run dev
```

#### Alternative: Step-by-step setup

```bash
# Create database only
npm run db:create

# Run migrations
npm run migrate

# Seed initial data
npm run seed

# Reset database (undo all, migrate, seed)
npm run db:reset
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## 📚 API Endpoints

### Wallet Operations

| Method | Endpoint                                      | Description                      |
| ------ | --------------------------------------------- | -------------------------------- |
| POST   | `/api/v1/wallets/top-up`                      | Credit wallet from purchase      |
| POST   | `/api/v1/wallets/bonus`                       | Issue bonus credits              |
| POST   | `/api/v1/wallets/spend`                       | Debit wallet for in-app purchase |
| GET    | `/api/v1/wallets/:userUid/balance/:assetCode` | Get specific balance             |
| GET    | `/api/v1/wallets/:userUid/balances`           | Get all balances                 |
| GET    | `/api/v1/wallets/:userUid/transactions`       | Get transaction history          |

### Transaction Operations

| Method | Endpoint                               | Description             |
| ------ | -------------------------------------- | ----------------------- |
| GET    | `/api/v1/transactions/:transactionUid` | Get transaction details |

### System

| Method | Endpoint    | Description           |
| ------ | ----------- | --------------------- |
| GET    | `/health`   | Health check          |
| GET    | `/api-docs` | Swagger documentation |

## 📝 API Usage Examples

### Top-up Wallet (Purchase Credits)

```bash
curl -X POST http://localhost:3000/api/v1/wallets/top-up \
  -H "Content-Type: application/json" \
  -d '{
    "userUid": "USER_UID_HERE",
    "assetCode": "GOLD",
    "amount": 1000,
    "idempotencyKey": "purchase-123-abc",
    "description": "Credit purchase",
    "metadata": {
      "paymentId": "pay_xyz123"
    }
  }'
```

### Issue Bonus

```bash
curl -X POST http://localhost:3000/api/v1/wallets/bonus \
  -H "Content-Type: application/json" \
  -d '{
    "userUid": "USER_UID_HERE",
    "assetCode": "DIAMOND",
    "amount": 50,
    "idempotencyKey": "referral-bonus-456",
    "description": "Referral bonus"
  }'
```

### Spend Credits

```bash
curl -X POST http://localhost:3000/api/v1/wallets/spend \
  -H "Content-Type: application/json" \
  -d '{
    "userUid": "USER_UID_HERE",
    "assetCode": "GOLD",
    "amount": 100,
    "idempotencyKey": "purchase-item-789",
    "description": "Purchased legendary sword"
  }'
```

### Check Balance

```bash
curl http://localhost:3000/api/v1/wallets/USER_UID_HERE/balance/GOLD
```

### Get All Balances

```bash
curl http://localhost:3000/api/v1/wallets/USER_UID_HERE/balances
```

## 🔒 Concurrency Strategy

### Problem

High-traffic applications may have multiple concurrent requests attempting to modify the same wallet balance. Without proper handling, this leads to:

- **Lost Updates**: Two transactions read the same balance, both update, one overwrites the other
- **Overdrafts**: Race conditions allowing balance to go negative
- **Deadlocks**: Circular lock dependencies causing system hangs

### Solution: Multi-layered Approach

#### 1. SERIALIZABLE Isolation Level

```javascript
const t = await sequelize.transaction({
  isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
});
```

PostgreSQL's SERIALIZABLE isolation ensures transactions execute as if they were running sequentially.

#### 2. Ordered Lock Acquisition (Deadlock Prevention)

```javascript
// Always acquire locks in consistent order (lower ID first)
const [firstId, secondId] =
  fromUserId < toUserId ? [fromUserId, toUserId] : [toUserId, fromUserId];
```

This prevents deadlocks by ensuring all transactions acquire locks in the same order.

#### 3. Optimistic Locking with Version Column

```javascript
const [affectedRows] = await Wallet.update(
  { balance: newBalance, version: currentVersion + 1 },
  { where: { id: wallet.id, version: currentVersion } }
);

if (affectedRows === 0) {
  throw new Error('Concurrent modification detected');
}
```

The `version` field detects if another transaction modified the record.

#### 4. Automatic Retry with Backoff

```javascript
if (error.parent?.code === '40001' /* Serialization failure */) {
  await sleep(RETRY_DELAY_MS * (retryCount + 1));
  return executeTransaction(..., retryCount + 1);
}
```

Retry up to 3 times with exponential backoff on serialization failures.

## ✅ Idempotency

Every transaction request requires an `idempotencyKey`:

```javascript
// Check if transaction already exists
const existingTx = await getTransactionByIdempotencyKey(idempotencyKey);
if (existingTx) {
  return existingTx; // Return existing transaction, don't create duplicate
}
```

This ensures:

- Network retries don't create duplicate transactions
- Client can safely retry failed requests
- System failures during processing don't cause data inconsistency

## 📊 Double-Entry Bookkeeping

Every transaction creates two ledger entries for complete auditability:

| Transaction Type | Debit Account | Credit Account |
| ---------------- | ------------- | -------------- |
| TOP_UP           | Treasury      | User Wallet    |
| BONUS            | Bonus Pool    | User Wallet    |
| PURCHASE         | User Wallet   | Revenue        |

```javascript
// Example: Top-up creates two entries
// 1. Treasury DEBIT entry (funds leaving treasury)
// 2. User CREDIT entry (funds entering user wallet)
```

This allows:

- Complete audit trail of all fund movements
- Balance reconstruction from ledger entries
- Detection of any balance discrepancies

## 🌱 Seed Data

The service comes pre-seeded with:

### Asset Types

| Code    | Name           | Description                     |
| ------- | -------------- | ------------------------------- |
| GOLD    | Gold Coins     | Premium virtual currency        |
| DIAMOND | Diamonds       | Rare currency for special items |
| LOYALTY | Loyalty Points | Earned through gameplay         |

### System Accounts

| UID          | Name       | Purpose                       |
| ------------ | ---------- | ----------------------------- |
| TREASURY0001 | Treasury   | Source for purchased credits  |
| REVENUE00001 | Revenue    | Destination for spent credits |
| BONUS0000001 | Bonus Pool | Source for bonus credits      |

### Test Users

| Email                  | Initial Balances                    |
| ---------------------- | ----------------------------------- |
| john.doe@example.com   | 1000 GOLD, 100 DIAMOND, 500 LOYALTY |
| jane.smith@example.com | 1000 GOLD, 100 DIAMOND, 500 LOYALTY |

## 🏆 Brownie Points Implemented

- ✅ **Deadlock Avoidance**: Ordered lock acquisition + automatic retry
- ✅ **Ledger-Based Architecture**: Full double-entry bookkeeping
- ✅ **Containerization**: Docker + docker-compose included

## 📁 Project Structure

```
wallet-service/
├── config/
│   └── config.js           # Database configuration
├── constants/
│   └── wallet.constant.js  # Constants and enums
├── controllers/
│   └── wallet.controller.js
├── helpers/
│   ├── assetTypes.helper.js
│   ├── idGenerator.helper.js  # CommonJS-compatible ID generator
│   ├── transactions.helper.js
│   ├── users.helper.js
│   └── wallets.helper.js
├── middlewares/
│   └── reqRes.middleware.js
├── migrations/             # Database migrations
├── models/
│   ├── index.js
│   ├── AssetType.js
│   ├── LedgerEntry.js
│   ├── Transaction.js
│   ├── User.js
│   └── Wallet.js
├── routes/
│   ├── index.js
│   ├── wallets.route.js
│   └── transactions.route.js
├── seeders/               # Initial data
├── serializers/
│   └── wallet.serializer.js
├── services/
│   └── wallet.service.js  # Core business logic
├── tests/
│   ├── wallet.test.js
│   └── concurrency.test.js
├── utils/
│   └── errorHandler.js
├── validators/
│   └── wallet.validator.js
├── app.js                 # Express app setup
├── index.js               # Entry point
├── docker-compose.yml
├── Dockerfile
└── README.md
```
