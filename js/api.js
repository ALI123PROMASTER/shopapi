const API_URL = "https://fakestoreapi.com";

let productsCache = null;
const productCacheById = {};

async function getProducts() {
  if (productsCache) {
    return productsCache;
  }

  const res = await fetch(`${API_URL}/products`);
  if (!res.ok) {
    throw new Error("Не удалось загрузить товары");
  }

  const data = await res.json();
  productsCache = data.map((item) => new Product(item));

  productsCache.forEach((product) => {
    productCacheById[product.id] = product;
  });

  return productsCache;
}

async function getProductById(id) {
  const productId = Number(id);
  if (!Number.isFinite(productId) || productId <= 0) {
    return null;
  }

  if (productCacheById[productId]) {
    return productCacheById[productId];
  }

  const res = await fetch(`${API_URL}/products/${id}`);
  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  if (!data || !data.id) {
    return null;
  }

  const product = new Product(data);
  productCacheById[product.id] = product;
  return product;
}

async function getCategories() {
  const products = await getProducts();
  return [...new Set(products.map((p) => p.category))];
}
