# Real Estate

A front-end practice project: a real estate agency website (home page, search, offer, testimonials, about, contact).

## Run locally

Requires Node.js 22.13 or newer (SQLite is built in).

```bash
cd server
npm install
npm run seed   # create the database and fill it with demo offers
npm run dev    # http://localhost:3000, restarts on file changes
```

The server (Express) serves both the website from `client/` and the API under `/api`.
Open the site through the server (http://localhost:3000), not as a file or via Live Server, otherwise the API calls fail.

### API

| Method | Address | What it does |
|---|---|---|
| GET | `/api/offers?location=&minPrice=&maxPrice=&beds=&baths=&city=&area=&type=&year=&terrace=yes&sort=` | List of offers with filters |
| GET | `/api/offers/:id` | One offer |
| GET | `/api/offers/:id/slots?date=YYYY-MM-DD` | Free viewing times for a day |
| POST | `/api/viewings` | Book a viewing (`409` if the time is taken) |
| POST | `/api/contact` | Message from the contact form |
| POST | `/api/newsletter` | Newsletter subscription |
The SQLite database file is `server/data/app.db` (not in git; recreate it with `npm run seed`).

## Demo data

All content is for demonstration only:

- Listings, prices and statistics are sample data.
- Testimonials (`client/testimonials.html`) use fictional names and reviews written for this project. The photos are stock images and do not show real clients.
- The About page (`client/about.html`) uses fictional team members and figures.
- The Contact page (`client/contact.html`) uses a placeholder phone, email and address. Messages from the form are saved in the local database; nobody receives them.
- The Offer page (`client/offer.html`) uses demo property data from the database (`server/data/offers.json`, loaded by `npm run seed`). Viewing bookings are saved in the local database.

## Credits

About page layout inspired by the shot [About Us page – Real Estate Website](https://dribbble.com/shots/27383681-About-Us-page-Real-Estate-Website) by Delisas: UX/UI & SaaS Agency on Dribbble. The texts are our own; the photos are stock images.

Contact page layout inspired by a Contact Us shot by Landing Play on Dribbble. The texts are our own.
