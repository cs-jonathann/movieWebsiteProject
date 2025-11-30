// adding useEffect which is for fetching data when the page loads
import React, { useState, useEffect } from "react";

// Pulling 4 components from react router: Link, Routes, Route, useNavigate
// Link → clickable navigation links (like <a>, but SPA-friendly).
// Routes → wrapper that looks at the URL and chooses which page to show.
// Route → defines “if the URL is X, render component Y”.
// useNavigate → lets us change pages in code (ex: go to /watchlist after login).
// Navigate → lets us redirect the user to another route (ex: send to /login if not auth).
// useLocation → lets us read the current URL/location.
import {
  Routes,
  Route,
  Link,
  useNavigate,
  Navigate,
  useLocation,
} from "react-router-dom";

const API_BASE_URL = "http://localhost:5100";

// App is main layout
function App() {
  // Keep track of the logged-in user in React state
  // We initialize from localStorage so if the page reloads, it remembers who is logged in
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  // Logs user out: clears localStorage and resets user state
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null); // ui updates to "Not logged in"
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        margin: 0,
        backgroundColor: "#001f3f", // navy background
        color: "#f8f9fa", // light text
        boxSizing: "border-box",
      }}
    >
      {/* Top bar showing app title + auth status */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem 1rem",
          borderBottom: "1px solid #ccc",
          marginBottom: "0.5rem",
        }}
      >
        <h2 style={{ margin: 0 }}>Movie Watchlist</h2>
        <div>
          {user ? (
            <>
              {/* Show who is logged in and a logout button */}
              <span style={{ marginRight: "0.5rem" }}>
                Logged in as <strong>{user.username || user.email}</strong>
              </span>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            // If no user is logged in, show this text
            <span style={{ fontStyle: "italic" }}>Not logged in</span>
          )}
        </div>
      </header>

      {/* Simple navbar for now */}
      {/* Simple navbar for now */}
      <nav
        style={{
          display: "flex", // putting links in a row
          gap: "1rem",
          padding: "0.5rem 1rem",
          borderBottom: "1px solid #ccc", // line under the navbar
          marginBottom: "1rem",
          width: "100%", // ⭐ make nav span full width
          boxSizing: "border-box", // include padding in that width
        }}
      >
        {/* React Router changes the URL without reloading the page. Allows me to move between pages in app */}
        <Link to="/">Browse</Link>
        <Link to="/watchlist">My Watchlist</Link>

        {user ? null : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>

      {/* Page content changes based on URL */}
      <div style={{ padding: "1rem" }}>
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
      </div>
    </div>
  );
}

// RequireAuth wraps a page and only shows it if there is a token.
// If there is no token, it redirects the user to /login.
function RequireAuth({ children }) {
  const token = localStorage.getItem("token"); // check if the user has a JWT token
  const location = useLocation(); // current URL (ex: /watchlist)

  // If there is no token, send user to /login and remember where they came from
  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }} // optional: can use later to send them back
      />
    );
  }

  // If token exists, show the protected content
  return children;
}

