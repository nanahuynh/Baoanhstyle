// SHOP → CATEGORY → FILTER (Size / Color / Price / Occasion)

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const list = key => (params.get(key) || '').split(',').filter(Boolean);

const f = {
  cat: params.get('cat') || '',
  sale: params.get('sale') === '1',
  size: new Set(list('size')),
  color: new Set(list('color')),
  price: new Set(list('price')),
  occasion: new Set(list('occasion')),
  sort: params.get('sort') || 'featured'
};

const ALL_SIZES = [...new Set(PRODUCTS.flatMap(p => p.sizes))];
const ALL_COLORS = [...new Set(PRODUCTS.flatMap(p => p.dots))];

function matches(p, skip) {
  if (f.cat && p.category !== f.cat) return false;
  if (f.sale && !p.sale) return false;
  if (skip !== 'size' && f.size.size && !p.sizes.some(s => f.size.has(s))) return false;
  if (skip !== 'color' && f.color.size && !p.dots.some(c => f.color.has(colorName(c)) || f.color.has(c))) return false;
  if (skip !== 'occasion' && f.occasion.size && !p.occasions.some(o => f.occasion.has(o))) return false;
  if (skip !== 'price' && f.price.size) {
    if (typeof p.price !== 'number') return false;
    if (!PRICE_RANGES.some(r => f.price.has(r.id) && p.price >= r.min && p.price < r.max)) return false;
  }
  return true;
}

function sorted(items) {
  const byPrice = dir => (a, b) => {
    const x = typeof a.price === 'number' ? a.price : null, y = typeof b.price === 'number' ? b.price : null;
    if (x === null && y === null) return 0;
    if (x === null) return 1;
    if (y === null) return -1;
    return dir * (x - y);
  };
  const out = items.slice();
  if (f.sort === 'new') out.sort((a, b) => (b.badge === 'NEW') - (a.badge === 'NEW'));
  if (f.sort === 'price-asc') out.sort(byPrice(1));
  if (f.sort === 'price-desc') out.sort(byPrice(-1));
  return out;
}

function syncUrl() {
  const q = new URLSearchParams();
  if (f.cat) q.set('cat', f.cat);
  if (f.sale) q.set('sale', '1');
  ['size', 'color', 'price', 'occasion'].forEach(k => { if (f[k].size) q.set(k, [...f[k]].join(',')); });
  if (f.sort !== 'featured') q.set('sort', f.sort);
  history.replaceState(null, '', 'shop.html' + (q.toString() ? '?' + q : ''));
}

function chip(group, value, label, extra = '') {
  const on = f[group].has(value);
  const count = PRODUCTS.filter(p => matches(p, group) && (
    group === 'size' ? p.sizes.includes(value)
    : group === 'color' ? p.dots.some(c => colorName(c) === value || c === value)
    : group === 'occasion' ? p.occasions.includes(value)
    : typeof p.price === 'number' && PRICE_RANGES.some(r => r.id === value && p.price >= r.min && p.price < r.max)
  )).length;
  return `<button type="button" class="chip" data-group="${group}" data-value="${escHtml(value)}" aria-pressed="${on}"${!count && !on ? ' data-empty="true"' : ''}>${extra}${escHtml(label)}<span class="chip-n">${count}</span></button>`;
}

