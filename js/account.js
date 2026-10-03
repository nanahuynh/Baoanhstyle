// MY ACCOUNT: sign in / sign up / forgot password, then Orders · Tracking · Wishlist · Addresses · Profile
// Delivered orders → Review / Return / Exchange
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile,
  sendPasswordResetEmail, signOut
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { auth, configured, authError } from './auth.js';
import {
  demo, onUser, myOrders, demoAdvance, getProfile, saveProfile, addReview, myReviewIds,
  requestReturn, myReturns, statusLabel, returnStatusLabel, toDate, trackingUrl, STATUS_STEPS
} from './data.js';

const $ = id => document.getElementById(id);
const next = new URLSearchParams(location.search).get('next');
const safeNext = next && /^[a-z]+\.html$/.test(next) ? next : null;

let user = null;
let profile = {};
let orders = [];
let returns = [];
let reviewed = new Set();
let tab = 'orders';
let openOrder = null;
let editingAddress = null;

// ======================================================================
// Sign in / sign up / forgot password (Firebase mode only)
// ======================================================================
const authViews = ['signin', 'signup', 'forgot'];
function showAuth(view) {
  $('auth-card').hidden = false;
  $('dash').hidden = true;
  authViews.forEach(v => { $('view-' + v).hidden = v !== view; });
  document.querySelectorAll('.form-error').forEach(e => { e.textContent = ''; });
  $('view-' + view).querySelector('input')?.focus();
}
function setBusy(form, busy) { const b = form.querySelector('[type=submit]'); b.disabled = busy; b.style.opacity = busy ? 0.6 : ''; }
function fail(form, msg) { form.querySelector('.form-error').textContent = msg; }
function requireFilled(form) {
  for (const input of form.querySelectorAll('input[required]')) {
    if (!input.value.trim()) { input.focus(); fail(form, t('required')); return false; }
    if (input.type === 'email' && !input.checkValidity()) { input.focus(); fail(form, t('badEmail')); return false; }
  }
  return true;
}

$('form-signin').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  fail(form, '');
  if (!requireFilled(form)) return;
  setBusy(form, true);
  try {
    await signInWithEmailAndPassword(auth, $('si-email').value.trim(), $('si-pw').value);
    if (safeNext) location.href = safeNext;
  } catch (err) { fail(form, authError(err)); }
  setBusy(form, false);
});
$('form-signup').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  fail(form, '');
  if (!requireFilled(form)) return;
  if ($('su-pw').value.length < 8) { $('su-pw').focus(); fail(form, t('pwShort')); return; }
  setBusy(form, true);
  try {
    const cred = await createUserWithEmailAndPassword(auth, $('su-email').value.trim(), $('su-pw').value);
    const name = $('su-name').value.trim();
    await updateProfile(cred.user, { displayName: name });
    await saveProfile({ name }).catch(() => {});
    if (safeNext) location.href = safeNext;
    else enterDash(cred.user);
  } catch (err) { fail(form, authError(err)); }
  setBusy(form, false);
});
$('form-forgot').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  fail(form, '');
  form.querySelector('.form-ok').hidden = true;
  if (!requireFilled(form)) return;
  setBusy(form, true);
  try {
    await sendPasswordResetEmail(auth, $('fg-email').value.trim());
    form.querySelector('.form-ok').hidden = false;
  } catch (err) {
    if (err.code === 'auth/user-not-found') form.querySelector('.form-ok').hidden = false;
    else fail(form, authError(err));
  }
  setBusy(form, false);
});

// ======================================================================
// Dashboard
// ======================================================================
async function enterDash(u) {
  user = u;
  $('auth-card').hidden = true;
  $('dash').hidden = false;
  $('demo-banner').hidden = !demo;
  $('btn-changepw').hidden = demo;
  $('btn-signout').hidden = demo;
  try { [profile, orders, returns, reviewed] = await Promise.all([getProfile(), myOrders(), myReturns(), myReviewIds()]); }
  catch { profile = profile || {}; }
  renderHead();
  routeFromHash();
}

function displayName() { return profile.name || (user && user.displayName) || (user && !user.demo ? user.email.split('@')[0] : tr('Khách demo', 'Demo customer')); }

