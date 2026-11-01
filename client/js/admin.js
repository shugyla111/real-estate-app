/* ------------------------------------------------------------------
   Agent dashboard. Every request here needs the login cookie;
   if the session has ended, the server answers 401 and we go back to login.
------------------------------------------------------------------- */
const $ = (id) => document.getElementById(id);

async function api(path, { method = 'GET', data } = {}) {
  const res = await fetch(path, {
    method,
    headers: data ? { 'Content-Type': 'application/json' } : {},
    body: data ? JSON.stringify(data) : undefined
  });
  if (res.status === 401) { location.replace('login.html'); throw new Error('Not logged in'); }
  const body = res.status === 204 ? null : await res.json();
  return { ok: res.ok, status: res.status, body };
}

let statusTimer;
function showStatus(text, isError = false) {
  const el = $('admin-status');
  el.textContent = text;
  el.classList.toggle('is-error', isError);
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => { el.textContent = ''; }, 5000);
}

const niceDate = (iso) => new Date(`${iso}T00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const niceDateTime = (sqlTime) => new Date(`${sqlTime.replace(' ', 'T')}Z`).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
const setCount = (name, n) => { $(`c-${name}`).textContent = `(${n})`; };

/* ---------------------------------- tabs ---------------------------------- */
const TABS = ['offers', 'viewings', 'messages', 'subscribers'];

function openTab(name) {
  TABS.forEach((t) => {
    $(`t-${t}`).setAttribute('aria-selected', String(t === name));
    $(`tab-${t}`).hidden = t !== name;
  });
  history.replaceState(null, '', `#${name}`);
}
TABS.forEach((t) => $(`t-${t}`).addEventListener('click', () => openTab(t)));

/* --------------------------------- offers --------------------------------- */
let offers = [];
let editingId = null; // null = adding a new offer
const form = $('offer-form');

async function loadOffers() {
  const { body } = await api('/api/offers');
  offers = body.items;
  setCount('offers', offers.length);
  $('offers-body').innerHTML = offers.map((o) => `
    <tr>
      <td><img class="admin-thumb" src="${esc(o.images[0])}" alt=""></td>
      <td><a href="offer.html?id=${o.id}" target="_blank" rel="noopener">${esc(o.title)}</a></td>
      <td>${esc(o.city)}</td>
      <td class="nowrap">${fmt(o.price)}€</td>
      <td>${esc(o.type)}</td>
      <td class="admin-actions">
        <button type="button" class="admin-btn" data-edit="${o.id}">Edit</button>
        <button type="button" class="admin-btn admin-btn--danger" data-delete="${o.id}">Delete</button>
      </td>
    </tr>`).join('') || '<tr><td colspan="6" class="admin-empty">No offers yet.</td></tr>';
}

function clearFormErrors() {
  form.querySelectorAll('[data-err]').forEach((el) => { el.textContent = ''; });
}

function openForm(offer) {
  editingId = offer ? offer.id : null;
  form.reset();
  clearFormErrors();
  $('form-title').textContent = offer ? `Edit: ${offer.title}` : 'New offer';
  if (offer) {
    ['title', 'city', 'type', 'price', 'area', 'rooms', 'beds', 'baths', 'floor', 'year', 'description']
      .forEach((key) => { form.elements[key].value = offer[key] ?? ''; });
    form.elements.terrace.checked = offer.terrace;
    form.elements.images.value = offer.images.join('\n');
  }
  form.hidden = false;
  form.elements.title.focus();
}

function closeForm() {
  form.hidden = true;
  editingId = null;
}

$('add-offer').addEventListener('click', () => openForm(null));
$('form-cancel').addEventListener('click', closeForm);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFormErrors();
  const f = form.elements;
  const data = {
    title: f.title.value, city: f.city.value, type: f.type.value,
    price: f.price.value, area: f.area.value, rooms: f.rooms.value, beds: f.beds.value, baths: f.baths.value,
    floor: f.floor.value, year: f.year.value, terrace: f.terrace.checked, description: f.description.value,
    images: f.images.value.split('\n')
  };

  const { ok, body } = editingId
    ? await api(`/api/offers/${editingId}`, { method: 'PUT', data })
    : await api('/api/offers', { method: 'POST', data });

  if (!ok) {
    Object.entries(body.errors || {}).forEach(([key, msg]) => {
      const el = form.querySelector(`[data-err="${key}"]`);
      if (el) el.textContent = msg;
    });
    const first = Object.keys(body.errors || {})[0];
    if (first) f[first].focus();
    showStatus(body.error, true);
    return;
  }

  showStatus(editingId ? 'Offer saved.' : 'Offer added.');
  closeForm();
  await loadOffers();
});

