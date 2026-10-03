// CHECKOUT: Contact → Shipping address → Shipping method → Payment → Review order
import { demo, onUser, placeOrder, getProfile, saveProfile } from './data.js';

const $ = id => document.getElementById(id);
const STEPS = ['contact', 'address', 'method', 'payment', 'review'];
const co = {
  step: 'contact',
  done: new Set(),
  contact: { name: '', phone: '', email: '' },
  pickup: state.ship === 'pickup',
  address: null,          // { address, city, state, zip }
  savedId: '',            // chosen saved address id ('' = new address)
  method: state.ship,
  payment: 'zelle'
};
let user = null;
let profile = {};

const section = name => document.querySelector(`.step[data-step="${name}"]`);

// ---------- summary sidebar ----------
function renderSummary() {
  $('mini-items').innerHTML = state.cart.map(item => {
    const p = findProduct(item.id);
    return `
      <li class="mini-item">
        <span class="mini-img" style="background:${p.bg}"><img src="${imageFor(p, item.color)}" alt=""><span class="mini-qty">${item.qty}</span></span>
        <span class="mini-info"><span>${escHtml(p[state.lang])}</span><span class="muted">${escHtml(colorName(item.color))} · ${item.size}</span></span>
        <span class="mini-price">${typeof p.price === 'number' ? money(p.price * item.qty) : priceText(p)}</span>
      </li>`;
  }).join('');
  const tt = cartTotals(co.method);
  $('co-subtotal').textContent = money(tt.subtotal, tr('[Tạm tính]', '[Subtotal]'));
  $('co-row-discount').hidden = !tt.promo.ok;
  $('co-code').textContent = tt.promo.ok ? `(${tt.promo.code})` : '';
  $('co-discount').textContent = typeof tt.discount === 'number' ? '−' + money(tt.discount) : tr('[Giảm]', '[Discount]');
  $('co-shipping').textContent = tt.shipping === 0 ? t('free') : money(tt.shipping, tr('[Phí ship]', '[Shipping]'));
  $('co-tax-label').textContent = taxLabel();
  $('co-tax').textContent = money(tt.tax, tr('[Thuế]', '[Tax]'));
  $('co-total').textContent = money(tt.total, tr('[Tổng tiền]', '[Total]'));
  return tt;
}

// ---------- steps ----------
function payNote(method) {
  return method === 'zelle' ? tr(`Chuyển Zelle tới ${PAYMENT_INFO.zelle}, ghi mã đơn trong lời nhắn. Shop giao hàng sau khi nhận tiền.`, `Send Zelle to ${PAYMENT_INFO.zelle} with your order number in the memo. We ship once payment arrives.`)
    : method === 'venmo' ? tr(`Chuyển Venmo tới ${PAYMENT_INFO.venmo}, ghi mã đơn trong lời nhắn. Shop giao hàng sau khi nhận tiền.`, `Send Venmo to ${PAYMENT_INFO.venmo} with your order number in the note. We ship once payment arrives.`)
    : t('cashNote');
}
function addressLine(a) { return a ? `${a.address}, ${a.city}, ${a.state} ${a.zip}` : ''; }

function summaryHtml(name) {
  if (name === 'contact') return `${escHtml(co.contact.name)} · ${escHtml(co.contact.phone)}${co.contact.email ? ' · ' + escHtml(co.contact.email) : ''}`;
  if (name === 'address') return co.pickup ? tr('Nhận tại shop (Houston, TX)', 'Pick up in store (Houston, TX)') : escHtml(addressLine(co.address));
  if (name === 'method') { const m = shipMethod(co.method); return `${escHtml(m[state.lang])} · ${escHtml(tr(m.etaVi, m.etaEn))}`; }
  if (name === 'payment') return co.payment === 'cash' ? t('cash') : co.payment === 'zelle' ? 'Zelle' : 'Venmo';
  return '';
}

function renderMethods() {
  const tt = cartTotals(co.method);
  const after = typeof tt.subtotal === 'number' ? tt.subtotal - (tt.discount || 0) : null;
  const options = SHIPPING_METHODS.filter(m => co.pickup ? m.id === 'pickup' : m.id !== 'pickup');
  if (!options.some(m => m.id === co.method)) co.method = options[0].id;
  $('method-options').innerHTML = options.map(m => {
    const fee = shippingFor(m.id, after);
    return `<label class="choice ship-choice">
      <input type="radio" name="method" value="${m.id}"${m.id === co.method ? ' checked' : ''}>
      <span class="ship-text"><span>${escHtml(m[state.lang])}</span><small>${escHtml(tr(m.etaVi, m.etaEn))}</small></span>
      <span class="ship-fee">${fee === 0 ? t('free') : money(fee, tr('[Phí ship]', '[Fee]'))}</span>
    </label>`;
  }).join('');
}

