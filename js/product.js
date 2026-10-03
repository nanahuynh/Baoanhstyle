// PRODUCT: photos + video, price, colour, size, size guide, find my size, details, reviews
import { getReviews, toDate } from './data.js';

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const product = findProduct(params.get('id')) || PRODUCTS[0];
const pdp = { media: 0, color: 0, size: '', qty: 1 };
let reviews = [];
let unit = product.sizeChart && product.sizeChart.unit === 'cm' ? 'cm' : 'in';

// media = the gallery photos (or one photo per colour), plus the video if there is one
function media() {
  const items = product.gallery
    ? product.gallery.map(src => ({ type: 'img', src }))
    : product.dots.map(hex => ({ type: 'img', src: imageFor(product, hex), hex }));
  if (product.video) items.push({ type: 'video', src: product.video });
  return items;
}

// ---------- size chart ----------
// Returns { keys, rows } where each row has a [lo, hi] range in inches per measurement.
// A product's own chart gives single numbers per size (e.g. bust 86 cm); the range
// for each size runs halfway to the neighbouring sizes.
function sizeChart() {
  if (product.sizeChart) {
    const { unit: u, rows } = product.sizeChart;
    const k = u === 'cm' ? 1 / 2.54 : 1;
    const keys = ['bust', 'waist', 'hips'].filter(key => rows.every(r => typeof r[key] === 'number'));
    return {
      keys,
      rows: rows.map((r, i) => {
        const out = { size: r.size, raw: r };
        keys.forEach(key => {
          const v = r[key], prev = rows[i - 1]?.[key], next = rows[i + 1]?.[key];
          const half = (prev != null ? v - prev : next != null ? next - v : 4) / 2;
          const halfUp = (next != null ? next - v : prev != null ? v - prev : 4) / 2;
          out[key] = [(v - half) * k, (v + halfUp) * k];
        });
        return out;
      })
    };
  }
  return { keys: ['bust', 'waist', 'hips'], rows: SIZE_CHART.filter(r => product.sizes.includes(r.size)) };
}

// ---------- find my size ----------
function suggestSize(m) {
  const { keys: chartKeys, rows: chart } = sizeChart();
  const keys = chartKeys.filter(k => m[k] > 0);
  if (!keys.length || !chart.length) return null;
  let best = null;
  chart.forEach((row, idx) => {
    let score = 0;
    keys.forEach(k => {
      const [lo, hi] = row[k];
      if (m[k] < lo) score += lo - m[k];
      else if (m[k] > hi) score += (m[k] - hi) * 1.5;   // too tight is worse than too loose
    });
    if (!best || score < best.score || (score === best.score && idx > best.idx)) best = { size: row.size, score, idx };
  });
  const last = chart[chart.length - 1];
  const tooBig = keys.some(k => m[k] > last[k][1] + 1);
  const tooSmall = keys.every(k => m[k] < chart[0][k][0] - 1);
  return { size: best.size, exact: best.score === 0, tooBig, tooSmall };
}

function savedFit() { return store.get('fit', null); }

function renderSizeHint() {
  const fit = savedFit();
  const s = fit ? suggestSize(fit) : null;
  $('size-hint').innerHTML = s && !s.tooBig && !s.tooSmall
    ? tr(`Gợi ý theo số đo của bạn: <b>${s.size}</b>`, `Based on your measurements: <b>${s.size}</b>`)
    : '';
}

