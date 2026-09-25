// Admin: customers & orders, inventory, capital & expenses (Firestore)
import {
  getFirestore, collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc,
  query, orderBy, runTransaction, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
  signInWithEmailAndPassword, signOut, sendEmailVerification, onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { app, auth, configured } from './auth.js';
import { ADMIN_EMAILS } from './firebase-config.js';

const $ = id => document.getElementById(id);
const db = configured ? getFirestore(app) : null;

const STATUS = {
  new: 'Mới', confirmed: 'Đã xác nhận', shipping: 'Đang giao', done: 'Hoàn tất', cancelled: 'Đã hủy'
};
const SOLD = ['confirmed', 'shipping', 'done'];   // statuses that count as sold / take stock
const KIND = { capital: 'Góp vốn', withdraw: 'Rút vốn', expense: 'Chi phí', income: 'Thu khác' };
const PAY = { zelle: 'Zelle', venmo: 'Venmo', cash: 'Tiền mặt' };

const data = { orders: [], inventory: [], ledger: [] };
const ui = { tab: 'overview', view: 'orders', search: '', status: '', customer: null, month: '', editing: null, stockItem: null };
const unsub = [];
const openCards = new Set();

// ---------- helpers ----------
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const fmt = v => usd.format(Number(v) || 0);
const num = v => (v === '' || v == null || isNaN(Number(v))) ? null : Number(v);
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function toDate(ts) { return ts && ts.toDate ? ts.toDate() : (ts ? new Date(ts) : null); }
function fmtDate(d) {
  return d ? d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
}
function today() { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { el.hidden = true; }, 2600);
}
function orderTotal(o) {
  if (typeof o.paidTotal === 'number') return o.paidTotal;
  return (Number(o.subtotal) || 0) + (Number(o.shipping) || 0);
}
function priceMissing(o) { return typeof o.paidTotal !== 'number' && (o.subtotal == null || o.items.some(i => typeof i.price !== 'number')); }
function customerKey(c) {
  const phone = String(c.phone || '').replace(/\D/g, '');
  return phone || String(c.email || '').toLowerCase() || String(c.name || '').toLowerCase();
}
function productName(id) { const p = findProduct(id); return p ? p.vi : null; }
function colorLabel(c) { return COLOR_NAMES[c] ? COLOR_NAMES[c].vi : c; }
function invLabel(it) { return `${it.name} · ${it.color || '—'} · ${it.size || '—'}`; }
function norm(s) { return String(s || '').trim().toLowerCase(); }
function matchInventory(item) {
  // match an order line to an inventory row: same product, colour (hex or name) and size
  return data.inventory.find(v =>
    v.productId === item.id &&
    norm(v.size) === norm(item.size) &&
    (norm(v.color) === norm(item.colorName) || norm(v.color) === norm(item.color) || norm(v.color) === norm(colorLabel(item.color))));
}

// ---------- gate ----------
function showGate(which, msg) {
  $('gate').hidden = false;
  $('app').hidden = true;
  ['config', 'login', 'verify', 'denied'].forEach(g => { $('gate-' + g).hidden = g !== which; });
  if (msg) $('denied-msg').textContent = msg;
}

function isAdminEmail(email) {
  return ADMIN_EMAILS.map(e => e.toLowerCase()).includes(String(email).toLowerCase());
}

function gate(user) {
  unsub.splice(0).forEach(f => f());
  $('admin-user').hidden = !user;
  if (user) $('admin-email').textContent = user.email;
  if (!configured) return showGate('config');
  if (!user) return showGate('login');
  if (!isAdminEmail(user.email)) return showGate('denied', 'Tài khoản ' + user.email + ' không phải tài khoản quản trị. Thêm email này vào ADMIN_EMAILS và firestore.rules nếu đây là email của shop.');
  if (!user.emailVerified) return showGate('verify');
  startApp();
}

