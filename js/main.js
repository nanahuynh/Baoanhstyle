// Style by BaoAnh Closet — shared site script

const I18N = {
  vi: {
    topbar: 'Chăm sóc khách hàng · Customer service: (669) 292-7189',
    navNew: 'Mới về', navShop: 'Shop', navLive: 'Live', navBeauty: 'Beauty', navSale: 'Sale',
    heroTitle: 'Tự tin tỏa sáng',
    heroBody: 'Thời trang thanh lịch cho người phụ nữ hiện đại: form tôn dáng, chất liệu dễ chịu, mặc đẹp từ công sở đến dạo phố.',
    shopNow: 'Mua ngay', watchLive: 'Xem Live',
    catEyebrow: 'Shop by category', catTitle: 'Chọn phong cách của bạn',
    newTitle: 'Hàng mới về tuần này', viewAll: 'Xem tất cả',
    liveTitle: 'Mua sắm cùng BaoAnh trên Live',
    liveBody: 'Xem thử đồ trên người thật, hỏi size trực tiếp và nhận ưu đãi chỉ có trong buổi Live.',
    liveSchedule: '[Lịch Live]', remind: 'Nhắc tôi',
    aboutEyebrow: 'Về chúng tôi', aboutTitle: 'Đẹp đơn giản, tự tin mỗi ngày',
    aboutBody: 'Style by BaoAnh Closet chọn lọc thời trang, làm đẹp và phong cách sống cho người phụ nữ biết mình muốn gì. Mỗi món đồ đều được chọn để bạn mặc thoải mái và luôn chỉn chu.',
    v1t: 'Tôn dáng', v1b: 'Form chọn cho vóc dáng phụ nữ trưởng thành.',
    v2t: 'Tư vấn tận tình', v2b: 'Gọi (669) 292-7189 để được chọn size.',
    v3t: 'Tại Houston', v3b: 'Cửa hàng và đội ngũ ở Houston, Texas.',
    newsTitle: 'Nhận tin hàng mới và lịch Live',
    newsBody: 'Ưu đãi riêng cho khách thân thiết, gửi thẳng vào hộp thư của bạn.',
    subscribe: 'Đăng ký', subscribed: 'Cảm ơn bạn đã đăng ký!', badEmail: 'Vui lòng nhập email hợp lệ.',
    fShop: 'Shop', fNew: 'Mới về', fDresses: 'Đầm', fWork: 'Công sở', fBeauty: 'Beauty',
    help: 'Hỗ trợ', sizeGuide: 'Hướng dẫn chọn size', shipping: 'Giao hàng', returns: 'Đổi trả', contact: 'Liên hệ',
    tagline: 'Thời trang đẹp – Phong cách chất – Tự tin tỏa sáng',
    // product page
    home: 'Trang chủ', dresses: 'Đầm', price: '[Giá]',
    desc: '[Mô tả sản phẩm: chất liệu, form dáng, dịp mặc.]',
    color: 'Màu', size: 'Size', addToBag: 'Thêm vào giỏ', added: 'Đã thêm ✓', call: 'Gọi tư vấn (669) 292-7189', messenger: 'Nhắn tin Messenger',
    acc1t: 'Chất liệu & bảo quản', acc1b: '[Thành phần vải, cách giặt]',
    acc2t: 'Số đo & form', acc2b: '[Bảng số đo theo size]',
    acc3t: 'Giao hàng & đổi trả', acc3b: '[Chính sách của shop]',
    dec: 'Giảm', inc: 'Tăng',
    // cart & checkout
    cart: 'Giỏ hàng', viewCart: 'Xem giỏ hàng →', cartEmpty: 'Giỏ hàng của bạn đang trống.',
    continueShopping: 'Tiếp tục mua sắm', remove: 'Xóa', qtyL: 'Số lượng',
    subtotal: 'Tạm tính', shippingFee: 'Phí giao hàng', total: 'Tổng cộng', free: 'Miễn phí',
    shipLater: 'Tính ở bước thanh toán', checkout: 'Thanh toán', backToCart: 'Quay lại giỏ hàng',
    contactInfo: 'Thông tin liên hệ', fullName: 'Họ và tên', phone: 'Số điện thoại', emailL: 'Email',
    delivery: 'Cách nhận hàng', ship: 'Giao tận nơi', pickup: 'Nhận tại shop (Houston, TX)',
    address: 'Địa chỉ', city: 'Thành phố', stateL: 'Tiểu bang', zip: 'ZIP code',
    payment: 'Thanh toán bằng', zelleNote: 'Chuyển Zelle tới [Zelle của shop], ghi mã đơn trong lời nhắn.',
    venmoNote: 'Chuyển Venmo tới [@Venmo của shop], ghi mã đơn trong lời nhắn.',
    cash: 'Tiền mặt khi nhận hàng', cashNote: 'Trả tiền mặt khi nhận hàng hoặc khi lấy tại shop.',
    note: 'Ghi chú (không bắt buộc)', placeOrder: 'Đặt hàng', orderSummary: 'Đơn hàng của bạn',
    required: 'Vui lòng điền mục này.', badPhone: 'Số điện thoại chưa đúng.',
    thanks: 'Cảm ơn bạn đã đặt hàng!', orderNo: 'Mã đơn hàng',
    thanksBody: 'Shop sẽ gọi hoặc nhắn tin cho bạn sớm nhất để xác nhận đơn và hướng dẫn thanh toán. Cần gấp, gọi (669) 292-7189.',
    sending: 'Đang gửi…', sendFail: 'Chưa gửi được đơn. Vui lòng thử lại hoặc gọi (669) 292-7189.'
  },
  en: {
    topbar: 'Customer service: (669) 292-7189',
    navNew: 'New', navShop: 'Shop', navLive: 'Live', navBeauty: 'Beauty', navSale: 'Sale',
    heroTitle: 'Confidence that shines',
    heroBody: 'Elegant fashion for the modern woman: flattering fits and comfortable fabrics, from the office to the weekend.',
    shopNow: 'Shop now', watchLive: 'Watch Live',
    catEyebrow: 'Shop by category', catTitle: 'Find your style',
    newTitle: 'New this week', viewAll: 'View all',
    liveTitle: 'Shop live with BaoAnh',
    liveBody: 'See every piece on a real woman, ask about sizing in real time, and get live-only offers.',
    liveSchedule: '[Live schedule]', remind: 'Remind me',
    aboutEyebrow: 'About us', aboutTitle: 'Simple beauty, everyday confidence',
    aboutBody: 'Style by BaoAnh Closet curates fashion, beauty and lifestyle for women who know what they want. Every piece is chosen to feel comfortable and look put-together.',
    v1t: 'Flattering fits', v1b: 'Cuts chosen for real, grown-up figures.',
    v2t: 'Personal help', v2b: 'Call (669) 292-7189 for sizing advice.',
    v3t: 'Houston based', v3b: 'Our shop and team are in Houston, Texas.',
    newsTitle: 'Get new arrivals and Live dates',
    newsBody: 'Exclusive offers for our regulars, straight to your inbox.',
    subscribe: 'Subscribe', subscribed: 'Thanks for subscribing!', badEmail: 'Please enter a valid email.',
    fShop: 'Shop', fNew: 'New arrivals', fDresses: 'Dresses', fWork: 'Workwear', fBeauty: 'Beauty',
    help: 'Help', sizeGuide: 'Size guide', shipping: 'Shipping', returns: 'Returns', contact: 'Contact',
    tagline: 'Simple · Elegant · Effortless',
    home: 'Home', dresses: 'Dresses', price: '[Price]',
    desc: '[Product description: fabric, fit, occasion.]',
    color: 'Color', size: 'Size', addToBag: 'Add to bag', added: 'Added ✓', call: 'Call (669) 292-7189', messenger: 'Message on Messenger',
    acc1t: 'Fabric & care', acc1b: '[Fabric content, care]',
    acc2t: 'Measurements & fit', acc2b: '[Size chart]',
    acc3t: 'Shipping & returns', acc3b: '[Store policy]',
    dec: 'Decrease', inc: 'Increase',
    cart: 'Bag', viewCart: 'View bag →', cartEmpty: 'Your bag is empty.',
    continueShopping: 'Continue shopping', remove: 'Remove', qtyL: 'Qty',
    subtotal: 'Subtotal', shippingFee: 'Shipping', total: 'Total', free: 'Free',
    shipLater: 'Calculated at checkout', checkout: 'Checkout', backToCart: 'Back to bag',
    contactInfo: 'Contact', fullName: 'Full name', phone: 'Phone', emailL: 'Email',
    delivery: 'Delivery', ship: 'Ship to me', pickup: 'Pick up in store (Houston, TX)',
    address: 'Address', city: 'City', stateL: 'State', zip: 'ZIP code',
    payment: 'Payment', zelleNote: 'Send Zelle to [shop Zelle], with your order number in the memo.',
    venmoNote: 'Send Venmo to [shop @Venmo], with your order number in the note.',
    cash: 'Cash on delivery', cashNote: 'Pay cash on delivery or at pickup.',
    note: 'Note (optional)', placeOrder: 'Place order', orderSummary: 'Your order',
    required: 'Please fill this in.', badPhone: 'Please enter a valid phone number.',
    thanks: 'Thank you for your order!', orderNo: 'Order number',
    thanksBody: 'We will call or text you shortly to confirm your order and payment. Need help now? Call (669) 292-7189.',
    sending: 'Sending…', sendFail: 'Your order could not be sent. Please try again or call (669) 292-7189.'
  }
};