function renderSavedAddresses() {
  const list = profile.addresses || [];
  $('save-address-wrap').hidden = !user;
  if (!list.length) { $('saved-addresses').innerHTML = ''; $('address-fields').hidden = false; return; }
  $('saved-addresses').innerHTML = `<div class="choices">${list.map(a => `
    <label class="choice"><input type="radio" name="saved" value="${escHtml(a.id)}"${co.savedId === a.id ? ' checked' : ''}>
      <span><b>${escHtml(a.label || a.name || '')}</b> ${escHtml(addressLine(a))}</span></label>`).join('')}
    <label class="choice"><input type="radio" name="saved" value=""${co.savedId === '' ? ' checked' : ''}><span>${tr('+ Địa chỉ mới', '+ New address')}</span></label>
  </div>`;
  $('address-fields').hidden = co.savedId !== '';
}

function renderReview() {
  const tt = renderSummary();
  $('review-items').innerHTML = `
    ${state.cart.map(item => {
      const p = findProduct(item.id);
      return `<li class="mini-item"><span class="mini-img" style="background:${p.bg}"><img src="${imageFor(p, item.color)}" alt=""><span class="mini-qty">${item.qty}</span></span>
        <span class="mini-info"><span>${escHtml(p[state.lang])}</span><span class="muted">${escHtml(colorName(item.color))} · ${item.size}</span></span>
        <span class="mini-price">${typeof p.price === 'number' ? money(p.price * item.qty) : priceText(p)}</span></li>`;
    }).join('')}
    <li class="review-total"><span>${t('total')}</span><b>${money(tt.total, tr('[Tổng tiền]', '[Total]'))}</b></li>`;
}

function render() {
  const empty = state.cart.length === 0;
  $('co-empty').hidden = !empty;
  $('co-main').hidden = empty;
  if (empty) return;
  STEPS.forEach((name, i) => {
    const el = section(name);
    const active = co.step === name;
    const done = co.done.has(name) && !active;
    el.classList.toggle('active', active);
    el.classList.toggle('is-done', done);
    el.classList.toggle('locked', !active && !done);
    el.querySelector('.step-body').hidden = !active;
    el.querySelector('.step-summary') && (el.querySelector('.step-summary').innerHTML = done ? summaryHtml(name) : '');
    el.querySelector('.step-n').innerHTML = done ? '✓' : String(i + 1);
    const edit = el.querySelector('.step-edit');
    if (edit) edit.hidden = !done;
  });
  $('login-fill').hidden = demo || !!user;
  $('f-pickup').checked = co.pickup;
  $('address-area').hidden = co.pickup;
  renderSavedAddresses();
  renderMethods();
  document.querySelector(`input[name=payment][value=${co.payment}]`).checked = true;
  $('pay-note').textContent = payNote(co.payment);
  renderSummary();
  if (co.step === 'review') renderReview();
}

function go(name) {
  co.step = name;
  render();
  const el = section(name);
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  el.querySelector('input:not([type=hidden]):not([type=radio]):not([type=checkbox]), button[type=submit]')?.focus({ preventScroll: true });
}
function next(name) {
  co.done.add(name);
  const after = STEPS[STEPS.indexOf(name) + 1];
  // skip steps that are already complete (e.g. editing contact after the fact)
  const target = STEPS.slice(STEPS.indexOf(after)).find(s => !co.done.has(s)) || 'review';
  go(target);
}

// ---------- validation ----------
function validate(form) {
  let ok = true;
  form.querySelectorAll('input').forEach(input => {
    if (input.closest('[hidden]')) return;
    const err = input.parentElement.querySelector('.err');
    if (!err) return;
    let msg = '';
    const v = input.value.trim();
    if (input.required && !v) msg = t('required');
    else if (input.type === 'tel' && v && v.replace(/\D/g, '').length < 10) msg = t('badPhone');
    else if (input.type === 'email' && v && !input.checkValidity()) msg = t('badEmail');
    else if (input.name === 'zip' && v && !/^\d{5}(-\d{4})?$/.test(v)) msg = tr('ZIP code gồm 5 số.', 'ZIP code is 5 digits.');
    err.textContent = msg;
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg && ok) { input.focus(); ok = false; }
  });
  return ok;
}

// ---------- step handlers ----------
section('contact').querySelector('form').addEventListener('submit', e => {
  e.preventDefault();
  if (!validate(e.target)) return;
  co.contact = { name: $('f-name').value.trim(), phone: $('f-phone').value.trim(), email: $('f-email').value.trim() };
  next('contact');
});

