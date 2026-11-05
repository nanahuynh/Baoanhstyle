// Style by BaoAnh — shared site script

// ======================================================================
// SHOP SETTINGS — sửa thông tin shop ở phần này
// ======================================================================

// Danh mục (CATEGORY)
const CATEGORY_LIST = [
  { id: 'ao', vi: 'Áo', en: 'Tops' },
  { id: 'quan', vi: 'Quần', en: 'Pants' },
  { id: 'set', vi: 'Set', en: 'Sets' },
  { id: 'vay', vi: 'Váy', en: 'Skirts' },
  { id: 'dam', vi: 'Đầm', en: 'Dresses' }
];

// Sản phẩm.
// price: giá bán (số, USD), vd 48. null = chưa có giá, hiện [Giá].
// added: ngày đưa lên web (YYYY-MM-DD). Trong 2 tháng đầu tự có nhãn NEW và nằm trong "Mới về".
// sale: true = đang sale (nhãn SALE, nằm trong mục Sale). oldPrice: giá gốc khi sale. video: link file .mp4 (vd 'videos/dam-a.mp4') hoặc null.
// details: mô tả / chất liệu / form / bảo quản — thay chữ trong [ ] bằng thông tin thật.
// gallery: nhiều ảnh cho 1 sản phẩm (ảnh đầu là ảnh đại diện). Không có thì dùng ảnh theo màu.
// sizeChart: bảng size riêng của mẫu (cm). Không có thì dùng SIZE_CHART chung bên dưới.
const PRODUCTS = [
  {
    id: 'e', vi: 'Đầm cổ bẻ khóa kéo', en: 'Collared zip-front mini dress', added: '2026-10-03',
    category: 'dam', sizes: ['S', 'M', 'L'],
    img: 'images/dam-co-be-khoa-keo-1.webp', bg: '#ecdcd3', dots: ['#2f2a28'], price: 58, video: null,
    gallery: [
      'images/dam-co-be-khoa-keo-1.webp',
      'images/dam-co-be-khoa-keo-2.webp',
      'images/dam-co-be-khoa-keo-3.webp',
      'images/dam-co-be-khoa-keo-4.webp'
    ],
    sizeChart: {
      unit: 'cm',
      rows: [
        { size: 'S', bust: 86, waist: 68 },
        { size: 'M', bust: 90, waist: 72 },
        { size: 'L', bust: 94, waist: 76 }
      ]
    },
    details: {
      description: 'Đầm mini cổ bẻ, tay phồng ngắn, ngực xếp ly chữ V, khóa kéo dọc thân trước. Chân váy xòe chữ A, mặc đi làm hay đi tiệc đều hợp.',
      material: '[Chất liệu: thành phần vải, độ co giãn]',
      fit: 'Eo chiết ôm, chân váy xòe chữ A, dài trên gối. [Mẫu cao … mặc size …]',
      care: '[Bảo quản: giặt tay / máy, nhiệt độ ủi]'
    }
  }
];

const COLOR_NAMES = {
  '#efe3cf': { vi: 'Be', en: 'Beige' },
  '#2f2a28': { vi: 'Đen', en: 'Black' },
  '#f7f2e8': { vi: 'Trắng kem', en: 'Cream' },
  '#f3ede2': { vi: 'Trắng ngà', en: 'Ivory' }
};
// Ảnh theo từng màu. Thêm ảnh ở đây khi có.
// Ví dụ:  e: { '#2f2a28': 'images/dam-co-be-khoa-keo-1.webp' },
const COLOR_IMAGES = {
};

// Khoảng giá cho bộ lọc Price (USD)
const PRICE_RANGES = [
  { id: 'u50', vi: 'Dưới $50', en: 'Under $50', min: 0, max: 50 },
  { id: '50-100', vi: '$50 – $100', en: '$50 – $100', min: 50, max: 100 },
  { id: 'o100', vi: 'Trên $100', en: 'Over $100', min: 100, max: Infinity }
];

// Bảng size (inch) — dùng cho Size Guide và Find My Size.
// SỐ ĐO MẪU theo chuẩn size nữ Mỹ: hãy sửa lại theo số đo thật của hàng shop.
const SIZE_CHART = [
  { size: 'S', bust: [32, 34], waist: [25, 27], hips: [35, 37] },
  { size: 'M', bust: [34, 36], waist: [27, 29], hips: [37, 39] },
  { size: 'L', bust: [36, 39], waist: [29, 32], hips: [39, 42] },
  { size: 'XL', bust: [39, 42], waist: [32, 35], hips: [42, 45] },
  { size: 'XXL', bust: [42, 45], waist: [35, 38], hips: [45, 48] }
];