if (!configured) showGate('config');
else onAuthStateChanged(auth, gate);

$('admin-login').addEventListener('submit', async e => {
  e.preventDefault();
  const err = e.target.querySelector('.form-error');
  err.textContent = '';
  try { await signInWithEmailAndPassword(auth, $('ad-email').value.trim(), $('ad-pw').value); }
  catch { err.textContent = 'Email hoặc mật khẩu không đúng.'; }
});
$('admin-signout').addEventListener('click', () => signOut(auth));
$('btn-denied-out').addEventListener('click', () => signOut(auth));
$('btn-send-verify').addEventListener('click', async () => {
  try {
    await sendEmailVerification(auth.currentUser);
    $('verify-msg').textContent = 'Đã gửi. Mở email, bấm link xác minh, rồi quay lại bấm nút bên dưới.';
  } catch { $('verify-msg').textContent = 'Chưa gửi được, thử lại sau vài phút.'; }
  $('verify-msg').hidden = false;
});
$('btn-verified').addEventListener('click', async () => {
  await auth.currentUser.reload();
  await auth.currentUser.getIdToken(true);
  gate(auth.currentUser);
});

// ---------- data ----------
function startApp() {
  $('gate').hidden = true;
  $('app').hidden = false;
  const onErr = err => {
    if (err.code === 'permission-denied') showGate('denied', 'Firestore từ chối quyền. Kiểm tra email của bạn đã có trong firestore.rules và đã bấm Publish chưa.');
    else toast('Lỗi tải dữ liệu: ' + err.message);
  };
  unsub.push(onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), s => {
    data.orders = s.docs.map(d => ({ _id: d.id, items: [], customer: {}, ...d.data() }));
    render();
  }, onErr));
  unsub.push(onSnapshot(collection(db, 'inventory'), s => {
    data.inventory = s.docs.map(d => ({ _id: d.id, ...d.data() }))
      .sort((a, b) => invLabel(a).localeCompare(invLabel(b), 'vi'));
    render();
  }, onErr));
  unsub.push(onSnapshot(query(collection(db, 'ledger'), orderBy('date', 'desc')), s => {
    data.ledger = s.docs.map(d => ({ _id: d.id, ...d.data() }));
    render();
  }, onErr));
}

// ---------- numbers ----------
function totals() {
  const sold = data.orders.filter(o => SOLD.includes(o.status));
  const revenue = sold.reduce((s, o) => s + orderTotal(o), 0);
  const cogs = sold.reduce((s, o) => s + o.items.reduce((a, i) => a + (Number(i.cost) || 0) * i.qty, 0), 0);
  const sum = (kind, filter = () => true) => data.ledger.filter(l => l.kind === kind && filter(l)).reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const capital = sum('capital');
  const withdraw = sum('withdraw');
  const expense = sum('expense');
  const purchase = sum('expense', l => norm(l.category) === 'nhập hàng');
  const income = sum('income');
  const stockValue = data.inventory.reduce((s, v) => s + (Number(v.qty) || 0) * (Number(v.cost) || 0), 0);
  const profit = revenue + income - cogs - (expense - purchase);
  const cash = capital - withdraw + revenue + income - expense;
  return { revenue, cogs, capital, withdraw, expense, purchase, income, stockValue, profit, cash, soldCount: sold.length };
}

// ---------- render ----------
function render() {
  const newCount = data.orders.filter(o => o.status === 'new').length;
  const low = data.inventory.filter(v => (Number(v.qty) || 0) <= (Number(v.lowAt) || 0));
  $('badge-new').hidden = !newCount; $('badge-new').textContent = newCount;
  $('badge-low').hidden = !low.length; $('badge-low').textContent = low.length;
  renderOverview(low);
  renderOrders();
  renderInventory();
  renderLedger();
}

function kpi(label, value, note, tone) {
  return `<div class="kpi${tone ? ' ' + tone : ''}"><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div>${note ? `<div class="kpi-note">${note}</div>` : ''}</div>`;
}

