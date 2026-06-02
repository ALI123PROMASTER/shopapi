async function renderWishlist() {
  const root = document.getElementById("wishlist-items");
  if (!root) return;

  const ids = getWishlist();
  if (!ids.length) {
    root.innerHTML = `
      <div class="placeholder">
        <h3>Избранное пока пусто</h3>
        <p>Нажмите на сердечко в каталоге, чтобы добавить товар.</p>
        <a class="btn btn-primary" href="index.html">Перейти в каталог</a>
      </div>
    `;
    return;
  }

  const products = (
    await Promise.all(ids.map((id) => getProductById(id)))
  ).filter(Boolean);
  if (!products.length) {
    root.innerHTML = `
      <div class="placeholder">
        <h3>Не удалось загрузить избранные товары</h3>
      </div>
    `;
    return;
  }

  root.innerHTML = products
    .map(
      (product) => `
        <article class="card" data-product-id="${product.id}">
          <div class="card-media">
            <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}">
          </div>
          <div class="card-body">
            <div class="card-meta">${escapeHtml(product.category)}</div>
            <h3 class="card-title">${escapeHtml(product.title)}</h3>
            <div class="rating">${renderStars(product.rating?.rate, product.rating?.count)}</div>
            <div class="price">${formatPrice(product.price)}</div>
            <div class="actions-row">
              <a class="btn btn-ghost" href="product.html?id=${product.id}">Подробнее</a>
              <button class="btn btn-primary" type="button" data-action="add" data-product-id="${product.id}">В корзину</button>
            </div>
            <button class="btn btn-danger" type="button" data-action="remove" data-product-id="${product.id}">Удалить из избранного</button>
          </div>
        </article>
      `,
    )
    .join("");
}

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("wishlist-items");
  if (!root) return;

  renderWishlist();

  root.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const productId = Number(button.dataset.productId);
    const action = button.dataset.action;

    if (action === "add") {
      addToCart(productId, 1);
      showToast("Товар добавлен в корзину", "success");
      return;
    }

    if (action === "remove") {
      toggleWishlist(productId);
      showToast("Удалено из избранного", "success");
      renderWishlist();
    }
  });
});