// Cách giao hàng. fee: số USD, null = chưa có (hiện [Phí ship]).
const SHIPPING_METHODS = [
  { id: 'standard', vi: 'Giao tận nơi', en: 'Shipping', etaVi: '[3–5] ngày làm việc', etaEn: '[3–5] business days', fee: 8 }
];
// Miễn phí giao hàng cho đơn từ bao nhiêu USD (null = không áp dụng).
const FREE_SHIPPING_OVER = 299;

// Thuế bán hàng (sales tax) theo tiểu bang của địa chỉ giao hàng. 0.0825 = 8.25%.
// Shop ở Houston, TX: khách ở Texas đóng 8.25% (Texas tính theo địa điểm của shop).
// Tiểu bang khác: 0% cho tới khi shop đăng ký thu thuế ở bang đó (thường khi doanh số vào bang
// vượt khoảng $100,000/năm). Khi đó thêm một dòng, ví dụ  CA: 0.0725,
// TAX_ON_SHIPPING: tính thuế cả trên phí ship (Texas có tính).
const TAX_BY_STATE = {
  TX: 0.0825
};
const TAX_ON_SHIPPING = true;
const SHOP_STATE = 'TX';
const US_STATES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut',
  DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
  RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming'
};

// Mã giảm giá. type: 'percent' (giảm %) hoặc 'fixed' (giảm số USD). minSubtotal: đơn tối thiểu.
// Ví dụ: WELCOME10: { type: 'percent', value: 10, minSubtotal: 0 }
const PROMO_CODES = {
};

// Chính sách hiển thị ở trang sản phẩm và trang đổi trả
const POLICY = {
  deliveryVi: '[Thời gian giao, phí ship, khu vực giao]',
  deliveryEn: '[Delivery times, fees, areas]',
  returnsVi: '[Đổi trả trong bao nhiêu ngày, điều kiện (còn tag, chưa giặt…), ai trả phí ship]',
  returnsEn: '[Return window, conditions (tags on, unwashed…), who pays return shipping]'
};

// Thanh toán bằng mã QR. qr: ảnh trong images/pay/. link: mở thẳng app trên điện thoại (null nếu app không có link).
const PAY_METHODS = {
  zelle:   { name: 'Zelle',    to: '(669) 292-7189', who: 'PHOENIX GLOW GROUP, LLC', qr: 'images/pay/zelle.jpg',   link: null },
  venmo:   { name: 'Venmo',    to: '@Hang2021',      who: 'Bao Anh',                 qr: 'images/pay/venmo.jpg',   link: 'https://venmo.com/u/Hang2021' },
  cashapp: { name: 'Cash App', to: '$baoanhusa',     who: 'Hang Huynh',              qr: 'images/pay/cashapp.jpg', link: 'https://cash.app/$baoanhusa' },
  paypal:  { name: 'PayPal',   to: 'Hang Huynh',     who: 'Hang Huynh',              qr: 'images/pay/paypal.jpg',  link: 'https://www.paypal.com/qrcodes/p2pqrc/UKWNCS2S7TH7S' }
};

// ======================================================================

