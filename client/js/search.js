/* ------------------------------------------------------------------
   Search page: "Filter by" and "Sort by" panels.
   For now the demo offers (js/offers-data.js) are filtered in the browser.
   The chosen filters are also kept in the address (search.html?beds=2&sort=price-asc),
   so the same query string can later be sent to the backend.
------------------------------------------------------------------- */

const $ = (id) => document.getElementById(id);
const fmt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

const form = $('search-form');
const results = $('results');

/* --------------------------- open / close panels --------------------------- */
const panels = [
  { toggle: $('filter-toggle'), panel: $('filter-panel') },
  { toggle: $('sort-toggle'), panel: $('sort-panel') }
];

panels.forEach(({ toggle, panel }) => {
  toggle.addEventListener('click', () => {
    const open = panel.hidden;
    // Only one panel is open at a time
    panels.forEach((p) => { p.panel.hidden = true; p.toggle.setAttribute('aria-expanded', 'false'); });
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  });
});

/* ------------------------------ read filters ------------------------------ */
function getFilters() {
  const data = new FormData(form);
  return {
    location: data.get('location').trim().toLowerCase(),
    minPrice: Number(data.get('minPrice')) || 0,
    maxPrice: Number(data.get('maxPrice')) || Infinity,
    beds: data.getAll('beds').map(Number),
    baths: data.getAll('baths').map(Number),
    city: data.getAll('city'),
    area: data.getAll('area'),
    type: data.getAll('type'),
    year: data.getAll('year'),
    terrace: data.get('terrace') === 'yes',
    sort: data.get('sort')
  };
}

// "100-149" -> is 120 inside? Empty side means no limit: "200-" or "-1999".
const inRange = (value, range) => {
  const [min, max] = range.split('-');
  return (min === '' || value >= Number(min)) && (max === '' || value <= Number(max));
};

// The last checkbox in a group means "and more": 4+ beds, 3+ baths
const matchCount = (value, chosen, top) => chosen.some((n) => (n === top ? value >= n : value === n));

function matches(o, f) {
  if (f.location && !`${o.city} ${o.title}`.toLowerCase().includes(f.location)) return false;
  if (o.price < f.minPrice || o.price > f.maxPrice) return false;
  if (f.beds.length && !matchCount(o.beds, f.beds, 4)) return false;
  if (f.baths.length && !matchCount(o.baths, f.baths, 3)) return false;
  if (f.city.length && !f.city.some((c) => o.city.startsWith(c))) return false;
  if (f.area.length && !f.area.some((r) => inRange(o.area, r))) return false;
  if (f.type.length && !f.type.includes(o.type)) return false;
  if (f.year.length && !f.year.some((r) => inRange(o.year, r))) return false;
  if (f.terrace && o.terrace !== 'Yes') return false;
  return true;
}

const sorters = {
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  'area-desc': (a, b) => b.area - a.area,
  'newest': (a, b) => b.year - a.year
};

/* --------------------------------- render --------------------------------- */
const card = (o) => `
  <article class="card">
    <a class="card__link" href="offer.html?id=${o.id}">
      <div class="card__media">
        <img src="${o.images[0]}" alt="">
        <span class="badge">For sale</span>
      </div>
      <div class="card__body">
        <p class="card__tag">${o.type}</p>
        <h3 class="card__title">${o.title}</h3>
        <p class="card__city"><svg class="icon"><use href="#i-pin"/></svg> ${o.city}</p>
        <ul class="specs">
          <li><svg class="icon"><use href="#i-area"/></svg> ${o.area} m²</li>
          <li><svg class="icon"><use href="#i-bed"/></svg> ${o.beds}</li>
          <li><svg class="icon"><use href="#i-bath"/></svg> ${o.baths}</li>
        </ul>
        <div class="card__footer">
          <span class="card__price">${fmt(o.price)}€</span>
          <span class="link-arrow">Discover <svg class="icon"><use href="#i-arrow"/></svg></span>
        </div>
      </div>
    </a>
  </article>`;

function update() {
  const f = getFilters();

  // BACKEND LATER: replace the next lines with
  // fetch(`/api/offers?${new URLSearchParams(new FormData(form))}`).then((r) => r.json()).then(render)
  const list = offers.filter((o) => matches(o, f));
  if (sorters[f.sort]) list.sort(sorters[f.sort]);

  results.innerHTML = list.map(card).join('');
  $('results-empty').hidden = list.length > 0;
  $('results-count').textContent = `${list.length} ${list.length === 1 ? 'offer' : 'offers'} found`;

  // Small number on the "Filter by" button: how many filter groups are in use
  const used = ['beds', 'baths', 'city', 'area', 'type', 'year'].filter((k) => f[k].length).length
    + (f.minPrice > 0 || f.maxPrice < Infinity ? 1 : 0) + (f.terrace ? 1 : 0);
  $('filter-count').textContent = used;
  $('filter-count').hidden = used === 0;

  saveToAddress();
}

/* ------------------------ keep filters in the address ------------------------ */
function saveToAddress() {
  const params = new URLSearchParams();
  for (const [key, value] of new FormData(form)) if (value !== '') params.append(key, value);
  const query = params.toString();
  history.replaceState(null, '', query ? `?${query}` : location.pathname);
}

function loadFromAddress() {
  const params = new URLSearchParams(location.search);
  for (const [key, value] of params) {
    const field = form.elements[key];
    if (!field) continue;
    const options = field instanceof RadioNodeList ? [...field] : [field];
    if (options[0].type === 'checkbox' || options[0].type === 'radio') {
      options.forEach((el) => { if (el.value === value) el.checked = true; });
    } else {
      options[0].value = value;
    }
  }
}

/* --------------------------------- start --------------------------------- */
form.addEventListener('input', update);
form.addEventListener('submit', (e) => e.preventDefault());
// The form is cleared after the "reset" event, so we update on the next tick
form.addEventListener('reset', () => setTimeout(update));
$('empty-reset').addEventListener('click', () => form.reset());

loadFromAddress();
update();
