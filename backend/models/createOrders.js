// Creates the `orders` table if it does not exist
module.exports = async function createOrdersTable(pool) {
  const query = `
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      total NUMERIC NOT NULL,
      name TEXT,
      phone TEXT,
      address TEXT,
      created_at TIMESTAMP DEFAULT now()
    );
  `;
  await pool.query(query);
};
