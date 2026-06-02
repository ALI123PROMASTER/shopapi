class User {
  constructor(name, email, password) {
    this.name = String(name || "").trim();
    this.email = String(email || "")
      .trim()
      .toLowerCase();
    this.password = String(password || "");
  }
}

class Product {
  constructor({ id, title, price, description, image, category, rating }) {
    this.id = Number(id);
    this.title = String(title || "");
    this.price = Number(price || 0);
    this.description = String(description || "");
    this.image = String(image || "");
    this.category = String(category || "");
    this.rating = rating || { rate: 0, count: 0 };
  }
}

class CartItem {
  constructor(productId, quantity = 1) {
    this.productId = Number(productId);
    this.quantity = Math.max(1, Number(quantity || 1));
  }
}

class Cart {
  constructor(items = []) {
    this.items = items.map((item) =>
      item instanceof CartItem
        ? item
        : new CartItem(item.productId, item.quantity),
    );
  }

  addItem(productId, quantity = 1) {
    const normalizedId = Number(productId);
    const qty = Math.max(1, Number(quantity || 1));
    const existing = this.items.find((item) => item.productId === normalizedId);
    if (existing) {
      existing.quantity += qty;
      return;
    }
    this.items.push(new CartItem(normalizedId, qty));
  }

  setQuantity(productId, quantity) {
    const normalizedId = Number(productId);
    const qty = Number(quantity || 0);
    if (qty <= 0) {
      this.removeItem(normalizedId);
      return;
    }
    const existing = this.items.find((item) => item.productId === normalizedId);
    if (existing) {
      existing.quantity = qty;
    }
  }

  removeItem(productId) {
    const normalizedId = Number(productId);
    this.items = this.items.filter((item) => item.productId !== normalizedId);
  }

  getItemCount() {
    return this.items.reduce((acc, item) => acc + item.quantity, 0);
  }

  getTotal(productsById = {}) {
    return this.items.reduce((total, item) => {
      const product = productsById[item.productId];
      if (!product) return total;
      return total + Number(product.price || 0) * item.quantity;
    }, 0);
  }
}

window.User = User;
window.Product = Product;
window.CartItem = CartItem;
window.Cart = Cart;
