// adding useEffect which is for fetching data when the page loads
import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Link,
  useNavigate,
  Navigate,
  useLocation,
  useParams,
} from "react-router-dom";

import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
console.log("API_BASE_URL from env:", API_BASE_URL);

// App is main layout
function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  // Search state at App level
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    // Navigate to home page if not already there
    if (location.pathname !== "/") {
      navigate("/");
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchInput("");
    setSearchTerm("");
  };

  return (
    <div className="app-root">
      {/* Top bar */}
      <header className="app-header">
        <h2 className="app-title">WatchStreamify</h2>
        <div className="app-auth">
          {user ? (
            <>
              <span className="app-auth-text">
                Logged in as <strong>{user.username || user.email}</strong>
              </span>
              <button className="btn btn-secondary" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <span className="app-auth-text app-auth-text--muted">
              Not logged in
            </span>
          )}
        </div>
      </header>

      {/* Nav bar */}
      <nav className="app-nav">
        <div className="app-nav-inner">
          <Link className="nav-link" to="/">
            Home
          </Link>
          <Link className="nav-link" to="/watchlist">
            My Watchlist
          </Link>

          {/* Search Bar in Navigation */}
          <form
            onSubmit={handleSearch}
            style={{
              display: "flex",
              gap: "0.5rem",
              marginLeft: "auto",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              placeholder="Search movies/shows..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{
                padding: "0.5rem 0.75rem",
                fontSize: "0.9rem",
                border: "1px solid #444",
                borderRadius: "4px",
                backgroundColor: "#2a2a2a",
                color: "#fff",
                width: "250px",
              }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                padding: "0.5rem 1rem",
                fontSize: "0.9rem",
              }}
            >
              Search
            </button>
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="btn btn-secondary"
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.9rem",
                }}
              >
                Clear
              </button>
            )}
          </form>

          {!user && (
            <div className="nav-right">
              <Link className="nav-link" to="/login">
                Login
              </Link>
              <Link className="nav-link" to="/register">
                Register
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Page content */}
      <main className="app-main">
        <Routes>
          <Route path="/" element={<BrowsePage searchTerm={searchTerm} />} />

          <Route
            path="/watch/:contentId"
            element={
              <RequireAuth>
                <WatchPage />
              </RequireAuth>
            }
          />

          <Route
            path="/watchlist"
            element={
              <RequireAuth>
                <WatchlistPage />
              </RequireAuth>
            }
          />
          <Route
            path="/login"
            element={<LoginPage onAuthSuccess={setUser} />}
          />
          <Route
            path="/register"
            element={<RegisterPage onAuthSuccess={setUser} />}
          />
        </Routes>
      </main>
    </div>
  );
}