// BrowsePage loads all content from your backend when the page opens, shows it in a list,
// and lets a logged-in user click “Add to Watchlist” to call your /api/watchlist POST route
// using their JWT token.
function BrowsePage() {
  const [items, setItems] = useState([]); // list of movies / shows from database
  const [loading, setLoading] = useState(true); // whether we are currently laoding data
  const [error, setError] = useState(""); // holding error message to show the user
  const [successMessage, setSuccessMessage] = useState(""); // message like "Added to watchlist" after clicking the add button

  // loading content when the page opens
  useEffect(() => {
    const fetchContent = async () => {
      // start loading and reset error
      setLoading(true);
      setError("");

      try {
        // calling backend
        const res = await fetch(`${API_BASE_URL}/api/content`);
        const data = await res.json();

        // if response is not ok show error the data gives you or show the custom message
        if (!res.ok) {
          setError(data.error || "Failed to load content");
          return;
        }

        // if response is ok, we store the movies and shows
        setItems(data);

        // if theres a error like server down or network failure ->
      } catch (err) {
        console.error("Error fetching content:", err);
        setError("Network error while loading content");
      } finally {
        // in all cases, stop the loading spinner
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  // when you click add button
  // receiving content ID of which show / movie you clicked on
  const handleAddToWatchlist = async (contentId) => {
    const token = localStorage.getItem("token"); // reading JWT token from localStorage
    setSuccessMessage(""); // clearing any old messages
    setError(""); // clearing any old messages

    // if there is no token ->
    if (!token) {
      setError("You must be logged in to add to your watchlist.");
      return;
    }

    // calling backend
    try {
      const res = await fetch(`${API_BASE_URL}/api/watchlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contentId,
          notes: "", // empty notes by default; can customize later
        }),
      });

      // reading data
      const data = await res.json();

      // if backend shows an error then ->
      if (!res.ok) {
        setError(data.error || "Failed to add to watchlist");
        return;
      }

      setSuccessMessage("Added to watchlist!");
    } catch (err) {
      console.error("Add to watchlist error:", err);
      // network error ->
      setError("Network error while adding to watchlist");
    }
  };

  // what the user sees while loading the data
  if (loading) {
    return <p>Loading content...</p>;
  }

  // if theres an error, if error has a message then show it in red
  if (error) {
    return (
      <div>
        <h1>Browse Content</h1>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  // ✅ THIS is the block you like – now with posters added at the top of each card
  return (
    // text-light for light text; navy background is handled by App wrapper
    <div className="text-light py-5">
      {/* main title centered */}
      <h1 className="text-center mb-4">Browse Content</h1>

      {/* if theres a sucess message show it in green */}
      {successMessage && (
        <p className="text-center" style={{ color: "lightgreen" }}>
          {successMessage}
        </p>
      )}

      {/* if items is empty then show -> */}
      {items.length === 0 ? (
        <p className="text-center">No content found.</p>
      ) : (
        // otherwise show a nice responsive grid
        // justify-content-center horizontally centers the columns
        <div className="row g-4 justify-content-center">
          {/* inside the grid */}
          {items.map((item) => (
            <div
              key={item.id}
              className="col-6 col-sm-4 col-md-3 col-lg-2" // responsive columns
            >
              {/* each card represents one movie/show */}
              <div
                className="card h-100 text-light"
                style={{
                  backgroundColor: "#111", // dark card background like streaming sites
                  border: "none",
                  borderRadius: "10px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* ⭐ Poster image area from the version where posters worked */}
                <div
                  style={{
                    width: "100%",
                    height: "260px", // poster height
                    borderRadius: "10px 10px 0 0",
                    overflow: "hidden",
                    backgroundColor: "#222",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {item.poster_url ? (
                    <img
                      src={item.poster_url}
                      alt={item.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover", // fill nicely
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: "0.8rem", color: "#888" }}>
                      No image
                    </span>
                  )}
                </div>

                {/* Text + button area (unchanged layout) */}
                <div className="card-body d-flex flex-column">
                  {/* printing the title, movie, show, year and genre */}
                  <h6 className="card-title mb-1">{item.title}</h6>
                  <small style={{ color: "#e0e0e0" }}>
                    {item.type === "movie" ? "Movie" : "TV Show"} •{" "}
                    {item.release_year || "Unknown year"}
                    {item.genre ? ` • ${item.genre}` : ""}
                  </small>

                  {/* spacer pushes button to bottom for equal-height cards */}
                  <div className="mt-auto pt-2">
                    {/* showing an Add to Watchlist button that will call handleAddToWatchlist with the items id */}
                    <button
                      onClick={() => handleAddToWatchlist(item.id)}
                      className="btn btn-primary btn-sm w-100"
                    >
                      Add to Watchlist
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

// WatchlistPage loads the current user’s watchlist using their token, shows all items,
// and lets you toggle watched status or remove items by calling your backend’s PUT/DELETE watchlist routes.
// WatchlistPage loads the current user’s watchlist using their token, shows all items, and lets you toggle watched status or remove items by calling your backend’s PUT/DELETE watchlist routes.
// WatchlistPage loads the current user’s watchlist using their token, shows all items,
// and lets you toggle watched status or remove items by calling your backend’s
// PUT/DELETE watchlist routes.
function WatchlistPage() {
  const [items, setItems] = useState([]); // watchlist entries from backend
  const [loading, setLoading] = useState(true); // if it is in loading state
  const [error, setError] = useState(""); // message if a error happens

  const token = localStorage.getItem("token"); // JWT stored in localStorage when you logged in / registered

  // load watchlist from backend
  const fetchWatchlist = async () => {
    setLoading(true);
    setError("");

    // if there is no token or invalid ->
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

  // no token -> centered message
  if (!token) {
    return (
      <div className="text-light py-5">
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >
          <h1 className="text-center mb-4">My Watchlist</h1>
          <p className="text-center" style={{ color: "red" }}>
            You are not logged in. Please log in to view your watchlist.
          </p>
        </div>
      </div>
    );
  }

  // loading -> centered message
  if (loading) {
    return (
      <div className="text-light py-5">
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >
          <h1 className="text-center mb-4">My Watchlist</h1>
          <p className="text-center">Loading watchlist...</p>
        </div>
      </div>
    );
  }

  // MAIN RENDER – normal state of the page that is rendering content
  return (
    // same outer styling as BrowsePage
    <div className="text-light py-5">
      {/* Title centered like BrowsePage */}
      <h1 className="text-center mb-4">My Watchlist</h1>

      {/* Error message (if any) centered */}
      {error && (
        <p className="text-center" style={{ color: "red" }}>
          {error}
        </p>
      )}

      {/* Empty state */}
      {items.length === 0 ? (
        <p className="text-center">Your watchlist is empty.</p>
      ) : (
        // ⭐ FLEX CONTAINER that is always centered and symmetric
        <div
          style={{
            maxWidth: "1200px", // keep things from stretching too wide
            margin: "0 auto", // center this whole block on the page
            display: "flex",
            flexWrap: "wrap",
            gap: "1.5rem",
            justifyContent: "center", // center the cards
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                flex: "1 1 350px", // responsive card width
                maxWidth: "420px",
              }}
            >
              <div
                className="card text-light"
                style={{
                  backgroundColor: "#111",
                  border: "none",
                  borderRadius: "10px",
                  display: "flex",
                  flexDirection: "row",
                  overflow: "hidden",
                  minHeight: "150px",
                }}
              >
                {/* Poster on the left */}
                <div style={{ width: "110px", flexShrink: 0 }}>
                  {item.poster_url ? (
                    <img
                      src={item.poster_url}
                      alt={item.title || `Content #${item.content_id}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#333",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                        color: "#aaa",
                      }}
                    >
                      No image
                    </div>
                  )}
                </div>

                {/* Text + buttons on the right */}
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title mb-1">
                    {item.title || `Content #${item.content_id}`}
                    {item.genre && (
                      <span className="text-muted"> — {item.genre}</span>
                    )}
                  </h5>

                  {item.release_year && (
                    <p
                      className="mb-1"
                      style={{ fontSize: "0.85rem", color: "#ccc" }}
                    >
                      Year: {item.release_year}
                    </p>
                  )}

                  <p className="mb-1" style={{ fontSize: "0.85rem" }}>
                    Status:{" "}
                    {item.watched ? (
                      <span style={{ color: "lightgreen" }}>Watched</span>
                    ) : (
                      <span style={{ color: "#ffcc00" }}>Not watched</span>
                    )}
                  </p>

                  {item.notes && (
                    <p className="mb-2" style={{ fontSize: "0.85rem" }}>
                      Notes: {item.notes}
                    </p>
                  )}

                  {/* Buttons pinned to bottom of card */}
                  <div className="mt-auto d-flex gap-2">
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
          ))}
        </div>
      )}
    </div>
  );
}

