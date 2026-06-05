document.addEventListener("DOMContentLoaded", async () => {
  applyTheme();

  const cart = getCartInstance();
  if (!cart.items.length) {
    window.location.href = "cart.html";
    return;
  }

  const user = getCurrentUser();
  const orderItemsRoot = document.getElementById("order-items-summary");
  const orderTotalRoot = document.getElementById("order-total");
  const submitButton = document.getElementById("btn-order");

  const products = (
    await Promise.all(cart.items.map((item) => getProductById(item.productId)))
  )
    .filter(Boolean)
    .map((item) => new Product(item));
  const rows = cart.items.map((item) => {
    const product = products.find((entry) => entry.id === item.productId);
    return {
      id: item.productId,
      title: product?.title || "Товар",
      price: Number(product?.price || 0),
      qty: item.quantity,
    };
  });

  const total = rows.reduce((sum, item) => sum + item.price * item.qty, 0);

  orderItemsRoot.innerHTML = rows
    .map(
      (item) => `
        <div class="summary-row">
          <span>${escapeHtml(item.title)} × ${item.qty}</span>
          <span>$${(item.price * item.qty).toFixed(2)}</span>
        </div>
      `,
    )
    .join("");
  orderTotalRoot.textContent = `$${total.toFixed(2)}`;

  const nameInput = document.getElementById("order-name");
  const phoneInput = document.getElementById("order-phone");
  const addressInput = document.getElementById("order-address");

  function setError(id, message) {
    const error = document.getElementById(id);
    if (error) error.textContent = message || "";
  }

  function validate() {
    let valid = true;
    if (!nameInput.value.trim()) {
      setError("order-name-error", "Введите имя");
      valid = false;
    } else setError("order-name-error", "");

    if (!phoneInput.value.trim()) {
      setError("order-phone-error", "Введите телефон");
      valid = false;
    } else setError("order-phone-error", "");

    if (!addressInput.value.trim()) {
      setError("order-address-error", "Введите адрес");
      valid = false;
    } else setError("order-address-error", "");

    return valid;
  }

  submitButton.addEventListener("click", async () => {
    if (!validate()) return;

    const payment =
      document.querySelector('input[name="payment"]:checked')?.value || "card";
    const email = user ? user.email : "guest";

    await fbSaveOrder(email, {
      items: rows,
      total,
      name: nameInput.value.trim(),
      address: addressInput.value.trim(),
      phone: phoneInput.value.trim(),
      payment,
    });

    cart.clear();
    updateCartCount();
    showToast("Заказ оформлен! 🎉", "success");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);
  });
});
