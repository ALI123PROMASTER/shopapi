function createSkeletonCard() {
  return `
    <article class="card skeleton">
      <div class="card-media box"></div>
      <div class="card-body">
        <div class="line"></div>
        <div class="line short"></div>
        <div class="line short"></div>
      </div>
    </article>
  `;
}

function renderCategoryFilters(categories, active) {
  const container = document.getElementById("category-filters");
  if (!container) return;

  const all = ["all", ...categories];
  container.innerHTML = all
    .map((category) => {
      const title = category === "all" ? "Все" : category;
      const isActive = category === active ? "is-active" : "";
      return `<button class="pill ${isActive}" type="button" data-category="${escapeHtml(category)}">${escapeHtml(title)}</button>`;
    })
    .join("");
}

function sortProducts(products, mode) {
  const sorted = [...products];
  switch (mode) {
    case "price-asc":
      sorted.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      sorted.sort((a, b) => b.price - a.price);
      break;
    case "title-asc":
      sorted.sort((a, b) => a.title.localeCompare(b.title, "ru"));
      break;
    case "rating-desc":
      sorted.sort(
        (a, b) => Number(b.rating?.rate || 0) - Number(a.rating?.rate || 0),
      );
      break;
    default:
      break;
  }
  return sorted;
}

function renderCompareShortcut() {
  const holder = document.getElementById("compare-shortcut");
  if (!holder) return;
  const count = getCompareList().length;
  holder.innerHTML = `<a class="btn btn-ghost" href="compare.html">Сравнение: ${count} / 3</a>`;
}

function createProductCard(product) {
  const wished = isInWishlist(product.id);
  const compared = isInCompare(product.id);

  return `
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
          <button class="btn btn-primary add-to-cart-btn" type="button" data-product-id="${product.id}">В корзину</button>
        </div>
        <div class="card-actions">
          <button class="icon-btn wishlist-btn ${wished ? "is-active" : ""}" type="button" data-product-id="${product.id}" title="Избранное">❤</button>
          <button class="icon-btn compare-btn ${compared ? "is-active" : ""}" type="button" data-product-id="${product.id}" title="Сравнить">⇄</button>
        </div>
      </div>
    </article>
  `;
}

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("catalog");
  if (!container) return;

  const searchInput = document.getElementById("search-input");
  const sortSelect = document.getElementById("sort-select");
  const categoryBox = document.getElementById("category-filters");

  const state = {
    products: [],
    category: "all",
    query: "",
    sort: "default",
  };

  container.innerHTML = new Array(8).fill("").map(createSkeletonCard).join("");

  try {
    state.products = await getProducts();
    const categories = await getCategories();
    renderCategoryFilters(categories, state.category);
    renderCompareShortcut();
  } catch (error) {
    container.innerHTML = `<div class="placeholder">Ошибка загрузки каталога. Попробуйте обновить страницу.</div>`;
    return;
  }

  function applyState() {
    const byCategory =
      state.category === "all"
        ? state.products
        : state.products.filter((item) => item.category === state.category);

    const byQuery = byCategory.filter((item) =>
      item.title.toLowerCase().includes(state.query.toLowerCase()),
    );

    const list = sortProducts(byQuery, state.sort);

    if (!list.length) {
      container.innerHTML = `<div class="placeholder">Ничего не найдено. Измените фильтры или поисковый запрос.</div>`;
      renderCompareShortcut();
      return;
    }

    container.innerHTML = list.map(createProductCard).join("");
    renderCompareShortcut();
  }

  applyState();

  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      state.query = event.target.value.trim();
      applyState();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", (event) => {
      state.sort = event.target.value;
      applyState();
    });
  }

  if (categoryBox) {
    categoryBox.addEventListener("click", (event) => {
      const target = event.target.closest("[data-category]");
      if (!target) return;
      state.category = target.dataset.category;
      categoryBox
        .querySelectorAll(".pill")
        .forEach((pill) => pill.classList.remove("is-active"));
      target.classList.add("is-active");
      applyState();
    });
  }

  container.addEventListener("click", (event) => {
    const addButton = event.target.closest(".add-to-cart-btn");
    if (addButton) {
      const productId = Number(addButton.dataset.productId);
      addToCart(productId, 1);
      showToast("Товар добавлен в корзину", "success");
      return;
    }

    const wishButton = event.target.closest(".wishlist-btn");
    if (wishButton) {
      const productId = Number(wishButton.dataset.productId);
      const active = toggleWishlist(productId);
      wishButton.classList.toggle("is-active", active);
      showToast(
        active ? "Добавлено в избранное" : "Удалено из избранного",
        "success",
      );
      return;
    }

    const compareButton = event.target.closest(".compare-btn");
    if (compareButton) {
      const productId = Number(compareButton.dataset.productId);
      const result = toggleCompare(productId);
      if (result.limitReached) {
        showToast("Можно сравнивать максимум 3 товара", "error");
        return;
      }
      compareButton.classList.toggle("is-active", result.active);
      renderCompareShortcut();
      showToast(
        result.active
          ? "Товар добавлен в сравнение"
          : "Товар убран из сравнения",
        "success",
      );
    }
  });
});
