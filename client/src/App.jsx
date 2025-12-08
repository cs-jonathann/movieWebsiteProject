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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
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
            Browse
          </Link>
          <Link className="nav-link" to="/watchlist">
            My Watchlist
          </Link>

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
          <Route path="/" element={<BrowsePage />} />

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

// Browse page
function BrowsePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate(); // ⭐ new

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_BASE_URL}/api/content`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load content");
          return;
        }

        setItems(data);
      } catch (err) {
        console.error("Error fetching content:", err);
        setError("Network error while loading content");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

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
        <h1 className="page-title">Browse Content</h1>
        <p className="text-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="page page-browse">
      <h1 className="page-title">Browse Content</h1>

      {successMessage && (
        <p className="text-success text-center">{successMessage}</p>
      )}

      {items.length === 0 ? (
        <p className="text-center">No content found.</p>
      ) : (
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

                {/* ⭐ New: Watch now button */}
                <button
                  onClick={() =>
                    navigate(`/watch/${item.id}`, { state: { item } })
                  }
                  className="btn btn-secondary btn-full"
                  style={{ marginBottom: "0.4rem" }}
                >
                  Watch now
                </button>

                {/* Existing Add to Watchlist button */}
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
  // If it doesn’t have what it needs (no IDs), it returns an empty string ""
  const embedUrl = buildEmbedUrl(item, season, episode);

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
