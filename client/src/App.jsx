// adding useEffect which is for fetching data when the page loads
import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Link,
  useNavigate,
  Navigate,
  useLocation,
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

                  <div className="watchlist-actions">
                    <button
                      onClick={() => handleToggleWatched(item)}
                      className="btn btn-primary"
                    >
                      Mark as {item.watched ? "Not Watched" : "Watched"}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="btn btn-danger"
                    >
                      Remove
                    </button>
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
