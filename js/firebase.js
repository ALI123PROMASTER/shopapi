const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
};

let db = null;

try {
  if (window.firebase && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
  }
} catch (error) {
  db = null;
}

function getWishlistLocal(email) {
  return JSON.parse(
    localStorage.getItem(
      `wishlist_${String(email || "guest").toLowerCase()}`,
    ) || "[]",
  );
}

function saveWishlistLocal(email, ids) {
  localStorage.setItem(
    `wishlist_${String(email || "guest").toLowerCase()}`,
    JSON.stringify(ids),
  );
}

function getOrdersLocal(email) {
  return JSON.parse(
    localStorage.getItem(`orders_${String(email || "guest").toLowerCase()}`) ||
      "[]",
  );
}

function saveOrdersLocal(email, orders) {
  localStorage.setItem(
    `orders_${String(email || "guest").toLowerCase()}`,
    JSON.stringify(orders),
  );
}

async function fbGetWishlist(email) {
  if (!db) return getWishlistLocal(email);
  try {
    const snap = await db
      .collection("wishlists")
      .doc(String(email))
      .collection("items")
      .get();
    return snap.docs.map((doc) => doc.data());
  } catch (error) {
    return getWishlistLocal(email);
  }
}

async function fbAddToWishlist(email, product) {
  if (!db) {
    const current = getWishlistLocal(email);
    if (!current.some((item) => Number(item.id) === Number(product.id))) {
      current.push({
        id: Number(product.id),
        title: product.title,
        price: product.price,
        image: product.image,
        category: product.category,
        rating: product.rating,
      });
    }
    saveWishlistLocal(email, current);
    return;
  }
  try {
    await db
      .collection("wishlists")
      .doc(String(email))
      .collection("items")
      .doc(String(product.id))
      .set({
        id: Number(product.id),
        title: product.title,
        price: product.price,
        image: product.image,
        category: product.category,
        rating: product.rating,
      });
  } catch (error) {
    await fbAddToWishlist(email, product);
  }
}

async function fbRemoveFromWishlist(email, productId) {
  if (!db) {
    const current = getWishlistLocal(email).filter(
      (item) => Number(item.id) !== Number(productId),
    );
    saveWishlistLocal(email, current);
    return;
  }
  try {
    await db
      .collection("wishlists")
      .doc(String(email))
      .collection("items")
      .doc(String(productId))
      .delete();
  } catch (error) {
    const current = getWishlistLocal(email).filter(
      (item) => Number(item.id) !== Number(productId),
    );
    saveWishlistLocal(email, current);
  }
}

async function fbSaveOrder(email, orderData) {
  const order = {
    id: `order_${Date.now()}`,
    date: new Date().toISOString(),
    ...orderData,
  };

  if (!db) {
    const current = getOrdersLocal(email);
    current.unshift(order);
    saveOrdersLocal(email, current);
    return order;
  }

  try {
    await db
      .collection("orders")
      .doc(String(email))
      .collection("list")
      .doc(order.id)
      .set(order);
    return order;
  } catch (error) {
    const current = getOrdersLocal(email);
    current.unshift(order);
    saveOrdersLocal(email, current);
    return order;
  }
}

async function fbGetOrders(email) {
  if (!db) return getOrdersLocal(email);
  try {
    const snap = await db
      .collection("orders")
      .doc(String(email))
      .collection("list")
      .orderBy("date", "desc")
      .get();
    return snap.docs.map((doc) => doc.data());
  } catch (error) {
    return getOrdersLocal(email);
  }
}

window.db = db;
window.fbGetWishlist = fbGetWishlist;
window.fbAddToWishlist = fbAddToWishlist;
window.fbRemoveFromWishlist = fbRemoveFromWishlist;
window.fbSaveOrder = fbSaveOrder;
window.fbGetOrders = fbGetOrders;