function renderOverview(low) {
  const t = totals();
  const missing = data.orders.filter(o => SOLD.includes(o.status) && priceMissing(o)).length;
  $('kpis').innerHTML = [
    kpi('Doanh thu', fmt(t.revenue), `${t.soldCount} đơn đã bán${missing ? ` · <b>${missing} đơn chưa có giá</b>` : ''}`),
    kpi('Lãi ước tính', fmt(t.profit), 'sau giá vốn và chi phí', t.profit < 0 ? 'neg' : 'pos'),
    kpi('Tiền mặt ước tính', fmt(t.cash), 'vốn − rút + thu − chi'),
    kpi('Vốn đã góp', fmt(t.capital - t.withdraw), t.withdraw ? `đã rút ${fmt(t.withdraw)}` : ''),
    kpi('Tổng chi phí', fmt(t.expense), `trong đó nhập hàng ${fmt(t.purchase)}`),
    kpi('Hàng tồn (giá vốn)', fmt(t.stockValue), `${data.inventory.reduce((s, v) => s + (Number(v.qty) || 0), 0)} cái trong kho`)
  ].join('');

  const fresh = data.orders.filter(o => o.status === 'new').slice(0, 6);
  $('ov-new').innerHTML = fresh.length
    ? `<ul class="mini-list">${fresh.map(o => `<li><button class="link-row" data-open-order="${o._id}"><b>${esc(o.number)}</b> · ${esc(o.customer.name)} · ${esc(o.customer.phone)}<span>${fmtDate(toDate(o.createdAt))}</span></button></li>`).join('')}</ul>`
    : '<p class="muted">Không có đơn mới.</p>';
  $('ov-low').innerHTML = low.length
    ? `<ul class="mini-list">${low.map(v => `<li><span>${esc(invLabel(v))}</span><b class="${v.qty <= 0 ? 'neg-text' : ''}">còn ${Number(v.qty) || 0}</b></li>`).join('')}</ul>`
    : '<p class="muted">Kho ổn.</p>';
}

function orderMatches(o) {
  if (ui.status && o.status !== ui.status) return false;
  if (ui.customer && customerKey(o.customer) !== ui.customer) return false;
  if (!ui.search) return true;
  const q = norm(ui.search);
  return [o.number, o.customer.name, o.customer.phone, o.customer.email].some(v => norm(v).includes(q))
    || String(o.customer.phone || '').replace(/\D/g, '').includes(q.replace(/\D/g, '') || '§');
}

