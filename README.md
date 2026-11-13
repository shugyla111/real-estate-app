# Real Estate

A full-stack real estate agency website: public listings with search and filters, viewing bookings, saved offers, and an agent dashboard for managing content. Express + SQLite backend with a REST API, session-based authentication and API tests.

**Live demo:** [real-estate-app-a16n.onrender.com](https://real-estate-app-a16n.onrender.com)
*(free hosting: the first visit after a quiet period can take up to a minute to wake the server)*

![Demo](docs/demo.gif)

<p>
  <img src="docs/home.png" alt="Home page" width="32%">
  <img src="docs/offer.png" alt="Offer page with viewing booking" width="32%">
  <img src="docs/admin.png" alt="Agent dashboard" width="32%">
</p>

## Features

- **Search and filters:** by location, price range, bedrooms, bathrooms, city, area, property type, year, terrace, with sorting
- **Offer page:** property details and viewing booking with free time slots per day (double booking is rejected)
- **Saved offers:** favourites stored in the browser (localStorage), no account needed
- **Contact form and newsletter:** messages and subscriptions are saved in the database
- **Agent dashboard:** secure login, add / edit / delete offers, manage viewings, messages and subscribers
- **Security basics:** scrypt password hashing, httpOnly session cookie (7 days), login blocked for 15 minutes after 5 wrong passwords

## Tech stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express
- **Database:** SQLite (built into Node.js)
- **Testing:** API tests, each run uses a fresh in-memory database
- **Deployment:** Render (free plan) via `render.yaml` blueprint

## Project structure

```
client/   # website pages, styles and scripts
server/   # Express app, API routes, database, seed and tests
render.yaml
```

## Run locally

Requires Node.js 22.13 or newer.

```bash
cd server
npm install
npm run seed   # create the database and fill it with demo offers
npm run dev    # http://localhost:3000, restarts on file changes
npm test       # API tests
```

The server serves both the website from `client/` and the API under `/api`. Open the site through the server ([http://localhost:3000](http://localhost:3000)), not as a file or via Live Server, otherwise the API calls fail.

## API

| Method              | Address                                                                                            | What it does                                |
| ------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| GET                 | `/api/offers?location=&minPrice=&maxPrice=&beds=&baths=&city=&area=&type=&year=&terrace=yes&sort=` | List of offers with filters                 |
| GET                 | `/api/offers/:id`                                                                                  | One offer                                   |
| GET                 | `/api/offers/:id/slots?date=YYYY-MM-DD`                                                            | Free viewing times for a day                |
| POST                | `/api/viewings`                                                                                    | Book a viewing (`409` if the time is taken) |
| POST                | `/api/contact`                                                                                     | Message from the contact form               |
| POST                | `/api/newsletter`                                                                                  | Newsletter subscription                     |
| POST                | `/api/auth/login` · `/api/auth/logout`, GET `/api/auth/me`                                         | Agent login (session cookie)                |
| POST · PUT · DELETE | `/api/offers`, `/api/offers/:id`                                                                   | Add, change, delete offers (agents only)    |
| GET                 | `/api/admin/viewings` · `/messages` · `/subscribers`                                               | Lists for the dashboard (agents only)       |
| DELETE              | `/api/admin/viewings/:id`                                                                          | Cancel a viewing (agents only)              |

`GET /api/offers?id=1&id=4` returns only these offers (used by the Saved offers page).

## Agent dashboard

Agents log in at `/login.html` (link "Agent login" in the footer) and manage offers, viewings, messages and subscribers at `/admin.html`.

- **Demo login** (created by `npm run seed`): `agent@realestate.example` / `demo-agent-2026`. Change or remove it before putting the site online.
- **Add a real agent:** `npm run create-agent -- maria@agency.es "Maria Lopez"` prints a random password.
- The SQLite database file is `server/data/app.db` (not in git; recreate it with `npm run seed`).

## Deploy (Render, free plan)

The repository has a `render.yaml` blueprint.

1. On [render.com](https://render.com) sign in with GitHub.
2. **New → Blueprint**, choose this repository, confirm.
3. Render installs and starts the server from `server/` (Node 24, `NODE_ENV=production`).

On the free plan the service sleeps after 15 minutes without visitors, and files are not kept between restarts. On every start with an empty database the server adds the demo offers and the demo agent, so bookings, messages and changes made in the dashboard disappear after a restart.

## Demo data

All content is for demonstration only. Listings, prices and statistics are sample data. Testimonials and team members on the About page are fictional, photos are stock images. The Contact page uses a placeholder phone, email and address; messages are saved in the local database and nobody receives them.

## Credits

About page layout inspired by the shot [About Us page – Real Estate Website](https://dribbble.com/shots/27383681-About-Us-page-Real-Estate-Website) by Delisas: UX/UI & SaaS Agency on Dribbble. Contact page layout inspired by a Contact Us shot by Landing Play on Dribbble. The texts are our own; the photos are stock images.
