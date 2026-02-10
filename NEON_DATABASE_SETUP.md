# Neon Database Setup Guide

This guide will help you set up a Neon database for your inventory management system.

## Prerequisites

- Node.js and npm installed
- A Neon account (free tier available)

## Step 1: Create a Neon Database

1. Go to [neon.tech](https://neon.tech) and sign up for a free account
2. Create a new project
3. Choose your preferred region
4. Create a database (default name is usually fine)

## Step 2: Get Your Database URL

1. In your Neon dashboard, go to your project
2. Navigate to the "Connection Details" section
3. Copy the connection string - it looks like:
   ```
   postgresql://username:password@ep-example-123.us-east-2.aws.neon.tech/dbname?sslmode=require
   ```

## Step 3: Configure Environment Variables

1. Create a `.env.local` file in your project root (if it doesn't exist)
2. Add your Neon database URL:
   ```
   NEON_DATABASE_URL="postgresql://your-connection-string-here"
   NODE_ENV="production"
   ```

## Step 4: Initialize Database Tables

The application will automatically create the required tables when you first run it with a valid Neon database connection:

- `admins` - Admin user accounts
- `categories` - Product categories
- `products` - Product inventory
- `stocks` - Stock quantities
- `transactions` - Buy/sell transactions
- `activity_logs` - System activity logs

## Step 5: Admin Account

A default admin account will be created:
- **Username:** `admin`
- **Password:** `admin123`

**⚠️ IMPORTANT:** Change the default password in production!

## Development vs Production

### Development Mode (Demo Data)
If `NEON_DATABASE_URL` is not set, the system runs in demo mode using local data store.

### Production Mode
When `NEON_DATABASE_URL` is configured, the system connects to your Neon database.

## Database Schema

```sql
-- Admin accounts
CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Categories
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Products
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  model VARCHAR(255),
  category_id INTEGER REFERENCES categories(id),
  buy_price DECIMAL(10,2) NOT NULL,
  sell_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);

-- Stock management
CREATE TABLE stocks (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_alert_quantity INTEGER DEFAULT 5,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id)
);

-- Transactions
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  type VARCHAR(10) CHECK (type IN ('BUY', 'SELL')),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Activity logs
CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES admins(id),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(50) NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Security Notes

1. **Password Hashing:** In production, implement proper password hashing (bcrypt, etc.)
2. **Environment Variables:** Keep your `.env.local` file secure and never commit it to version control
3. **Database Security:** Use Neon's built-in security features and connection pooling
4. **Admin Access:** Change default admin credentials immediately in production

## Troubleshooting

### Common Issues

1. **Connection Error:**
   - Verify your database URL is correct
   - Check if your IP is whitelisted (Neon usually allows all IPs by default)
   - Ensure you have an active internet connection

2. **Module Not Found:**
   - Run `npm install @neondatabase/serverless`

3. **Authentication Issues:**
   - Clear browser localStorage and try again
   - Check admin credentials in the database

### Support

- Neon Documentation: [docs.neon.tech](https://docs.neon.tech)
- GitHub Issues: Create an issue in your project repository

---

## Quick Start Commands

```bash
# Install dependencies
npm install

# Set up environment variables (create .env.local with your Neon URL)
cp .env.local.example .env.local

# Start development server
npm run dev

# Open browser and go to:
# http://localhost:3000/login
# Username: admin
# Password: admin123
```

Your inventory management system is now ready with Neon database integration! 🚀