// ---------- render ----------
function render() {
  const other = state.lang === 'vi' ? 'en' : 'vi';
  const name = product[state.lang];
  const items = media();
  const cur = items[pdp.media] || items[0];
  document.title = `${name} — Style by BaoAnh`;
  $('crumb-cat').textContent = categoryName(product.category);
  $('crumb-cat').href = `shop.html?cat=${product.category}`;
  $('crumb-name').textContent = name;
  $('p-name').textContent = name;
  $('p-sub').textContent = product[other];
  $('p-price').textContent = priceText(product);
  $('p-price').classList.toggle('sale', !!product.sale);
  $('p-old').textContent = oldPriceText(product);
  $('main-badge').textContent = product.badge;
  $('main-badge').classList.toggle('sale', !!product.sale);

  const isVideo = cur.type === 'video';
  $('main-img').hidden = isVideo;
  $('main-video').hidden = !isVideo;
  if (isVideo) { if ($('main-video').getAttribute('src') !== cur.src) $('main-video').src = cur.src; }
  else {
    $('main-video').pause?.();
    $('main-img').src = cur.src;
    $('main-img').alt = `${name} — ${colorName(product.dots[pdp.color])}`;
  }

  $('thumbs').innerHTML = items.map((m, i) => m.type === 'img'
    ? `<button data-media="${i}" aria-pressed="${i === pdp.media}" aria-label="${escHtml(m.hex ? colorName(m.hex) : tr('Ảnh', 'Photo') + ' ' + (i + 1))}"><img src="${m.src}" alt=""></button>`
    : `<button data-media="${i}" aria-pressed="${i === pdp.media}" aria-label="Video" class="thumb-video"><svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg><span>Video</span></button>`).join('');

  $('color-name').textContent = colorName(product.dots[pdp.color]);
  $('swatches').innerHTML = product.dots.map((h, i) => `
    <button data-color="${i}" aria-pressed="${i === pdp.color}" aria-label="${escHtml(colorName(h))}"><span style="background:${h}"></span></button>`).join('');

  $('size-name').textContent = pdp.size || tr('chưa chọn', 'not selected');
  $('sizes').innerHTML = product.sizes.map(s => `<button data-size="${s}" aria-pressed="${s === pdp.size}">${s}</button>`).join('');
  renderSizeHint();

  $('qty').textContent = pdp.qty;
  $('qty-dec').setAttribute('aria-label', t('dec'));
  $('qty-inc').setAttribute('aria-label', t('inc'));
  $('pdp-fav').innerHTML = HEART;
  $('pdp-fav').dataset.id = product.id;
  $('pdp-fav').setAttribute('aria-pressed', !!state.favs[product.id]);
  $('pdp-fav').setAttribute('aria-label', tr('Thêm vào yêu thích', 'Add to wishlist'));

  const d = product.details || {};
  $('d-description').textContent = d.description || '';
  $('d-material').textContent = d.material || '';
  $('d-fit').textContent = d.fit || '';
  $('d-care').textContent = d.care || '';
  $('d-delivery').innerHTML = `<b>${tr('Giao hàng', 'Delivery')}:</b> ${escHtml(tr(POLICY.deliveryVi, POLICY.deliveryEn))}`;
  $('d-returns').innerHTML = `<b>${tr('Đổi trả', 'Returns')}:</b> ${escHtml(tr(POLICY.returnsVi, POLICY.returnsEn))}`;

  renderSizeTable();
  renderReviews();
}

function renderSizeTable() {
  const { keys, rows } = sizeChart();
  const label = { bust: tr('Ngực', 'Bust'), waist: tr('Eo', 'Waist'), hips: tr('Hông', 'Hips') };
  const own = product.sizeChart;
  // own chart: show the shop's exact numbers; shared chart: show the range
  const cell = (r, k) => {
    if (own) {
      const v = r.raw[k];
      const cm = own.unit === 'cm' ? v : v * 2.54;
      return unit === 'cm' ? String(Math.round(cm)) : (cm / 2.54).toFixed(1);
    }
    const [a, b] = r[k];
    return unit === 'cm' ? `${Math.round(a * 2.54)}–${Math.round(b * 2.54)}` : `${a}–${b}`;
  };
  $('size-table').innerHTML = `
    <thead><tr><th>Size</th>${keys.map(k => `<th>${label[k]} (${unit})</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr><th>${r.size}</th>${keys.map(k => `<td>${cell(r, k)}</td>`).join('')}</tr>`).join('')}</tbody>`;
  // Find My Size only asks for what this chart measures
  ['bust', 'waist', 'hips'].forEach(k => { $('fit-' + k).closest('.field').hidden = !keys.includes(k); });
  document.querySelectorAll('[data-unit]').forEach(b => b.setAttribute('aria-pressed', b.dataset.unit === unit));
}

function renderReviews() {
  const n = reviews.length;
  const avg = n ? reviews.reduce((s, r) => s + r.rating, 0) / n : 0;
  $('rating-link').innerHTML = n
    ? `${starsHtml(avg, 14)} <span>${avg.toFixed(1)} · ${n} ${tr('đánh giá', n === 1 ? 'review' : 'reviews')}</span>`
    : `<span>${tr('Chưa có đánh giá', 'No reviews yet')}</span>`;
  const dist = [5, 4, 3, 2, 1].map(s => [s, reviews.filter(r => r.rating === s).length]);
  $('reviews-summary').innerHTML = n ? `
    <div class="avg"><span class="avg-num">${avg.toFixed(1)}</span>${starsHtml(avg, 20)}<span class="muted">${n} ${tr('đánh giá', n === 1 ? 'review' : 'reviews')}</span></div>
    <div class="dist">${dist.map(([s, c]) => `<div class="dist-row"><span>${s}★</span><span class="bar"><span style="width:${n ? c / n * 100 : 0}%"></span></span><span>${c}</span></div>`).join('')}</div>`
    : `<p class="muted">${tr('Sản phẩm này chưa có đánh giá.', 'No reviews for this piece yet.')}</p>`;
  $('review-list').innerHTML = reviews.map(r => {
    const d = toDate(r.createdAt);
    return `<li class="review">
      <div class="review-top">${starsHtml(r.rating, 14)}<span class="review-name">${escHtml(r.name || tr('Khách hàng', 'Customer'))}</span><span class="verified">✓ ${tr('Đã mua hàng', 'Verified buyer')}</span></div>
      ${r.size ? `<div class="muted review-meta">${tr('Size đã mua', 'Size bought')}: ${escHtml(r.size)}${d ? ' · ' + d.toLocaleDateString(state.lang === 'vi' ? 'vi-VN' : 'en-US') : ''}</div>` : ''}
      <p>${escHtml(r.text)}</p>
    </li>`;
  }).join('');
}