const I18N = {
  vi: {
    topbar: 'Chăm sóc khách hàng · Customer service: (669) 292-7189',
    navNew: 'Mới về', navShop: 'Shop', navLive: 'Live', navBeauty: 'Beauty', navSale: 'Sale',
    heroTitle: 'Tự tin tỏa sáng',
    heroBody: 'Thời trang thanh lịch cho người phụ nữ hiện đại: form tôn dáng, chất liệu dễ chịu, mặc đẹp từ công sở đến dạo phố.',
    shopNow: 'Mua ngay', watchLive: 'Xem Live',
    catEyebrow: 'Shop by category', catTitle: 'Chọn phong cách của bạn',
    newTitle: 'Hàng mới về', viewAll: 'Xem tất cả',
    liveTitle: 'Mua sắm cùng BaoAnh trên Live',
    liveBody: 'Xem thử đồ trên người thật, hỏi size trực tiếp và nhận ưu đãi chỉ có trong buổi Live.',
    liveSchedule: '[Lịch Live]', remind: 'Nhắc tôi',
    aboutEyebrow: 'Về chúng tôi', aboutTitle: 'Đẹp đơn giản, tự tin mỗi ngày',
    aboutBody: 'Style by BaoAnh chọn lọc thời trang, làm đẹp và phong cách sống cho người phụ nữ biết mình muốn gì. Mỗi món đồ đều được chọn để bạn mặc thoải mái và luôn chỉn chu.',
    v1t: 'Tôn dáng', v1b: 'Form chọn cho vóc dáng phụ nữ trưởng thành.',
    v2t: 'Tư vấn tận tình', v2b: 'Gọi (669) 292-7189 để được chọn size.',
    v3t: 'Tại Houston', v3b: 'Cửa hàng và đội ngũ ở Houston, Texas.',
    newsTitle: 'Nhận tin hàng mới và ưu đãi',
    newsBody: 'Ưu đãi riêng cho khách thân thiết, gửi thẳng vào hộp thư của bạn.',
    subscribe: 'Đăng ký', subscribed: 'Cảm ơn bạn đã đăng ký!', badEmail: 'Vui lòng nhập email hợp lệ.',
    fShop: 'Shop', fNew: 'Mới về', fDresses: 'Đầm', fWork: 'Công sở', fBeauty: 'Beauty',
    help: 'Hỗ trợ', sizeGuide: 'Hướng dẫn chọn size', shipping: 'Giao hàng', returns: 'Đổi trả', contact: 'Liên hệ',
    tagline: 'Thời trang đẹp – Phong cách chất – Tự tin tỏa sáng',
    home: 'Trang chủ', dresses: 'Đầm',
    color: 'Màu', size: 'Size', addToBag: 'Thêm vào giỏ', added: 'Đã thêm ✓', call: 'Gọi tư vấn (669) 292-7189', messenger: 'Nhắn tin Messenger',
    dec: 'Giảm', inc: 'Tăng',
    cart: 'Giỏ hàng', viewCart: 'Xem giỏ hàng →', cartEmpty: 'Giỏ hàng của bạn đang trống.',
    continueShopping: 'Tiếp tục mua sắm', remove: 'Xóa', qtyL: 'Số lượng',
    subtotal: 'Tạm tính', shippingFee: 'Phí giao hàng', total: 'Tổng cộng', free: 'Miễn phí',
    checkout: 'Thanh toán', backToCart: 'Quay lại giỏ hàng',
    contactInfo: 'Thông tin liên hệ', fullName: 'Họ và tên', phone: 'Số điện thoại', emailL: 'Email',
    address: 'Địa chỉ', city: 'Thành phố', stateL: 'Tiểu bang', zip: 'ZIP code',
    cash: 'Tiền mặt khi nhận hàng', cashNote: 'Trả tiền mặt khi nhận hàng hoặc khi lấy tại shop.',
    note: 'Ghi chú (không bắt buộc)', placeOrder: 'Đặt hàng', paidPlaceOrder: 'Tôi đã chuyển tiền – Đặt hàng', orderSummary: 'Đơn hàng của bạn',
    required: 'Vui lòng điền mục này.', badPhone: 'Số điện thoại chưa đúng.',
    thanks: 'Cảm ơn bạn đã đặt hàng!', orderNo: 'Mã đơn hàng',
    sending: 'Đang gửi…', sendFail: 'Chưa gửi được đơn. Vui lòng thử lại hoặc gọi (669) 292-7189.'
  },
  en: {
    topbar: 'Customer service: (669) 292-7189',
    navNew: 'New', navShop: 'Shop', navLive: 'Live', navBeauty: 'Beauty', navSale: 'Sale',
    heroTitle: 'Confidence that shines',
    heroBody: 'Elegant fashion for the modern woman: flattering fits and comfortable fabrics, from the office to the weekend.',
    shopNow: 'Shop now', watchLive: 'Watch Live',
    catEyebrow: 'Shop by category', catTitle: 'Find your style',
    newTitle: 'New arrivals', viewAll: 'View all',
    liveTitle: 'Shop live with BaoAnh',
    liveBody: 'See every piece on a real woman, ask about sizing in real time, and get live-only offers.',
    liveSchedule: '[Live schedule]', remind: 'Remind me',
    aboutEyebrow: 'About us', aboutTitle: 'Simple beauty, everyday confidence',
    aboutBody: 'Style by BaoAnh curates fashion, beauty and lifestyle for women who know what they want. Every piece is chosen to feel comfortable and look put-together.',
    v1t: 'Flattering fits', v1b: 'Cuts chosen for real, grown-up figures.',
    v2t: 'Personal help', v2b: 'Call (669) 292-7189 for sizing advice.',
    v3t: 'Houston based', v3b: 'Our shop and team are in Houston, Texas.',
    newsTitle: 'Get new arrivals and offers',
    newsBody: 'Exclusive offers for our regulars, straight to your inbox.',
    subscribe: 'Subscribe', subscribed: 'Thanks for subscribing!', badEmail: 'Please enter a valid email.',
    fShop: 'Shop', fNew: 'New arrivals', fDresses: 'Dresses', fWork: 'Workwear', fBeauty: 'Beauty',
    help: 'Help', sizeGuide: 'Size guide', shipping: 'Shipping', returns: 'Returns', contact: 'Contact',
    tagline: 'Simple · Elegant · Effortless',
    home: 'Home', dresses: 'Dresses',
    color: 'Color', size: 'Size', addToBag: 'Add to bag', added: 'Added ✓', call: 'Call (669) 292-7189', messenger: 'Message on Messenger',
    dec: 'Decrease', inc: 'Increase',
    cart: 'Bag', viewCart: 'View bag →', cartEmpty: 'Your bag is empty.',
    continueShopping: 'Continue shopping', remove: 'Remove', qtyL: 'Qty',
    subtotal: 'Subtotal', shippingFee: 'Shipping', total: 'Total', free: 'Free',
    checkout: 'Checkout', backToCart: 'Back to bag',
    contactInfo: 'Contact', fullName: 'Full name', phone: 'Phone', emailL: 'Email',
    address: 'Address', city: 'City', stateL: 'State', zip: 'ZIP code',
    cash: 'Cash on delivery', cashNote: 'Pay cash on delivery or at pickup.',
    note: 'Note (optional)', placeOrder: 'Place order', paidPlaceOrder: 'I have paid – Place order', orderSummary: 'Your order',
    required: 'Please fill this in.', badPhone: 'Please enter a valid phone number.',
    thanks: 'Thank you for your order!', orderNo: 'Order number',
    sending: 'Sending…', sendFail: 'Your order could not be sent. Please try again or call (669) 292-7189.'
  }
};