$('offers-body').addEventListener('click', async (e) => {
  const edit = e.target.closest('[data-edit]');
  if (edit) { openForm(offers.find((o) => o.id === Number(edit.dataset.edit))); return; }

  const del = e.target.closest('[data-delete]');
  if (!del) return;
  const offer = offers.find((o) => o.id === Number(del.dataset.delete));
  if (!confirm(`Delete "${offer.title}"?\nIts viewings will be removed too.`)) return;

  const { ok } = await api(`/api/offers/${offer.id}`, { method: 'DELETE' });
  showStatus(ok ? 'Offer deleted.' : 'Could not delete the offer.', !ok);
  if (editingId === offer.id) closeForm();
  await Promise.all([loadOffers(), loadViewings()]);
});

/* -------------------------------- viewings -------------------------------- */
async function loadViewings() {
  const { body } = await api('/api/admin/viewings');
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  setCount('viewings', body.total);
  $('viewings-body').innerHTML = body.items.map((v) => `
    <tr class="${v.date < today ? 'is-past' : ''}">
      <td class="nowrap">${niceDate(v.date)}</td>
      <td>${v.time}</td>
      <td><a href="offer.html?id=${v.offerId}" target="_blank" rel="noopener">${esc(v.offerTitle)}</a></td>
      <td>${esc(v.name)}<br><a href="mailto:${esc(v.email)}">${esc(v.email)}</a></td>
      <td>${esc(v.message || '—')}</td>
      <td><button type="button" class="admin-btn admin-btn--danger" data-cancel="${v.id}">Cancel</button></td>
    </tr>`).join('') || '<tr><td colspan="6" class="admin-empty">No viewings booked yet.</td></tr>';
}

$('viewings-body').addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-cancel]');
  if (!btn || !confirm('Cancel this viewing? The time becomes free again.')) return;
  const { ok } = await api(`/api/admin/viewings/${btn.dataset.cancel}`, { method: 'DELETE' });
  showStatus(ok ? 'Viewing cancelled.' : 'Could not cancel the viewing.', !ok);
  await loadViewings();
});

/* ------------------------- messages and subscribers ------------------------- */
const TOPICS = { buy: 'Buy', sell: 'Sell', rent: 'Rent', invest: 'Invest', other: 'Other' };

async function loadMessages() {
  const { body } = await api('/api/admin/messages');
  setCount('messages', body.total);
  $('messages-list').innerHTML = body.items.map((m) => `
    <article class="admin-message">
      <header>
        <strong>${esc(m.name)}</strong> <span class="admin-tag">${TOPICS[m.topic] || esc(m.topic)}</span>
        <time>${niceDateTime(m.createdAt)}</time>
      </header>
      <p class="admin-message__contacts"><a href="mailto:${esc(m.email)}">${esc(m.email)}</a>${m.phone ? ` · ${esc(m.phone)}` : ''}</p>
      <p>${esc(m.message)}</p>
    </article>`).join('') || '<p class="admin-empty">No messages yet.</p>';
}

async function loadSubscribers() {
  const { body } = await api('/api/admin/subscribers');
  setCount('subscribers', body.total);
  $('subscribers-body').innerHTML = body.items.map((s) => `
    <tr><td>${esc(s.email)}</td><td>${niceDateTime(s.createdAt)}</td></tr>`).join('')
    || '<tr><td colspan="2" class="admin-empty">No subscribers yet.</td></tr>';
}

/* --------------------------------- start --------------------------------- */
$('logout').addEventListener('click', async () => {
  await api('/api/auth/logout', { method: 'POST' });
  location.replace('login.html');
});

async function start() {
  const me = await api('/api/auth/me'); // goes to login.html if not logged in
  $('agent-name').textContent = me.body.name;
  $('admin').hidden = false;
  openTab(TABS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'offers');
  await Promise.all([loadOffers(), loadViewings(), loadMessages(), loadSubscribers()]);
}

start().catch((err) => {
  if (err.message === 'Not logged in') return; // already on the way to login.html
  $('admin').hidden = false;
  showStatus('Could not load the dashboard. Is the server running?', true);
});
