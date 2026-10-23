const express = require("express");
const router = express.Router();

const TMDB_BASE = "https://api.themoviedb.org/3";

// GET /api/tmdb/trailer/movie/27205  or  /api/tmdb/trailer/tv_show/1396
// Finds the best YouTube trailer for a title and returns its YouTube video key.
router.get("/trailer/:type/:tmdbId", async (req, res) => {
  const { type, tmdbId } = req.params;

  // only allow our two content types and a numeric id
  if (!["movie", "tv_show"].includes(type) || !/^\d+$/.test(tmdbId)) {
    return res.status(400).json({ error: "Invalid type or tmdbId" });
  }

  try {
    const tmdbType = type === "movie" ? "movie" : "tv";
    const titleUrl = `${TMDB_BASE}/${tmdbType}/${tmdbId}?api_key=${process.env.TMDB_API_KEY}`;

    // asking for the title details with its videos attached.
    // include_video_language gets English trailers plus ones in the title's own language (anime, k-dramas, etc.)
    const tmdbRes = await fetch(
      `${titleUrl}&language=en-US&append_to_response=videos`
    );
    if (!tmdbRes.ok) {
      return res.status(502).json({ error: "TMDB request failed" });
    }
    let tmdbData = await tmdbRes.json();

    // only YouTube videos can be embedded with the YouTube player
    let videos = (tmdbData.videos?.results || []).filter(
      (v) => v.site === "YouTube"
    );

    // no English videos, so try again in the title's original language
    if (videos.length === 0 && tmdbData.original_language) {
      const retryRes = await fetch(
        `${titleUrl}&append_to_response=videos&include_video_language=${tmdbData.original_language},null`
      );
      if (retryRes.ok) {
        tmdbData = await retryRes.json();
        videos = (tmdbData.videos?.results || []).filter(
          (v) => v.site === "YouTube"
        );
      }
    }

    // best pick first: official trailer -> any trailer -> teaser -> any youtube video
    const video =
      videos.find((v) => v.type === "Trailer" && v.official) ||
      videos.find((v) => v.type === "Trailer") ||
      videos.find((v) => v.type === "Teaser") ||
      videos[0];

    if (!video) {
      return res.status(404).json({ error: "No trailer found" });
    }

    // trailers rarely change, so let browsers (max-age) and Vercel's CDN (s-maxage) cache this for a day
    res.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
    res.json({ youtube_key: video.key, name: video.name });
  } catch (err) {
    console.error("Error fetching TMDB trailer:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
