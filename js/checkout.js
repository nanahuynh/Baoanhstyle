// Checkout page

const $ = id => document.getElementById(id);
const form = $('co-form');
let lastOrder = null;

function delivery() { return form.delivery.value; }
function payment() { return form.payment.value; }

function shippingCost() { return delivery() === 'pickup' ? 0 : SHIPPING_FEE; }

function renderSummary() {
  $('mini-items').innerHTML = state.cart.map(item => {
    const p = findProduct(item.id);
    return `
      <li class="mini-item">
        <span class="mini-img" style="background:${p.bg}"><img src="${imageFor(p, item.color)}" alt=""><span class="mini-qty">${item.qty}</span></span>
        <span class="mini-info"><span>${p[state.lang]}</span><span class="muted">${colorName(item.color)} · ${item.size}</span></span>
        <span class="mini-price">${typeof p.price === 'number' ? money(p.price * item.qty) : priceText(p)}</span>
      </li>`;
  }).join('');
  const sub = cartSubtotal();
  const ship = shippingCost();
  $('co-subtotal').textContent = money(sub, '[Tạm tính]');
  $('co-shipping').textContent = ship === 0 ? t('free') : money(ship, '[Phí ship]');
  $('co-total').textContent = (typeof sub === 'number' && typeof ship === 'number') ? money(sub + ship) : '[Tổng tiền]';
}

function renderPayNote() {
  const key = { zelle: 'zelleNote', venmo: 'venmoNote', cash: 'cashNote' }[payment()];
  $('pay-note').textContent = t(key);
}

function renderAddress() {
  const pickup = delivery() === 'pickup';
  $('address-fields').hidden = pickup;
  $('address-fields').querySelectorAll('input').forEach(i => { i.required = !pickup; });
}

function render() {
  if (lastOrder) return renderDone();
  const empty = state.cart.length === 0;
  $('co-empty').hidden = !empty;
  $('co-main').hidden = empty;
  if (empty) return;
  renderSummary();
  renderPayNote();
  renderAddress();
}

function renderDone() {
  $('co-main').hidden = true;
  $('co-empty').hidden = true;
  $('done').hidden = false;
  $('done-no').textContent = lastOrder.number;
  const key = { zelle: 'zelleNote', venmo: 'venmoNote', cash: 'cashNote' }[lastOrder.payment];
  $('done-pay').textContent = t(key);
}

function validate() {
  let ok = true;
  form.querySelectorAll('input').forEach(input => {
    const err = input.parentElement.querySelector('.err');
    if (!err) return;
    let msg = '';
    const v = input.value.trim();
    if (input.required && !v) msg = t('required');
    else if (input.type === 'tel' && v && v.replace(/\D/g, '').length < 10) msg = t('badPhone');
    else if (input.type === 'email' && v && !input.checkValidity()) msg = t('badEmail');
    err.textContent = msg;
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg && ok) { input.focus(); ok = false; }
  });
  return ok;
}

form.addEventListener('change', e => {
  if (e.target.name === 'delivery') { renderAddress(); renderSummary(); }
  if (e.target.name === 'payment') renderPayNote();
});

form.addEventListener('submit', async e => {
  e.preventDefault();
  $('co-msg').textContent = '';
  if (!validate()) return;

  const data = Object.fromEntries(new FormData(form));
  const order = {
    number: 'BA' + Date.now().toString().slice(-6),
    createdAt: new Date().toISOString(),
    customer: { name: data.name, phone: data.phone, email: data.email },
    delivery: data.delivery,
    address: data.delivery === 'ship' ? { address: data.address, city: data.city, state: data.state, zip: data.zip } : null,
    payment: data.payment,
    note: data.note,
    items: state.cart.map(i => {
      const p = findProduct(i.id);
      return { id: i.id, product: p.vi, color: i.color, colorName: COLOR_NAMES[i.color] ? COLOR_NAMES[i.color].vi : i.color, size: i.size, qty: i.qty, price: p.price };
    }),
    subtotal: cartSubtotal(),
    shipping: shippingCost()
  };

  // Firebase configured → save to Firestore (admin page reads it). Else ORDER_ENDPOINT if set.
  const orders_ = await import('./orders.js').catch(() => null);
  const useFirestore = orders_ && orders_.configured;
  if (useFirestore || ORDER_ENDPOINT) {
    const btn = $('co-submit');
    btn.disabled = true;
    btn.textContent = t('sending');
    try {
      if (useFirestore) {
        await orders_.saveOrder(order);
      } else {
        const res = await fetch(ORDER_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(order)
        });
        if (!res.ok) throw new Error(res.status);
      }
    } catch {
      $('co-msg').textContent = t('sendFail');
      btn.disabled = false;
      btn.textContent = t('placeOrder');
      return;
    }
  }

  const orders = store.get('orders', []);
  orders.push(order);
  store.set('orders', orders);
  state.cart = [];
  saveCart();
  lastOrder = order;
  renderDone();
  scrollTo(0, 0);
});

// Signed-in customers: fill in what we already know
document.addEventListener('authchange', e => {
  const user = e.detail;
  $('login-fill').hidden = !!user;
  if (!user) return;
  if (!form.name.value && user.displayName) form.name.value = user.displayName;
  if (!form.email.value) form.email.value = user.email;
});

document.addEventListener('langchange', render);
render();
