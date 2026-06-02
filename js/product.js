function renderProduct404() {
  const details = document.getElementById("product-details");
  const breadcrumbs = document.getElementById("breadcrumbs");
  if (breadcrumbs) {
    breadcrumbs.innerHTML = `<a href="index.html">Главная</a> → Товар не найден`;
  }
  details.innerHTML = `
		<div class="placeholder">
			<h2>404: товар не найден</h2>
			<p>Проверьте ссылку или вернитесь в каталог.</p>
			<a class="btn btn-primary" href="index.html">В каталог</a>
		</div>
	`;
}

function renderProductView(product) {
  const details = document.getElementById("product-details");
  const breadcrumbs = document.getElementById("breadcrumbs");
  const inWishlist = isInWishlist(product.id);
  const inCompare = isInCompare(product.id);

  if (breadcrumbs) {
    breadcrumbs.innerHTML = `
			<a href="index.html">Главная</a>
			→
			<span>${escapeHtml(product.category)}</span>
			→
			<span>${escapeHtml(product.title)}</span>
		`;
  }

  details.innerHTML = `
		<article class="product-layout">
			<div class="product-image">
				<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}">
			</div>
			<div class="product-panel">
				<h2>${escapeHtml(product.title)}</h2>
				<div class="muted">Категория: ${escapeHtml(product.category)}</div>
				<div class="rating">${renderStars(product.rating?.rate, product.rating?.count)}</div>
				<p class="price">${formatPrice(product.price)}</p>
				<p>${escapeHtml(product.description)}</p>
				<div class="actions-row">
					<button id="add-product-to-cart" class="btn btn-primary" type="button">Добавить в корзину</button>
					<button id="toggle-product-wishlist" class="btn btn-ghost ${inWishlist ? "is-active" : ""}" type="button">${inWishlist ? "Убрать из избранного" : "В избранное"}</button>
					<button id="toggle-product-compare" class="btn btn-ghost ${inCompare ? "is-active" : ""}" type="button">${inCompare ? "Убрать из сравнения" : "Добавить в сравнение"}</button>
				</div>
				<div class="actions-row" style="margin-top: 0.6rem;">
					<a class="btn btn-ghost" href="index.html">В каталог</a>
					<a class="btn btn-ghost" href="cart.html">В корзину</a>
				</div>
			</div>
		</article>
	`;

  const addButton = document.getElementById("add-product-to-cart");
  const wishlistButton = document.getElementById("toggle-product-wishlist");
  const compareButton = document.getElementById("toggle-product-compare");

  addButton?.addEventListener("click", () => {
    addToCart(product.id, 1);
    showToast("Товар добавлен в корзину", "success");
  });

  wishlistButton?.addEventListener("click", () => {
    const active = toggleWishlist(product.id);
    wishlistButton.textContent = active
      ? "Убрать из избранного"
      : "В избранное";
    wishlistButton.classList.toggle("is-active", active);
    showToast(
      active ? "Добавлено в избранное" : "Удалено из избранного",
      "success",
    );
  });

  compareButton?.addEventListener("click", () => {
    const result = toggleCompare(product.id);
    if (result.limitReached) {
      showToast("Можно сравнивать максимум 3 товара", "error");
      return;
    }
    compareButton.textContent = result.active
      ? "Убрать из сравнения"
      : "Добавить в сравнение";
    compareButton.classList.toggle("is-active", result.active);
    showToast(
      result.active ? "Товар добавлен в сравнение" : "Товар убран из сравнения",
      "success",
    );
  });
}

async function renderRecentSection(currentProductId) {
  const root = document.getElementById("recently-viewed");
  if (!root) return;

  const ids = getRecentViewed()
    .filter((id) => id !== currentProductId)
    .slice(0, 4);
  if (!ids.length) {
    root.innerHTML = "";
    return;
  }

  const products = (
    await Promise.all(ids.map((id) => getProductById(id)))
  ).filter(Boolean);

  if (!products.length) {
    root.innerHTML = "";
    return;
  }

  root.innerHTML = `
		<h3>Вы смотрели недавно</h3>
		<div class="catalog">
			${products
        .map(
          (item) => `
						<article class="card">
							<div class="card-media">
								<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">
							</div>
							<div class="card-body">
								<h4 class="card-title">${escapeHtml(item.title)}</h4>
								<div class="price">${formatPrice(item.price)}</div>
								<a class="btn btn-ghost" href="product.html?id=${item.id}">Открыть</a>
							</div>
						</article>
					`,
        )
        .join("")}
		</div>
	`;
}

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const productId = Number(params.get("id"));

  if (!Number.isFinite(productId) || productId <= 0) {
    renderProduct404();
    return;
  }

  const product = await getProductById(productId);
  if (!product) {
    renderProduct404();
    return;
  }

  renderProductView(product);
  pushRecentViewed(product.id);
  await renderRecentSection(product.id);
});
