# WatchStreamify

A full-stack movie and TV browsing site. Create an account, browse hundreds of titles by genre, watch trailers, keep a personal watchlist, and pick up trailers where you left off.

**Live site:** https://movie-website-project-rose.vercel.app

## Demo login

Recruiters and reviewers can skip sign-up. On the login page, click **Use the demo account**, or type it in:

| Email or username | Password |
| --- | --- |
| `demo` (or `demo@example.com`) | `WatchDemo2026` |

The demo account is shared, so it resets to a few starting titles in My List every time someone logs into it.

## Features

- **Browse:** auto-advancing hero carousel, Movies and TV Shows tabs with one scrolling row per genre, and search.
- **Watch now:** plays the title's trailer from YouTube (the official one when TMDB has it). It's looked up through the backend, so the TMDB API key never reaches the browser.
- **Continue Watching:** saves your real position in each trailer, so you can resume later.
- **My List:** add titles, mark them as watched or unwatched, and remove them.
- **Accounts:** sign up and log in with your email or username. Passwords are hashed with bcrypt, sessions use JWTs, and repeated failed logins are throttled.
- **Responsive:** works on phones as well as desktop.

## Tech stack

- **Frontend:** React + Vite (`client/`), deployed on Vercel
- **Backend:** Node.js + Express REST API (`server/`), deployed on Vercel
- **Database:** PostgreSQL on Supabase
- **Data:** ~600 movies and shows imported from TMDB

## Running locally

You need **Node.js 20 or newer**, a PostgreSQL database, and a free [TMDB API key](https://www.themoviedb.org/settings/api).

1. **Configure the backend.** Create `server/.env` with `JWT_SECRET`, `TMDB_API_KEY`, and your database connection:
   - **Local Postgres:** `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
   - **Hosted Postgres** (Supabase etc.): `DATABASE_URL` instead. This always connects over SSL, so don't use it for a local Postgres.
2. **Set up the database** (once, on an empty database):
   ```bash
   cd server
   npm install
   node setup-db.js                  # creates the tables
   node scripts/importTmdbContent.js # imports the titles from TMDB
   node scripts/seedDemoAccount.js   # creates the demo login
   ```
3. **Start the backend:** `npm start` in `server/`. It runs on port 5100 unless you set `PORT`.
4. **Start the frontend.** Create `client/.env` with `VITE_API_BASE_URL=http://localhost:5100` (use your `PORT` if you changed it), then:
   ```bash
   cd client
   npm install
   npm run dev
   ```
5. Open **http://localhost:5173**. The backend only accepts requests from that exact address, so if Vite picks a different port, free up 5173 first.
