/* ------------------------------------------------------------------
   Demo offers, shared by the search page and the offer page.
   BACKEND LATER: this list will come from the API (GET /api/offers).
------------------------------------------------------------------- */

const rawOffers = [
  { id: 1, title: 'Large 4-room apartment with a beautiful terrace',      city: 'Barcelona IV.',  price: 320000, area: 110, rooms: 4, beds: 3, baths: 2, type: 'Flat',      floor: '3 of 6',   year: 2012, terrace: 'Yes' },
  { id: 2, title: 'Bright and airy 2-bedroom flat near the city center',  city: 'Barcelona IV.',  price: 215000, area: 72,  rooms: 3, beds: 2, baths: 1, type: 'Flat',      floor: '2 of 5',   year: 2005, terrace: 'No'  },
  { id: 3, title: 'Exclusive 5-room residence with a rooftop terrace',    city: 'Madrid VI.',     price: 480000, area: 165, rooms: 5, beds: 4, baths: 3, type: 'Penthouse', floor: '7 of 7',   year: 2018, terrace: 'Yes' },
  { id: 4, title: 'Newly built 4-room apartment with premium finishes',   city: 'Madrid III.',    price: 390000, area: 118, rooms: 4, beds: 3, baths: 2, type: 'Flat',      floor: '4 of 8',   year: 2024, terrace: 'Yes' },
  { id: 5, title: 'Charming 2-bedroom flat in a prime urban area',        city: 'Barcelona VII.', price: 310000, area: 84,  rooms: 3, beds: 2, baths: 1, type: 'Flat',      floor: '1 of 4',   year: 1998, terrace: 'No'  },
  { id: 6, title: 'Prestigious 5-bedroom home with a panoramic rooftop',  city: 'Madrid II.',     price: 650000, area: 210, rooms: 6, beds: 5, baths: 3, type: 'House',     floor: '3 levels', year: 2016, terrace: 'Yes' }
];

// Every offer gets three photos. For now they are taken from apartment1..6.jpg.
const imagesFor = (n) => [n, (n % 6) + 1, ((n + 1) % 6) + 1].map((k) => `images/apartment${k}.jpg`);
const offers = rawOffers.map((o) => ({ ...o, images: imagesFor(o.id) }));