// LoginPage is a form that lets the user type email + password, sends that to your backend login route,
// saves the returned token/user on success, and redirects them to /watchlist, or shows an error if anything fails.
// We also accept onAuthSuccess from App so we can update App's user state when login works.
function LoginPage({ onAuthSuccess }) {
  const navigate = useNavigate(); // change pages in code, will go to /watchist after a successful login
  const [email, setEmail] = useState(""); // store what the user types into the inputs
  const [password, setPassword] = useState(""); // store what the user types into the inputs
  const [error, setError] = useState(""); // stores any error message to show to the user
  const [loading, setLoading] = useState(false);

  // what happens when you press login
  const handleSubmit = async (e) => {
    e.preventDefault(); // stops the brwser from doing a normal form submit (page reload)
    setError(""); // clear the previous error message that popped up
    setLoading(true); // show that we are in the middle of a request

    // sending request to backend
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      // reading response
      const data = await res.json();

      // if backend returns a non-200 status it shows the error from the backend or "Login Failed"
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      // if login was successful
      // Save token + user in localStorage
      localStorage.setItem("token", data.token); // store JWT token in localStorage for future API calls
      localStorage.setItem("user", JSON.stringify(data.user)); // store user object so you can show their name

      // Tells App about the new logged-in user so the header/nav can update as "Logged in..."
      if (onAuthSuccess) {
        onAuthSuccess(data.user);
      }

      // Go to watchlist after login, send user to watchlist page
      navigate("/watchlist");

      // if theres a network problem then ->
    } catch (err) {
      // handles unexpected issues like server down
      console.error("Login error:", err);
      setError("Network error. Please try again.");
    } finally {
      // runs whether it worked or failed
      setLoading(false);
    }
  };

  // jsx that will get rendered
  return (
    <div style={{ maxWidth: "400px" }}>
      <h1>Login</h1>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
      >
        {/* email input */}
        <label>
          Email:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)} // updates email state when the user types
            required // field cant be empty on submit
          />
        </label>

        {/* password input */}
        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)} // updates password state when the user types
            required // field cant be empty on submit
          />
        </label>

        {/* error messsage */}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {/* pressing this triggers onSubmit={handleSubmit} on the form. */}
        <button type="submit" disabled={loading}>
          {/* if loading is true show logging in, else show Login */}
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