const CATEGORIES = [
  { vi: 'Dự tiệc', en: 'Occasion', img: 'images/dam-cape-vai.jpg', bg: '#f1ddd5' },
  { vi: 'Công sở', en: 'Workwear', img: 'images/dam-den-nhun-eo.jpg', bg: '#ecdcd3' },
  { vi: 'Áo & Set', en: 'Tops & sets', img: 'images/set-ao-lua-sequin.jpg', bg: '#f4e4de' },
  { vi: 'Dạo phố', en: 'Casual', img: 'images/dam-suong-day-rut.jpg', bg: '#e9d2cb' }
];

// ===== SHOP SETTINGS: điền giá thật vào đây =====
// price: giá bán (số, USD), vd 48 → hiện "$48.00". Để null thì hiện chữ tạm [Giá].
// oldPrice: giá gốc khi sale (số hoặc null).
const PRODUCTS = [
  { id: 'a', vi: 'Đầm cape vai đính cài', en: 'Cape-sleeve midi dress', badge: 'NEW', img: 'images/dam-cape-vai.jpg', bg: '#f1ddd5', dots: ['#efe3cf', '#2f2a28'], price: null },
  { id: 'b', vi: 'Đầm đen nhún eo đính cài', en: 'Black ruched midi dress', badge: 'SALE', img: 'images/dam-den-nhun-eo.jpg', bg: '#ecdcd3', dots: ['#2f2a28', '#efe3cf'], price: null, oldPrice: null, sale: true },
  { id: 'c', vi: 'Set áo lụa đính hoa & chân váy sequin', en: 'Rose blouse & sequin skirt set', badge: 'LIVE', img: 'images/set-ao-lua-sequin.jpg', bg: '#f4e4de', dots: ['#f7f2e8'], price: null },
  { id: 'd', vi: 'Đầm suông dây rút eo', en: 'Sleeveless drawstring dress', badge: 'NEW', img: 'images/dam-suong-day-rut.jpg', bg: '#e9d2cb', dots: ['#f3ede2'], price: null }
];
// Phí giao hàng (USD). null = chưa có, sẽ hiện [Phí ship]. Nhận tại shop luôn miễn phí.
const SHIPPING_FEE = null;
// Đơn hàng gửi về đâu: dán link Formspree (https://formspree.io) hoặc API của bạn vào đây.
// Để trống thì đơn chỉ lưu trên trình duyệt của khách, shop KHÔNG nhận được.
const ORDER_ENDPOINT = '';