// Home page tiles → shop filters
// Ô danh mục ở trang chủ (Shop by category). img: null = chưa có ảnh, hiện ô màu chờ.
const HOME_TILES = [
  { vi: 'Áo', en: 'Tops', img: null, bg: '#f4e4de', href: 'shop.html?cat=ao' },
  { vi: 'Quần', en: 'Pants', img: null, bg: '#ecdcd3', href: 'shop.html?cat=quan' },
  { vi: 'Set', en: 'Sets', img: null, bg: '#f1ddd5', href: 'shop.html?cat=set' },
  { vi: 'Váy', en: 'Skirts', img: null, bg: '#e9d2cb', href: 'shop.html?cat=vay' },
  { vi: 'Đầm', en: 'Dresses', img: 'images/dam-co-be-khoa-keo-2.webp', bg: '#ecdcd3', href: 'shop.html?cat=dam' }
];

// ---------- helpers ----------
function money(v, placeholder) {
  return typeof v === 'number' ? '$' + v.toFixed(2) : placeholder;
}
function tr(vi, en) { return state.lang === 'vi' ? vi : en; }

// ---------- QR payment ----------
function payName(id) { return PAY_METHODS[id] ? PAY_METHODS[id].name : t('cash'); }
// QR + how to pay. With an order (after checkout) it also shows the amount and the order number for the memo.
function payQrHtml(id, order, placed) {
  const m = PAY_METHODS[id];
  if (!m) return `<p>${escHtml(t('cashNote'))}</p>`;
  const amount = order && typeof order.total === 'number' ? money(order.total) : null;
  const memo = order && order.number;
  const how = placed
    ? tr(`Shop sẽ kiểm tra khoản chuyển <b>${escHtml(amount || '[tổng tiền]')}</b> qua ${m.name} (lời nhắn <b>${escHtml(memo)}</b>) và nhắn tin xác nhận cho bạn. Nếu bạn chưa chuyển, quét mã bên cạnh.`,
         `We will check your <b>${escHtml(amount || '[total]')}</b> ${m.name} payment (note <b>${escHtml(memo)}</b>) and text you to confirm. Not paid yet? Scan the code.`)
    : memo
    ? tr(`Quét mã bằng app ${m.name}, chuyển <b>${escHtml(amount || '[tổng tiền]')}</b> và ghi mã đơn <b>${escHtml(memo)}</b> trong lời nhắn.`,
         `Scan with ${m.name}, send <b>${escHtml(amount || '[total]')}</b> and put <b>${escHtml(memo)}</b> in the note.`)
    : tr(`Sau khi đặt hàng, quét mã bằng app ${m.name} và ghi mã đơn trong lời nhắn.`,
         `After you place the order, scan with ${m.name} and put your order number in the note.`);
  return `<div class="pay-qr">
    <img src="${m.qr}" alt="${escHtml(tr('Mã QR ' + m.name, m.name + ' QR code'))}" width="560" loading="lazy">
    <div class="pay-qr-text">
      <p class="pay-qr-to"><b>${escHtml(m.name)}</b>: ${escHtml(m.to)}<br><span>${escHtml(m.who)}</span></p>
      <p>${how}</p>
      ${m.link ? `<a class="btn btn-outline btn-sm" href="${m.link}" target="_blank" rel="noopener">${escHtml(tr('Mở app ' + m.name, 'Open ' + m.name))}</a>` : ''}
      <p class="muted small">${escHtml(tr('Shop giao hàng sau khi nhận được tiền.', 'We ship once payment arrives.'))}</p>
    </div>
  </div>`;
}
function priceText(p) { return money(p.price, p.sale ? tr('[Giá sale]', '[Sale price]') : tr('[Giá]', '[Price]')); }
// once the real price is set, an unknown original price is simply not shown
function oldPriceText(p) { return p.sale && !(typeof p.price === 'number' && typeof p.oldPrice !== 'number') ? money(p.oldPrice, tr('[Giá gốc]', '[Was]')) : ''; }
function colorName(hex) { return COLOR_NAMES[hex] ? COLOR_NAMES[hex][state.lang] : hex; }
function imageFor(p, hex) { return (COLOR_IMAGES[p.id] && COLOR_IMAGES[p.id][hex]) || p.img; }
function findProduct(id) { return PRODUCTS.find(p => p.id === id); }
function categoryName(id) { const c = CATEGORY_LIST.find(x => x.id === id); return c ? c[state.lang] : id; }
function shipMethod(id) { return SHIPPING_METHODS.find(m => m.id === id) || SHIPPING_METHODS[0]; }
function escHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem('baoanh.' + key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem('baoanh.' + key, JSON.stringify(value)); } catch {}
  }
};

