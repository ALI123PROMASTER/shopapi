// scripts/remove_fk.js
// One‑time script to drop the stray foreign‑key constraint on the "cart" table.
// The project uses an external product API, so there is no local "products" table.
// Run it with:  node scripts/remove_fk.js
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

(async () => {
  try {
    console.log('🔧 Attempting to drop constraint cart_product_id_fkey (if it exists)…');
    await pool.query(`
      ALTER TABLE IF EXISTS cart
      DROP CONSTRAINT IF EXISTS cart_product_id_fkey;
    `);
    console.log('✅ Constraint dropped (or was already absent).');
  } catch (err) {
    console.error('❌ Failed to drop constraint:', err.message);
  } finally {
    await pool.end();
    console.log('🔌 Database connection closed.');
  }
})();
