// Creates the `users` table if it does not exist
module.exports = async function createUsersTable(pool) {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      login TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      email TEXT
    );
  `;
  await pool.query(query);
};
