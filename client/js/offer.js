/* ------------------------------------------------------------------
   Offer page. The address decides which offer is shown: offer.html?id=3
------------------------------------------------------------------- */

const $ = (id) => document.getElementById(id);
const fmt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

const params = new URLSearchParams(location.search);
const offerId = Number(params.get('id')) || 1;
let offer; // loaded from GET /api/offers/:id in start()

/* ------------------------------ page text ------------------------------ */
function renderOffer() {
  document.title = `${offer.title} | Real Estate`;
  $('o-title').textContent = offer.title;
  $('o-city').textContent = offer.city;

  $('o-facts').innerHTML = [
    [`${fmt(offer.price)}€`, 'Price'],
    [`${offer.area} m²`, 'Area'],
    [offer.rooms, 'Rooms'],
    [offer.baths, 'Bathrooms'],
    [`${fmt(offer.price / offer.area)}€`, 'Per m²']
  ].map(([value, label]) => `<li><strong>${value}</strong><span>${label}</span></li>`).join('');

  $('o-desc').innerHTML = [
    `This ${offer.type.toLowerCase()} in ${offer.city} offers ${offer.area} m² of living space, ${offer.rooms} rooms and ${offer.baths} bathroom${offer.baths > 1 ? 's' : ''}.`,
    offer.description || 'Replace this demo text with your own description of the property: the layout, the light, the neighbourhood and what makes it special.'
  ].map((p) => `<p>${p}</p>`).join('');

  const chars = {
    'City': offer.city,
    'Type': offer.type,
    'Floor': offer.floor,
    'Rooms': offer.rooms,
    'Bedrooms': offer.beds,
    'Usable area': `${offer.area} m²`,
    'Bathrooms': offer.baths,
    'Terrace': offer.terrace ? 'Yes' : 'No',
    'Year built': offer.year
  };
  $('o-chars').innerHTML = Object.entries(chars)
    .map(([key, value]) => `<div><dt>${key}</dt><dd>${value}</dd></div>`).join('');
}

/* ------------------- 2. Gallery with full-screen viewer ------------------- */
function initGallery() {
  const imgs = offer.images;
  const main = $('g-main-img');
  const thumbs = $('g-thumbs');
  const lb = $('lightbox');
  const lbImg = $('lb-img');
  let current = 0;

  thumbs.innerHTML = imgs.map((src, i) =>
    `<button type="button" data-i="${i}" aria-label="Show photo ${i + 1}"><img src="${src}" alt=""></button>`
  ).join('');

  function setCurrent(i) {
    current = (i + imgs.length) % imgs.length;
    main.src = imgs[current];
    main.alt = `${offer.title}, photo ${current + 1}`;
    [...thumbs.children].forEach((btn, idx) => btn.setAttribute('aria-current', String(idx === current)));
    if (lb.open) {
      lbImg.src = imgs[current];
      lbImg.alt = main.alt;
      $('lb-count').textContent = `${current + 1} / ${imgs.length}`;
    }
  }

  thumbs.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (btn) setCurrent(Number(btn.dataset.i));
  });

  $('g-main').addEventListener('click', () => {
    lb.showModal();
    document.body.classList.add('lb-open');
    setCurrent(current);
  });

  $('lb-close').addEventListener('click', () => lb.close());
  $('lb-prev').addEventListener('click', () => setCurrent(current - 1));
  $('lb-next').addEventListener('click', () => setCurrent(current + 1));

  // A click on the dark area around the photo closes the viewer
  lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
  // Escape closes the dialog by itself; we only clean up here
  lb.addEventListener('close', () => document.body.classList.remove('lb-open'));

  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') setCurrent(current - 1);
    if (e.key === 'ArrowRight') setCurrent(current + 1);
  });

  // Swipe on phones
  let startX = null;
  lbImg.addEventListener('pointerdown', (e) => { startX = e.clientX; });
  lbImg.addEventListener('pointerup', (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 50) setCurrent(current + (dx < 0 ? 1 : -1));
  });

  setCurrent(0);
}

/* ------------------------ 1. Mortgage calculator ------------------------ */
function initMortgage() {
  const down = $('m-down');
  const term = $('m-term');
  const rate = $('m-rate');

  function update() {
    const downPct = Number(down.value);
    const years = Number(term.value);
    const annual = Math.min(Math.max(Number(rate.value) || 0, 0), 15);

    const downSum = offer.price * downPct / 100;
    const loan = offer.price - downSum;
    const months = years * 12;
    const r = annual / 100 / 12; // monthly interest rate

    // Standard annuity formula. With 0% interest it is just loan / months.
    const monthly = r === 0 ? loan / months : loan * r / (1 - Math.pow(1 + r, -months));
    const totalInterest = monthly * months - loan;

    $('m-down-out').textContent = `${downPct}% (${fmt(downSum)}€)`;
    $('m-term-out').textContent = `${years} years`;
    $('m-payment').textContent = `${fmt(monthly)}€ / month`;
    $('m-loan').textContent = `${fmt(loan)}€`;
    $('m-interest').textContent = `${fmt(totalInterest)}€`;
  }

  [down, term, rate].forEach((el) => el.addEventListener('input', update));
  update();
}

