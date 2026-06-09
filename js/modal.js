// modal.js – reusable Buy Now modal
// This script creates a hidden modal in the DOM and provides functions to open/close it.

function createBuyNowModal() {
  if (document.getElementById('buy-now-modal')) return; // already created

  const modalHtml = `
    <div id="buy-now-modal" class="modal hidden">
      <div class="modal-content">
        <h2>Оформить покупку</h2>
        <p id="modal-product-title" class="modal-title"></p>
        <p>Цена: <span id="modal-product-price"></span></p>
        <input id="modal-name" class="form-input" placeholder="Имя" required />
        <input id="modal-phone" class="form-input" placeholder="Телефон" required />
        <textarea id="modal-address" class="form-input" placeholder="Адрес доставки" required></textarea>
        <div class="modal-actions" style="margin-top:1rem; display:flex; gap:0.5rem;">
          <button id="modal-confirm" type="button" class="btn btn-primary">Подтвердить покупку</button>
          <button id="modal-cancel" type="button" class="btn btn-outline">Отмена</button>
        </div>
      </div>
    </div>
  `;
  const container = document.createElement('div');
  container.innerHTML = modalHtml;
  document.body.appendChild(container);

  // Close on overlay click
  document.getElementById('buy-now-modal').addEventListener('click', (e) => {
    if (e.target.id === 'buy-now-modal') hideBuyNowModal();
  });

  document.getElementById('modal-cancel').addEventListener('click', hideBuyNowModal);
}

function showBuyNowModal(product) {
  createBuyNowModal();
  const modal = document.getElementById('buy-now-modal');
  document.getElementById('modal-product-title').textContent = product.title;
  document.getElementById('modal-product-price').textContent = `$${Number(product.price).toFixed(2)}`;
  // Store product info for later use
  modal.dataset.productId = product.id;
  modal.dataset.productPrice = product.price;
  modal.classList.remove('hidden');
}

function hideBuyNowModal() {
  const modal = document.getElementById('buy-now-modal');
  if (modal) modal.classList.add('hidden');
}

// Hook up confirm button – sends order to backend
async function confirmBuyNow() {
  const modal = document.getElementById('buy-now-modal');
  const productId = Number(modal.dataset.productId);
  const price = Number(modal.dataset.productPrice);
  const name = document.getElementById('modal-name').value.trim();
  const phone = document.getElementById('modal-phone').value.trim();
  const address = document.getElementById('modal-address').value.trim();
  if (!name || !phone || !address) {
    showToast('Заполните все поля', 'error');
    return;
  }
  // Build payload – single item order
  const payload = {
    total: price,
    items: [{ product_id: productId, quantity: 1, price }],
    // optional user data – backend can associate via session if logged in
    // we just send name/phone/address inside a custom field for now
    customer: { name, phone, address }
  };
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Ошибка при создании заказа');
    const data = await res.json();
    hideBuyNowModal();
    showToast('Заказ оформлен! 🎉', 'success');
    // Redirect to order page with orderId for confirmation
    if (data && data.orderId) {
      window.location.href = `/pages/order.html?orderId=${data.orderId}`;
    } else {
      window.location.href = '/pages/order.html';
    }
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Не удалось оформить заказ', 'error');
  }
}

// Attach confirm handler once
if (document.getElementById('modal-confirm')) {
  document.getElementById('modal-confirm').addEventListener('click', confirmBuyNow);
} else {
  // In case modal not yet in DOM, defer attachment until it's created
  document.addEventListener('click', (e) => {
    if (e.target.id === 'modal-confirm') {
      e.stopPropagation();
      confirmBuyNow();
    }
  });
}

// Export functions for external use (catalog.js will call showBuyNowModal)
// expose globally for non‑module usage
window.showBuyNowModal = showBuyNowModal;
window.hideBuyNowModal = hideBuyNowModal;
