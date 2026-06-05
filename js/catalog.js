function createSkeletonCard() {
  return `
    <div class="card skeleton skeleton-card"></div>
  `;
}

function renderCategoryFilters(categories, active) {
  const container = document.getElementById("category-filters");
  if (!container) return;

  const allCategories = ["all", ...categories];
  container.innerHTML = allCategories
    .map((category) => {
      const label = category === "all" ? "Все" : category;
      return `<button class="filter-pill ${category === active ? "active" : ""}" type="button" data-category="${escapeHtml(category)}">${escapeHtml(label)}</button>`;
    })
    .join("");
}

function sortProducts(products, mode) {
  const list = [...products];
  switch (mode) {
    case "price-asc":
      list.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      list.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      list.sort(
        (a, b) => Number(b.rating?.rate || 0) - Number(a.rating?.rate || 0),
      );
      break;
    case "name":
      list.sort((a, b) => a.title.localeCompare(b.title, "ru"));
      break;
    default:
      break;
  }
  return list;
}

function createProductCard(product, inWishlist) {
  return `
    <div class="card" data-product-id="${product.id}">
      <div class="card-img-wrap">
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}">
        <button class="wish-btn ${inWishlist ? "active" : ""}" data-id="${product.id}" type="button" aria-label="В избранное">
          <i class="ti ti-heart"></i>
        </button>
      </div>
      <div class="card-body">
        <div class="card-category">${escapeHtml(product.category)}</div>
        <div class="card-title">${escapeHtml(product.title)}</div>
        <div><span class="card-stars">${product.getStars()}</span><span class="card-reviews">(${product.rating?.count || 0})</span></div>
        <div class="card-footer">
          <div class="card-price">$${Number(product.price || 0).toFixed(2)}</div>
          <button class="btn-add" data-id="${product.id}" type="button" aria-label="Добавить в корзину">
            <i class="ti ti-plus"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", async () => {
  const catalogRoot = document.getElementById("catalog");
  if (!catalogRoot) return;

  applyTheme();

  const searchInput = document.getElementById("search-input");
  const sortSelect = document.getElementById("sort-select");
  const categoriesRoot = document.getElementById("category-filters");

  const state = {
    products: [],
    category: "all",
    query: "",
    sort: "",
    wishlistIds: [],
  };

  catalogRoot.innerHTML = new Array(8)
    .fill("")
    .map(createSkeletonCard)
    .join("");

  try {
    state.products = (await getProducts()).map((item) => new Product(item));
    const categories = await getCategories();
    const user = getCurrentUser();
    if (user) {
      const items = await getWishlist(user.email);
      state.wishlistIds = items.map((item) => Number(item.id));
    }
    renderCategoryFilters(categories, state.category);

    function applyState() {
      const filtered = state.products
        .filter(
          (item) =>
            state.category === "all" || item.category === state.category,
        )
        .filter((item) =>
          item.title.toLowerCase().includes(state.query.toLowerCase()),
        );

      const sorted = sortProducts(filtered, state.sort);
      if (!sorted.length) {
        catalogRoot.innerHTML = `<div class="placeholder">Ничего не найдено.</div>`;
        return;
      }

      catalogRoot.innerHTML = sorted
        .map((product) =>
          createProductCard(product, state.wishlistIds.includes(product.id)),
        )
        .join("");
    }

    applyState();

    searchInput?.addEventListener("input", (event) => {
      state.query = event.target.value.trim();
      applyState();
    });

    sortSelect?.addEventListener("change", (event) => {
      state.sort = event.target.value;
      applyState();
    });

    categoriesRoot?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-category]");
      if (!button) return;
      state.category = button.dataset.category;
      categoriesRoot
        .querySelectorAll(".filter-pill")
        .forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      applyState();
    });

    catalogRoot.addEventListener("click", async (event) => {
      const addButton = event.target.closest(".btn-add");
      const wishButton = event.target.closest(".wish-btn");
      const user = getCurrentUser();

      if (addButton) {
        const productId = Number(addButton.dataset.id);
        getCartInstance().addItem(productId);
        updateCartCount();
        showToast("Добавлено в корзину!", "success");
        return;
      }

      if (wishButton) {
        if (!user) {
          showToast("Войдите, чтобы добавить в избранное", "info");
          return;
        }

        const productId = Number(wishButton.dataset.id);
        const product = state.products.find((item) => item.id === productId);
        const active = state.wishlistIds.includes(productId);
        if (active) {
          await fbRemoveFromWishlist(user.email, productId);
          state.wishlistIds = state.wishlistIds.filter(
            (item) => item !== productId,
          );
          showToast("Удалено из избранного", "success");
        } else if (product) {
          await fbAddToWishlist(user.email, product);
          state.wishlistIds.push(productId);
          showToast("Добавлено в избранное", "success");
        }
        applyState();
      }
    });
  } catch (error) {
    catalogRoot.innerHTML = `<div class="placeholder">Ошибка загрузки каталога.</div>`;
  }
});
