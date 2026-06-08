// Creates the `order_items` table if it does not exist
module.exports = async function createOrderItemsTable(pool) {
  const query = `
    CREATE TABLE IF NOT EXISTS order_items (
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price NUMERIC NOT NULL,
      PRIMARY KEY (order_id, product_id)
    );
  `;
  await pool.query(query);
};
