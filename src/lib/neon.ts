import { neon } from "@neondatabase/serverless";

// Create Neon database client
export function createClient() {
  const databaseUrl = process.env.NEON_DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("NEON_DATABASE_URL is not set in environment variables");
  }

  return neon(databaseUrl);
}

// Database schema initialization
export const initializeDatabase = async () => {
  try {
    const sql = createClient();

    // Create tables if they don't exist
    await sql`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        model VARCHAR(255),
        category_id INTEGER REFERENCES categories(id),
        buy_price DECIMAL(10,2) NOT NULL,
        sell_price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP NULL
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS stocks (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 0,
        min_alert_quantity INTEGER DEFAULT 5,
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(product_id)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id),
        type VARCHAR(10) CHECK (type IN ('BUY', 'SELL')),
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER REFERENCES admins(id),
        action VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(50) NOT NULL,
        details JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Insert default admin if not exists
    await sql`
      INSERT INTO admins (username, password) 
      VALUES ('admin', 'admin123') 
      ON CONFLICT (username) DO NOTHING
    `;

    // Insert default categories if not exists
    const existingCategories = await sql`SELECT COUNT(*) as count FROM categories`;
    if (existingCategories[0].count === 0) {
      await sql`
        INSERT INTO categories (name, description) VALUES
        ('Screens', 'LCD, OLED, and touch screen panels'),
        ('Batteries', 'Mobile phone batteries and power cells'),
        ('Chargers', 'Charging cables, adapters, and wireless chargers'),
        ('Speakers', 'Phone speakers and audio components'),
        ('Cameras', 'Camera modules, front and rear'),
        ('IC / Chips', 'Integrated circuits and chipsets'),
        ('Other Parts', 'Miscellaneous mobile phone parts')
      `;
    }

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
};
