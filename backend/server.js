require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware — должен быть ДО static и маршрутов
app.use(cors());
app.use(express.json());

// Раздаём статику (HTML, CSS, JS, изображения) из корня проекта
app.use(express.static(path.join(__dirname, '../')));

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Алиасы: /cart.html → /pages/cart.html (и т.д.)
const pageAliases = ['cart', 'wishlist', 'compare', 'profile', 'auth', 'product', 'order'];
pageAliases.forEach(page => {
  app.get(`/${page}.html`, (req, res) => {
    res.sendFile(path.join(__dirname, `../pages/${page}.html`));
  });
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

// Fallback for SPA routes – serve main page for any unknown path
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'))
});

// New order endpoint – creates order and order_items in a transaction
app.post('/api/orders', async (req, res) => {
  const { total, items, customer } = req.body;
  if (!total || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Invalid order payload' });
  }
  const client = await db.pool.connect(); // get a dedicated client for transaction
  try {
    await client.query('BEGIN');
    const orderResult = await client.query(
      'INSERT INTO orders (user_id, total, name, phone, address) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [req.body.user_id || null, total, req.body.customer?.name || null, req.body.customer?.phone || null, req.body.customer?.address || null]
    );
    const orderId = orderResult.rows[0].id;
    // Insert order_items
    const insertPromises = items.map((it) =>
      client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [orderId, it.product_id, it.quantity, it.price]
      )
    );
    await Promise.all(insertPromises);
    await client.query('COMMIT');
    // Optionally store customer info somewhere – omitted for brevity
    res.status(201).json({ orderId });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Order creation error:', e);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
});

// GET order details (including items)
app.get('/api/orders/:id', async (req, res) => {
  const orderId = Number(req.params.id);
  if (!orderId) return res.status(400).json({ error: 'Invalid order id' });
  try {
    const orderResult = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    const order = orderResult.rows[0];
    const itemsResult = await db.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
    const items = itemsResult.rows;
    res.json({ order, items });
  } catch (e) {
    console.error('Error fetching order', e);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
