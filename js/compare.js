function compareRow(label, renderCell) {
  const ids = getCompareList();
  return `
    <tr>
      <th>${label}</th>
      ${ids.map((id) => `<td>${renderCell(id)}</td>`).join("")}
    </tr>
  `;
}

async function renderComparePage() {
  const root = document.getElementById("compare-content");
  if (!root) return;

  const ids = getCompareList();
  if (ids.length < 2) {
    root.innerHTML = `
      <div class="placeholder">
        <h3>Недостаточно товаров для сравнения</h3>
        <p>Добавьте минимум 2 товара в сравнение на главной странице.</p>
        <a class="btn btn-primary" href="index.html">В каталог</a>
      </div>
    `;
    return;
  }

  const products = (
    await Promise.all(ids.map((id) => getProductById(id)))
  ).filter(Boolean);
  const byId = Object.fromEntries(
    products.map((product) => [product.id, product]),
  );

  root.innerHTML = `
    <div class="actions-row" style="margin-bottom:0.8rem;">
      <button id="clear-compare" class="btn btn-danger" type="button">Очистить сравнение</button>
    </div>
    <div class="compare-table-wrap">
      <table class="compare-table">
        <tbody>
          ${compareRow("Товар", (id) => {
            const product = byId[id];
            if (!product) return "-";
            return `<a href="product.html?id=${product.id}">${escapeHtml(product.title)}</a>`;
          })}
          ${compareRow("Фото", (id) => {
            const product = byId[id];
            if (!product) return "-";
            return `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}">`;
          })}
          ${compareRow("Категория", (id) => escapeHtml(byId[id]?.category || "-"))}
          ${compareRow("Цена", (id) => formatPrice(byId[id]?.price || 0))}
          ${compareRow("Рейтинг", (id) => {
            const p = byId[id];
            return p ? renderStars(p.rating?.rate, p.rating?.count) : "-";
          })}
          ${compareRow("Описание", (id) => escapeHtml(byId[id]?.description || "-"))}
          ${compareRow("Действия", (id) => {
            const p = byId[id];
            if (!p) return "-";
            return `
              <div class="actions-row">
                <button class="btn btn-primary" type="button" data-action="add" data-product-id="${p.id}">В корзину</button>
                <button class="btn btn-ghost" type="button" data-action="remove" data-product-id="${p.id}">Убрать</button>
              </div>
            `;
          })}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById("clear-compare")?.addEventListener("click", () => {
    saveCompareList([]);
    showToast("Сравнение очищено", "success");
    renderComparePage();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderComparePage();

  document
    .getElementById("compare-content")
    ?.addEventListener("click", (event) => {
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
        const ids = getCompareList().filter((id) => Number(id) !== productId);
        saveCompareList(ids);
        showToast("Товар удален из сравнения", "success");
        renderComparePage();
      }
    });
});
