// ORDER CONFIRMED
import { demo, onUser, myOrders } from './data.js';

const $ = id => document.getElementById(id);
const no = new URLSearchParams(location.search).get('no');
let order = null;
let user = null;

try {
  const last = JSON.parse(sessionStorage.getItem('baoanh.lastOrder') || 'null');
  if (last && last.number === no) order = last;
} catch {}

function payText(o) {
  if (o.payment === 'zelle') return tr(`Chuyển <b>${escHtml(money(o.total, '[tổng tiền]'))}</b> qua Zelle tới <b>${escHtml(PAYMENT_INFO.zelle)}</b>, ghi mã đơn <b>${escHtml(o.number)}</b> trong lời nhắn.`, `Send <b>${escHtml(money(o.total, '[total]'))}</b> by Zelle to <b>${escHtml(PAYMENT_INFO.zelle)}</b> with <b>${escHtml(o.number)}</b> in the memo.`);
  if (o.payment === 'venmo') return tr(`Chuyển <b>${escHtml(money(o.total, '[tổng tiền]'))}</b> qua Venmo tới <b>${escHtml(PAYMENT_INFO.venmo)}</b>, ghi mã đơn <b>${escHtml(o.number)}</b> trong lời nhắn.`, `Send <b>${escHtml(money(o.total, '[total]'))}</b> by Venmo to <b>${escHtml(PAYMENT_INFO.venmo)}</b> with <b>${escHtml(o.number)}</b> in the note.`);
  return escHtml(t('cashNote'));
}

function render() {
  if (!order) { $('confirm').hidden = true; $('no-order').hidden = false; return; }
  $('confirm').hidden = false;
  $('no-order').hidden = true;
  const o = order;
  $('o-number').textContent = o.number;
  $('o-contact').textContent = tr(
    `Shop sẽ gọi hoặc nhắn tin tới ${o.customer.phone} để xác nhận đơn.${o.customer.email ? ' Xác nhận cũng được gửi tới ' + o.customer.email + '.' : ''}`,
    `We will call or text ${o.customer.phone} to confirm.${o.customer.email ? ' A copy goes to ' + o.customer.email + '.' : ''}`);
  $('o-pay').innerHTML = payText(o);

  const m = shipMethod(o.shippingMethod || (o.delivery === 'pickup' ? 'pickup' : 'standard'));
  $('o-delivery').innerHTML = o.delivery === 'pickup'
    ? `<b>${escHtml(m[state.lang])}</b><br>${escHtml(tr(m.etaVi, m.etaEn))}`
    : `<b>${escHtml(m[state.lang])}</b> · ${escHtml(tr(m.etaVi, m.etaEn))}<br>${escHtml(o.customer.name)}<br>${escHtml(o.address.address)}, ${escHtml(o.address.city)}, ${escHtml(o.address.state)} ${escHtml(o.address.zip)}`;

  const steps = [
    [tr('Đã đặt hàng', 'Order placed'), tr('Shop đã nhận đơn của bạn.', 'We have your order.'), true],
    [tr('Xác nhận', 'Confirmed'), tr('Shop gọi hoặc nhắn để xác nhận size, màu và thanh toán.', 'We confirm size, colour and payment with you.')],
    [o.delivery === 'pickup' ? tr('Sẵn sàng nhận', 'Ready for pickup') : tr('Đang giao', 'Shipped'), o.delivery === 'pickup' ? tr('Shop nhắn khi hàng sẵn sàng tại Houston.', 'We text you when it is ready in Houston.') : tr('Bạn nhận được mã vận đơn để theo dõi.', 'You get a tracking number.')],
    [tr('Đã nhận hàng', 'Delivered'), tr('Đánh giá sản phẩm hoặc yêu cầu đổi/trả trong Tài khoản.', 'Review it, or request a return or exchange from My account.')]
  ];
  $('o-steps').innerHTML = steps.map(([title, body, on]) => `<li class="${on ? 'on' : ''}"><b>${title}</b><span>${body}</span></li>`).join('');

  $('o-items').innerHTML = o.items.map(i => {
    const p = findProduct(i.id);
    return `<li class="mini-item">
      <span class="mini-img" style="background:${p ? p.bg : '#f1ddd5'}"><img src="${p ? imageFor(p, i.color) : ''}" alt=""><span class="mini-qty">${i.qty}</span></span>
      <span class="mini-info"><span>${escHtml(p ? p[state.lang] : i.product)}</span><span class="muted">${escHtml(colorName(i.color))} · ${escHtml(i.size)}</span></span>
      <span class="mini-price">${typeof i.price === 'number' ? money(i.price * i.qty) : tr('[Giá]', '[Price]')}</span>
    </li>`;
  }).join('');
  $('o-totals').innerHTML = `
    <div class="summary-row"><span>${t('subtotal')}</span><span>${money(o.subtotal, tr('[Tạm tính]', '[Subtotal]'))}</span></div>
    ${o.promoCode ? `<div class="summary-row discount"><span>${tr('Giảm giá', 'Discount')} (${escHtml(o.promoCode)})</span><span>${typeof o.discount === 'number' ? '−' + money(o.discount) : '—'}</span></div>` : ''}
    <div class="summary-row"><span>${t('shippingFee')}</span><span>${o.shipping === 0 ? t('free') : money(o.shipping, tr('[Phí ship]', '[Shipping]'))}</span></div>
    ${o.taxRate != null ? `<div class="summary-row"><span>${tr('Thuế', 'Tax')} (${+(o.taxRate * 100).toFixed(3)}%)</span><span>${money(o.tax, '—')}</span></div>` : ''}
    <div class="summary-row total"><span>${t('total')}</span><span>${money(o.total, tr('[Tổng tiền]', '[Total]'))}</span></div>`;

  const signedIn = demo || !!user;
  $('o-actions').innerHTML = signedIn
    ? `<a class="btn btn-primary" href="account.html#orders">${tr('Theo dõi đơn hàng', 'Track my order')}</a>
       <a class="btn btn-outline" href="shop.html">${t('continueShopping')}</a>`
    : `<div class="guest-note"><p>${tr('Tạo tài khoản để theo dõi đơn, lưu địa chỉ và đánh giá sản phẩm sau khi nhận hàng.', 'Create an account to track orders, save addresses and review your pieces after delivery.')}</p>
       <a class="btn btn-primary" href="account.html#signup">${tr('Tạo tài khoản', 'Create account')}</a>
       <a class="btn btn-outline" href="shop.html">${t('continueShopping')}</a></div>`;
}

onUser(async u => {
  user = u;
  if (!order && u) {
    try { order = (await myOrders()).find(x => x.number === no) || null; } catch {}
  }
  render();
});
document.addEventListener('langchange', render);
render();
