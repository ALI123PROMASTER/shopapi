async function renderCart() {
  const cart = getCartInstance();
  const cartRoot = document.getElementById("cart-items");
  const emptyRoot = document.getElementById("cart-empty");
  const footer = document.getElementById("cart-footer");
  const totalRoot = document.getElementById("cart-total");
  const countRoot = document.getElementById("cart-count-text");
  if (!cartRoot || !emptyRoot || !footer || !totalRoot || !countRoot) return;

  if (!cart.items.length) {
    cartRoot.innerHTML = "";
    emptyRoot.style.display = "flex";
    footer.style.display = "none";
    totalRoot.textContent = "$0";
    countRoot.textContent = "0 шт.";
    updateCartCount();
    return;
  }

  const detailed = await Promise.all(
    cart.items.map(async (item) => {
      const product = await getProductById(item.productId);
      if (!product) return null;
      return { product: new Product(product), quantity: item.quantity };
    }),
  );

  const items = detailed.filter(Boolean);
  const prices = Object.fromEntries(
    items.map(({ product }) => [product.id, product.price]),
  );
  const total = cart.getTotal(prices);
  const count = cart.getCount();

  emptyRoot.style.display = "none";
  footer.style.display = "block";

  cartRoot.innerHTML = items
    .map(
      ({ product, quantity }) => `
        <article class="cart-row" data-product-id="${product.id}">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}">
          <div class="cart-row-info">
            <div class="cart-row-title">${escapeHtml(product.title)}</div>
            <div class="cart-row-price">$${Number(product.price || 0).toFixed(2)} за шт.</div>
          </div>
          <div class="qty-control">
            <button class="qty-btn" type="button" data-action="decrease" data-product-id="${product.id}">−</button>
            <input class="qty-input" type="number" min="1" value="${quantity}" data-action="qty" data-product-id="${product.id}">
            <button class="qty-btn" type="button" data-action="increase" data-product-id="${product.id}">+</button>
          </div>
          <div class="cart-row-subtotal">$${(Number(product.price || 0) * quantity).toFixed(2)}</div>
          <button class="btn-icon" type="button" data-action="remove" data-product-id="${product.id}" aria-label="Удалить">
            <i class="ti ti-trash"></i>
          </button>
        </article>
      `,
    )
    .join("");

  totalRoot.textContent = `$${total.toFixed(2)}`;
  countRoot.textContent = `${count} шт.`;
  updateCartCount();
}

document.addEventListener("DOMContentLoaded", () => {
  applyTheme();

  const cartRoot = document.getElementById("cart-items");
  const checkoutBtn = document.getElementById("btn-checkout");
  const clearBtn = document.getElementById("btn-clear");
  if (!cartRoot) return;

  renderCart();

  cartRoot.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const productId = Number(button.dataset.productId);
    const cart = getCartInstance();
    const current = cart.items.find((item) => item.productId === productId);
    if (!current) return;

    if (action === "increase") {
      cart.updateQty(productId, current.quantity + 1);
      await renderCart();
      return;
    }

    if (action === "decrease") {
      cart.updateQty(productId, current.quantity - 1);
      await renderCart();
      return;
    }

    if (action === "remove") {
      const row = button.closest(".cart-row");
      if (!row) return;
      row.classList.add("removing");
      setTimeout(async () => {
        cart.removeItem(productId);
        await renderCart();
      }, 300);
    }
  });

  cartRoot.addEventListener("change", async (event) => {
    const input = event.target.closest('input[data-action="qty"]');
    if (!input) return;
    const productId = Number(input.dataset.productId);
    const value = Number(input.value || 1);
    getCartInstance().updateQty(productId, value);
    await renderCart();
  });

  checkoutBtn?.addEventListener("click", () => {
    if (!getCartInstance().items.length) {
      showToast("Корзина пуста", "error");
      return;
    }
    window.location.href = "order.html";
  });

  clearBtn?.addEventListener("click", async () => {
    getCartInstance().clear();
    showToast("Корзина очищена", "success");
    await renderCart();
  });
});