const COLOR_NAMES = {
  '#efe3cf': { vi: 'Be', en: 'Beige' },
  '#2f2a28': { vi: 'Đen', en: 'Black' },
  '#f7f2e8': { vi: 'Trắng kem', en: 'Cream' },
  '#f3ede2': { vi: 'Trắng ngà', en: 'Ivory' }
};
// Ảnh theo từng màu. Thêm ảnh ở đây khi có.
const COLOR_IMAGES = {
  a: { '#efe3cf': 'images/dam-cape-vai.jpg', '#2f2a28': 'images/dam-den-nhun-eo.jpg' },
  b: { '#2f2a28': 'images/dam-den-nhun-eo.jpg', '#efe3cf': 'images/dam-cape-vai.jpg' }
};

function money(v, placeholder) {
  return typeof v === 'number' ? '$' + v.toFixed(2) : placeholder;
}
function priceText(p) { return money(p.price, p.sale ? '[Giá sale]' : '[Giá]'); }
function oldPriceText(p) { return p.sale ? money(p.oldPrice, '[Giá gốc]') : ''; }
function colorName(hex) { return COLOR_NAMES[hex] ? COLOR_NAMES[hex][state.lang] : hex; }
function imageFor(p, hex) { return (COLOR_IMAGES[p.id] && COLOR_IMAGES[p.id][hex]) || p.img; }
function findProduct(id) { return PRODUCTS.find(p => p.id === id); }

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
  cart: [].concat(store.get('cart', [])).filter(i => i && findProduct(i.id))
};

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

