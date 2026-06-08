const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
/* Добавляем в начало server.js (после объявлений const) */
const path = require('path');

/* Заменяем обработчик app.get('/') и добавляем раздачу статики */
app.use(express.static(path.join(__dirname, '../'))); // Раздаем все файлы из основной папки

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

app.use(cors());
app.use(express.json());

// Главная страница для проверки работы сервера
app.get('/', (req, res) => {
  res.send('API сервер интернет-магазина запущен и работает. Используйте эндпоинты /api/...');
});
// --- АУТЕНТИФИКАЦИЯ ---

// Регистрация (добавлена для удобства)
app.post('/api/auth/register', async (req, res) => {
  const { login, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (login, password) VALUES ($1, $2) RETURNING id, login',
      [login, hashedPassword]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка регистрации. Возможно, логин занят.' });
  }
});

// Логин
app.post('/api/auth/login', async (req, res) => {
  const { login, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE login = $1', [login]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }
    res.json({ id: user.id, login: user.login });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// --- КОРЗИНА ---

// Получить корзину пользователя
app.get('/api/cart', async (req, res) => {
  const { user_id } = req.query;
  try {
    const result = await db.query('SELECT * FROM cart WHERE user_id = $1', [user_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Добавить в корзину
app.post('/api/cart', async (req, res) => {
  const { user_id, product_id, quantity } = req.body;
  try {
    // Проверяем, есть ли уже такой товар
    const existing = await db.query(
      'SELECT * FROM cart WHERE user_id = $1 AND product_id = $2',
      [user_id, product_id]
    );
    if (existing.rows.length > 0) {
      const result = await db.query(
        'UPDATE cart SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3 RETURNING *',
        [quantity || 1, user_id, product_id]
      );
      res.json(result.rows[0]);
    } else {
      const result = await db.query(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
        [user_id, product_id, quantity || 1]
      );
      res.json(result.rows[0]);
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Удалить из корзины
app.delete('/api/cart', async (req, res) => {
  const { user_id, product_id } = req.body;
  try {
    await db.query('DELETE FROM cart WHERE user_id = $1 AND product_id = $2', [user_id, product_id]);
    res.json({ message: 'Товар удален из корзины' });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// --- ИЗБРАННОЕ ---

app.get('/api/favorites', async (req, res) => {
  const { user_id } = req.query;
  try {
    const result = await db.query('SELECT * FROM favorites WHERE user_id = $1', [user_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post('/api/favorites', async (req, res) => {
  const { user_id, product_id } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO favorites (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *',
      [user_id, product_id]
    );
    res.json(result.rows[0] || { message: 'Уже в избранном' });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.delete('/api/favorites', async (req, res) => {
  const { user_id, product_id } = req.body;
  try {
    await db.query('DELETE FROM favorites WHERE user_id = $1 AND product_id = $2', [user_id, product_id]);
    res.json({ message: 'Удалено из избранного' });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// --- СРАВНЕНИЕ ---

app.get('/api/compare', async (req, res) => {
  const { user_id } = req.query;
  try {
    const result = await db.query('SELECT * FROM i_compare WHERE user_id = $1', [user_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post('/api/compare', async (req, res) => {
  const { user_id, product_id } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO i_compare (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *',
      [user_id, product_id]
    );
    res.json(result.rows[0] || { message: 'Уже в сравнении' });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.delete('/api/compare', async (req, res) => {
  const { user_id, product_id } = req.body;
  try {
    await db.query('DELETE FROM i_compare WHERE user_id = $1 AND product_id = $2', [user_id, product_id]);
    res.json({ message: 'Удалено из сравнения' });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