function orderCard(o) {
  const addr = o.address ? `${esc(o.address.address)}, ${esc(o.address.city)}, ${esc(o.address.state)} ${esc(o.address.zip)}` : 'Nhận tại shop';
  const stockNote = o.stockApplied ? '<span class="pill ok">Đã trừ kho</span>' : '';
  return `
  <details class="order" id="order-${o._id}">
    <summary>
      <span class="order-no">${esc(o.number)}</span>
      <span class="order-who">${esc(o.customer.name)}<small>${esc(o.customer.phone)}</small></span>
      <span class="order-date">${fmtDate(toDate(o.createdAt))}</span>
      <span class="order-total">${priceMissing(o) ? '<i>chưa có giá</i>' : fmt(orderTotal(o))}</span>
      <span class="pill st-${esc(o.status)}">${STATUS[o.status] || esc(o.status)}</span>
    </summary>
    <div class="order-body">
      <table class="admin-table compact">
        <thead><tr><th>Sản phẩm</th><th>Màu</th><th>Size</th><th>SL</th><th>Giá</th></tr></thead>
        <tbody>${o.items.map(i => `<tr><td>${esc(i.product || productName(i.id))}</td><td>${esc(i.colorName || colorLabel(i.color))}</td><td>${esc(i.size)}</td><td>${Number(i.qty) || 0}</td><td>${typeof i.price === 'number' ? fmt(i.price) : '—'}</td></tr>`).join('')}</tbody>
      </table>
      <dl class="order-meta">
        <dt>Email</dt><dd>${esc(o.customer.email) || '—'}</dd>
        <dt>Nhận hàng</dt><dd>${addr}</dd>
        <dt>Thanh toán</dt><dd>${PAY[o.payment] || esc(o.payment)}</dd>
        ${o.note ? `<dt>Ghi chú</dt><dd>${esc(o.note)}</dd>` : ''}
      </dl>
      <div class="order-actions">
        <label>Trạng thái
          <select class="admin-input" data-status="${o._id}">
            ${Object.entries(STATUS).map(([k, v]) => `<option value="${k}"${k === o.status ? ' selected' : ''}>${v}</option>`).join('')}
          </select>
        </label>
        <label>Tổng tiền thực thu (USD)
          <input class="admin-input" type="number" min="0" step="0.01" data-paid="${o._id}" value="${typeof o.paidTotal === 'number' ? o.paidTotal : ''}" placeholder="${o.subtotal != null ? orderTotal(o) : 'nhập số tiền'}">
        </label>
        ${stockNote}
        <a class="btn btn-outline btn-sm" href="tel:${esc(String(o.customer.phone || '').replace(/[^\d+]/g, ''))}">Gọi khách</a>
        <button class="link-btn" data-customer="${esc(customerKey(o.customer))}">Lịch sử khách này</button>
      </div>
    </div>
  </details>`;
}

function customersList() {
  const map = new Map();
  for (const o of data.orders) {
    const key = customerKey(o.customer);
    if (!key) continue;
    const c = map.get(key) || { key, name: o.customer.name, phone: o.customer.phone, email: o.customer.email, orders: 0, spent: 0, last: null, cancelled: 0 };
    c.orders += 1;
    if (SOLD.includes(o.status)) c.spent += orderTotal(o);
    if (o.status === 'cancelled') c.cancelled += 1;
    const d = toDate(o.createdAt);
    if (d && (!c.last || d > c.last)) { c.last = d; c.name = o.customer.name || c.name; }
    if (!c.email && o.customer.email) c.email = o.customer.email;
    map.set(key, c);
  }
  return [...map.values()].sort((a, b) => (b.last || 0) - (a.last || 0));
}

function renderOrders() {
  $('orders-view').hidden = ui.view !== 'orders';
  $('customers-view').hidden = ui.view !== 'customers';
  document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === ui.view));

  // focused customer header
  if (ui.customer) {
    const c = customersList().find(x => x.key === ui.customer);
    $('customer-focus').innerHTML = c ? `
      <div class="admin-box focus">
        <div><h2 class="admin-h2">${esc(c.name)}</h2><p class="muted">${esc(c.phone)} · ${esc(c.email) || 'không có email'}</p></div>
        <div class="focus-stats"><span><b>${c.orders}</b> đơn</span><span><b>${fmt(c.spent)}</b> đã mua</span>${c.cancelled ? `<span><b>${c.cancelled}</b> đã hủy</span>` : ''}</div>
        <button class="link-btn" id="clear-customer">× Bỏ lọc khách</button>
      </div>` : '';
  } else $('customer-focus').innerHTML = '';

  const list = data.orders.filter(orderMatches);
  $('orders-view').innerHTML = list.length ? list.map(orderCard).join('') : '<p class="muted empty-row">Chưa có đơn nào phù hợp.</p>';
  openCards.forEach(id => { const el = $(id); if (el) el.open = true; });

  const q = norm(ui.search);
  const customers = customersList().filter(c => !q || [c.name, c.phone, c.email].some(v => norm(v).includes(q)));
  $('customers-view').innerHTML = customers.length ? `
    <div class="table-wrap"><table class="admin-table">
      <thead><tr><th>Khách hàng</th><th>Điện thoại</th><th>Email</th><th class="num">Số đơn</th><th class="num">Đã mua</th><th>Đơn gần nhất</th><th></th></tr></thead>
      <tbody>${customers.map(c => `<tr>
        <td><b>${esc(c.name)}</b></td><td>${esc(c.phone)}</td><td>${esc(c.email) || '—'}</td>
        <td class="num">${c.orders}</td><td class="num">${fmt(c.spent)}</td><td>${fmtDate(c.last)}</td>
        <td><button class="link-btn" data-customer="${esc(c.key)}">Xem đơn</button></td></tr>`).join('')}</tbody>
    </table></div>` : '<p class="muted empty-row">Chưa có khách hàng.</p>';
}