const state = {
  lang: store.get('lang', 'vi'),
  favs: store.get('favs', {}),
  cart: [].concat(store.get('cart', [])).filter(i => i && findProduct(i.id)),
  promo: store.get('promo', ''),
  ship: (SHIPPING_METHODS.find(m => m.id === store.get('ship', '')) || SHIPPING_METHODS[0]).id,
  // state used for tax before the address is entered: the customer's last address, else the shop's
  taxState: normState((store.get('customer', null) || {}).address?.state) || SHOP_STATE
};

// ---------- cart ----------
// Cart items: { id, color, size, qty }
function cartCount() { return state.cart.reduce((n, i) => n + i.qty, 0); }
function cartSubtotal() {
  let sum = 0;
  for (const i of state.cart) {
    const p = findProduct(i.id);
    if (typeof p.price !== 'number') return null;
    sum += p.price * i.qty;
  }
  return sum;
}
function saveCart() { store.set('cart', state.cart); updateCounts(); }

// Promo: returns { ok, code, discount (number|null), message }
function checkPromo(code, subtotal) {
  const key = String(code || '').trim().toUpperCase();
  if (!key) return { ok: false, code: '', discount: 0 };
  const p = PROMO_CODES[key];
  if (!p) return { ok: false, code: key, discount: 0, message: tr('Mã giảm giá không đúng hoặc đã hết hạn.', 'This code is not valid.') };
  if (typeof subtotal !== 'number') return { ok: true, code: key, discount: null };
  if (p.minSubtotal && subtotal < p.minSubtotal) {
    return { ok: false, code: key, discount: 0, message: tr(`Mã này áp dụng cho đơn từ ${money(p.minSubtotal)}.`, `This code needs a ${money(p.minSubtotal)} minimum.`) };
  }
  const discount = p.type === 'percent' ? subtotal * p.value / 100 : Math.min(subtotal, p.value);
  return { ok: true, code: key, discount: Math.round(discount * 100) / 100 };
}

