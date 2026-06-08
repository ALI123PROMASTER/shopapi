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

async function getCartInstance() {
  const user = getCurrentUser();
  const cart = new Cart(user ? user.id : "guest");
  
  // Если пользователь залогинен, синхронизируем с БД
  if (user && user.id) {
    const dbItems = await apiGetCart(user.id);
    if (dbItems) {
      cart.items = dbItems.map(item => new CartItem(item.product_id, item.quantity));
      cart.save(); // Обновляем локальное хранилище для оффлайн-просмотра
    }
  }
  return cart;
}

async function updateCartCount() {
  const cart = await getCartInstance();
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

function saveCompareList(ids) {
  writeJson(getScopedKey("compare"), ids);
}

function getRecentViewed() {
  return readJson(getScopedKey("recent"), []);
}

function saveRecentViewed(ids) {
  writeJson(getScopedKey("recent"), ids);
}

function saveWishlistIds(ids) {
  writeJson(getScopedKey("wishlist"), ids);
}

async function setCartQuantity(productId, quantity) {
  const user = getCurrentUser();
  if (user && user.id) {
    await apiAddToCart(user.id, productId, quantity - (await getCartQuantityLocal(productId)));
  } else {
    const cart = await getCartInstance();
    cart.updateQty(Number(productId), Number(quantity));
  }
  await updateCartCount();
}

async function getCartQuantityLocal(productId) {
  const cart = await getCartInstance();
  const item = cart.items.find(i => i.productId === Number(productId));
  return item ? item.quantity : 0;
}

async function isInWishlist(productId) {
  const list = await getWishlistIds();
  return list.includes(Number(productId));
}

async function toggleWishlist(productId) {
  return await toggleWishlistId(productId);
}

async function isInCompare(productId) {
  const list = await getCompareList();
  return list.includes(Number(productId));
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

function getBasePath(){return location.pathname.includes('/pages/')?"../":"";}

function markActiveLink() {
  const page = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".main-nav a[data-page]").forEach((link) => {
    if (link.dataset.page === page) {
      link.classList.add("is-active");
    }
  });
}

async function updateDocumentTitleCount() {
  await updateCartCount();
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

async function getWishlistIds() {
  const user = getCurrentUser();
  if (user && user.id) {
    const items = await apiGetFavorites(user.id);
    return items ? items.map(i => Number(i.product_id)) : [];
  }
  return readJson(getScopedKey("wishlist"), []);
}

async function toggleWishlistId(productId) {
  const user = getCurrentUser();
  const id = Number(productId);

  if (user && user.id) {
    const current = await getWishlistIds();
    const exists = current.includes(id);
    if (exists) {
      await apiRemoveFromFavorites(user.id, id);
    } else {
      await apiAddToFavorites(user.id, id);
    }
    return !exists;
  }

  const current = await getWishlistIds();
  const exists = current.includes(id);
  const next = exists
    ? current.filter((item) => item !== id)
    : [...current, id];
  saveWishlistIds(next);
  return !exists;
}

async function getCompareList() {
  const user = getCurrentUser();
  if (user && user.id) {
    const items = await apiGetCompare(user.id);
    return items ? items.map(i => Number(i.product_id)) : [];
  }
  return readJson(getScopedKey("compare"), []);
}

async function toggleCompare(productId) {
  const user = getCurrentUser();
  const id = Number(productId);
  const current = await getCompareList();
  const exists = current.includes(id);

  if (exists) {
    if (user && user.id) {
      await apiRemoveFromCompare(user.id, id);
    } else {
      const next = current.filter((item) => item !== id);
      saveCompareList(next);
    }
    return { active: false, limitReached: false };
  }

  if (current.length >= 3) {
    return { active: false, limitReached: true };
  }

  if (user && user.id) {
    await apiAddToCompare(user.id, id);
  } else {
    const next = [...current, id];
    saveCompareList(next);
  }
  return { active: true, limitReached: false };
}

async function addToCart(productId, quantity = 1) {
  const user = getCurrentUser();
  if (user && user.id) {
    await apiAddToCart(user.id, productId, quantity);
  } else {
    const cart = await getCartInstance();
    cart.addItem(Number(productId), Number(quantity || 1));
  }
  await updateCartCount();
}

async function removeFromCart(productId) {
  const user = getCurrentUser();
  if (user && user.id) {
    await apiRemoveFromCart(user.id, productId);
  } else {
    const cart = await getCartInstance();
    cart.removeItem(Number(productId));
  }
  await updateCartCount();
}

async function renderHeader() {
  const header = document.getElementById("header");
  if (!header) return;

  const user = getCurrentUser();

  const cart = await getCartInstance();
  const cartCount = cart.getCount();
  const basePath = getBasePath();
  header.innerHTML = `
    <div class="header-inner">
      <a class="brand" href="/index.html">Shopi<span class="logo-accent">x</span></a>
      <nav class="main-nav">
        <a data-page="index.html" href="/index.html">Главная</a>
        <a data-page="wishlist.html" href="/pages/wishlist.html">Избранное</a>
        <a data-page="compare.html" href="/pages/compare.html">Сравнение</a>
        <a data-page="cart.html" href="/pages/cart.html">Корзина <span id="cart-count" class="cart-badge">${cartCount}</span></a>
        <a data-page="profile.html" href="/pages/profile.html">Профиль</a>
      </nav>
      <div class="header-actions">
        <button class="btn btn-ghost btn-theme" id="theme-toggle" type="button" aria-label="Переключить тему"><i id="theme-icon" class="ti ti-sun"></i></button>
        ${
          user
            ? `<a class="user-box" href="/pages/profile.html">${getAvatar(user.name || user.login)}<span>${escapeHtml(user.name || user.login)}</span></a><button id="logout-btn" class="btn btn-ghost" type="button">Выйти</button>`
            : `<a class="btn btn-ghost" data-page="auth.html" href="/pages/auth.html">Вход / Регистрация</a>`
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
      window.location.href = `${basePath}index.html`;
    });
  }
}

async function refreshHeaderAndTitle() {
  await renderHeader();
  await updateCartCount();
}

document.addEventListener("DOMContentLoaded", async () => {
  applyTheme();
  await refreshHeaderAndTitle();
});