function renderInventory() {
  const rows = data.inventory;
  $('inv-table').innerHTML = rows.length ? `
    <thead><tr><th>Sản phẩm</th><th>Màu</th><th>Size</th><th class="num">Tồn</th><th class="num">Giá vốn</th><th class="num">Giá bán</th><th class="num">Giá trị tồn</th><th></th></tr></thead>
    <tbody>${rows.map(v => {
      const qty = Number(v.qty) || 0;
      const lowCls = qty <= 0 ? 'out' : qty <= (Number(v.lowAt) || 0) ? 'low' : '';
      return `<tr class="${lowCls}">
        <td><b>${esc(v.name)}</b></td><td>${esc(v.color) || '—'}</td><td>${esc(v.size) || '—'}</td>
        <td class="num"><span class="qty-pill ${lowCls}">${qty}</span></td>
        <td class="num">${v.cost != null ? fmt(v.cost) : '—'}</td>
        <td class="num">${v.price != null ? fmt(v.price) : '—'}</td>
        <td class="num">${fmt(qty * (Number(v.cost) || 0))}</td>
        <td class="row-actions">
          <button class="btn btn-outline btn-sm" data-stock="${v._id}">Nhập / xuất</button>
          <button class="link-btn" data-edit="${v._id}">Sửa</button>
          <button class="link-btn danger" data-del-item="${v._id}">Xóa</button>
        </td></tr>`;
    }).join('')}</tbody>` : '<tbody><tr><td class="muted empty-row">Kho đang trống. Bấm “+ Thêm hàng vào kho” để bắt đầu.</td></tr></tbody>';
}

function renderLedger() {
  const t = totals();
  $('ledger-kpis').innerHTML = [
    kpi('Vốn góp', fmt(t.capital)), kpi('Rút vốn', fmt(t.withdraw)),
    kpi('Chi phí', fmt(t.expense)), kpi('Thu khác', fmt(t.income)),
    kpi('Tiền mặt ước tính', fmt(t.cash), 'gồm cả doanh thu đơn hàng')
  ].join('');
  const rows = data.ledger.filter(l => !ui.month || String(l.date).startsWith(ui.month));
  const monthSum = rows.reduce((s, l) => s + (['expense', 'withdraw'].includes(l.kind) ? -1 : 1) * (Number(l.amount) || 0), 0);
  $('ledger-table').innerHTML = rows.length ? `
    <thead><tr><th>Ngày</th><th>Loại</th><th>Danh mục</th><th>Ghi chú</th><th class="num">Số tiền</th><th></th></tr></thead>
    <tbody>${rows.map(l => {
      const out = ['expense', 'withdraw'].includes(l.kind);
      return `<tr><td>${esc(l.date)}</td><td><span class="pill k-${esc(l.kind)}">${KIND[l.kind] || esc(l.kind)}</span></td>
        <td>${esc(l.category) || '—'}</td><td>${esc(l.note) || ''}</td>
        <td class="num ${out ? 'neg-text' : 'pos-text'}">${out ? '−' : '+'}${fmt(l.amount)}</td>
        <td><button class="link-btn danger" data-del-ledger="${l._id}">Xóa</button></td></tr>`;
    }).join('')}</tbody>
    <tfoot><tr><td colspan="4">${ui.month ? 'Cộng tháng ' + esc(ui.month) : 'Cộng tất cả'} (thu − chi)</td><td class="num"><b>${monthSum < 0 ? '−' : '+'}${fmt(Math.abs(monthSum))}</b></td><td></td></tr></tfoot>`
    : '<tbody><tr><td class="muted empty-row">Chưa có khoản nào.</td></tr></tbody>';
}

