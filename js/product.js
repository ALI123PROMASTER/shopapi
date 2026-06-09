function renderProduct404() {
  const details = document.getElementById("product-details");
  if (!details) return;

  details.innerHTML = `
    <div class="empty-state">
      <i class="ti ti-mood-sad"></i>
      <h3>Товар не найден</h3>
      <p>Проверьте ссылку или вернитесь в каталог.</p>
      <button class="btn btn-outline" type="button" onclick="location.href='/index.html'">В каталог</button>
    </div>
  `;
}

async function renderProductView(product) {
  const details = document.getElementById("product-details");
  if (!details) return;

  const inWishlist = await isInWishlist(product.id);

  details.innerHTML = `
  <div class="product-page">
    <div class="product-img-box">
      <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}">
    </div>
    <div class="product-info">
      <span class="product-badge">${escapeHtml(product.category)}</span>
      <h1 class="product-title">${escapeHtml(product.title)}</h1>
      <div class="product-stars">
        <span class="stars">${product.getStars()}</span>
        <span class="count">${product.rating?.count || 0} отзывов</span>
      </div>
      <div class="product-price">$${Number(product.price || 0).toFixed(2)}</div>
      <p class="product-desc">${escapeHtml(product.description)}</p>
      <div class="product-actions">
        <button class="btn btn-primary" id="add-to-cart" type="button"><i class="ti ti-shopping-bag"></i> В корзину</button>
          <button class="btn btn-primary" id="buy-now" type="button"><i class="ti ti-bolt"></i> Купить сейчас</button>
        <button class="icon-btn wish-btn ${inWishlist ? "active" : ""}" id="add-to-wish" type="button"><i class="ti ti-heart"></i></button>
      </div>
      <div class="product-nav" style="display:flex; gap:12px; margin-top:24px;">
        <button class="btn btn-outline" id="to-catalog" type="button"><i class="ti ti-arrow-left"></i> Назад</button>
        <button class="btn btn-outline" id="to-cart" type="button">В корзину <i class="ti ti-arrow-right"></i></button>
      </div>
    </div>
  </div>
  `;

  const user = getCurrentUser();

  document
    .getElementById("add-to-cart")
    ?.addEventListener("click", async () => {
      await addToCart(product.id);
      showToast("Добавлено в корзину!", "success");
    });

  document.getElementById("buy-now")?.addEventListener("click", () => {
    if (typeof window.showBuyNowModal === "function") {
      window.showBuyNowModal(product);
    } else {
      // fallback — переходим на страницу заказа
      window.location.href = "/pages/order.html";
    }
  });

  document.getElementById("to-catalog")?.addEventListener("click", () => {
    window.location.href = "/index.html";
  });

  document.getElementById("to-cart")?.addEventListener("click", () => {
    window.location.href = "/pages/cart.html";
  });

  document
    .getElementById("add-to-wish")
    ?.addEventListener("click", async () => {
      // Allow both logged‑in and guest users to toggle wishlist.
      // Previously guests were blocked with a toast message, which
      // prevented adding items to the wishlist for unauthenticated users.
      const isActive = await toggleWishlist(product.id);
      if (isActive) {
        showToast("Добавлено в избранное", "success");
      } else {
        showToast("Удалено из избранного", "success");
      }
      // Re‑render the product view to update the button state.
      renderProductView(product);
    });
}

document.addEventListener("DOMContentLoaded", async () => {
  applyTheme();

  const params = new URLSearchParams(window.location.search);
  const productId = Number(params.get("id"));
  if (!Number.isFinite(productId) || productId <= 0) {
    renderProduct404();
    return;
  }

  const data = await getProductById(productId);
  if (!data) {
    renderProduct404();
    return;
  }

  const product = new Product(data);
  renderProductView(product);
  pushRecentViewed(product.id);
});