function render() {
  // category tabs
  const tabs = [{ id: '', vi: 'Tất cả', en: 'All' }, ...CATEGORY_LIST];
  $('cat-tabs').innerHTML = tabs.map(c => `<button type="button" role="tab" data-cat="${c.id}" aria-selected="${f.cat === c.id}">${c[state.lang]}</button>`).join('')
    + `<button type="button" role="tab" data-sale="1" aria-selected="${f.sale}" class="sale">Sale</button>`;

  const title = f.sale ? 'Sale' : f.cat ? categoryName(f.cat) : tr('Tất cả sản phẩm', 'All pieces');
  $('shop-title').textContent = title;
  $('crumb-cat').textContent = f.cat || f.sale ? ' / ' + title : '';
  document.title = `${title} — Style by BaoAnh`;

  // filters (colour values are the localised names so Be/Beige stay one chip)
  $('f-size').innerHTML = ALL_SIZES.map(s => chip('size', s, s)).join('');
  const colorNames = [...new Map(ALL_COLORS.map(c => [colorName(c), c])).entries()];
  $('f-color').innerHTML = colorNames.map(([name, hex]) => chip('color', name, name, `<span class="swatch-dot" style="background:${hex}"></span>`)).join('');
  $('f-price').innerHTML = PRICE_RANGES.map(r => chip('price', r.id, r[state.lang])).join('');
  $('f-occasion').innerHTML = OCCASIONS.map(o => chip('occasion', o.id, o[state.lang])).join('');

  const items = sorted(PRODUCTS.filter(p => matches(p)));
  $('shop-grid').innerHTML = items.map(productCard).join('');
  $('shop-empty').hidden = items.length > 0;
  $('shop-count').textContent = tr(`${items.length} sản phẩm`, `${items.length} ${items.length === 1 ? 'piece' : 'pieces'}`);
  $('show-results').textContent = tr(`Xem ${items.length} sản phẩm`, `Show ${items.length} results`);

  const active = [];
  f.size.forEach(v => active.push(['size', v, v]));
  f.color.forEach(v => active.push(['color', v, v]));
  f.price.forEach(v => { const r = PRICE_RANGES.find(x => x.id === v); active.push(['price', v, r ? r[state.lang] : v]); });
  f.occasion.forEach(v => { const o = OCCASIONS.find(x => x.id === v); active.push(['occasion', v, o ? o[state.lang] : v]); });
  $('active-filters').innerHTML = active.map(([g, v, label]) =>
    `<button type="button" class="active-chip" data-remove="${g}" data-value="${escHtml(v)}" aria-label="${tr('Bỏ lọc', 'Remove')} ${escHtml(label)}">${escHtml(label)} ×</button>`).join('');
  $('filter-count').textContent = active.length ? `(${active.length})` : '';
  $('sort').value = f.sort;
  if (f.price.size && PRODUCTS.every(p => typeof p.price !== 'number')) {
    $('shop-empty').querySelector('p').textContent = tr('Sản phẩm chưa có giá nên chưa lọc theo giá được.', 'Prices are not set yet, so price filters show nothing.');
  }
  syncUrl();
}

function clearFilters() {
  ['size', 'color', 'price', 'occasion'].forEach(k => f[k].clear());
  render();
}

document.addEventListener('click', e => {
  const c = e.target.closest('.chip');
  if (c) {
    const set = f[c.dataset.group];
    set.has(c.dataset.value) ? set.delete(c.dataset.value) : set.add(c.dataset.value);
    return render();
  }
  const r = e.target.closest('[data-remove]');
  if (r) { f[r.dataset.remove].delete(r.dataset.value); return render(); }
  const tab = e.target.closest('#cat-tabs [role=tab]');
  if (tab) {
    if (tab.dataset.sale) { f.sale = !f.sale; f.cat = ''; }
    else { f.cat = tab.dataset.cat; f.sale = false; }
    return render();
  }
  if (e.target.closest('#clear-filters, #clear-filters-2')) return clearFilters();
  if (e.target.closest('#filter-toggle')) {
    const open = $('filters').classList.toggle('open');
    $('filter-toggle').setAttribute('aria-expanded', open);
    return;
  }
  if (e.target.closest('#show-results')) {
    $('filters').classList.remove('open');
    $('filter-toggle').setAttribute('aria-expanded', 'false');
    $('shop-grid').scrollIntoView({ behavior: 'smooth' });
  }
});
$('sort').addEventListener('change', e => { f.sort = e.target.value; render(); });

// colour names change with the language: map selected names across
document.addEventListener('langchange', () => {
  const sel = [...f.color];
  f.color.clear();
  sel.forEach(name => {
    const hex = Object.keys(COLOR_NAMES).find(h => COLOR_NAMES[h].vi === name || COLOR_NAMES[h].en === name);
    f.color.add(hex ? colorName(hex) : name);
  });
  render();
});
document.addEventListener('favchange', render);

render();