// RegisterPage is a sign-up form that sends username, email, and password to your /api/auth/register backend route,
// saves the returned token and user in localStorage on success, and redirects you to the home (Browse) page,
// or shows an error if something goes wrong.
// We also accept onAuthSuccess from App so we can update App's user state when register works.
function RegisterPage({ onAuthSuccess }) {
  const navigate = useNavigate(); // lets you programmatically change pages after successful register
  const [username, setUsername] = useState(""); // store what the user types in the form
  const [email, setEmail] = useState(""); // store what the user types in the form
  const [password, setPassword] = useState(""); // store what the user types in the form
  const [error, setError] = useState(""); // text of an error message to show under the form
  const [loading, setLoading] = useState(false);

  // what happens when you click register
  const handleSubmit = async (e) => {
    e.preventDefault(); // stops the normal browser form submit (page reload)
    setError(""); // clearing any old error messgae
    setLoading(true); // shows the request is in progress and disables the button

    try {
      // calling backend
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      // reading the response
      const data = await res.json();

      if (!res.ok) {
        // set to false if status is not a 200 page
        setError(data.error || "Registration failed"); // show backend error or "registration failed"
        return;
      }

      // If registration is successful
      // Save token + user just like login
      localStorage.setItem("token", data.token); // saving jwt token to localStorage under token
      localStorage.setItem("user", JSON.stringify(data.user)); // saving user info under user

      // Tells App about the new logged-in user so the header/nav can update
      if (onAuthSuccess) {
        onAuthSuccess(data.user);
      }

      // Go to browse or watchlist after register
      navigate("/");

      // if theres a network problem
    } catch (err) {
      // catch runs if there is a network failure or server down
      console.error("Register error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // the jsx that gets rendered
  return (
    <div style={{ maxWidth: "400px" }}>
      <h1>Register</h1>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
      >
        <label>
          Username:
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)} // updates username when the user types
            required // cant submit the form empty
          />
        </label>

        <label>
          Email:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)} // updates email when the user types
            required // cant submit the form empty
          />
        </label>

        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)} // updates pw when the user types
            required // cant submit the form empty
          />
        </label>

        {/* error message */}
        {/* if error is not a empty string, show a red paragraph with that text, else nothing will be rendered */}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {/* submit button */}
        {/* clicking submit triggers onSubmit ={handleSubmit} on the form. disabled loading means that the user cannot spam the button while the request is in progress */}
        <button type="submit" disabled={loading}>
          {/* if loading is true then show creating account, else show register */}
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>
    </div>
  );
}

export default App;
