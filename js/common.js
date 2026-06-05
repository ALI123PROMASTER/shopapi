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

function getCartInstance() {
  const user = getCurrentUser();
  return new Cart(user ? user.email : "guest");
}

function updateCartCount() {
  const cart = getCartInstance();
  const badge = document.getElementById("cart-count");
  if (badge) badge.textContent = cart.getCount();
  const baseTitle = document.body?.dataset?.title || "Shopix";
  document.title =
    cart.getCount() > 0 ? `(${cart.getCount()}) ${baseTitle}` : baseTitle;
}

function getAvatar(name) {
  const source = String(name || "?");
  const letter = source.charAt(0).toUpperCase();
  const colors = ["#d4956a", "#d4776a", "#c28e6b", "#e0b08a", "#b58266"];
  const color = colors[letter.charCodeAt(0) % colors.length];
  return `<span class="avatar" style="background:${color}">${escapeHtml(letter)}</span>`;
}

function applyTheme() {
  const theme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", theme);
  const icon = document.getElementById("theme-icon");
  if (icon) {
    icon.className = theme === "dark" ? "ti ti-sun" : "ti ti-moon";
  }
}

function toggleTheme() {
  const current = localStorage.getItem("theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  localStorage.setItem("theme", next);
  document.documentElement.setAttribute("data-theme", next);
  const icon = document.getElementById("theme-icon");
  if (icon) {
    icon.className = next === "dark" ? "ti ti-sun" : "ti ti-moon";
  }
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

function getWishlistIds() {
  return readJson(getScopedKey("wishlist"), []);
}

function saveWishlistIds(ids) {
  writeJson(getScopedKey("wishlist"), ids);
}

function toggleWishlistId(productId) {
  const id = Number(productId);
  const current = getWishlistIds();
  const exists = current.includes(id);
  const next = exists
    ? current.filter((item) => item !== id)
    : [...current, id];
  saveWishlistIds(next);
  return !exists;
}

function getCartCount() {
  return getCartInstance().getCount();
}

function addToCart(productId, quantity = 1) {
  const cart = getCartInstance();
  cart.addItem(Number(productId), Number(quantity || 1));
  updateCartCount();
}

function setCartQuantity(productId, quantity) {
  const cart = getCartInstance();
  cart.updateQty(Number(productId), Number(quantity));
  updateCartCount();
}

function removeFromCart(productId) {
  const cart = getCartInstance();
  cart.removeItem(Number(productId));
  updateCartCount();
}

function isInWishlist(productId) {
  return getWishlistIds().includes(Number(productId));
}

function toggleWishlist(productId) {
  return toggleWishlistId(productId);
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
  updateCartCount();
}

function getToastRoot() {
  let root = document.querySelector(".toast-container");
  if (root) return root;

  root = document.createElement("div");
  root.className = "toast-container";
  document.body.appendChild(root);
  return root;
}

function showToast(message, type = "success") {
  const root = getToastRoot();
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-dot"></div>
    <span>${escapeHtml(message)}</span>
  `;
  root.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

function renderHeader() {
  const header = document.getElementById("header");
  if (!header) return;

  const user = getCurrentUser();
  const cartCount = getCartCount();

  header.innerHTML = `
    <div class="header-inner">
      <a class="brand" href="index.html">Shopi<span class="logo-accent">x</span></a>
      <nav class="main-nav">
        <a data-page="index.html" href="index.html">Главная</a>
        <a data-page="wishlist.html" href="wishlist.html">Избранное</a>
        <a data-page="compare.html" href="compare.html">Сравнение</a>
        <a data-page="cart.html" href="cart.html">Корзина <span id="cart-count" class="cart-badge">${cartCount}</span></a>
        <a data-page="profile.html" href="profile.html">Профиль</a>
      </nav>
      <div class="header-actions">
        <button class="btn btn-ghost btn-theme" id="theme-toggle" type="button" aria-label="Переключить тему"><i id="theme-icon" class="ti ti-sun"></i></button>
        ${
          user
            ? `<a class="user-box" href="profile.html">${getAvatar(user.name || user.email)}<span>${escapeHtml(user.name || user.email)}</span></a><button id="logout-btn" class="btn btn-ghost" type="button">Выйти</button>`
            : `<a class="btn btn-ghost" data-page="auth.html" href="auth.html">Вход / Регистрация</a>`
        }
      </div>
    </div>
  `;

  markActiveLink();
  const savedTheme = localStorage.getItem("theme") || "dark";
  const themeIcon = document.getElementById("theme-icon");
  if (themeIcon) {
    themeIcon.className = savedTheme === "dark" ? "ti ti-sun" : "ti ti-moon";
  }
  document
    .getElementById("theme-toggle")
    ?.addEventListener("click", toggleTheme);

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
  applyTheme();
  refreshHeaderAndTitle();
});
