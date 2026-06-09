async function compareRow(label, renderCell) {
  const ids = await getCompareList();
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

  const ids = await getCompareList();
  if (ids.length < 2) {
    root.innerHTML = `
      <div class="placeholder">
        <h3>Недостаточно товаров для сравнения</h3>
        <p>Добавьте минимум 2 товара в сравнение на главной странице.</p>
        <a class="btn btn-primary" href="/index.html">В каталог</a>
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

  // Генерируем строки таблицы
  const rowsHtml = [
    {
      label: "Товар",
      render: (id) =>
        byId[id]
          ? `<a href="product.html?id=${byId[id].id}">${escapeHtml(byId[id].title)}</a>`
          : "-",
    },
    {
      label: "Фото",
      render: (id) =>
        byId[id]
          ? `<img src="${escapeHtml(byId[id].image)}" alt="${escapeHtml(byId[id].title)}">`
          : "-",
    },
    {
      label: "Категория",
      render: (id) => escapeHtml(byId[id]?.category || "-"),
    },
    { label: "Цена", render: (id) => formatPrice(byId[id]?.price || 0) },
    {
      label: "Рейтинг",
      render: (id) =>
        byId[id]
          ? renderStars(byId[id].rating?.rate, byId[id].rating?.count)
          : "-",
    },
    {
      label: "Описание",
      render: (id) => escapeHtml(byId[id]?.description || "-"),
    },
    {
      label: "Действия",
      render: (id) =>
        byId[id]
          ? `
      <div class="actions-row">
        <button class="btn btn-primary" type="button" data-action="add" data-product-id="${byId[id].id}">В корзину</button>
        <button class="btn btn-ghost" type="button" data-action="remove" data-product-id="${byId[id].id}">Убрать</button>
      </div>
    `
          : "-",
    },
  ]
    .map(
      (row) => `
    <tr>
      <th>${row.label}</th>
      ${ids.map((id) => `<td>${row.render(id)}</td>`).join("")}
    </tr>
  `,
    )
    .join("");

  root.innerHTML = `
    <div class="actions-row" style="margin-bottom:0.8rem;">
      <button id="clear-compare" class="btn btn-danger" type="button">Очистить сравнение</button>
    </div>
    <div class="compare-table-wrap">
      <table class="compare-table">
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;

  document
    .getElementById("clear-compare")
    ?.addEventListener("click", async () => {
      const currentIds = await getCompareList();
      for (const id of currentIds) {
        await toggleCompare(id);
      }
      showToast("Сравнение очищено", "success");
      await renderComparePage();
    });
}

document.addEventListener("DOMContentLoaded", () => {
  renderComparePage();

  document
    .getElementById("compare-content")
    ?.addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;

      // The catalog uses `data-id` for product identifier, not `data-product-id`.
      // Adjust to read the correct attribute to obtain the product ID.
      // Buttons for adding to cart use `data-product-id`, while compare toggle uses `data-id`.
      const productId = Number(button.dataset.productId ?? button.dataset.id);
      const action = button.dataset.action;

      if (action === "add") {
        await addToCart(productId, 1);
        showToast("Товар добавлен в корзину", "success");
        return;
      }

      if (action === "remove") {
        await toggleCompare(productId);
        showToast("Товар удален из сравнения", "success");
        await renderComparePage();
      }
    });
});
