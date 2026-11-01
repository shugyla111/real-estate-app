// "Saved offers" page: shows the offers whose ids are in favorites (js/favorites.js)
const list = document.getElementById('saved-list');
const empty = document.getElementById('saved-empty');
const countEl = document.getElementById('saved-count');

function showCount(n) {
  countEl.textContent = n ? `${n} saved ${n === 1 ? 'offer' : 'offers'}` : '';
  empty.hidden = n > 0;
}

async function load() {
  const ids = favorites.ids();
  if (!ids.length) { list.innerHTML = ''; showCount(0); return; }

  try {
    const res = await fetch(`/api/offers?${ids.map((id) => `id=${id}`).join('&')}`);
    if (!res.ok) throw new Error();
    const { items } = await res.json();
    list.innerHTML = items.map(offerCard).join('');
    favorites.sync();
    showCount(items.length);
  } catch {
    countEl.textContent = 'Could not load your saved offers. Please try again later.';
  }
}

// Un-saving a card on this page removes it from the list
document.addEventListener('favorites:change', (e) => {
  if (e.detail.saved) return;
  list.querySelector(`[data-fav="${e.detail.id}"]`)?.closest('.card').remove();
  showCount(list.children.length);
});

load();
