// Product detail page — reads ?id=a|b|c|d, defaults to the first product

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

const params = new URLSearchParams(location.search);
const product = findProduct(params.get('id')) || PRODUCTS[0];
const pdp = { color: 0, size: 'M', qty: 1 };

const $ = id => document.getElementById(id);

function renderPdp() {
  const other = state.lang === 'vi' ? 'en' : 'vi';
  const name = product[state.lang];
  const hex = product.dots[pdp.color];
  document.title = `${name} — Style by BaoAnh Closet`;
  $('crumb-name').textContent = name;
  $('p-name').textContent = name;
  $('p-sub').textContent = product[other];
  $('p-price').textContent = priceText(product);
  $('p-price').classList.toggle('sale', !!product.sale);
  $('main-badge').textContent = product.badge;
  $('main-badge').classList.toggle('sale', !!product.sale);
  $('main-img').src = imageFor(product, hex);
  $('main-img').alt = `${name} — ${colorName(hex)}`;
  $('color-name').textContent = colorName(hex);

  $('thumbs').innerHTML = product.dots.map((h, i) => `
    <button data-color="${i}" aria-pressed="${i === pdp.color}" aria-label="${colorName(h)}">
      <img src="${imageFor(product, h)}" alt="">
    </button>`).join('');
  $('swatches').innerHTML = product.dots.map((h, i) => `
    <button data-color="${i}" aria-pressed="${i === pdp.color}" aria-label="${colorName(h)}">
      <span style="background:${h}"></span>
    </button>`).join('');
  $('sizes').innerHTML = SIZES.map(s => `<button data-size="${s}" aria-pressed="${s === pdp.size}">${s}</button>`).join('');
  $('qty').textContent = pdp.qty;
  $('qty-dec').setAttribute('aria-label', t('dec'));
  $('qty-inc').setAttribute('aria-label', t('inc'));
}

document.addEventListener('click', e => {
  const c = e.target.closest('[data-color]');
  if (c) { pdp.color = +c.dataset.color; renderPdp(); return; }
  const s = e.target.closest('[data-size]');
  if (s) { pdp.size = s.dataset.size; renderPdp(); return; }
});
$('qty-dec').addEventListener('click', () => { pdp.qty = Math.max(1, pdp.qty - 1); renderPdp(); });
$('qty-inc').addEventListener('click', () => { pdp.qty += 1; renderPdp(); });
$('add-btn').addEventListener('click', () => {
  addToBag({ id: product.id, color: product.dots[pdp.color], size: pdp.size, qty: pdp.qty });
  const btn = $('add-btn');
  btn.textContent = t('added');
  $('added-msg').hidden = false;
  setTimeout(() => { btn.textContent = t('addToBag'); }, 1800);
});

document.addEventListener('langchange', renderPdp);
renderPdp();
