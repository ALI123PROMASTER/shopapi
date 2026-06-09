// Creates the `favorites` table if it does not exist
module.exports = async function createFavoritesTable(pool) {
  // Create the table with all required columns from the start.
  // user_id is NOT NULL so the unique constraint works correctly —
  // PostgreSQL does not consider two NULLs equal, so a nullable user_id
  // would allow unlimited duplicate (NULL, product_id) rows and break
  // ON CONFLICT resolution in the API.
  const createQuery = `
    CREATE TABLE IF NOT EXISTS favorites (
      id         SERIAL  PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL
    );
  `;
  await pool.query(createQuery);

  // Idempotent unique index — safe to run on both fresh and existing tables.
  const uniqueIdxQuery = `
    CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_product_idx
      ON favorites(user_id, product_id);
  `;
  await pool.query(uniqueIdxQuery);

  // Migration: if the table was created by an older version of this script
  // (without NOT NULL on user_id), enforce the constraint now.
  // This is a best-effort migration; it will log a warning if it cannot
  // apply (e.g. existing NULL rows) but will not crash the server.
  try {
    await pool.query(`
      ALTER TABLE favorites
        ALTER COLUMN user_id SET NOT NULL;
    `);
  } catch (e) {
    console.warn(
      '⚠️  Could not set NOT NULL on favorites.user_id ' +
      '(table may have existing NULL rows — clean them up manually):', e.message
    );
  }
};