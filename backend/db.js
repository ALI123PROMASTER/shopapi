const { Pool } = require('pg');
require('dotenv').config();

// Настройка подключения к базе данных
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Проверка подключения
pool.on('connect', () => {
  console.log('Подключено к PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Ошибка PostgreSQL:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
