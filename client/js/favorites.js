/* ------------------------------------------------------------------
   Saved offers ("favorites"). Visitors do not log in, so the list of
   saved offer ids is kept in their own browser (localStorage).
   Any element with data-fav="3" works as a save / unsave button for offer 3.
------------------------------------------------------------------- */
const favorites = (() => {
  const KEY = 'favorites';

  const ids = () => {
    try {
      const value = JSON.parse(localStorage.getItem(KEY));
      return Array.isArray(value) ? value.filter(Number.isInteger) : [];
    } catch { return []; }
  };
  const store = (list) => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* storage blocked */ } };
  const has = (id) => ids().includes(id);

  // Puts the current state on every button and on the counter in the header
  function sync() {
    const saved = ids();
    document.querySelectorAll('[data-fav]').forEach((el) => {
      const on = saved.includes(Number(el.dataset.fav));
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-pressed', String(on));
      const label = el.querySelector('.save-offer__text');
      if (label) label.textContent = on ? 'Saved' : 'Save';
    });
    document.querySelectorAll('[data-fav-count]').forEach((el) => {
      el.textContent = saved.length;
      el.hidden = saved.length === 0;
    });
  }

  function toggle(id) {
    const saved = ids();
    const on = !saved.includes(id);
    store(on ? [...saved, id] : saved.filter((x) => x !== id));
    sync();
    document.dispatchEvent(new CustomEvent('favorites:change', { detail: { id, saved: on } }));
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-fav]');
    if (!btn) return;
    e.preventDefault(); // the heart may sit on top of a card link
    toggle(Number(btn.dataset.fav));
  });
  // Saved in another tab -> update this one too
  window.addEventListener('storage', (e) => { if (e.key === KEY) sync(); });

  sync();
  return { ids, has, toggle, sync };
})();
