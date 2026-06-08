document.addEventListener("DOMContentLoaded", async () => {
  // If an orderId is present in the query string, fetch and display that order instead of the cart flow
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('orderId');
  if (orderId) {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) throw new Error('Order not found');
      const { order, items } = await res.json();
      // Populate order summary
      const orderItemsRoot = document.getElementById("order-items-summary");
      const orderTotalRoot = document.getElementById("order-total");
      const total = items.reduce((sum, it) => sum + Number(it.price) * it.quantity, 0);
      orderItemsRoot.innerHTML = items.map(it => `
        <div class="summary-row">
          <span>${escapeHtml(it.product_id)} × ${it.quantity}</span>
          <span>$${(Number(it.price) * it.quantity).toFixed(2)}</span>
        </div>`).join("");
      orderTotalRoot.textContent = `$${total.toFixed(2)}`;
      // Disable form inputs – order already placed
      document.getElementById("order-name").value = order.name || '';
      document.getElementById("order-phone").value = order.phone || '';
      document.getElementById("order-address").value = order.address || '';
      document.querySelectorAll("#order-name, #order-phone, #order-address").forEach(el => el.setAttribute('disabled', 'true'));
      document.getElementById("btn-order").style.display = 'none';
      return; // stop further cart logic
    } catch (e) {
      console.error(e);
      // fallback to cart view if fetching fails
    }
  }
  // ----- Existing cart‑based order flow follows -----
  applyTheme();

  const cart = await getCartInstance();
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

    if (user && user.id) {
      const currentCart = await getCartInstance();
      for (const item of currentCart.items) {
        await removeFromCart(item.productId);
      }
    } else {
      cart.clear();
    }
    
    await updateCartCount();
    showToast("Заказ оформлен! 🎉", "success");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);
  });
});
