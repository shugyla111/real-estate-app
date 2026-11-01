// Offer card used on the search, offer and saved pages
const fmt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

const offerCard = (o) => `
  <article class="card">
    <button type="button" class="like" data-fav="${o.id}" aria-pressed="false" aria-label="Save ${o.title}"><svg class="icon"><use href="#i-heart"/></svg></button>
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
