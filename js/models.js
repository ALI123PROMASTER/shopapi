class User {
  constructor(name, email, password) {
    this.name = String(name || "").trim();
    this.email = String(email || "")
      .trim()
      .toLowerCase();
    this.password = String(password || "");
  }

  getInitial() {
    const source = this.name || this.email || "?";
    return source.charAt(0).toUpperCase();
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

  getStars() {
    const safeRate = Number(this.rating?.rate || 0);
    const filled = Math.max(0, Math.min(5, Math.round(safeRate)));
    return "★".repeat(filled) + "☆".repeat(5 - filled);
  }
}

class CartItem {
  constructor(productId, quantity = 1) {
    this.productId = Number(productId);
    this.quantity = Math.max(1, Number(quantity || 1));
  }
}

class Cart {
  constructor(uid = "guest") {
    this.storageKey = `cart_${uid}`;
    this.items = JSON.parse(localStorage.getItem(this.storageKey) || "[]").map(
      (item) => new CartItem(item.productId, item.quantity),
    );
  }

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.items));
  }

  addItem(productId, quantity = 1) {
    const normalizedId = Number(productId);
    const qty = Math.max(1, Number(quantity || 1));
    const existing = this.items.find((item) => item.productId === normalizedId);
    if (existing) {
      existing.quantity += qty;
    } else {
      this.items.push(new CartItem(normalizedId, qty));
    }
    this.save();
  }

  removeItem(productId) {
    const normalizedId = Number(productId);
    this.items = this.items.filter((item) => item.productId !== normalizedId);
    this.save();
  }

  updateQty(productId, qty) {
    const normalizedId = Number(productId);
    const quantity = Math.max(1, Number(qty || 1));
    const item = this.items.find((entry) => entry.productId === normalizedId);
    if (item) {
      item.quantity = quantity;
      this.save();
    }
  }

  setQuantity(productId, qty) {
    this.updateQty(productId, qty);
  }

  clear() {
    this.items = [];
    this.save();
  }

  getCount() {
    return this.items.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0,
    );
  }

  getItemCount() {
    return this.getCount();
  }

  getTotal(prices = {}) {
    return this.items.reduce((sum, item) => {
      return (
        sum + Number(prices[item.productId] || 0) * Number(item.quantity || 0)
      );
    }, 0);
  }
}

window.User = User;
window.Product = Product;
window.CartItem = CartItem;
window.Cart = Cart;
