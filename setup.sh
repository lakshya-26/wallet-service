#!/bin/bash

# Wallet Service Setup Script
# This script sets up the database and seeds initial data

set -e

echo "🚀 Setting up Wallet Service..."

# Check if .env exists, if not create from sample
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.sample..."
    cp .env.sample .env
    echo "⚠️  Please update .env with your database credentials before continuing."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create database if it doesn't exist
echo "🗄️  Creating database if it doesn't exist..."
npm run db:create

# Run migrations
echo "🔄 Running database migrations..."
npm run migrate

# Run seeders
echo "🌱 Seeding database with initial data..."
npm run seed

echo "✅ Setup complete!"
echo ""
echo "To start the server, run:"
echo "  npm run dev"
echo ""
echo "API Documentation available at: http://localhost:3000/api-docs"
echo "Health Check: http://localhost:3000/health"