// Protect routes
function RequireAuth({ children }) {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

// Continue Watching Component
function ContinueWatchingSection({ navigate }) {
  const [continueWatching, setContinueWatching] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContinueWatching = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/progress`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setContinueWatching(data);
        }
      } catch (err) {
        console.error("Error fetching continue watching:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContinueWatching();
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgressPercentage = (progress, duration) => {
    return ((progress / duration) * 100).toFixed(0);
  };

  if (loading || continueWatching.length === 0) return null;

  return (
    <div style={{ marginBottom: "3rem" }}>
      <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>
        Continue Watching
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {continueWatching.map((item) => (
          <div
            key={item.id}
            style={{
              backgroundColor: "#111",
              borderRadius: "10px",
              overflow: "hidden",
              cursor: "pointer",
              position: "relative",
            }}
            onClick={() =>
              navigate(`/watch/${item.content_id}`, { state: { item } })
            }
          >
            <div style={{ position: "relative" }}>
              {item.poster_url ? (
                <img
                  src={item.poster_url}
                  alt={item.title}
                  style={{
                    width: "100%",
                    height: "260px",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "260px",
                    backgroundColor: "#222",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ color: "#888" }}>No image</span>
                </div>
              )}

              {/* Progress bar */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "4px",
                  backgroundColor: "rgba(255,255,255,0.3)",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${getProgressPercentage(
                      item.progress_seconds,
                      item.duration_seconds
                    )}%`,
                    backgroundColor: "#0d6efd",
                  }}
                />
              </div>
            </div>

            <div style={{ padding: "0.6rem 0.7rem" }}>
              <h6 style={{ margin: 0, fontSize: "0.9rem" }}>{item.title}</h6>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#ccc",
                  margin: "0.2rem 0 0",
                }}
              >
                {formatTime(item.progress_seconds)} /{" "}
                {formatTime(item.duration_seconds)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BrowsePage({ searchTerm }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 108;

  const navigate = useNavigate();

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setError("");

      try {
        // Build URL with search parameter if exists
        const url = new URL(`${API_BASE_URL}/api/content`);
        url.searchParams.append("page", currentPage);
        url.searchParams.append("limit", itemsPerPage);
        if (searchTerm) {
          url.searchParams.append("search", searchTerm);
        }

        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load content");
          return;
        }

        setItems(data.items || []);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.total || 0);

        console.log("Loaded page:", currentPage, "Items:", data.items?.length);
      } catch (err) {
        console.error("Error fetching content:", err);
        setError("Network error while loading content");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [currentPage, searchTerm]); // Re-fetch when page or search changes

  const handleAddToWatchlist = async (contentId) => {
    const token = localStorage.getItem("token");
    setSuccessMessage("");
    setError("");

    if (!token) {
      setError("You must be logged in to add to your watchlist.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/watchlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contentId,
          notes: "",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to add to watchlist");
        return;
      }

      setSuccessMessage("Added to watchlist!");
    } catch (err) {
      console.error("Add to watchlist error:", err);
      setError("Network error while adding to watchlist");
    }
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePageClick = (pageNum) => {
    setCurrentPage(pageNum);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (loading) {
    return (
      <div className="page page-browse">
        <p>Loading content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page page-browse">
        <p className="text-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="page page-browse">
      {/* Show active search */}
      {searchTerm && (
        <div
          style={{ textAlign: "center", marginBottom: "1rem", opacity: 0.8 }}
        >
          Searching for: <strong>"{searchTerm}"</strong>
        </div>
      )}

      {/* Continue Watching Section */}
      {!searchTerm && <ContinueWatchingSection navigate={navigate} />}

      {/* Pagination info */}

      {successMessage && (
        <p className="text-success text-center">{successMessage}</p>
      )}

      {items.length === 0 ? (
        <p className="text-center">
          {searchTerm
            ? `No results found for "${searchTerm}"`
            : "No content found."}
        </p>
      ) : (
        <>
          <div className="content-grid">
            {items.map((item) => (
              <div key={item.id} className="content-card">
                <div className="content-card-poster">
                  {item.poster_url ? (
                    <img
                      src={item.poster_url}
                      alt={item.title}
                      className="content-card-img"
                    />
                  ) : (
                    <span className="content-card-noimg">No image</span>
                  )}
                </div>

                <div className="content-card-body">
                  <h6 className="content-card-title">{item.title}</h6>
                  <div className="content-card-meta">
                    {item.type === "movie" ? "Movie" : "TV Show"} •{" "}
                    {item.release_year || "Unknown year"}
                    {item.genre ? ` • ${item.genre}` : ""}
                  </div>

                  <button
                    onClick={() =>
                      navigate(`/watch/${item.id}`, { state: { item } })
                    }
                    className="btn btn-secondary btn-full"
                    style={{ marginBottom: "0.4rem" }}
                  >
                    Watch now
                  </button>

                  <button
                    onClick={() => handleAddToWatchlist(item.id)}
                    className="btn btn-primary btn-full"
                  >
                    Add to Watchlist
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: "2rem",
                marginBottom: "2rem",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="btn btn-secondary"
                style={{
                  opacity: currentPage === 1 ? 0.5 : 1,
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                }}
              >
                Previous
              </button>

              {getPageNumbers().map((pageNum, idx) =>
                pageNum === "..." ? (
                  <span key={`ellipsis-${idx}`} style={{ padding: "0.5rem" }}>
                    ...
                  </span>
                ) : (
                  <button
                    key={pageNum}
                    onClick={() => handlePageClick(pageNum)}
                    className={`btn ${
                      currentPage === pageNum ? "btn-primary" : "btn-secondary"
                    }`}
                    style={{
                      minWidth: "40px",
                      fontWeight: currentPage === pageNum ? "bold" : "normal",
                    }}
                  >
                    {pageNum}
                  </button>
                )
              )}

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="btn btn-secondary"
                style={{
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  cursor:
                    currentPage === totalPages ? "not-allowed" : "pointer",
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Watchlist page
function WatchlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchWatchlist = async () => {
    setLoading(true);
    setError("");

    if (!token) {
      setError("You must be logged in to see your watchlist.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/watchlist`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load watchlist");
        return;
      }

      setItems(data);
    } catch (err) {
      console.error("Watchlist fetch error:", err);
      setError("Network error while loading watchlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleWatched = async (item) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/watchlist/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          watched: !item.watched,
          notes: item.notes || "",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update watchlist item");
        return;
      }

      setItems((prev) =>
        prev.map((w) =>
          w.id === item.id ? { ...w, watched: data.watched } : w
        )
      );
    } catch (err) {
      console.error("Update watchlist error:", err);
      setError("Network error while updating watchlist");
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/watchlist/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete watchlist item");
        return;
      }

      setItems((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      console.error("Delete watchlist error:", err);
      setError("Network error while deleting watchlist item");
    }
  };

  if (!token) {
    return (
      <div className="page page-watchlist">
        <h1 className="page-title">My Watchlist</h1>
        <p className="text-center text-error">
          You are not logged in. Please log in to view your watchlist.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page page-watchlist">
        <h1 className="page-title">My Watchlist</h1>
        <p className="text-center">Loading watchlist...</p>
      </div>
    );
  }

  return (
    <div className="page page-watchlist">
      <h1 className="page-title">My Watchlist</h1>

      {error && <p className="text-center text-error">{error}</p>}

      {items.length === 0 ? (
        <p className="text-center">Your watchlist is empty.</p>
      ) : (
        <div className="watchlist-grid">
          {items.map((item) => (
            <div key={item.id} className="watchlist-card-wrapper">
              <div className="watchlist-card">
                <div className="watchlist-poster">
                  {item.poster_url ? (
                    <img
                      src={item.poster_url}
                      alt={item.title || `Content #${item.content_id}`}
                      className="watchlist-poster-img"
                    />
                  ) : (
                    <div className="watchlist-poster-placeholder">No image</div>
                  )}
                </div>

                <div className="watchlist-body">
                  <h5 className="watchlist-title">
                    {item.title || `Content #${item.content_id}`}
                    {item.genre && (
                      <span className="watchlist-genre"> — {item.genre}</span>
                    )}
                  </h5>

                  {item.release_year && (
                    <p className="watchlist-meta">Year: {item.release_year}</p>
                  )}

                  <p className="watchlist-meta">
                    Status:{" "}
                    {item.watched ? (
                      <span className="watchlist-status watchlist-status--watched">
                        Watched
                      </span>
                    ) : (
                      <span className="watchlist-status watchlist-status--not">
                        Not watched
                      </span>
                    )}
                  </p>

                  {item.notes && (
                    <p className="watchlist-meta">Notes: {item.notes}</p>
                  )}

                  {/* adding watch now button */}
                  <div className="mt-auto d-flex flex-column gap-2">
                    {/* ⭐ New: Watch now button */}
                    <button
                      onClick={() =>
                        navigate(`/watch/${item.content_id}`, {
                          state: { item },
                        })
                      }
                      className="btn btn-sm btn-secondary"
                    >
                      Watch now
                    </button>

                    <div className="d-flex gap-2">
                      <button
                        onClick={() => handleToggleWatched(item)}
                        className="btn btn-sm btn-primary"
                      >
                        Mark as {item.watched ? "Not Watched" : "Watched"}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="btn btn-sm btn-danger"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper: build Vidsrc embed URL for a given time + optional season / episode. given this piece of content (movie or show), what Vidsrc link should I use to play it?
function buildEmbedUrl(item, season = 1, episode = 1) {
  if (!item) return null;

  const movieBase = "https://vidsrc-embed.ru/embed/movie";
  const tvBase = "https://vidsrc-embed.ru/embed/tv";

  // ✅ correct field names and spelling
  const hasImdb = !!item.imdb_id;
  const hasTmdb = !!item.tmdb_id;

  // MOVIES
  if (item.type === "movie") {
    if (hasImdb) {
      // e.g. https://vidsrc-embed.ru/embed/movie/tt0468569
      return `${movieBase}/${item.imdb_id}`;
    }
    if (hasTmdb) {
      // fallback using TMDB id as query param
      return `${movieBase}?tmdb=${item.tmdb_id}`;
    }
  }

  // TV SHOWS
  if (item.type === "tv_show") {
    if (hasImdb) {
      // e.g. https://vidsrc-embed.ru/embed/tv/tt0944947/1-1
      return `${tvBase}/${item.imdb_id}/${season}-${episode}`;
    }
    if (hasTmdb) {
      // fallback with TMDB as query param
      return `${tvBase}?tmdb=${item.tmdb_id}&season=${season}&episode=${episode}`;
    }
  }

  // If we get here, we had no usable ID
  return null;
}

// Page that shows the actual video player using Vidsrc iframe
function WatchPage() {
  // If your route is /watch/:id, and the URL is /watch/7, then id === "7". That tells WatchPage which content to show.
  const { contentId } = useParams(); // /watch/:contentId
  const navigate = useNavigate(); // lets user go back or go to another page in coded
  const location = useLocation();

  // item may be passed from Browse/Watchlist via location.state
  const passedItem = location.state?.item || null;

  const [item, setItem] = useState(passedItem); // content we're trying to watch
  const [season, setSeason] = useState(1); // used for tv shows to build the Vidsrc url
  const [episode, setEpisode] = useState(1); // used for tv shows to build the Vidsrc url
  const [error, setError] = useState(""); // text to show if something goes wrong
  const [savedProgress, setSavedProgress] = useState(0);

  // Load saved progress when component mounts
  useEffect(() => {
    const loadProgress = async () => {
      const token = localStorage.getItem("token");
      if (!token || !contentId) return;

      try {
        const res = await fetch(`${API_BASE_URL}/api/progress/${contentId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setSavedProgress(data.progress_seconds || 0);
          console.log("Loaded progress:", data.progress_seconds);
        }
      } catch (err) {
        console.error("Error loading progress:", err);
      }
    };

    loadProgress();
  }, [contentId]);

  // Save progress periodically (every 10 seconds)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !contentId) return;

    const interval = setInterval(() => {
      // Save progress
      fetch(`${API_BASE_URL}/api/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contentId: parseInt(contentId, 10),
          progressSeconds: savedProgress + 10, // Increment by 10 seconds
          durationSeconds: 7200, // Estimate 2 hours, adjust as needed
        }),
      }).catch((err) => console.error("Error saving progress:", err));

      setSavedProgress((prev) => prev + 10);
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [contentId, savedProgress]);

  // handling error
  useEffect(() => {
    if (!item) {
      setError(
        "No content info found. Please go back and choose a title again."
      );
    }
  }, [item]);

  // streaming URL, calling the helper from up above
  //   Based on item.type and its imdb_id or tmdb_id, plus season/episode for TV, it returns something like:
  // Movie: https://vidsrc-embed.ru/embed/movie/tt5433140
  // TV: https://vidsrc-embed.ru/embed/tv/tt0944947/1-1
  // If it doesn't have what it needs (no IDs), it returns an empty string ""
  const embedUrl = buildEmbedUrl(item, season, episode);

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    // centers everything anf keeps it from being too wide
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "2rem 1rem",
        color: "#f8f9fa",
      }}
    >
      {/* back button */}
      <button
        // makes the browser go back one page
        onClick={() => navigate(-1)}
        style={{
          marginBottom: "1rem",
          padding: "0.4rem 0.8rem",
          borderRadius: "4px",
          border: "none",
          backgroundColor: "#0d6efd",
          color: "white",
          cursor: "pointer",
        }}
      >
        ← Back
      </button>

      {/* if we do have an item, show all its details, if not show an error */}
      {item ? (
        <>
          <h1 style={{ marginBottom: "0.5rem" }}>
            {item.title}{" "}
            {item.release_year && (
              <span style={{ fontSize: "0.8em", opacity: 0.8 }}>
                ({item.release_year})
              </span>
            )}
          </h1>
          <p style={{ opacity: 0.8, marginBottom: "1rem" }}>
            {item.type === "movie" ? "Movie" : "TV Show"}
            {item.genre ? ` • ${item.genre}` : ""}
            {savedProgress > 0 && (
              <span style={{ color: "#4cd964", marginLeft: "1rem" }}>
                • Resuming from {formatTime(savedProgress)}
              </span>
            )}
          </p>

          {/* TV controls, for the season(s) and episode(s) Lets the user type what season and episode they want. When they type, we call setSeason / setEpisode*/}
          {item.type === "tv_show" && (
            <div
              style={{
                display: "flex",
                gap: "1rem",
                marginBottom: "1rem",
                flexWrap: "wrap",
              }}
            >
              <label>
                Season:{" "}
                <input
                  type="number"
                  min="1"
                  value={season}
                  onChange={(e) => setSeason(Number(e.target.value) || 1)}
                  style={{ width: "60px" }}
                />
              </label>
              <label>
                Episode:{" "}
                <input
                  type="number"
                  min="1"
                  value={episode}
                  onChange={(e) => setEpisode(Number(e.target.value) || 1)}
                  style={{ width: "60px" }}
                />
              </label>
            </div>
          )}

          {/* player frame */}
          {embedUrl ? (
            <div
              style={{
                position: "relative",
                paddingBottom: "56.25%", // 16:9
                height: 0,
                overflow: "hidden",
                borderRadius: "10px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
              }}
            >
              {/* iframe points to the Vidsrc URL and this is what actually shows the video player on screen */}
              <iframe
                src={embedUrl}
                title={item.title}
                allowFullScreen
                frameBorder="0"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                }}
              />
            </div>
          ) : (
            // if the embedUrl is empty, show a red error message
            <p style={{ color: "red" }}>
              Sorry, we don&apos;t have a valid stream URL for this title.
            </p>
          )}
        </>
      ) : (
        <p style={{ color: "red" }}>{error}</p>
      )}
    </div>
  );
}

// Login + Register stay basically the same
function LoginPage({ onAuthSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (onAuthSuccess) onAuthSuccess(data.user);

      navigate("/watchlist");
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page-auth">
      <div className="auth-card">
        <h1 className="page-title">Login</h1>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">
            Email:
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="auth-label">
            Password:
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <p className="text-error">{error}</p>}

          <button
            className="btn btn-primary btn-full"
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

function RegisterPage({ onAuthSuccess }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (onAuthSuccess) onAuthSuccess(data.user);

      navigate("/");
    } catch (err) {
      console.error("Register error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page-auth">
      <div className="auth-card">
        <h1 className="page-title">Register</h1>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">
            Username:
            <input
              className="auth-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>

          <label className="auth-label">
            Email:
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="auth-label">
            Password:
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <p className="text-error">{error}</p>}

          <button
            className="btn btn-primary btn-full"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
