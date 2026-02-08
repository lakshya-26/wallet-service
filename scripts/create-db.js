#!/usr/bin/env node

/**
 * Database Setup Script
 * Creates the database if it doesn't exist
 */

require('dotenv').config();
const { Client } = require('pg');

const dbName = process.env.DB_DATABASE || 'wallet_service';
const dbUser = process.env.DB_USERNAME || 'postgres';
const dbPassword = process.env.DB_PASSWORD || '';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || 5432;

async function createDatabase() {
  // Connect to postgres database (default database that always exists)
  const client = new Client({
    user: dbUser,
    password: dbPassword,
    host: dbHost,
    port: dbPort,
    database: 'postgres', // Connect to default postgres database
  });

  try {
    await client.connect();
    console.log(`🔗 Connected to PostgreSQL server`);

    // Check if database exists
    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (result.rows.length === 0) {
      // Database doesn't exist, create it
      console.log(`📦 Creating database "${dbName}"...`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database "${dbName}" created successfully!`);
    } else {
      console.log(`✅ Database "${dbName}" already exists.`);
    }
  } catch (error) {
    if (error.code === '42P04') {
      // Database already exists (race condition)
      console.log(`✅ Database "${dbName}" already exists.`);
    } else {
      console.error(`❌ Error creating database:`, error.message);
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

createDatabase();
