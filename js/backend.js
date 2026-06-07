const BACKEND_URL = "http://10.10.10.14:3000/api";

async function apiRequest(endpoint, method = "GET", body = null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, options);
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error(`Request to ${endpoint} failed:`, error);
    return null;
  }
}

// Функции для корзины
async function apiGetCart(userId) {
  return await apiRequest(`/cart?user_id=${userId}`);
}

async function apiAddToCart(userId, productId, quantity) {
  return await apiRequest("/cart", "POST", { user_id: userId, product_id: productId, quantity });
}

async function apiRemoveFromCart(userId, productId) {
  return await apiRequest("/cart", "DELETE", { user_id: userId, product_id: productId });
}

// Функции для избранного
async function apiGetFavorites(userId) {
  return await apiRequest(`/favorites?user_id=${userId}`);
}

async function apiAddToFavorites(userId, productId) {
  return await apiRequest("/favorites", "POST", { user_id: userId, product_id: productId });
}

async function apiRemoveFromFavorites(userId, productId) {
  return await apiRequest("/favorites", "DELETE", { user_id: userId, product_id: productId });
}

// Функции для сравнения
async function apiGetCompare(userId) {
  return await apiRequest(`/compare?user_id=${userId}`);
}

async function apiAddToCompare(userId, productId) {
  return await apiRequest("/compare", "POST", { user_id: userId, product_id: productId });
}

async function apiRemoveFromCompare(userId, productId) {
  return await apiRequest("/compare", "DELETE", { user_id: userId, product_id: productId });
}