const HEART = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';

function t(key) { return I18N[state.lang][key] ?? key; }

function renderCategories() {
  const el = document.getElementById('cat-grid');
  if (!el) return;
  el.innerHTML = CATEGORIES.map(c => `
    <a class="cat" href="#new">
      <img src="${c.img}" alt="${c[state.lang]}" style="background:${c.bg}" loading="lazy">
      <span>${c[state.lang]}</span>
    </a>`).join('');
}

function renderProducts() {
  const el = document.getElementById('product-grid');
  if (!el) return;
  const other = state.lang === 'vi' ? 'en' : 'vi';
  el.innerHTML = PRODUCTS.map(p => {
    const fav = !!state.favs[p.id];
    return `
    <article class="card">
      <div class="card-media" style="background:${p.bg}">
        <a href="product.html?id=${p.id}"><img src="${p.img}" alt="${p[state.lang]}" loading="lazy"></a>
        <span class="badge${p.sale ? ' sale' : ''}">${p.badge}</span>
        <button class="fav" data-id="${p.id}" aria-pressed="${fav}" aria-label="${state.lang === 'vi' ? 'Yêu thích' : 'Save'}">${HEART}</button>
      </div>
      <div class="card-body">
        <a class="name" href="product.html?id=${p.id}">${p[state.lang]}</a>
        <div class="sub">${p[other]}</div>
        <div class="price-row">
          <span class="price${p.sale ? ' sale' : ''}">${priceText(p)}</span>
          ${p.sale ? `<s class="old-price">${oldPriceText(p)}</s>` : ''}
        </div>
        <div class="dots">${p.dots.map(d => `<span style="background:${d}"></span>`).join('')}</div>
      </div>
    </article>`;
  }).join('');
}

function updateCounts() {
  const favCount = Object.values(state.favs).filter(Boolean).length;
  document.querySelectorAll('[data-count="fav"]').forEach(el => { el.textContent = favCount; el.dataset.zero = favCount === 0; });
  const bag = cartCount();
  document.querySelectorAll('[data-count="bag"]').forEach(el => { el.textContent = bag; el.dataset.zero = bag === 0; });
}

function applyLang() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('.lang-switch button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === state.lang));
  renderCategories();
  renderProducts();
  document.dispatchEvent(new CustomEvent('langchange'));
}

function addToBag(item) {
  const same = state.cart.find(i => i.id === item.id && i.color === item.color && i.size === item.size);
  if (same) same.qty += item.qty;
  else state.cart.push({ ...item });
  saveCart();
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
    const id = fav.dataset.id;
    state.favs[id] = !state.favs[id];
    store.set('favs', state.favs);
    fav.setAttribute('aria-pressed', state.favs[id]);
    updateCounts();
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
