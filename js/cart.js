// BAG: products, size, qty, promo, shipping estimate, total

const $ = id => document.getElementById(id);

function lineItemHtml(item, index) {
  const p = findProduct(item.id);
  const line = typeof p.price === 'number' ? money(p.price * item.qty) : priceText(p);
  return `
    <li class="line-item">
      <a href="product.html?id=${p.id}" class="line-img" style="background:${p.bg}">
        <img src="${imageFor(p, item.color)}" alt="${escHtml(p[state.lang])}">
      </a>
      <div class="line-info">
        <a class="line-name" href="product.html?id=${p.id}">${escHtml(p[state.lang])}</a>
        <div class="line-meta">${t('color')}: ${escHtml(colorName(item.color))}</div>
        <label class="line-size">${t('size')}:
          <select data-act="size" data-i="${index}">
            ${p.sizes.map(s => `<option${s === item.size ? ' selected' : ''}>${s}</option>`).join('')}
          </select>
        </label>
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

function renderShipOptions(totals) {
  $('ship-options').innerHTML = SHIPPING_METHODS.map(m => {
    const fee = shippingFor(m.id, typeof totals.subtotal === 'number' ? totals.subtotal - (totals.discount || 0) : null);
    const feeText = fee === 0 ? t('free') : money(fee, tr('[Phí ship]', '[Fee]'));
    return `<label class="ship-opt">
      <input type="radio" name="ship" value="${m.id}"${m.id === state.ship ? ' checked' : ''}>
      <span class="ship-text"><span>${escHtml(m[state.lang])}</span><small>${escHtml(tr(m.etaVi, m.etaEn))}</small></span>
      <span class="ship-fee">${feeText}</span>
    </label>`;
  }).join('');
}

function renderCart() {
  const empty = state.cart.length === 0;
  $('cart-empty').hidden = !empty;
  $('cart-full').hidden = empty;
  $('cart-count').textContent = empty ? '' : `(${cartCount()})`;
  if (empty) return;
  $('line-items').innerHTML = state.cart.map(lineItemHtml).join('');

  const tt = cartTotals();
  renderShipOptions(tt);
  $('sum-subtotal').textContent = money(tt.subtotal, tr('[Tạm tính]', '[Subtotal]'));
  $('row-discount').hidden = !(tt.promo.ok);
  $('discount-code').textContent = tt.promo.ok ? `(${tt.promo.code})` : '';
  $('sum-discount').textContent = typeof tt.discount === 'number' ? '−' + money(tt.discount) : tr('[Giảm]', '[Discount]');
  $('sum-shipping').textContent = tt.shipping === 0 ? t('free') : money(tt.shipping, tr('[Phí ship]', '[Shipping]'));
  $('tax-label').textContent = taxLabel();
  $('sum-tax').textContent = money(tt.tax, tr('[Thuế]', '[Tax]'));
  $('sum-total').textContent = money(tt.total, tr('[Tổng tiền]', '[Total]'));

  const msg = $('promo-msg');
  if (state.promo) {
    msg.innerHTML = tt.promo.ok
      ? `${tr('Đã áp dụng mã', 'Applied')} <b>${escHtml(tt.promo.code)}</b> · <button type="button" class="link-btn small" id="promo-remove">${tr('Bỏ mã', 'Remove')}</button>`
      : escHtml(tt.promo.message || '');
    msg.classList.toggle('error', !tt.promo.ok);
  } else { msg.textContent = ''; }
}

$('line-items').addEventListener('click', e => {
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const i = +btn.dataset.i;
  if (btn.dataset.act === 'inc') state.cart[i].qty += 1;
  if (btn.dataset.act === 'dec') state.cart[i].qty = Math.max(1, state.cart[i].qty - 1);
  if (btn.dataset.act === 'remove') state.cart.splice(i, 1);
  saveCart();
  renderCart();
});
$('line-items').addEventListener('change', e => {
  const sel = e.target.closest('select[data-act=size]');
  if (!sel) return;
  const i = +sel.dataset.i;
  const item = state.cart[i];
  const dup = state.cart.findIndex((x, j) => j !== i && x.id === item.id && x.color === item.color && x.size === sel.value);
  if (dup >= 0) { state.cart[dup].qty += item.qty; state.cart.splice(i, 1); }
  else item.size = sel.value;
  saveCart();
  renderCart();
});
$('ship-options').addEventListener('change', e => {
  state.ship = e.target.value;
  store.set('ship', state.ship);
  renderCart();
});
$('promo-form').addEventListener('submit', e => {
  e.preventDefault();
  state.promo = $('promo-input').value.trim().toUpperCase();
  const check = checkPromo(state.promo, cartSubtotal());
  if (!check.ok) {
    $('promo-msg').textContent = check.message || '';
    $('promo-msg').classList.add('error');
    state.promo = '';
    store.set('promo', '');
    return;
  }
  store.set('promo', state.promo);
  $('promo-input').value = '';
  renderCart();
});
document.addEventListener('click', e => {
  if (e.target.id === 'promo-remove') { state.promo = ''; store.set('promo', ''); renderCart(); }
});

document.addEventListener('langchange', renderCart);
renderCart();