function renderHead() {
  const name = displayName();
  $('acc-name').textContent = name;
  $('acc-email').textContent = user.demo ? '' : user.email;
  $('acc-avatar').textContent = name.trim().charAt(0).toUpperCase();
}

function setTab(name) {
  tab = name;
  document.querySelectorAll('.dash-tabs [data-tab]').forEach(a => a.toggleAttribute('aria-current', a.dataset.tab === name));
  document.querySelectorAll('.dash-panel').forEach(p => { p.hidden = p.id !== 'tab-' + name; });
  document.querySelector('.dash-tabs [aria-current]')?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  renderTab();
}
function routeFromHash() {
  const h = location.hash.replace('#', '');
  const [name, id] = h.split('/');
  if (['orders', 'tracking', 'wishlist', 'addresses', 'profile'].includes(name)) {
    openOrder = name === 'orders' && id ? id : null;
    setTab(name);
  } else setTab('orders');
}
window.addEventListener('hashchange', () => { if (!$('dash').hidden) routeFromHash(); });

function renderTab() {
  if (tab === 'orders') renderOrders();
  if (tab === 'tracking') renderTracking();
  if (tab === 'wishlist') renderWishlist();
  if (tab === 'addresses') renderAddresses();
  if (tab === 'profile') renderProfile();
}

