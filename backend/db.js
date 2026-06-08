const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

// Настройка подключения к базе данных
// Проверяем наличие обязательных переменных окружения и выводим понятные сообщения, если они отсутствуют.
const requiredEnv = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(
    `❌ Ошибка конфигурации: отсутствуют переменные окружения: ${missingEnv.join(', ')}. ` +
      'Создайте файл .env с необходимыми параметрами или установите их в окружении.'
  );
  // Завершаем процесс, чтобы сервер не запускался без подключения к БД.
  process.exit(1);
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Если база находится в облаке, часто требуется SSL.
  // Добавляем опцию, которая включается автоматически при наличии переменной DB_SSL.
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Проверка подключения
pool.on('connect', async () => {
  console.log('✅ Подключено к PostgreSQL');
  // Удаляем внешний ключ, который ссылается на несуществующую таблицу products
  try {
    await pool.query('ALTER TABLE IF EXISTS cart DROP CONSTRAINT IF EXISTS cart_product_id_fkey');
    console.log('🛠️ Удалён внешний ключ cart_product_id_fkey (если он был)');
  } catch (e) {
    console.error('⚠️ Ошибка при удалении внешнего ключа:', e.message);
  }
});

pool.on('error', (err) => {
  console.error('❌ Ошибка PostgreSQL:', err);
});

// Load schema creation helpers
const createOrdersTable = require('./models/createOrders');
const createOrderItemsTable = require('./models/createOrderItems');

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};

// Ensure tables exist after pool is ready
pool.on('connect', async () => {
  try {
    await createOrdersTable(pool);
    await createOrderItemsTable(pool);
    console.log('✅ Order tables ensured');
  } catch (e) {
    console.error('⚠️ Error creating order tables:', e.message);
  }
});