function shippingFor(methodId, subtotalAfterDiscount) {
  const m = shipMethod(methodId);
  if (m.fee === 0) return 0;
  if (typeof FREE_SHIPPING_OVER === 'number' && typeof subtotalAfterDiscount === 'number' && subtotalAfterDiscount >= FREE_SHIPPING_OVER) return 0;
  return m.fee;
}

// Totals for the bag / checkout. Any unknown number makes the total unknown (null).
function normState(s) { const c = String(s || '').trim().toUpperCase(); return US_STATES[c] ? c : ''; }
function taxRateFor(st) { return TAX_BY_STATE[normState(st)] ?? 0; }

function cartTotals(methodId = state.ship, promoCode = state.promo, taxState = state.taxState) {
  const taxRate = taxRateFor(taxState);
  const subtotal = cartSubtotal();
  const promo = checkPromo(promoCode, subtotal);
  const discount = promo.ok ? promo.discount : 0;
  const afterDiscount = (typeof subtotal === 'number' && typeof discount === 'number') ? subtotal - discount : null;
  const shipping = shippingFor(methodId, afterDiscount);
  const taxable = typeof afterDiscount === 'number' && (!TAX_ON_SHIPPING || typeof shipping === 'number')
    ? afterDiscount + (TAX_ON_SHIPPING ? shipping : 0) : null;
  const tax = typeof taxable === 'number' ? Math.round(taxable * taxRate * 100) / 100 : null;
  const total = (typeof afterDiscount === 'number' && typeof shipping === 'number' && typeof tax === 'number')
    ? Math.round((afterDiscount + shipping + tax) * 100) / 100 : null;
  return { subtotal, promo, discount, shipping, tax, total, taxRate, taxState: normState(taxState) };
}

const HEART = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';

function t(key) { return I18N[state.lang][key] ?? key; }

// ---------- shared renderers ----------
// NEW for 2 months after the date it was added; SALE when tagged sale (sale wins)
const NEW_FOR_DAYS = 60;
function isNew(p) {
  const d = p.added ? new Date(p.added + 'T00:00:00') : null;
  return !!d && !isNaN(d) && (Date.now() - d) / 864e5 < NEW_FOR_DAYS;
}
function badgeOf(p) { return p.sale ? 'SALE' : isNew(p) ? 'NEW' : ''; }
function newestFirst(a, b) { return String(b.added || '').localeCompare(String(a.added || '')); }

function productCard(p) {
  const fav = !!state.favs[p.id];
  const other = state.lang === 'vi' ? 'en' : 'vi';
  return `
    <article class="card">
      <div class="card-media" style="background:${p.bg}">
        <a href="product.html?id=${p.id}"><img src="${p.img}" alt="${escHtml(p[state.lang])}" loading="lazy"></a>
        ${badgeOf(p) ? `<span class="badge${p.sale ? ' sale' : ''}">${badgeOf(p)}</span>` : ''}
        <button class="fav" data-id="${p.id}" aria-pressed="${fav}" aria-label="${tr('Yêu thích', 'Save')}">${HEART}</button>
      </div>
      <div class="card-body">
        <a class="name" href="product.html?id=${p.id}">${escHtml(p[state.lang])}</a>
        <div class="sub">${escHtml(p[other])}</div>
        <div class="price-row">
          <span class="price${p.sale ? ' sale' : ''}">${priceText(p)}</span>
          ${p.sale ? `<s class="old-price">${oldPriceText(p)}</s>` : ''}
        </div>
        <div class="dots">${p.dots.map(d => `<span style="background:${d}" title="${escHtml(colorName(d))}"></span>`).join('')}</div>
      </div>
    </article>`;
}

function renderHomeTiles() {
  const el = document.getElementById('cat-grid');
  if (!el) return;
  el.innerHTML = HOME_TILES.map(c => `
    <a class="cat" href="${c.href}">
      ${c.img ? `<img src="${c.img}" alt="${c[state.lang]}" style="background:${c.bg}" loading="lazy">`
        : `<span class="cat-ph" style="background:${c.bg}">${tr('Sắp có hàng', 'Coming soon')}</span>`}
      <span class="cat-name">${c[state.lang]}</span>
    </a>`).join('');
}