section('address').querySelector('form').addEventListener('submit', async e => {
  e.preventDefault();
  if (co.pickup) { co.address = null; co.method = 'pickup'; return next('address'); }
  if (co.savedId) {
    co.address = (profile.addresses || []).find(a => a.id === co.savedId) || null;
    return next('address');
  }
  if (!validate(e.target)) return;
  co.address = { address: $('f-address').value.trim(), city: $('f-city').value.trim(), state: $('f-state').value.trim().toUpperCase(), zip: $('f-zip').value.trim() };
  if (user && $('f-save-address').checked) {
    const addresses = profile.addresses || [];
    const exists = addresses.some(a => addressLine(a).toLowerCase() === addressLine(co.address).toLowerCase());
    if (!exists) {
      const entry = { id: 'a' + Date.now(), name: co.contact.name, phone: co.contact.phone, ...co.address, isDefault: !addresses.length };
      profile.addresses = [...addresses, entry];
      co.savedId = entry.id;
      saveProfile({ addresses: profile.addresses }).catch(() => {});
    }
  }
  if (co.method === 'pickup') co.method = SHIPPING_METHODS[0].id;
  next('address');
});
$('f-pickup').addEventListener('change', e => {
  co.pickup = e.target.checked;
  co.method = co.pickup ? 'pickup' : SHIPPING_METHODS[0].id;
  co.done.delete('method');
  render();
});
$('saved-addresses').addEventListener('change', e => { co.savedId = e.target.value; render(); });

section('method').querySelector('form').addEventListener('submit', e => {
  e.preventDefault();
  co.method = e.target.method.value;
  state.ship = co.method;
  store.set('ship', co.method);
  next('method');
});
$('method-options').addEventListener('change', e => { co.method = e.target.value; renderSummary(); });

section('payment').querySelector('form').addEventListener('submit', e => {
  e.preventDefault();
  co.payment = e.target.payment.value;
  next('payment');
});
section('payment').querySelector('form').addEventListener('change', e => {
  if (e.target.name === 'payment') { co.payment = e.target.value; $('pay-note').textContent = payNote(co.payment); }
});

document.addEventListener('click', e => {
  const edit = e.target.closest('[data-edit]');
  if (edit) go(edit.dataset.edit);
});

$('review-form').addEventListener('submit', async e => {
  e.preventDefault();
  $('co-msg').textContent = '';
  const tt = cartTotals(co.method);
  const order = {
    customer: co.contact,
    delivery: co.pickup ? 'pickup' : 'ship',
    shippingMethod: co.method,
    address: co.pickup ? null : co.address && { address: co.address.address, city: co.address.city, state: co.address.state, zip: co.address.zip },
    payment: co.payment,
    note: $('f-note').value.trim(),
    items: state.cart.map(i => {
      const p = findProduct(i.id);
      return { id: i.id, product: p.vi, color: i.color, colorName: COLOR_NAMES[i.color] ? COLOR_NAMES[i.color].vi : i.color, size: i.size, qty: i.qty, price: p.price };
    }),
    subtotal: tt.subtotal,
    promoCode: tt.promo.ok ? tt.promo.code : '',
    discount: tt.promo.ok ? tt.discount : 0,
    shipping: tt.shipping,
    taxRate: TAX_RATE,
    tax: tt.tax,
    total: tt.total
  };
  const btn = $('co-submit');
  btn.disabled = true;
  btn.textContent = t('sending');
  try {
    const { id, number } = await placeOrder(order);
    // keep contact for next time
    if (user) saveProfile({ name: profile.name || co.contact.name, phone: profile.phone || co.contact.phone }).catch(() => {});
    try { sessionStorage.setItem('baoanh.lastOrder', JSON.stringify({ ...order, id, number, createdAt: new Date().toISOString() })); } catch {}
    state.cart = [];
    saveCart();
    state.promo = '';
    store.set('promo', '');
    location.href = `order.html?no=${encodeURIComponent(number)}`;
  } catch {
    $('co-msg').textContent = t('sendFail');
    btn.disabled = false;
    btn.textContent = t('placeOrder');
  }
});

// ---------- prefill from account ----------
onUser(async u => {
  user = u;
  if (u) {
    try { profile = await getProfile(); } catch { profile = {}; }
    if (!$('f-name').value) $('f-name').value = profile.name || (u.demo ? '' : u.displayName) || '';
    if (!$('f-phone').value) $('f-phone').value = profile.phone || '';
    if (!$('f-email').value && !u.demo) $('f-email').value = u.email || '';
    const def = (profile.addresses || []).find(a => a.isDefault) || (profile.addresses || [])[0];
    if (def && !co.address) co.savedId = def.id;
  }
  render();
});

document.addEventListener('langchange', render);
render();
