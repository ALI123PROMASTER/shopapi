const API_URL = "https://fakestoreapi.com";

let productsCache = null;
const productCacheById = {};

async function getProducts() {
  if (productsCache) {
    return productsCache;
  }

  const res = await fetch(`${API_URL}/products`);
  if (!res.ok) {
    throw new Error("Не удалось загрузить товары");
  }

  const data = await res.json();
  productsCache = data.map((item) => new Product(item));

  productsCache.forEach((product) => {
    productCacheById[product.id] = product;
  });

  return productsCache;
}

async function getProductById(id) {
  const productId = Number(id);
  if (!Number.isFinite(productId) || productId <= 0) {
    return null;
  }

  if (productCacheById[productId]) {
    return productCacheById[productId];
  }

  const res = await fetch(`${API_URL}/products/${id}`);
  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  if (!data || !data.id) {
    return null;
  }

  const product = new Product(data);
  productCacheById[product.id] = product;
  return product;
}

async function getCategories() {
  const products = await getProducts();
  return [...new Set(products.map((p) => p.category))];
}

// ---------------------------------------------------------------------------
// Placeholder API helpers used by the client‑side code.
// The original project expects server endpoints for cart, favorites, compare,
// etc. To avoid `ReferenceError` we provide minimal implementations that return
// empty data or perform no‑op fetches. Replace these with real backend calls
// when the server API becomes available.
// ---------------------------------------------------------------------------

/** Fetch cart items for a user. Returns an array of objects with `product_id`
 *  and `quantity` fields. */
async function apiGetCart(userId) {
  try {
    const res = await fetch(`${API_URL}/carts/user/${userId}`);
    if (!res.ok) return [];
    const data = await res.json();
    // Expected shape: { id, userId, date, products: [{ productId, quantity }] }
    return data.products || [];
  } catch {
    return [];
  }
}

/** Add or update a product in the user's cart. */
async function apiAddToCart(userId, productId, quantity) {
  try {
    await fetch(`${API_URL}/carts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, productId, quantity }),
    });
  } catch {}
}

/** Get favorites for a user.
 *  The real API endpoint does not exist on fakestoreapi.com, so we store the
 *  list locally in `localStorage` under a namespaced key. This avoids 404
 *  responses while preserving the expected array shape.
 */
async function apiGetFavorites(userId) {
  const key = `shop_favorites_${userId}`;
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/** Add a product to favorites (local storage stub). */
async function apiAddToFavorites(userId, productId) {
  const key = `shop_favorites_${userId}`;
  const list = await apiGetFavorites(userId);
  const id = Number(productId);
  if (!list.includes(id)) {
    list.push(id);
    localStorage.setItem(key, JSON.stringify(list));
  }
}

/** Remove a product from favorites (local storage stub). */
async function apiRemoveFromFavorites(userId, productId) {
  const key = `shop_favorites_${userId}`;
  const list = await apiGetFavorites(userId);
  const id = Number(productId);
  const filtered = list.filter((v) => v !== id);
  localStorage.setItem(key, JSON.stringify(filtered));
}

/** Get compare list for a user (local storage stub). */
async function apiGetCompare(userId) {
  const key = `shop_compare_${userId}`;
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/** Add a product to compare list (local storage stub). */
async function apiAddToCompare(userId, productId) {
  const key = `shop_compare_${userId}`;
  const list = await apiGetCompare(userId);
  const id = Number(productId);
  if (!list.includes(id)) {
    list.push(id);
    localStorage.setItem(key, JSON.stringify(list));
  }
}

/** Remove a product from compare list (local storage stub). */
async function apiRemoveFromCompare(userId, productId) {
  const key = `shop_compare_${userId}`;
  const list = await apiGetCompare(userId);
  const id = Number(productId);
  const filtered = list.filter((v) => v !== id);
  localStorage.setItem(key, JSON.stringify(filtered));
}

// Functions are attached to the global scope because the script is loaded
// without `type="module"`.