function renderHomeProducts() {
  const el = document.getElementById('product-grid');
  if (!el) return;
  const fresh = PRODUCTS.filter(isNew).sort(newestFirst);
  const sec = el.closest('section');
  if (sec) sec.hidden = !fresh.length;
  el.innerHTML = fresh.slice(0, 4).map(productCard).join('');
}

function taxLabel(tt) { return `${tr('Thuế', 'Tax')} ${tt.taxState} (${+(tt.taxRate * 100).toFixed(3)}%)`; }

function updateCounts() {
  const favCount = Object.values(state.favs).filter(Boolean).length;
  document.querySelectorAll('[data-count="fav"]').forEach(el => { el.textContent = favCount; el.dataset.zero = favCount === 0; });
  const bag = cartCount();
  document.querySelectorAll('[data-count="bag"]').forEach(el => { el.textContent = bag; el.dataset.zero = bag === 0; });
}

function applyLang() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  // <span data-en="English">Tiếng Việt</span> — the Vietnamese text is the element's own text
  document.querySelectorAll('[data-en]').forEach(el => {
    if (el.dataset.vi === undefined) el.dataset.vi = el.textContent;
    el.textContent = state.lang === 'vi' ? el.dataset.vi : el.dataset.en;
  });
  document.querySelectorAll('[data-en-placeholder]').forEach(el => {
    if (el.dataset.viPlaceholder === undefined) el.dataset.viPlaceholder = el.placeholder;
    el.placeholder = state.lang === 'vi' ? el.dataset.viPlaceholder : el.dataset.enPlaceholder;
  });
  document.querySelectorAll('.lang-switch button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === state.lang));
  renderHomeTiles();
  renderHomeProducts();
  document.dispatchEvent(new CustomEvent('langchange'));
}

function addToBag(item) {
  const same = state.cart.find(i => i.id === item.id && i.color === item.color && i.size === item.size);
  if (same) same.qty += item.qty;
  else state.cart.push({ ...item });
  saveCart();
}

function toggleFav(id) {
  state.favs[id] = !state.favs[id];
  if (!state.favs[id]) delete state.favs[id];
  store.set('favs', state.favs);
  updateCounts();
  document.dispatchEvent(new CustomEvent('favchange'));
  return !!state.favs[id];
}

document.addEventListener('click', e => {
  const langBtn = e.target.closest('.lang-switch button');
  if (langBtn) {
    state.lang = langBtn.dataset.lang;
    store.set('lang', state.lang);
    applyLang();
    return;
  }
  const fav = e.target.closest('.fav');
  if (fav) {
    fav.setAttribute('aria-pressed', toggleFav(fav.dataset.id));
    return;
  }
  const menu = e.target.closest('.menu-toggle');
  if (menu) {
    const nav = document.getElementById('mobile-nav');
    const open = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', open);
    return;
  }
  if (e.target.closest('#mobile-nav a')) {
    document.getElementById('mobile-nav').classList.remove('open');
    document.querySelector('.menu-toggle')?.setAttribute('aria-expanded', 'false');
  }
});

const newsForm = document.getElementById('news-form');
if (newsForm) {
  newsForm.addEventListener('submit', e => {
    e.preventDefault();
    const input = newsForm.querySelector('input');
    const msg = document.getElementById('news-msg');
    if (!input.checkValidity() || !input.value) { msg.textContent = t('badEmail'); return; }
    // TODO: connect to your email service (Mailchimp, Klaviyo, ...)
    msg.textContent = t('subscribed');
    input.value = '';
  });
}

applyLang();
updateCounts();

// Star rating (fractional fill), e.g. starsHtml(4.5, 16)
let _starId = 0;
function starsHtml(rating, size = 16) {
  return `<span class="stars" role="img" aria-label="${rating.toFixed(1)} / 5">${[1, 2, 3, 4, 5].map(i => {
    const fill = Math.max(0, Math.min(1, rating - i + 1)) * 100;
    const id = 'st' + (++_starId);
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="${id}"><stop offset="${fill}%" stop-color="currentColor"/><stop offset="${fill}%" stop-color="transparent"/></linearGradient></defs><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z" fill="url(#${id})" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
  }).join('')}</span>`;
}