// ---------- order actions ----------
async function changeStatus(id, next) {
  const ref = doc(db, 'orders', id);
  try {
    const warn = await runTransaction(db, async tx => {
      const snap = await tx.get(ref);
      const o = snap.data();
      const willTake = SOLD.includes(next) && !o.stockApplied;
      const willReturn = next === 'cancelled' && o.stockApplied;
      const update = { status: next, updatedAt: serverTimestamp() };
      const missing = [];
      if (willTake || willReturn) {
        // read every stock row first (transactions need reads before writes)
        const lines = [];
        for (const item of o.items) {
          const inv = matchInventory(item);
          if (!inv) { missing.push(item.product || item.id); lines.push(null); continue; }
          const invRef = doc(db, 'inventory', inv._id);
          lines.push({ invRef, snap: await tx.get(invRef), item });
        }
        const items = o.items.map(i => ({ ...i }));
        lines.forEach((l, idx) => {
          if (!l || !l.snap.exists()) return;
          const cur = Number(l.snap.data().qty) || 0;
          const qty = Number(l.item.qty) || 0;
          tx.update(l.invRef, { qty: willTake ? cur - qty : cur + qty });
          if (willTake) items[idx].cost = Number(l.snap.data().cost) || 0;
        });
        update.items = items;
        update.stockApplied = willTake;
      }
      tx.update(ref, update);
      return missing;
    });
    toast(warn.length ? `Đã đổi trạng thái. Không tìm thấy trong kho: ${warn.join(', ')}` : 'Đã cập nhật đơn.');
  } catch (err) { toast('Lỗi: ' + err.message); }
}

// ---------- inventory dialogs ----------
function fillProductSelect(selectedId) {
  $('it-product').innerHTML = PRODUCTS.map(p => `<option value="${p.id}"${p.id === selectedId ? ' selected' : ''}>${esc(p.vi)}</option>`).join('')
    + `<option value="other"${selectedId === 'other' ? ' selected' : ''}>Sản phẩm khác (nhập tên)…</option>`;
  syncProductFields();
}
function syncProductFields() {
  const id = $('it-product').value;
  $('it-name-wrap').hidden = id !== 'other';
  const p = findProduct(id);
  $('it-colors').innerHTML = (p ? p.dots : Object.keys(COLOR_NAMES)).map(h => `<option value="${esc(colorLabel(h))}"></option>`).join('');
}
$('it-product').addEventListener('change', syncProductFields);

function openItem(item) {
  ui.editing = item ? item._id : null;
  const f = $('item-form');
  f.reset();
  f.querySelector('.form-error').textContent = '';
  $('item-title').textContent = item ? 'Sửa hàng trong kho' : 'Thêm hàng vào kho';
  fillProductSelect(item ? (item.productId || 'other') : PRODUCTS[0].id);
  $('it-ledger-wrap').hidden = !!item;
  if (item) {
    $('it-name').value = item.productId ? '' : item.name;
    $('it-color').value = item.color || '';
    $('it-size').value = item.size || '';
    $('it-qty').value = item.qty ?? 0;
    $('it-low').value = item.lowAt ?? 2;
    $('it-cost').value = item.cost ?? '';
    $('it-price').value = item.price ?? '';
  }
  $('dlg-item').showModal();
}