// ---------- events ----------
document.addEventListener('click', e => {
  const m = e.target.closest('[data-media]');
  if (m) {
    pdp.media = +m.dataset.media;
    const item = media()[pdp.media];
    if (item.type === 'img' && item.hex) pdp.color = product.dots.indexOf(item.hex);
    return render();
  }
  const c = e.target.closest('[data-color]');
  if (c) { pdp.color = +c.dataset.color; if (!product.gallery) pdp.media = pdp.color; return render(); }
  const s = e.target.closest('[data-size]');
  if (s) { pdp.size = s.dataset.size; $('add-error').textContent = ''; return render(); }
  if (e.target.closest('[data-close]')) return e.target.closest('dialog').close();
  const u = e.target.closest('[data-unit]');
  if (u) {
    const next = u.dataset.unit;
    if (next === unit) return;
    ['fit-bust', 'fit-waist', 'fit-hips'].forEach(id => {
      const v = parseFloat($(id).value);
      if (v > 0) $(id).value = next === 'cm' ? Math.round(v * 2.54) : Math.round(v / 2.54 * 2) / 2;
    });
    unit = next;
    document.querySelectorAll('[data-unit]').forEach(b => b.setAttribute('aria-pressed', b.dataset.unit === unit));
    renderSizeTable();
    return;
  }
  const pick = e.target.closest('[data-pick-size]');
  if (pick) { pdp.size = pick.dataset.pickSize; $('dlg-fit').close(); $('add-error').textContent = ''; render(); }
});
$('qty-dec').addEventListener('click', () => { pdp.qty = Math.max(1, pdp.qty - 1); render(); });
$('qty-inc').addEventListener('click', () => { pdp.qty += 1; render(); });
$('add-btn').addEventListener('click', () => {
  if (!pdp.size) {
    $('add-error').textContent = tr('Vui lòng chọn size.', 'Please choose a size.');
    $('sizes').querySelector('button')?.focus();
    return;
  }
  addToBag({ id: product.id, color: product.dots[pdp.color], size: pdp.size, qty: pdp.qty });
  const btn = $('add-btn');
  btn.textContent = t('added');
  $('added-msg').hidden = false;
  setTimeout(() => { btn.textContent = t('addToBag'); }, 1800);
});
$('open-guide').addEventListener('click', () => $('dlg-guide').showModal());
$('open-fit').addEventListener('click', () => openFit());
$('guide-to-fit').addEventListener('click', () => { $('dlg-guide').close(); openFit(); });

function openFit() {
  const fit = savedFit();
  if (fit) {
    const k = unit === 'cm' ? 2.54 : 1;
    if (fit.bust) $('fit-bust').value = Math.round(fit.bust * k * 2) / 2;
    if (fit.waist) $('fit-waist').value = Math.round(fit.waist * k * 2) / 2;
    if (fit.hips) $('fit-hips').value = Math.round(fit.hips * k * 2) / 2;
  }
  $('dlg-fit').showModal();
}

$('fit-form').addEventListener('submit', e => {
  e.preventDefault();
  const k = unit === 'cm' ? 1 / 2.54 : 1;
  const m = {
    bust: (parseFloat($('fit-bust').value) || 0) * k,
    waist: (parseFloat($('fit-waist').value) || 0) * k,
    hips: (parseFloat($('fit-hips').value) || 0) * k
  };
  const out = $('fit-result');
  out.hidden = false;
  const s = suggestSize(m);
  if (!s) { out.innerHTML = `<p>${tr('Nhập ít nhất một số đo.', 'Enter at least one measurement.')}</p>`; return; }
  store.set('fit', m);
  if (s.tooBig || s.tooSmall) {
    out.innerHTML = `<p>${tr('Số đo của bạn nằm ngoài bảng size của mẫu này. Gọi shop để được tư vấn:', 'Your measurements are outside this piece’s size range. Call us for advice:')} <a href="tel:+16692927189">(669) 292-7189</a></p>`;
    return;
  }
  out.innerHTML = `
    <p class="fit-size">${tr('Size đề xuất', 'Recommended size')}: <b>${s.size}</b></p>
    <p class="muted">${s.exact ? tr('Số đo của bạn nằm gọn trong size này.', 'Your measurements sit within this size.') : tr('Gần nhất với số đo của bạn. Nếu thích mặc rộng, chọn lớn hơn một size.', 'The closest match. Prefer a looser fit? Go one size up.')}</p>
    <button type="button" class="btn btn-primary btn-block" data-pick-size="${s.size}">${tr('Chọn size', 'Choose size')} ${s.size}</button>`;
  renderSizeHint();
});

document.addEventListener('langchange', render);
document.addEventListener('favchange', () => $('pdp-fav').setAttribute('aria-pressed', !!state.favs[product.id]));

if (location.hash === '#size-guide') $('dlg-guide').showModal();
render();
getReviews(product.id).then(r => {
  reviews = r;
  renderReviews();
  if (location.hash === '#reviews') $('reviews').scrollIntoView();
}).catch(() => {});