/* --------------------------- 3. Book a viewing --------------------------- */
// Free times come from GET /api/offers/:id/slots, bookings go to POST /api/viewings.
// The server checks everything again; the checks here only give quick hints.
function initBooking() {
  const form = $('booking-form');
  const dateEl = $('b-date');
  const ERR = { date: 'b-date-err', time: 'b-time-err', name: 'b-name-err', email: 'b-email-err' };

  // Local dates (toISOString would shift the day because of the time zone)
  const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const minDate = new Date(today); minDate.setDate(minDate.getDate() + 1);
  const maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + 60);
  dateEl.min = toISO(minDate);
  dateEl.max = toISO(maxDate);

  function dateError(value) {
    if (!value) return 'Please choose a date.';
    const d = parseISO(value);
    if (Number.isNaN(d.getTime())) return 'Please enter a valid date.';
    if (d < minDate || d > maxDate) return 'Please choose a date within the next 60 days.';
    if (d.getDay() === 0) return 'We do not hold viewings on Sundays. Please pick another day.';
    return '';
  }

  const hint = (text) => { $('b-slots').innerHTML = `<p class="slots__hint">${text}</p>`; };
  let slotsRequest = 0;

  async function renderSlots() {
    const value = dateEl.value;
    const err = dateError(value);
    $('b-date-err').textContent = value ? err : '';
    $('b-time-err').textContent = '';
    if (err) { hint('Choose a date to see free times.'); return; }

    const request = ++slotsRequest;
    hint('Loading free times…');
    try {
      const res = await fetch(`/api/offers/${offer.id}/slots?date=${value}`);
      const data = await res.json();
      if (request !== slotsRequest) return; // the date was changed again meanwhile
      if (!res.ok) { $('b-date-err').textContent = data.error; hint('Choose a date to see free times.'); return; }

      if (!data.slots.some((s) => s.free)) { hint('No free times on this day. Please pick another one.'); return; }
      $('b-slots').innerHTML = data.slots.map((s) =>
        `<label class="slot"><input type="radio" name="time" value="${s.time}"${s.free ? '' : ' disabled'}><span>${s.time}</span></label>`
      ).join('');
    } catch {
      if (request === slotsRequest) hint('Could not load free times. Please try again later.');
    }
  }

  const clearErrors = () => Object.values(ERR).forEach((id) => { $(id).textContent = ''; });

  dateEl.addEventListener('change', renderSlots);
  $('b-slots').addEventListener('change', () => { $('b-time-err').textContent = ''; });
  $('b-name').addEventListener('input', () => { $('b-name-err').textContent = ''; });
  $('b-email').addEventListener('input', () => { $('b-email-err').textContent = ''; });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    $('b-ok').hidden = true;

    const time = form.querySelector('input[name="time"]:checked')?.value;
    const name = $('b-name').value.trim();
    const email = $('b-email').value.trim();

    const problems = [
      [dateEl, 'b-date-err', dateError(dateEl.value)],
      [form.querySelector('input[name="time"]') || dateEl, 'b-time-err', time ? '' : 'Please choose a time.'],
      [$('b-name'), 'b-name-err', name ? '' : 'Please enter your name.'],
      [$('b-email'), 'b-email-err', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Please enter a valid email.']
    ];
    problems.forEach(([, errId, msg]) => { $(errId).textContent = msg; });

    const firstBad = problems.find(([, , msg]) => msg);
    if (firstBad) { firstBad[0].focus(); return; }

    const booking = { offerId: offer.id, date: dateEl.value, time, name, email, message: $('b-msg').value.trim() };
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;

    try {
      const res = await fetch('/api/viewings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking)
      });
      const data = await res.json();

      if (!res.ok) {
        // 400: wrong fields, 409: somebody took this time a moment ago
        Object.entries(data.errors || {}).forEach(([field, msg]) => { if (ERR[field]) $(ERR[field]).textContent = msg; });
        if (!data.errors) $('b-time-err').textContent = data.error;
        if (res.status === 409) {
          await renderSlots();
          $('b-time-err').textContent = data.errors.time;
        }
        return;
      }

      form.reset();
      clearErrors();
      hint('Choose a date to see free times.');
      const nice = parseISO(booking.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
      $('b-ok').textContent = `Thank you, ${name}! Your viewing is booked for ${nice} at ${time}.`;
      $('b-ok').hidden = false;
    } catch {
      $('b-time-err').textContent = 'Could not send the booking. Please try again later.';
    } finally {
      button.disabled = false;
    }
  });

  renderSlots();
}

/* ------------------------- similar offers (cards) ------------------------- */
function renderSimilar(offers) {
  $('o-similar').innerHTML = offers
    .filter((o) => o.id !== offer.id)
    .sort((a, b) => Math.abs(a.price - offer.price) - Math.abs(b.price - offer.price))
    .slice(0, 3)
    .map((o) => `
      <article class="card">
        <a class="card__link" href="offer.html?id=${o.id}">
          <img src="${o.images[0]}" alt="">
          <div class="card__body">
            <h3 class="card__title">${o.title}</h3>
            <p class="card__price">${fmt(o.price)}€</p>
            <p class="card__city">${o.city}</p>
          </div>
        </a>
      </article>`).join('');
}

/* -------------------------------- start -------------------------------- */
async function start() {
  try {
    const res = await fetch(`/api/offers/${offerId}`);
    if (res.status === 404) { $('not-found').hidden = false; return; }
    if (!res.ok) throw new Error(`Server answered ${res.status}`);
    offer = await res.json();
  } catch {
    $('not-found').textContent = 'Could not load this offer. Please try again later.';
    $('not-found').hidden = false;
    return;
  }

  $('offer').hidden = false;
  renderOffer();
  initGallery();
  initMortgage();
  initBooking();

  // Similar offers are a bonus: if they fail to load, the section just stays empty
  try {
    const res = await fetch('/api/offers');
    if (res.ok) renderSimilar((await res.json()).items);
  } catch { /* leave the section empty */ }
}

start();
