document.addEventListener("DOMContentLoaded", async () => {
  applyTheme();

  const user = getCurrentUser();
  if (!user) {
    window.location.href = "auth.html";
    return;
  }

  const profileRoot = document.getElementById("profile-info");
  const ordersRoot = document.getElementById("orders-list");
  const ordersEmpty = document.getElementById("orders-empty");

  profileRoot.innerHTML = `
    <div>${getAvatar(user.name || user.email)}</div>
    <div class="profile-card-info">
      <h3>${escapeHtml(user.name || "Пользователь")}</h3>
      <p>${escapeHtml(user.email)}</p>
    </div>
  `;

  const orders = await fbGetOrders(user.email);
  if (!orders.length) {
    ordersEmpty.style.display = "flex";
  } else {
    ordersEmpty.style.display = "none";
    ordersRoot.innerHTML = orders
      .map(
        (order) => `
          <div class="order-card">
            <div class="order-header">
              <span class="order-id">#${String(order.id || "").slice(-8)}</span>
              <span class="order-date">${new Date(order.date).toLocaleDateString("ru-RU")}</span>
              <span class="order-total">$${Number(order.total || 0).toFixed(2)}</span>
            </div>
            <div class="order-items">${(order.items || []).map((item) => `${escapeHtml(item.title)} × ${item.qty}`).join(", ")}</div>
          </div>
        `,
      )
      .join("");
  }

  document.getElementById("logout-btn")?.addEventListener("click", () => {
    logoutUser();
    refreshHeaderAndTitle();
    window.location.href = "index.html";
  });
});
