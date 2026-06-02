async function renderCart() {
  const cartRoot = document.getElementById("cart-items");
  const totalRoot = document.getElementById("cart-total");
  const summary = document.getElementById("cart-summary");
  if (!cartRoot || !totalRoot || !summary) return;

  const items = getCartItems();
  if (!items.length) {
    cartRoot.innerHTML = `
			<div class="placeholder">
				<h3>Корзина пока пуста</h3>
				<p>Добавьте товары из каталога, чтобы продолжить покупки.</p>
				<a class="btn btn-primary" href="index.html">В каталог</a>
			</div>
		`;
    totalRoot.textContent = formatPrice(0);
    summary.style.display = "none";
    refreshHeaderAndTitle();
    return;
  }

  const detailed = await Promise.all(
    items.map(async (item) => {
      const product = await getProductById(item.productId);
      if (!product) return null;
      return {
        product,
        quantity: Number(item.quantity || 1),
      };
    }),
  );

  const validItems = detailed.filter(Boolean);
  if (!validItems.length) {
    saveCartItems([]);
    renderCart();
    return;
  }

  summary.style.display = "flex";
  cartRoot.innerHTML = validItems
    .map(
      ({ product, quantity }) => `
				<article class="cart-item" data-product-id="${product.id}">
					<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}">
					<div>
						<h3 class="card-title">${escapeHtml(product.title)}</h3>
						<p class="muted">${formatPrice(product.price)} за шт.</p>
						<div class="qty">
							<button type="button" data-action="decrease" data-product-id="${product.id}">−</button>
							<span>${quantity}</span>
							<button type="button" data-action="increase" data-product-id="${product.id}">+</button>
						</div>
					</div>
					<div>
						<p class="price">${formatPrice(product.price * quantity)}</p>
						<button type="button" class="btn btn-danger" data-action="remove" data-product-id="${product.id}">Удалить</button>
					</div>
				</article>
			`,
    )
    .join("");

  const total = validItems.reduce(
    (sum, row) =>
      sum + Number(row.product.price || 0) * Number(row.quantity || 1),
    0,
  );
  totalRoot.textContent = formatPrice(total);
  refreshHeaderAndTitle();
}

document.addEventListener("DOMContentLoaded", () => {
  const cartRoot = document.getElementById("cart-items");
  const checkoutBtn = document.getElementById("checkout-btn");
  if (!cartRoot) return;

  renderCart();

  cartRoot.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const productId = Number(button.dataset.productId);
    const items = getCartItems();
    const current = items.find((item) => Number(item.productId) === productId);
    if (!current) return;

    if (action === "increase") {
      setCartQuantity(productId, Number(current.quantity || 1) + 1);
      renderCart();
      return;
    }

    if (action === "decrease") {
      const next = Number(current.quantity || 1) - 1;
      setCartQuantity(productId, next);
      renderCart();
      return;
    }

    if (action === "remove") {
      const row = button.closest(".cart-item");
      if (!row) return;
      row.classList.add("is-removing");
      setTimeout(() => {
        removeFromCart(productId);
        renderCart();
      }, 260);
    }
  });

  checkoutBtn?.addEventListener("click", () => {
    if (!getCartItems().length) {
      showToast("Корзина пуста", "error");
      return;
    }
    showToast("Заказ оформлен", "success");
  });
});
