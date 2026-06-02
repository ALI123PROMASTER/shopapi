const USERS_KEY = "shop_users_v2";
const CURRENT_USER_KEY = "shop_current_user_v2";

function readJson(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatPrice(price) {
  return `${Number(price || 0).toFixed(2)} $`;
}

function renderStars(rate = 0, count = 0) {
  const safeRate = Math.max(0, Math.min(5, Number(rate || 0)));
  const filled = Math.round(safeRate);
  const stars = "★★★★★".slice(0, filled) + "☆☆☆☆☆".slice(0, 5 - filled);
  return `${stars} (${safeRate.toFixed(1)} · ${count})`;
}

function getUsers() {
  return readJson(USERS_KEY, []);
}

function saveUsers(users) {
  writeJson(USERS_KEY, users);
}

function getCurrentUser() {
  return readJson(CURRENT_USER_KEY, null);
}

function setCurrentUser(user) {
  writeJson(CURRENT_USER_KEY, user);
}

function logoutUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

function getUserScopeId() {
  const user = getCurrentUser();
  return user?.email ? user.email.toLowerCase() : "guest";
}

function getScopedKey(prefix) {
  return `shop_${prefix}_${getUserScopeId()}`;
}

function getCartItems() {
  return readJson(getScopedKey("cart"), []);
}

function saveCartItems(items) {
  writeJson(getScopedKey("cart"), items);
}

function getWishlist() {
  return readJson(getScopedKey("wishlist"), []);
}

function saveWishlist(ids) {
  writeJson(getScopedKey("wishlist"), ids);
}

function getCompareList() {
  return readJson(getScopedKey("compare"), []);
}

function saveCompareList(ids) {
  writeJson(getScopedKey("compare"), ids);
}

function getRecentViewed() {
  return readJson(getScopedKey("recent"), []);
}

function saveRecentViewed(ids) {
  writeJson(getScopedKey("recent"), ids);
}

function getCartCount() {
  return getCartItems().reduce(
    (acc, item) => acc + Number(item.quantity || 0),
    0,
  );
}

function addToCart(productId, quantity = 1) {
  const cart = new Cart(getCartItems());
  cart.addItem(Number(productId), Number(quantity || 1));
  saveCartItems(cart.items);
  refreshHeaderAndTitle();
}

function setCartQuantity(productId, quantity) {
  const cart = new Cart(getCartItems());
  cart.setQuantity(Number(productId), Number(quantity));
  saveCartItems(cart.items);
  refreshHeaderAndTitle();
}

function removeFromCart(productId) {
  const cart = new Cart(getCartItems());
  cart.removeItem(Number(productId));
  saveCartItems(cart.items);
  refreshHeaderAndTitle();
}

function isInWishlist(productId) {
  return getWishlist().includes(Number(productId));
}

function toggleWishlist(productId) {
  const id = Number(productId);
  const current = getWishlist();
  const exists = current.includes(id);
  const next = exists
    ? current.filter((item) => item !== id)
    : [...current, id];
  saveWishlist(next);
  return !exists;
}

function isInCompare(productId) {
  return getCompareList().includes(Number(productId));
}

function toggleCompare(productId) {
  const id = Number(productId);
  const current = getCompareList();
  const exists = current.includes(id);

  if (exists) {
    const next = current.filter((item) => item !== id);
    saveCompareList(next);
    return { active: false, limitReached: false };
  }

  if (current.length >= 3) {
    return { active: false, limitReached: true };
  }

  const next = [...current, id];
  saveCompareList(next);
  return { active: true, limitReached: false };
}

function pushRecentViewed(productId) {
  const id = Number(productId);
  const current = getRecentViewed().filter((item) => item !== id);
  current.unshift(id);
  saveRecentViewed(current.slice(0, 8));
}

function getAvatarColor(seedText) {
  const text = String(seedText || "U");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue} 74% 45%)`;
}

function markActiveLink() {
  const page = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".main-nav a[data-page]").forEach((link) => {
    if (link.dataset.page === page) {
      link.classList.add("is-active");
    }
  });
}

function updateDocumentTitleCount() {
  const base = document.body?.dataset?.title || "Магазин";
  const count = getCartCount();
  document.title = count > 0 ? `(${count}) ${base}` : base;
}

function getToastRoot() {
  let root = document.querySelector(".toast-root");
  if (root) return root;

  root = document.createElement("div");
  root.className = "toast-root";
  document.body.appendChild(root);
  return root;
}

function showToast(message, type = "info") {
  const root = getToastRoot();
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  root.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2600);
}

function renderHeader() {
  const header = document.getElementById("header");
  if (!header) return;

  const user = getCurrentUser();
  const cartCount = getCartCount();
  const initial = (user?.name || "Гость").charAt(0).toUpperCase();
  const activeColor = getAvatarColor(user?.name || user?.email || "guest");

  header.innerHTML = `
    <div class="header-inner">
      <a class="brand" href="index.html">Drift Store</a>
      <nav class="main-nav">
        <a data-page="index.html" href="index.html">Главная</a>
        <a data-page="wishlist.html" href="wishlist.html">Избранное</a>
        <a data-page="compare.html" href="compare.html">Сравнение</a>
        <a data-page="cart.html" href="cart.html">Корзина <span class="cart-badge">${cartCount}</span></a>
        ${
          user
            ? `<span class="user-box"><span class="avatar" style="background:${activeColor}">${escapeHtml(initial)}</span><span>Привет, ${escapeHtml(user.name)}</span><button id="logout-btn" class="btn btn-ghost" type="button">Выйти</button></span>`
            : `<a data-page="auth.html" href="auth.html">Вход / Регистрация</a>`
        }
      </nav>
    </div>
  `;

  markActiveLink();

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      logoutUser();
      showToast("Вы вышли из аккаунта", "success");
      refreshHeaderAndTitle();
      window.location.href = "index.html";
    });
  }
}

function refreshHeaderAndTitle() {
  renderHeader();
  updateDocumentTitleCount();
}

document.addEventListener("DOMContentLoaded", () => {
  refreshHeaderAndTitle();
});