// ---------- shared bits ----------
function fmtDate(v) {
  const d = toDate(v);
  return d ? d.toLocaleDateString(state.lang === 'vi' ? 'vi-VN' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
}
function orderTotalText(o) { return money(o.total, tr('[Tổng tiền]', '[Total]')); }
function thumbs(o) {
  return o.items.slice(0, 4).map(i => { const p = findProduct(i.id); return p ? `<img src="${imageFor(p, i.color)}" alt="">` : ''; }).join('');
}
function timeline(o) {
  if (o.status === 'cancelled') return `<p class="pill st-cancelled">${statusLabel('cancelled')}</p>`;
  const reached = STATUS_STEPS.indexOf(o.status);
  const labels = o.delivery === 'pickup'
    ? { shipping: tr('Sẵn sàng nhận', 'Ready for pickup'), done: tr('Đã nhận hàng', 'Picked up') } : {};
  return `<ol class="track">${STATUS_STEPS.map((s, i) => {
    const when = o.history && o.history[s] ? fmtDate(o.history[s]) : (s === 'new' ? fmtDate(o.createdAt) : '');
    return `<li class="${i <= reached ? 'on' : ''}${i === reached ? ' now' : ''}"><span class="dot"></span><b>${labels[s] || statusLabel(s)}</b>${when ? `<small>${when}</small>` : ''}</li>`;
  }).join('')}</ol>`;
}
function trackingLine(o) {
  if (!o.trackingNo) return '';
  const url = trackingUrl(o.carrier, o.trackingNo);
  return `<p class="tracking-no">${tr('Mã vận đơn', 'Tracking')}: ${escHtml(o.carrier || '')} <b>${escHtml(o.trackingNo)}</b>${url ? ` · <a href="${url}" target="_blank" rel="noopener">${tr('Xem hành trình →', 'Track package →')}</a>` : ''}</p>`;
}

// ---------- ORDERS ----------
function renderOrders() {
  if (openOrder) return renderOrderDetail(orders.find(o => o.id === openOrder));
  $('order-detail').hidden = true;
  $('orders-list').hidden = false;
  if (!orders.length) {
    $('orders-list').innerHTML = `<div class="empty"><p>${tr('Bạn chưa có đơn hàng nào.', 'You have no orders yet.')}</p><a class="btn btn-primary" href="shop.html">${tr('Bắt đầu mua sắm', 'Start shopping')}</a></div>`;
    return;
  }
  $('orders-list').innerHTML = `<ul class="order-list">${orders.map(o => `
    <li><a class="order-row" href="#orders/${encodeURIComponent(o.id)}">
      <span class="order-thumbs">${thumbs(o)}</span>
      <span class="order-main"><b>${escHtml(o.number)}</b><small>${fmtDate(o.createdAt)} · ${o.items.reduce((n, i) => n + i.qty, 0)} ${tr('món', 'items')}</small></span>
      <span class="pill st-${escHtml(o.status)}">${statusLabel(o.status)}</span>
      <span class="order-sum">${orderTotalText(o)}</span>
    </a></li>`).join('')}</ul>
    ${returns.length ? `<h2 class="panel-title returns-title">${tr('Yêu cầu đổi / trả', 'Returns & exchanges')}</h2>
      <ul class="return-list">${returns.map(r => `<li><b>${escHtml(r.orderNumber)}</b> · ${r.type === 'exchange' ? tr('Đổi hàng', 'Exchange') : tr('Trả hàng', 'Return')} · ${fmtDate(r.createdAt)}<span class="pill rs-${escHtml(r.status)}">${returnStatusLabel(r.status)}</span></li>`).join('')}</ul>` : ''}`;
}

function renderOrderDetail(o) {
  $('orders-list').hidden = true;
  const el = $('order-detail');
  el.hidden = false;
  if (!o) { el.innerHTML = `<a href="#orders" class="back-inline">← ${tr('Tất cả đơn hàng', 'All orders')}</a><p class="muted">${tr('Không tìm thấy đơn.', 'Order not found.')}</p>`; return; }
  const delivered = o.status === 'done';
  const m = shipMethod(o.shippingMethod || (o.delivery === 'pickup' ? 'pickup' : 'standard'));
  const myReturnsHere = returns.filter(r => r.orderId === o.id);
  el.innerHTML = `
    <a href="#orders" class="back-inline">← ${tr('Tất cả đơn hàng', 'All orders')}</a>
    <div class="order-detail-head">
      <h2 class="panel-title">${tr('Đơn', 'Order')} ${escHtml(o.number)}</h2>
      <span class="muted">${fmtDate(o.createdAt)}</span>
    </div>
    <div class="panel-box">${timeline(o)}${trackingLine(o)}
      ${demo && STATUS_STEPS.indexOf(o.status) >= 0 && o.status !== 'done' ? `<button type="button" class="link-btn small demo-advance" data-advance="${escHtml(o.id)}">${tr('Demo: chuyển sang bước tiếp theo', 'Demo: move to next step')} →</button>` : ''}
    </div>
    ${delivered ? `<div class="panel-box delivered-box">
      <b>${tr('Bạn đã nhận hàng. Hài lòng không?', 'Delivered. How did it go?')}</b>
      <p class="muted">${tr('Đánh giá từng món bên dưới, hoặc gửi yêu cầu đổi / trả.', 'Review each piece below, or request a return or exchange.')}</p>
      <button type="button" class="btn btn-outline btn-sm" data-return="${escHtml(o.id)}">${tr('Đổi / trả hàng', 'Return or exchange')}</button>
    </div>` : ''}
    <ul class="detail-items">${o.items.map(i => {
      const p = findProduct(i.id);
      const rid = `${o.id}_${i.id}`;
      return `<li>
        <a href="product.html?id=${escHtml(i.id)}" class="detail-img" style="background:${p ? p.bg : ''}"><img src="${p ? imageFor(p, i.color) : ''}" alt=""></a>
        <div class="detail-info">
          <a href="product.html?id=${escHtml(i.id)}" class="line-name">${escHtml(p ? p[state.lang] : i.product)}</a>
          <span class="muted">${escHtml(colorName(i.color))} · Size ${escHtml(i.size)} · ×${i.qty}</span>
          ${delivered ? (reviewed.has(rid)
            ? `<span class="reviewed">✓ ${tr('Đã đánh giá', 'Reviewed')}</span>`
            : `<button type="button" class="btn btn-outline btn-sm" data-review="${escHtml(o.id)}" data-pid="${escHtml(i.id)}" data-size="${escHtml(i.size)}">★ ${tr('Viết đánh giá', 'Write a review')}</button>`) : ''}
        </div>
        <span class="price">${typeof i.price === 'number' ? money(i.price * i.qty) : tr('[Giá]', '[Price]')}</span>
      </li>`;
    }).join('')}</ul>
    ${myReturnsHere.length ? `<div class="panel-box"><b>${tr('Yêu cầu đổi / trả của đơn này', 'Return requests for this order')}</b>
      <ul class="return-list">${myReturnsHere.map(r => `<li>${r.type === 'exchange' ? tr('Đổi hàng', 'Exchange') : tr('Trả hàng', 'Return')} · ${fmtDate(r.createdAt)} <span class="pill rs-${escHtml(r.status)}">${returnStatusLabel(r.status)}</span>${r.reply ? `<p class="muted">${tr('Shop', 'Shop')}: ${escHtml(r.reply)}</p>` : ''}</li>`).join('')}</ul></div>` : ''}
    <div class="detail-grid">
      <div class="panel-box"><b>${tr('Nhận hàng', 'Delivery')}</b><p>${escHtml(m[state.lang])}${o.address ? `<br>${escHtml(o.address.address)}, ${escHtml(o.address.city)}, ${escHtml(o.address.state)} ${escHtml(o.address.zip)}` : ''}</p></div>
      <div class="panel-box"><b>${tr('Thanh toán', 'Payment')}</b><p>${o.payment === 'cash' ? escHtml(t('cash')) : o.payment === 'zelle' ? 'Zelle' : 'Venmo'}</p></div>
      <div class="panel-box totals-box">
        <div class="summary-row"><span>${t('subtotal')}</span><span>${money(o.subtotal, '—')}</span></div>
        ${o.promoCode ? `<div class="summary-row"><span>${tr('Giảm giá', 'Discount')} (${escHtml(o.promoCode)})</span><span>−${money(o.discount, '—')}</span></div>` : ''}
        <div class="summary-row"><span>${t('shippingFee')}</span><span>${o.shipping === 0 ? t('free') : money(o.shipping, '—')}</span></div>
        ${o.taxRate != null ? `<div class="summary-row"><span>${tr('Thuế', 'Tax')} (${+(o.taxRate * 100).toFixed(3)}%)</span><span>${money(o.tax, '—')}</span></div>` : ''}
        <div class="summary-row total"><span>${t('total')}</span><span>${orderTotalText(o)}</span></div>
      </div>
    </div>`;
}

// ---------- TRACKING ----------
function renderTracking() {
  const active = orders.filter(o => ['new', 'confirmed', 'shipping'].includes(o.status));
  $('tracking-list').innerHTML = active.length
    ? active.map(o => `<div class="panel-box track-card">
        <div class="track-card-head"><a href="#orders/${encodeURIComponent(o.id)}"><b>${escHtml(o.number)}</b></a><span class="muted">${fmtDate(o.createdAt)}</span><span class="order-thumbs">${thumbs(o)}</span></div>
        ${timeline(o)}${trackingLine(o)}
        ${demo ? `<button type="button" class="link-btn small demo-advance" data-advance="${escHtml(o.id)}">${tr('Demo: chuyển sang bước tiếp theo', 'Demo: move to next step')} →</button>` : ''}
      </div>`).join('')
    : `<div class="empty"><p>${tr('Không có đơn nào đang trên đường giao.', 'Nothing on its way right now.')}</p><a class="btn btn-outline" href="#orders">${tr('Xem tất cả đơn', 'See all orders')}</a></div>`;
}

// ---------- WISHLIST ----------
function renderWishlist() {
  const items = PRODUCTS.filter(p => state.favs[p.id]);
  $('wish-grid').innerHTML = items.map(productCard).join('');
  $('wish-empty').hidden = items.length > 0;
}
document.addEventListener('favchange', () => { if (tab === 'wishlist') renderWishlist(); });

// ---------- ADDRESSES ----------
function addressLine(a) { return `${a.address}, ${a.city}, ${a.state} ${a.zip}`; }
function renderAddresses() {
  const list = profile.addresses || [];
  $('address-list').innerHTML = list.length ? list.map(a => `
    <li class="panel-box address-card">
      <div><b>${escHtml(a.label || a.name)}</b>${a.isDefault ? ` <span class="pill">${tr('Mặc định', 'Default')}</span>` : ''}
        <p>${escHtml(a.name)} · ${escHtml(a.phone || '')}<br>${escHtml(addressLine(a))}</p></div>
      <div class="address-actions">
        ${a.isDefault ? '' : `<button type="button" class="link-btn small" data-addr-default="${escHtml(a.id)}">${tr('Đặt mặc định', 'Make default')}</button>`}
        <button type="button" class="link-btn small" data-addr-edit="${escHtml(a.id)}">${tr('Sửa', 'Edit')}</button>
        <button type="button" class="link-btn small danger" data-addr-del="${escHtml(a.id)}">${tr('Xóa', 'Delete')}</button>
      </div>
    </li>`).join('') : `<li class="muted">${tr('Chưa có địa chỉ nào. Địa chỉ cũng được lưu tự động khi bạn thanh toán.', 'No saved addresses yet. They are also saved when you check out.')}</li>`;
}
function openAddressForm(a) {
  editingAddress = a ? a.id : null;
  const f = $('address-form');
  f.hidden = false;
  $('add-address').hidden = true;
  $('address-form-title').textContent = a ? tr('Sửa địa chỉ', 'Edit address') : tr('Địa chỉ mới', 'New address');
  $('ad-label').value = a ? a.label || '' : '';
  $('ad-name').value = a ? a.name || '' : displayName();
  $('ad-phone').value = a ? a.phone || '' : profile.phone || '';
  $('ad-address').value = a ? a.address : '';
  $('ad-city').value = a ? a.city : '';
  $('ad-state').value = a ? a.state : 'TX';
  $('ad-zip').value = a ? a.zip : '';
  $('ad-default').checked = a ? !!a.isDefault : !(profile.addresses || []).length;
  f.querySelectorAll('.err').forEach(e => { e.textContent = ''; });
  $('ad-label').focus();
}
function closeAddressForm() { $('address-form').hidden = true; $('add-address').hidden = false; }
$('add-address').addEventListener('click', () => openAddressForm(null));
$('address-cancel').addEventListener('click', closeAddressForm);
$('address-form').addEventListener('submit', async e => {
  e.preventDefault();
  let ok = true;
  e.target.querySelectorAll('input[required]').forEach(i => {
    const err = i.parentElement.querySelector('.err');
    let msg = !i.value.trim() ? t('required') : '';
    if (!msg && i.type === 'tel' && i.value.replace(/\D/g, '').length < 10) msg = t('badPhone');
    if (!msg && i.id === 'ad-zip' && !/^\d{5}(-\d{4})?$/.test(i.value.trim())) msg = tr('ZIP code gồm 5 số.', 'ZIP code is 5 digits.');
    if (err) err.textContent = msg;
    if (msg && ok) { i.focus(); ok = false; }
  });
  if (!ok) return;
  const entry = {
    id: editingAddress || 'a' + Date.now(), label: $('ad-label').value.trim(), name: $('ad-name').value.trim(),
    phone: $('ad-phone').value.trim(), address: $('ad-address').value.trim(), city: $('ad-city').value.trim(),
    state: $('ad-state').value.trim().toUpperCase(), zip: $('ad-zip').value.trim(), isDefault: $('ad-default').checked
  };
  let list = (profile.addresses || []).filter(a => a.id !== entry.id);
  if (entry.isDefault) list = list.map(a => ({ ...a, isDefault: false }));
  list.push(entry);
  if (!list.some(a => a.isDefault)) list[0].isDefault = true;
  profile.addresses = list;
  await saveProfile({ addresses: list }).catch(() => {});
  closeAddressForm();
  renderAddresses();
});

// ---------- PROFILE ----------
function renderProfile() {
  $('pf-name').value = profile.name || (user && user.displayName) || '';
  $('pf-phone').value = profile.phone || '';
  $('pf-email').value = user.demo ? '' : user.email;
  $('pf-email').closest('.field').hidden = !!user.demo;
}
$('profile-form').addEventListener('submit', async e => {
  e.preventDefault();
  const phone = $('pf-phone').value.trim();
  const err = $('pf-phone').parentElement.querySelector('.err');
  err.textContent = phone && phone.replace(/\D/g, '').length < 10 ? t('badPhone') : '';
  if (err.textContent) return;
  const name = $('pf-name').value.trim();
  profile = { ...profile, name, phone };
  await saveProfile({ name, phone }).catch(() => {});
  if (!demo && auth.currentUser && name) updateProfile(auth.currentUser, { displayName: name }).catch(() => {});
  $('profile-msg').textContent = tr('Đã lưu.', 'Saved.');
  $('profile-msg').hidden = false;
  renderHead();
});
$('btn-changepw').addEventListener('click', async () => {
  const msg = $('acc-msg');
  try { await sendPasswordResetEmail(auth, auth.currentUser.email); msg.textContent = t('changePwSent'); }
  catch (err) { msg.textContent = authError(err); }
  msg.hidden = false;
});
$('btn-signout').addEventListener('click', () => signOut(auth));

// ---------- REVIEW ----------
let reviewCtx = null;
let rating = 0;
function renderStarInput() {
  $('star-row').innerHTML = [1, 2, 3, 4, 5].map(n => `
    <label class="star-pick${n <= rating ? ' on' : ''}"><input type="radio" name="rating" value="${n}"${n === rating ? ' checked' : ''} class="sr-only">
      <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>
      <span class="sr-only">${n} ${tr('sao', n === 1 ? 'star' : 'stars')}</span></label>`).join('');
}
$('star-row').addEventListener('change', e => { rating = +e.target.value; renderStarInput(); });
function openReview(orderId, pid, size) {
  reviewCtx = { orderId, productId: pid, size };
  rating = 0;
  const p = findProduct(pid);
  $('review-product').textContent = `${p ? p[state.lang] : pid} · Size ${size}`;
  $('rv-text').value = '';
  $('rv-name').value = displayName().split(' ').slice(-1)[0];
  $('review-form').querySelector('.form-error').textContent = '';
  renderStarInput();
  $('dlg-review').showModal();
}
$('review-form').addEventListener('submit', async e => {
  e.preventDefault();
  const err = e.target.querySelector('.form-error');
  if (!rating) { err.textContent = tr('Chọn số sao.', 'Choose a star rating.'); return; }
  if ($('rv-text').value.trim().length < 5) { err.textContent = tr('Viết vài chữ nhận xét nhé.', 'Please write a few words.'); return; }
  try {
    await addReview({ ...reviewCtx, rating, text: $('rv-text').value.trim(), name: $('rv-name').value.trim() || tr('Khách hàng', 'Customer') });
    reviewed.add(`${reviewCtx.orderId}_${reviewCtx.productId}`);
    $('dlg-review').close();
    renderTab();
  } catch { err.textContent = tr('Chưa gửi được. Có thể bạn đã đánh giá món này rồi.', 'Could not post. You may have reviewed this already.'); }
});

// ---------- RETURN / EXCHANGE ----------
let returnCtx = null;
let rtype = 'exchange';
const REASONS = () => [
  ['size-small', tr('Size nhỏ', 'Too small')], ['size-big', tr('Size lớn', 'Too big')],
  ['not-like-photo', tr('Không giống hình', 'Not as pictured')], ['defect', tr('Hàng lỗi / hư', 'Damaged or faulty')],
  ['changed-mind', tr('Đổi ý', 'Changed my mind')], ['other', tr('Lý do khác', 'Other')]
];
function renderReturnItems() {
  const o = returnCtx;
  $('return-items').innerHTML = o.items.map((i, idx) => {
    const p = findProduct(i.id);
    return `<div class="return-item">
      <label class="check-line"><input type="checkbox" data-ri="${idx}" checked> ${escHtml(p ? p[state.lang] : i.product)} · ${escHtml(colorName(i.color))} · ${escHtml(i.size)} ×${i.qty}</label>
      ${rtype === 'exchange' && p ? `<label class="exchange-size">${tr('Đổi sang size', 'New size')}
        <select data-rs="${idx}">${p.sizes.map(s => `<option${s === i.size ? ' selected' : ''}>${s}</option>`).join('')}</select></label>` : ''}
    </div>`;
  }).join('');
}
function openReturn(orderId) {
  returnCtx = orders.find(o => o.id === orderId);
  rtype = 'exchange';
  document.querySelectorAll('[data-rtype]').forEach(b => b.setAttribute('aria-pressed', b.dataset.rtype === rtype));
  $('return-policy').textContent = tr(POLICY.returnsVi, POLICY.returnsEn);
  $('rt-reason').innerHTML = REASONS().map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
  $('rt-note').value = '';
  $('return-form').querySelector('.form-error').textContent = '';
  renderReturnItems();
  $('dlg-return').showModal();
}
$('return-form').addEventListener('submit', async e => {
  e.preventDefault();
  const err = e.target.querySelector('.form-error');
  const items = [...document.querySelectorAll('[data-ri]')].filter(c => c.checked).map(c => {
    const i = returnCtx.items[+c.dataset.ri];
    const ns = document.querySelector(`[data-rs="${c.dataset.ri}"]`);
    return { id: i.id, product: i.product, color: i.color, colorName: i.colorName || '', size: i.size, qty: i.qty, newSize: rtype === 'exchange' && ns ? ns.value : '' };
  });
  if (!items.length) { err.textContent = tr('Chọn ít nhất một món.', 'Choose at least one piece.'); return; }
  try {
    await requestReturn({
      orderId: returnCtx.id, orderNumber: returnCtx.number, type: rtype, items,
      reason: $('rt-reason').value, note: $('rt-note').value.trim(),
      customer: returnCtx.customer
    });
    returns = await myReturns();
    $('dlg-return').close();
    renderTab();
  } catch { err.textContent = tr('Chưa gửi được. Vui lòng thử lại hoặc gọi (669) 292-7189.', 'Could not send. Please try again or call (669) 292-7189.'); }
});

// ---------- delegated clicks ----------
document.addEventListener('click', async e => {
  const go = e.target.closest('[data-go]');
  if (go) {
    const typed = document.querySelector('.auth-view:not([hidden]) input[type=email]')?.value;
    showAuth(go.dataset.go);
    const nextEmail = $('view-' + go.dataset.go).querySelector('input[type=email]');
    if (typed && nextEmail && !nextEmail.value) nextEmail.value = typed;
    return;
  }
  const toggle = e.target.closest('.pw-toggle');
  if (toggle) {
    const input = toggle.previousElementSibling;
    const showing = input.type === 'text';
    input.type = showing ? 'password' : 'text';
    toggle.dataset.i18n = showing ? 'show' : 'hide';
    toggle.textContent = t(toggle.dataset.i18n);
    return;
  }
  if (e.target.closest('[data-close]')) return e.target.closest('dialog').close();
  const adv = e.target.closest('[data-advance]');
  if (adv) { demoAdvance(adv.dataset.advance); orders = await myOrders(); return renderTab(); }
  const rv = e.target.closest('[data-review]');
  if (rv) return openReview(rv.dataset.review, rv.dataset.pid, rv.dataset.size);
  const rt = e.target.closest('[data-return]');
  if (rt) return openReturn(rt.dataset.return);
  const ty = e.target.closest('[data-rtype]');
  if (ty) {
    rtype = ty.dataset.rtype;
    document.querySelectorAll('[data-rtype]').forEach(b => b.setAttribute('aria-pressed', b.dataset.rtype === rtype));
    return renderReturnItems();
  }
  const ed = e.target.closest('[data-addr-edit]');
  if (ed) return openAddressForm((profile.addresses || []).find(a => a.id === ed.dataset.addrEdit));
  const df = e.target.closest('[data-addr-default]');
  if (df) {
    profile.addresses = (profile.addresses || []).map(a => ({ ...a, isDefault: a.id === df.dataset.addrDefault }));
    await saveProfile({ addresses: profile.addresses }).catch(() => {});
    return renderAddresses();
  }
  const del = e.target.closest('[data-addr-del]');
  if (del && confirm(tr('Xóa địa chỉ này?', 'Delete this address?'))) {
    let list = (profile.addresses || []).filter(a => a.id !== del.dataset.addrDel);
    if (list.length && !list.some(a => a.isDefault)) list[0].isDefault = true;
    profile.addresses = list;
    await saveProfile({ addresses: list }).catch(() => {});
    renderAddresses();
  }
});

document.addEventListener('langchange', () => { if (!$('dash').hidden) { renderHead(); renderTab(); } });

// ---------- start ----------
if (demo) {
  onUser(enterDash);
} else {
  onUser(u => {
    if (u) enterDash(u);
    else showAuth(location.hash === '#signup' ? 'signup' : location.hash === '#forgot' ? 'forgot' : 'signin');
  });
}
