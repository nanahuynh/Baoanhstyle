// Cart page

const $ = id => document.getElementById(id);

function lineItemHtml(item, index) {
  const p = findProduct(item.id);
  const line = typeof p.price === 'number' ? money(p.price * item.qty) : priceText(p);
  return `
    <li class="line-item">
      <a href="product.html?id=${p.id}" class="line-img" style="background:${p.bg}">
        <img src="${imageFor(p, item.color)}" alt="${p[state.lang]}">
      </a>
      <div class="line-info">
        <a class="line-name" href="product.html?id=${p.id}">${p[state.lang]}</a>
        <div class="line-meta">${t('color')}: ${colorName(item.color)} · Size: ${item.size}</div>
        <div class="line-actions">
          <div class="qty qty-sm">
            <button data-act="dec" data-i="${index}" aria-label="${t('dec')}">−</button>
            <output>${item.qty}</output>
            <button data-act="inc" data-i="${index}" aria-label="${t('inc')}">+</button>
          </div>
          <button class="link-btn" data-act="remove" data-i="${index}">${t('remove')}</button>
        </div>
      </div>
      <div class="line-price price${p.sale ? ' sale' : ''}">${line}</div>
    </li>`;
}

function renderCart() {
  const empty = state.cart.length === 0;
  $('cart-empty').hidden = !empty;
  $('cart-full').hidden = empty;
  $('cart-count').textContent = empty ? '' : `(${cartCount()})`;
  if (empty) return;
  $('line-items').innerHTML = state.cart.map(lineItemHtml).join('');
  $('sum-subtotal').textContent = money(cartSubtotal(), '[Tạm tính]');
}

$('line-items').addEventListener('click', e => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const i = +btn.dataset.i;
  if (btn.dataset.act === 'inc') state.cart[i].qty += 1;
  if (btn.dataset.act === 'dec') state.cart[i].qty = Math.max(1, state.cart[i].qty - 1);
  if (btn.dataset.act === 'remove') state.cart.splice(i, 1);
  saveCart();
  renderCart();
});

document.addEventListener('langchange', renderCart);
renderCart();
