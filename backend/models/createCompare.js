// Creates the `i_compare` table if it does not exist
module.exports = async function createCompareTable(pool) {
  const query = `
    CREATE TABLE IF NOT EXISTS i_compare (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL,
      UNIQUE(user_id, product_id)
    );
  `;
  await pool.query(query);
};
