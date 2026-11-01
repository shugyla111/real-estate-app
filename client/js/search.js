/* ------------------------------------------------------------------
   Search page: "Filter by" and "Sort by" panels.
   The chosen filters are kept in the address (search.html?beds=2&sort=price-asc)
   and the same query string is sent to the server: GET /api/offers?beds=2&sort=price-asc
------------------------------------------------------------------- */

const $ = (id) => document.getElementById(id);

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
    minPrice: Number(data.get('minPrice')) || 0,
    maxPrice: Number(data.get('maxPrice')) || Infinity,
    beds: data.getAll('beds').map(Number),
    baths: data.getAll('baths').map(Number),
    city: data.getAll('city'),
    area: data.getAll('area'),
    type: data.getAll('type'),
    year: data.getAll('year'),
    terrace: data.get('terrace') === 'yes'
  };
}

// Cards come from offerCard() in js/cards.js

// Form -> "beds=2&sort=price-asc" (empty fields are left out)
function queryString() {
  const params = new URLSearchParams();
  for (const [key, value] of new FormData(form)) if (value !== '') params.append(key, value);
  return params.toString();
}

function showFilterCount() {
  // Small number on the "Filter by" button: how many filter groups are in use
  const f = getFilters();
  const used = ['beds', 'baths', 'city', 'area', 'type', 'year'].filter((k) => f[k].length).length
    + (f.minPrice > 0 || f.maxPrice < Infinity ? 1 : 0) + (f.terrace ? 1 : 0);
  $('filter-count').textContent = used;
  $('filter-count').hidden = used === 0;
}

function render(list) {
  results.innerHTML = list.map(offerCard).join('');
  favorites.sync();
  $('results-empty').hidden = list.length > 0;
  $('results-count').textContent = `${list.length} ${list.length === 1 ? 'offer' : 'offers'} found`;
}

// Only the answer to the latest request is shown, even if an older one arrives later
let lastRequest = 0;

async function update() {
  const query = queryString();
  const request = ++lastRequest;
  history.replaceState(null, '', query ? `?${query}` : location.pathname);
  showFilterCount();

  try {
    const res = await fetch(`/api/offers?${query}`);
    const data = await res.json();
    if (request !== lastRequest) return;
    if (!res.ok) throw new Error(data.error);
    render(data.items);
  } catch {
    if (request !== lastRequest) return;
    results.innerHTML = '';
    $('results-empty').hidden = true;
    $('results-count').textContent = 'Could not load offers. Please try again later.';
  }
}

/* ------------------- restore filters from the address ------------------- */
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