$('item-save').addEventListener('click', async e => {
  e.preventDefault();
  const f = $('item-form');
  const err = f.querySelector('.form-error');
  const productId = $('it-product').value === 'other' ? null : $('it-product').value;
  const name = productId ? productName(productId) : $('it-name').value.trim();
  if (!name) { err.textContent = 'Nhập tên sản phẩm.'; return; }
  const row = {
    productId, name,
    color: $('it-color').value.trim(), size: $('it-size').value.trim().toUpperCase().replace('FREE SIZE', 'Free size'),
    qty: Math.max(0, Math.round(num($('it-qty').value) || 0)),
    lowAt: Math.max(0, Math.round(num($('it-low').value) || 0)),
    cost: num($('it-cost').value), price: num($('it-price').value)
  };
  const dup = data.inventory.find(v => v._id !== ui.editing && v.productId === row.productId && v.name === row.name && norm(v.color) === norm(row.color) && norm(v.size) === norm(row.size));
  if (dup) { err.textContent = 'Mẫu, màu, size này đã có trong kho. Dùng nút “Nhập / xuất” để thêm số lượng.'; return; }
  try {
    if (ui.editing) {
      await updateDoc(doc(db, 'inventory', ui.editing), row);
    } else {
      await addDoc(collection(db, 'inventory'), { ...row, createdAt: serverTimestamp() });
      if ($('it-ledger').checked && row.qty > 0 && row.cost) {
        await addDoc(collection(db, 'ledger'), { date: today(), kind: 'expense', category: 'Nhập hàng', amount: row.qty * row.cost, note: `Nhập ${row.qty} × ${invLabel(row)}`, createdAt: serverTimestamp() });
      }
    }
    $('dlg-item').close();
    toast('Đã lưu.');
  } catch (e2) { err.textContent = 'Lỗi: ' + e2.message; }
});

function openStock(item) {
  ui.stockItem = item;
  const f = $('stock-form');
  f.reset();
  f.querySelector('.form-error').textContent = '';
  $('stock-sub').textContent = `${invLabel(item)} — đang tồn ${Number(item.qty) || 0}`;
  $('st-cost').value = item.cost ?? '';
  syncStockMode();
  $('dlg-stock').showModal();
}
function syncStockMode() {
  const inMode = $('st-mode').value === 'in';
  $('st-cost-wrap').hidden = !inMode;
  $('st-ledger-wrap').hidden = !inMode;
}
$('st-mode').addEventListener('change', syncStockMode);

$('stock-save').addEventListener('click', async e => {
  e.preventDefault();
  const item = ui.stockItem;
  const err = $('stock-form').querySelector('.form-error');
  const mode = $('st-mode').value;
  const n = Math.round(num($('st-qty').value) ?? -1);
  if (n < 0 || (mode !== 'set' && n === 0)) { err.textContent = 'Nhập số lượng.'; return; }
  const ref = doc(db, 'inventory', item._id);
  try {
    await runTransaction(db, async tx => {
      const cur = Number((await tx.get(ref)).data().qty) || 0;
      const next = mode === 'in' ? cur + n : mode === 'out' ? Math.max(0, cur - n) : n;
      const update = { qty: next };
      const cost = num($('st-cost').value);
      if (mode === 'in' && cost != null) update.cost = cost;
      tx.update(ref, update);
    });
    const cost = num($('st-cost').value);
    if (mode === 'in' && $('st-ledger').checked && cost) {
      await addDoc(collection(db, 'ledger'), { date: today(), kind: 'expense', category: 'Nhập hàng', amount: n * cost, note: `Nhập ${n} × ${invLabel(item)}`, createdAt: serverTimestamp() });
    }
    $('dlg-stock').close();
    toast('Đã cập nhật kho.');
  } catch (e2) { err.textContent = 'Lỗi: ' + e2.message; }
});

