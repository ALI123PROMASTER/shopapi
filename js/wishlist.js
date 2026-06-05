async function renderWishlist() {
  const root = document.getElementById("wishlist-items");
  if (!root) return;

  const user = getCurrentUser();
  if (!user) {
    window.location.href = "auth.html";
    return;
  }

  const items = await getWishlist(user.email);
  if (!items.length) {
    root.innerHTML = `
      <div class="empty-state">
        <i class="ti ti-heart-off"></i>
        <h3>Избранное пока пусто</h3>
        <p>Нажмите на сердечко в каталоге, чтобы добавить товар.</p>
        <button class="btn btn-primary" type="button" onclick="location.href='index.html'">Перейти в каталог</button>
      </div>
    `;
    return;
  }

  root.innerHTML = items
    .map(
      (item) => `
        <div class="card" data-product-id="${item.id}">
          <div class="card-img-wrap">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">
            <button class="wish-btn active" type="button" data-action="remove" data-id="${item.id}"><i class="ti ti-heart"></i></button>
          </div>
          <div class="card-body">
            <div class="card-category">${escapeHtml(item.category || "")}</div>
            <div class="card-title">${escapeHtml(item.title)}</div>
            <div><span class="card-stars">${new Product(item).getStars()}</span><span class="card-reviews">(${item.rating?.count || 0})</span></div>
            <div class="card-footer">
              <div class="card-price">$${Number(item.price || 0).toFixed(2)}</div>
              <button class="btn-add" type="button" data-action="add" data-id="${item.id}"><i class="ti ti-plus"></i></button>
            </div>
          </div>
        </div>
      `,
    )
    .join("");
}

document.addEventListener("DOMContentLoaded", () => {
  applyTheme();

  const root = document.getElementById("wishlist-items");
  if (!root) return;

  renderWishlist();

  root.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const productId = Number(button.dataset.id);
    const user = getCurrentUser();
    if (!user) {
      window.location.href = "auth.html";
      return;
    }

    if (button.dataset.action === "add") {
      getCartInstance().addItem(productId);
      updateCartCount();
      showToast("Добавлено в корзину!", "success");
      return;
    }

    if (button.dataset.action === "remove") {
      await fbRemoveFromWishlist(user.email, productId);
      showToast("Удалено из избранного", "success");
      renderWishlist();
    }
  });
});
