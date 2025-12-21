// server/scripts/importTmdbContent.js
//  loading .env so the TMDB api key and DB URL are available
require("dotenv").config();
const fetch = (...args) =>
  // node-fetch allows us to use fetch() in Node
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

//   postgres connection from config/db.js
const pool = require("../config/db");

const TMDB_API_KEY = process.env.TMDB_API_KEY;

// TMDB URL
const TMDB_BASE = "https://api.themoviedb.org/3";

// --- Helpers to call TMDb ---

// fetching popular content, page lets you ask for page 1, 2, 3... of the popular list. it returns the result array from TMDB
async function fetchPopularMovies(page = 1) {
  const res = await fetch(
    `${TMDB_BASE}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`
  );
  if (!res.ok) {
    throw new Error("TMDb movie popular failed: " + res.status);
  }
  const data = await res.json();
  return data.results || [];
}

// fetching popular content, page lets you ask for page 1, 2, 3... of the popular list. it returns the result array from TMDB
async function fetchPopularTv(page = 1) {
  const res = await fetch(
    `${TMDB_BASE}/tv/popular?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`
  );
  if (!res.ok) {
    throw new Error("TMDb tv popular failed: " + res.status);
  }
  const data = await res.json();
  return data.results || [];
}

// allows us to get the IMDB IDs and it helps us build the Vidsrc URL
async function fetchMovieExternalIds(tmdbId) {
  const res = await fetch(
    `${TMDB_BASE}/movie/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`
  );
  if (!res.ok) return {};
  return res.json();
}

// allows us to get the IMDB IDs and it helps us build the Vidsrc URL
async function fetchTvExternalIds(tmdbId) {
  const res = await fetch(
    `${TMDB_BASE}/tv/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`
  );
  if (!res.ok) return {};
  return res.json();
}

// --- Main import logic ---
// importing the populars content into the content table
async function importMovies(pages = 1) {
  // connecting to postgres
  const client = await pool.connect();

  try {
    for (let page = 1; page <= pages; page++) {
      console.log(`Fetching popular movies page ${page}...`);
      const movies = await fetchPopularMovies(page);

      //   looping through each movie and fetches its IMDB ID
      for (const m of movies) {
        const external = await fetchMovieExternalIds(m.id);
        const imdbId = external.imdb_id || null;

        // building a poster URL usning TMDB image base
        const posterUrl = m.poster_path
          ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
          : null;

        const releaseYear = m.release_date
          ? parseInt(m.release_date.slice(0, 4), 10)
          : null;

        //   inserting into table, if the TMDB_ID is new, it inserts it into a new row onto the table but if the ID already exists then it just updates the row instead
        await client.query(
          `
          INSERT INTO content (tmdb_id, imdb_id, title, type, poster_url, release_year, genre)
          VALUES ($1, $2, $3, 'movie', $4, $5, $6)
          ON CONFLICT (tmdb_id) DO UPDATE
          SET imdb_id = EXCLUDED.imdb_id,
              title = EXCLUDED.title,
              type = EXCLUDED.type,
              poster_url = EXCLUDED.poster_url,
              release_year = EXCLUDED.release_year,
              genre = EXCLUDED.genre
        `,
          [
            m.id,
            imdbId,
            m.title,
            posterUrl,
            releaseYear,
            m.genre_ids && m.genre_ids.length > 0
              ? m.genre_ids.join(",")
              : null, // simple genre storage for now
          ]
        );
        console.log(`Upserted movie: ${m.title}`);
      }
    }
  } finally {
    client.release();
  }
}

async function importTvShows(pages = 1) {
  const client = await pool.connect();
  try {
    for (let page = 1; page <= pages; page++) {
      console.log(`Fetching popular TV page ${page}...`);
      const shows = await fetchPopularTv(page);

      //   looping through each movie and fetches its IMDB ID
      for (const s of shows) {
        const external = await fetchTvExternalIds(s.id);
        const imdbId = external.imdb_id || null;

        // building a poster URL through TMDBs image base
        const posterUrl = s.poster_path
          ? `https://image.tmdb.org/t/p/w500${s.poster_path}`
          : null;

        const firstYear = s.first_air_date
          ? parseInt(s.first_air_date.slice(0, 4), 10)
          : null;

        //   inserting into table, if the TMDB_ID is new, it inserts it into a new row onto the table but if the ID already exists then it just updates the row instead
        await client.query(
          `
          INSERT INTO content (tmdb_id, imdb_id, title, type, poster_url, release_year, genre)
          VALUES ($1, $2, $3, 'tv_show', $4, $5, $6)
          ON CONFLICT (tmdb_id) DO UPDATE
          SET imdb_id = EXCLUDED.imdb_id,
              title = EXCLUDED.title,
              type = EXCLUDED.type,
              poster_url = EXCLUDED.poster_url,
              release_year = EXCLUDED.release_year,
              genre = EXCLUDED.genre
        `,
          [
            s.id,
            imdbId,
            s.name,
            posterUrl,
            firstYear,
            s.genre_ids && s.genre_ids.length > 0
              ? s.genre_ids.join(",")
              : null,
          ]
        );
        console.log(`Upserted TV show: ${s.name}`);
      }
    }
  } finally {
    client.release();
  }
}

// main function that runs everything
async function main() {
  // checking that an api key exists
  try {
    if (!TMDB_API_KEY) {
      throw new Error("TMDB_API_KEY is missing in .env");
    }

    // how many pages of each you want to import
    await importMovies(15); // ~300 movies
    await importTvShows(15); // ~300 tv shows

    // logging success or error
    console.log("TMDb import completed.");
  } catch (err) {
    console.error("Import failed:", err);
  } finally {
    process.exit(0);
  }
}

main();