// ---------- ledger ----------
$('lg-date').value = today();
$('ledger-form').addEventListener('submit', async e => {
  e.preventDefault();
  const err = e.target.querySelector('.form-error');
  err.textContent = '';
  const amount = num($('lg-amount').value);
  if (!$('lg-date').value || !amount || amount <= 0) { err.textContent = 'Nhập ngày và số tiền lớn hơn 0.'; return; }
  try {
    await addDoc(collection(db, 'ledger'), {
      date: $('lg-date').value, kind: $('lg-kind').value, category: $('lg-cat').value.trim(),
      amount, note: $('lg-note').value.trim(), createdAt: serverTimestamp()
    });
    $('lg-amount').value = ''; $('lg-note').value = ''; $('lg-cat').value = '';
    toast('Đã ghi sổ.');
  } catch (e2) { err.textContent = 'Lỗi: ' + e2.message; }
});
$('lg-month').addEventListener('change', e => { ui.month = e.target.value; renderLedger(); });
$('lg-all').addEventListener('click', () => { ui.month = ''; $('lg-month').value = ''; renderLedger(); });

// ---------- navigation & delegated events ----------
function setTab(tab) {
  ui.tab = tab;
  document.querySelectorAll('[data-tab]').forEach(b => b.toggleAttribute('aria-current', b.dataset.tab === tab));
  document.querySelectorAll('.admin-panel').forEach(p => { p.hidden = p.id !== 'tab-' + tab; });
  scrollTo(0, 0);
}

document.addEventListener('click', async e => {
  const el = e.target.closest('button, a');
  if (!el) return;
  const d = el.dataset;
  if (d.tab) return setTab(d.tab);
  if (d.view) { ui.view = d.view; return renderOrders(); }
  if (d.customer !== undefined) { ui.customer = d.customer; ui.view = 'orders'; setTab('customers'); return renderOrders(); }
  if (el.id === 'clear-customer') { ui.customer = null; return renderOrders(); }
  if (d.openOrder) {
    ui.customer = null; ui.status = ''; ui.search = ''; ui.view = 'orders';
    $('status-filter').value = ''; $('search').value = '';
    setTab('customers'); renderOrders();
    const card = $('order-' + d.openOrder);
    if (card) { card.open = true; card.scrollIntoView({ block: 'center' }); }
    return;
  }
  if (el.id === 'btn-add-item') return openItem(null);
  if (d.edit) return openItem(data.inventory.find(v => v._id === d.edit));
  if (d.stock) return openStock(data.inventory.find(v => v._id === d.stock));
  if (d.delItem) {
    const v = data.inventory.find(x => x._id === d.delItem);
    if (confirm(`Xóa “${invLabel(v)}” khỏi kho?`)) { await deleteDoc(doc(db, 'inventory', d.delItem)); toast('Đã xóa.'); }
    return;
  }
  if (d.delLedger) {
    if (confirm('Xóa khoản này khỏi sổ?')) { await deleteDoc(doc(db, 'ledger', d.delLedger)); toast('Đã xóa.'); }
  }
});

document.addEventListener('change', async e => {
  const el = e.target;
  if (el.dataset.status) {
    const o = data.orders.find(x => x._id === el.dataset.status);
    if (el.value === o.status) return;
    if (el.value === 'cancelled' && !confirm(`Hủy đơn ${o.number}?`)) { el.value = o.status; return; }
    await changeStatus(o._id, el.value);
  }
  if (el.dataset.paid) {
    const v = num(el.value);
    await updateDoc(doc(db, 'orders', el.dataset.paid), { paidTotal: v });
    toast('Đã lưu số tiền.');
  }
});

$('search').addEventListener('input', e => { ui.search = e.target.value; renderOrders(); });
$('status-filter').addEventListener('change', e => { ui.status = e.target.value; renderOrders(); });

// keep open order cards open across live re-renders
document.addEventListener('toggle', e => {
  if (e.target.classList && e.target.classList.contains('order')) {
    if (e.target.open) openCards.add(e.target.id); else openCards.delete(e.target.id);
  }
}, true);
