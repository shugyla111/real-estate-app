# Real Estate

A front-end practice project: a real estate agency website (home page, search, offer, saved offers, testimonials, about, contact, agent dashboard).

## Run locally

Requires Node.js 22.13 or newer (SQLite is built in).

```bash
cd server
npm install
npm run seed   # create the database and fill it with demo offers
npm run dev    # http://localhost:3000, restarts on file changes
npm test       # API tests, each run uses a fresh in-memory database
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
| POST | `/api/auth/login` · `/api/auth/logout`, GET `/api/auth/me` | Agent login (session cookie) |
| POST · PUT · DELETE | `/api/offers`, `/api/offers/:id` | Add, change, delete offers (agents only) |
| GET | `/api/admin/viewings` · `/messages` · `/subscribers` | Lists for the dashboard (agents only) |
| DELETE | `/api/admin/viewings/:id` | Cancel a viewing (agents only) |

`GET /api/offers?id=1&id=4` returns only these offers (used by the Saved offers page).

### Agent dashboard

Agents log in at `/login.html` (link "Agent login" in the footer) and manage offers, viewings, messages and subscribers at `/admin.html`.

- Demo login, created by `npm run seed`: **agent@realestate.example** / **demo-agent-2026**. Change or remove it before putting the site online.
- Add a real agent: `npm run create-agent -- maria@agency.es "Maria Lopez"` prints a random password.
- Passwords are stored as scrypt hashes. The session lives in an httpOnly cookie for 7 days; after 5 wrong passwords the login is blocked for 15 minutes.
The SQLite database file is `server/data/app.db` (not in git; recreate it with `npm run seed`).

## Demo data

All content is for demonstration only:

- Listings, prices and statistics are sample data.
- Testimonials (`client/testimonials.html`) use fictional names and reviews written for this project. The photos are stock images and do not show real clients.
- The About page (`client/about.html`) uses fictional team members and figures.
- Saved offers (the heart on cards, `client/favorites.html`) are kept in the visitor's browser (localStorage); visitors do not need an account.
- The Contact page (`client/contact.html`) uses a placeholder phone, email and address. Messages from the form are saved in the local database; nobody receives them.
- The Offer page (`client/offer.html`) uses demo property data from the database (`server/data/offers.json`, loaded by `npm run seed`). Viewing bookings are saved in the local database.

## Credits

About page layout inspired by the shot [About Us page – Real Estate Website](https://dribbble.com/shots/27383681-About-Us-page-Real-Estate-Website) by Delisas: UX/UI & SaaS Agency on Dribbble. The texts are our own; the photos are stock images.

Contact page layout inspired by a Contact Us shot by Landing Play on Dribbble. The texts are our own.
