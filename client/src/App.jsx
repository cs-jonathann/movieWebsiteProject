// adding useEffect which is for fetching data when the page loads
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  Routes,
  Route,
  Link,
  NavLink,
  useNavigate,
  Navigate,
  useLocation,
  useParams,
} from "react-router-dom";

import "./App.css";
import { useAuth } from "./AuthContext.jsx";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
console.log("API_BASE_URL from env:", API_BASE_URL);

// how long each homepage carousel slide stays up (also drives the dot progress bar)
const SLIDE_MS = 7000;

// =========================================================
// Small helpers
// =========================================================

// TMDB lets us pick the image size in the URL. posters are saved as w500, cards only need w342 (smaller = faster)
function resizeTmdbImage(url, size) {
  return url ? url.replace(/\/t\/p\/w\d+\//, `/t/p/${size}/`) : url;
}

// "Action, Science Fiction" -> ["Action", "Science Fiction"]
function splitGenres(genre) {
  return genre
    ? genre
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean)
    : [];
}

function typeLabel(type) {
  return type === "movie" ? "Movie" : "TV Show";
}

// Format seconds to MM:SS or HH:MM:SS
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// turns "Science Fiction" into "science-fiction" so it can be used as an element id
function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

// returns a function to call when the API says our saved login token is no longer valid
// (expired, or the account is gone). It logs the user out; on pages that need an account,
// RequireAuth then sends them to the login page, which shows a "session expired" note if showNotice is true
function useExpireSession() {
  const { logout } = useAuth();

  return useCallback(
    (showNotice) => {
      if (showNotice) sessionStorage.setItem("sessionExpired", "1");
      logout();
    },
    [logout]
  );
}

// returns a function that adds a title to the logged in user's watchlist.
// that function returns { ok, message } for the toast popup
function useAddToWatchlist() {
  const { token } = useAuth();
  const expireSession = useExpireSession();

  return useCallback(
    async (contentId) => {
      if (!token) {
        return { ok: false, message: "Log in to save titles to My List." };
      }

      try {
        // no notes sent, so re-adding a title keeps any notes it already has
        const res = await fetch(`${API_BASE_URL}/api/watchlist`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ contentId }),
        });

        if (res.status === 401) {
          expireSession(false);
          return {
            ok: false,
            message: "Your session expired. Please log in again.",
          };
        }

        const data = await res.json();

        if (!res.ok) {
          return { ok: false, message: data.error || "Failed to add to My List" };
        }

        return { ok: true, message: "Added to My List" };
      } catch (err) {
        console.error("Add to watchlist error:", err);
        return { ok: false, message: "Network error while adding to My List" };
      }
    },
    [token, expireSession]
  );
}

// small popup message at the bottom of the screen. returns [the popup element, function to show one]
function useToast() {
  const [toast, setToast] = useState(null); // { ok, message }
  const timerRef = useRef(null);

  const showToast = useCallback((next) => {
    setToast(next);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), 2600);
  }, []);

  // stop the timer if the page closes while a toast is showing
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const toastEl = toast ? (
    <div
      className={`toast ${toast.ok ? "toast--ok" : "toast--error"}`}
      role="status"
    >
      {toast.ok ? <CheckIcon /> : <CloseIcon />}
      {toast.message}
    </div>
  ) : null;

  return [toastEl, showToast];
}

// =========================================================
// Icons (tiny inline SVGs so we don't need an icon library)
// =========================================================
function Svg({ children, size = 18, filled = false, className }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const PlayIcon = (props) => (
  <Svg filled {...props}>
    <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l10.6-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z" />
  </Svg>
);
const PlusIcon = (props) => (
  <Svg {...props}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
const CheckIcon = (props) => (
  <Svg {...props}>
    <path d="M5 12.5l4.5 4.5L19 7" />
  </Svg>
);
const CloseIcon = (props) => (
  <Svg {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);
const ChevronLeftIcon = (props) => (
  <Svg {...props}>
    <path d="M15 18l-6-6 6-6" />
  </Svg>
);
const ChevronRightIcon = (props) => (
  <Svg {...props}>
    <path d="M9 18l6-6-6-6" />
  </Svg>
);
const SearchIcon = (props) => (
  <Svg {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </Svg>
);
const StarIcon = (props) => (
  <Svg filled {...props}>
    <path d="M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96L12 2.5z" />
  </Svg>
);
const TrashIcon = (props) => (
  <Svg {...props}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </Svg>
);

// =========================================================
// App is main layout
// =========================================================
function App() {
  // logged in user + logout come from AuthContext (shared with every page)
  const { user, logout } = useAuth();

  // Search state at App level
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // header turns solid once the page is scrolled a little
  const [scrolled, setScrolled] = useState(() => window.scrollY > 10);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // start each new page at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput.trim());
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

  // only the homepage (with its carousel) gets the see-through header
  const solidHeader = scrolled || location.pathname !== "/" || !!searchTerm;
  const displayName = user ? user.username || user.email : "";

  return (
    <div className="app-root">
      {/* Top bar */}
      <header className={`app-header ${solidHeader ? "is-solid" : ""}`}>
        <div className="header-inner">
          <Link to="/" className="brand" onClick={handleClearSearch}>
            Watch<span>Streamify</span>
          </Link>

          <nav className="header-nav" aria-label="Main">
            <NavLink to="/" end className="header-link header-link--home">
              Home
            </NavLink>
            <NavLink to="/watchlist" className="header-link">
              My List
            </NavLink>
          </nav>

          {/* Search Bar */}
          <form className="search" role="search" onSubmit={handleSearch}>
            <SearchIcon className="search-icon" />
            <input
              className="search-input"
              type="search"
              placeholder="Search movies & shows"
              aria-label="Search movies and shows"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {(searchInput || searchTerm) && (
              <button
                type="button"
                className="search-clear"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <CloseIcon size={16} />
              </button>
            )}
          </form>

          <div className="header-user">
            {user ? (
              <>
                <span className="avatar" aria-hidden="true">
                  {displayName.charAt(0)}
                </span>
                <span className="header-username">{displayName}</span>
                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link className="btn btn-ghost btn-sm" to="/login">
                  Log in
                </Link>
                <Link
                  className="btn btn-primary btn-sm header-signup"
                  to="/register"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

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
            element={<LoginPage />}
          />
          <Route
            path="/register"
            element={<RegisterPage />}
          />
        </Routes>
      </main>

      {/* TMDB requires apps using their API to credit them */}
      <footer className="app-footer">
        <span>© {new Date().getFullYear()} WatchStreamify</span>
        <span>
          Movie &amp; TV data and images from TMDB. This product uses the TMDB
          API but is not endorsed or certified by TMDB.
        </span>
      </footer>
    </div>
  );
}

// Protect routes
function RequireAuth({ children }) {
  const { token } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

// =========================================================
// Shared pieces
// =========================================================

// rating • year • type • genre chips
function MetaRow({ item, maxGenres = 3 }) {
  const rating = Number(item.rating);

  return (
    <div className="meta-row">
      {rating > 0 && (
        <span className="meta-rating">
          <StarIcon size={14} /> {rating.toFixed(1)}
        </span>
      )}
      {item.release_year && <span>{item.release_year}</span>}
      <span>{typeLabel(item.type)}</span>
      {splitGenres(item.genre)
        .slice(0, maxGenres)
        .map((g) => (
          <span key={g} className="chip">
            {g}
          </span>
        ))}
    </div>
  );
}

// one poster tile. clicking the poster plays the trailer, the "+" adds it to My List
function PosterCard({ item, onPlay, onAdd, progress, meta }) {
  const rating = Number(item.rating);

  return (
    <article className="card">
      <div className="card-media">
        <button
          className="card-poster"
          onClick={() => onPlay(item)}
          aria-label={`Play ${item.title} trailer`}
        >
          {item.poster_url ? (
            <img
              src={resizeTmdbImage(item.poster_url, "w342")}
              alt=""
              loading="lazy"
            />
          ) : (
            <span className="card-noimg">{item.title}</span>
          )}

          <span className="card-overlay">
            <span className="card-play">
              <PlayIcon size={22} />
            </span>
          </span>

          {rating > 0 && (
            <span className="card-rating">
              <StarIcon size={12} /> {rating.toFixed(1)}
            </span>
          )}

          {progress != null && (
            <span className="card-progress">
              <span style={{ width: `${progress}%` }} />
            </span>
          )}
        </button>

        {onAdd && (
          <button
            className="card-add"
            onClick={() => onAdd(item)}
            aria-label={`Add ${item.title} to My List`}
            title="Add to My List"
          >
            <PlusIcon size={16} />
          </button>
        )}
      </div>

      <div className="card-info">
        <h4 className="card-title" title={item.title}>
          {item.title}
        </h4>
        <p className="card-meta">
          {meta ||
            `${item.release_year || "—"} • ${typeLabel(item.type)}`}
        </p>
      </div>
    </article>
  );
}

// a titled, sideways-scrolling row of posters. "See all" turns it into a full grid
function ContentRow({
  id,
  title,
  items,
  onPlay,
  onAdd,
  getProgress,
  getMeta,
  showCount = false,
  expanded = false,
  onToggleExpand,
}) {
  const scrollerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll position to show/hide arrows
  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  // re-check when the row resizes (window resize, items loading in)
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateArrows);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateArrows, items, expanded]);

  // scroll about one screen-width of posters at a time
  const scroll = (direction) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section className="row" id={id} aria-label={title}>
      <div className="row-header">
        <h3 className="row-title">
          {title}
          {showCount && <span className="row-count">{items.length}</span>}
        </h3>
        {onToggleExpand && items.length > 6 && (
          <button className="row-link" onClick={onToggleExpand}>
            {expanded ? "Show less" : "See all"}
          </button>
        )}
      </div>

      <div className="row-body">
        {!expanded && canScrollLeft && (
          <button
            className="row-arrow row-arrow--left"
            onClick={() => scroll(-1)}
            aria-label={`Scroll ${title} left`}
          >
            <ChevronLeftIcon size={30} />
          </button>
        )}

        <div
          ref={scrollerRef}
          className={expanded ? "card-grid" : "row-scroller"}
          onScroll={expanded ? undefined : updateArrows}
        >
          {items.map((item) => (
            <PosterCard
              key={item.id}
              item={item}
              onPlay={onPlay}
              onAdd={onAdd}
              progress={getProgress ? getProgress(item) : undefined}
              meta={getMeta ? getMeta(item) : undefined}
            />
          ))}
        </div>

        {!expanded && canScrollRight && (
          <button
            className="row-arrow row-arrow--right"
            onClick={() => scroll(1)}
            aria-label={`Scroll ${title} right`}
          >
            <ChevronRightIcon size={30} />
          </button>
        )}
      </div>
    </section>
  );
}

// grey placeholder rows while content loads
function SkeletonRows({ rows = 3 }) {
  return Array.from({ length: rows }, (_, r) => (
    <div className="row" key={r} aria-hidden="true">
      <div className="skeleton skeleton-title" />
      <div className="row-scroller">
        {Array.from({ length: 8 }, (_, i) => (
          <div className="skeleton skeleton-card" key={i} />
        ))}
      </div>
    </div>
  ));
}

// =========================================================
// Homepage carousel
// =========================================================
function HeroCarousel({ items, onPlay, onAdd }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(null);

  const count = items.length;
  const current = items[index];

  // rank among titles of the same type (slides alternate movie/show, so index alone isn't the rank)
  const typeRank = items
    .slice(0, index + 1)
    .filter((i) => i.type === current.type).length;

  const goTo = useCallback((i) => setIndex((i + count) % count), [count]);
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  // swipe left/right on phones
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0) next();
      else prev();
    }
    touchStartX.current = null;
  };

  return (
    <section
      className={`hero ${paused ? "is-paused" : ""}`}
      style={{ "--slide-ms": `${SLIDE_MS}ms` }}
      aria-roledescription="carousel"
      aria-label="Featured titles"
      // pause the auto-advance while the mouse is over it. only real mice: on phones a tap
      // fires a fake "enter" with no "leave", which would pause the carousel for good
      onPointerEnter={(e) => e.pointerType === "mouse" && setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* all slides are stacked on top of each other, the active one fades in */}
      {items.map((item, i) => (
        <div
          key={item.id}
          className={`hero-slide ${i === index ? "is-active" : ""}`}
          aria-hidden={i !== index}
        >
          <img
            className="hero-backdrop"
            src={item.backdrop_url}
            alt=""
            loading={i === 0 ? "eager" : "lazy"}
          />
        </div>
      ))}

      <div className="hero-shade" />

      {/* key makes the text re-animate on every slide change */}
      <div
        className="hero-content"
        key={current.id}
        aria-live={paused ? "polite" : "off"}
      >
        <span className="hero-badge">
          #{typeRank} Trending {current.type === "movie" ? "Movie" : "Show"}
        </span>
        <h1 className="hero-title">{current.title}</h1>
        <MetaRow item={current} />
        <p className="hero-overview">{current.overview}</p>

        <div className="hero-actions">
          <button
            className="btn btn-light btn-lg"
            onClick={() => onPlay(current)}
          >
            <PlayIcon /> Play Trailer
          </button>
          <button
            className="btn btn-glass btn-lg"
            onClick={() => onAdd(current)}
          >
            <PlusIcon /> My List
          </button>
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            className="hero-arrow hero-arrow--prev"
            onClick={prev}
            aria-label="Previous title"
          >
            <ChevronLeftIcon size={24} />
          </button>
          <button
            className="hero-arrow hero-arrow--next"
            onClick={next}
            aria-label="Next title"
          >
            <ChevronRightIcon size={24} />
          </button>

          {/* the active dot fills up over SLIDE_MS. when its animation ends we go to the next slide,
              so pausing the animation (hover) also pauses the carousel */}
          <div className="hero-dots">
            {items.map((item, i) => (
              <button
                key={item.id}
                className={`hero-dot ${i === index ? "is-active" : ""}`}
                onClick={() => goTo(i)}
                aria-label={`Show ${item.title}`}
                aria-current={i === index}
              >
                <span className="hero-dot-bar">
                  <span
                    className="hero-dot-fill"
                    onAnimationEnd={i === index ? next : undefined}
                  />
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// =========================================================
// Continue Watching row
// =========================================================
function ContinueWatchingSection({ onPlay }) {
  const { token } = useAuth();
  const expireSession = useExpireSession();

  // remember whose token the rows were loaded with, so after logging out (or switching
  // accounts) the old person's rows are never shown
  const [loaded, setLoaded] = useState({ token: null, items: [] });

  // reload whenever the logged in user changes
  useEffect(() => {
    if (!token) return;

    const fetchContinueWatching = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/progress`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          expireSession(false); // just log out quietly, the homepage works without an account
        } else if (res.ok) {
          const data = await res.json();
          // progress rows have their own id, so use the content's id for keys and links
          setLoaded({
            token,
            items: data.map((p) => ({ ...p, id: p.content_id })),
          });
        }
      } catch (err) {
        console.error("Error fetching continue watching:", err);
      }
    };

    fetchContinueWatching();
  }, [token, expireSession]);

  const items = token && loaded.token === token ? loaded.items : [];
  if (items.length === 0) return null;

  return (
    <ContentRow
      id="continue-watching"
      title="Continue Watching"
      items={items}
      onPlay={onPlay}
      getProgress={(item) =>
        Math.min(
          100,
          Math.round((item.progress_seconds / item.duration_seconds) * 100)
        )
      }
      getMeta={(item) =>
        `${formatTime(item.progress_seconds)} / ${formatTime(
          item.duration_seconds
        )}`
      }
    />
  );
}

// =========================================================
// Homepage
// =========================================================

// genres that don't make good "featured" picks for the carousel
const NOT_FEATURED_GENRES = ["News", "Talk", "Reality", "Soap"];

// the catalog, kept after the first load so going Back to the homepage doesn't download it again
let catalogCache = null;

function BrowsePage({ searchTerm }) {
  const navigate = useNavigate();
  const [toastEl, showToast] = useToast();
  const addToWatchlist = useAddToWatchlist();

  const [items, setItems] = useState(() => catalogCache || []);
  const [loading, setLoading] = useState(!catalogCache);
  const [error, setError] = useState("");

  const [tab, setTab] = useState("movie"); // "movie" or "tv_show"
  const [expandedGenre, setExpandedGenre] = useState(null); // genre row showing "See all"

  // the whole catalog is only ~600 titles, so load it once and group it in the browser
  useEffect(() => {
    if (catalogCache) return;

    const fetchContent = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/content?limit=1000`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load content");
          return;
        }

        // comes back sorted most popular first
        catalogCache = data.items || [];
        setItems(catalogCache);
      } catch (err) {
        console.error("Error fetching content:", err);
        setError("Network error while loading content");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  const handlePlay = (item) =>
    navigate(`/watch/${item.id}`, { state: { item } });

  const handleAdd = async (item) => showToast(await addToWatchlist(item.id));

  // carousel picks: popular + recent titles with a big backdrop image. mix of movies and shows
  const featured = useMemo(() => {
    const candidates = items.filter(
      (i) =>
        i.backdrop_url &&
        i.overview &&
        Number(i.rating) >= 6 &&
        !splitGenres(i.genre).some((g) => NOT_FEATURED_GENRES.includes(g))
    );

    // newest titles first (still most-popular-first inside that), then everything else
    const newestYear = Math.max(0, ...candidates.map((i) => i.release_year || 0));
    const isRecent = (i) => (i.release_year || 0) >= newestYear - 1;
    const ordered = [
      ...candidates.filter(isRecent),
      ...candidates.filter((i) => !isRecent(i)),
    ];

    const movies = ordered.filter((i) => i.type === "movie").slice(0, 5);
    const shows = ordered.filter((i) => i.type === "tv_show").slice(0, 3);

    // alternate movie, show, movie, show...
    const mixed = [];
    for (let i = 0; i < Math.max(movies.length, shows.length); i++) {
      if (movies[i]) mixed.push(movies[i]);
      if (shows[i]) mixed.push(shows[i]);
    }
    return mixed;
  }, [items]);

  // everything for the selected tab (movies or shows)
  const tabItems = useMemo(
    () => items.filter((i) => i.type === tab),
    [items, tab]
  );

  // top 20 for the "Popular" row (skipping news/talk shows, which TMDB ranks very high)
  const popularItems = useMemo(
    () =>
      tabItems
        .filter(
          (i) =>
            !splitGenres(i.genre).some((g) => NOT_FEATURED_GENRES.includes(g))
        )
        .slice(0, 20),
    [tabItems]
  );

  // one row per genre. a title with 3 genres shows up in all 3 rows
  const genreRows = useMemo(() => {
    const groups = new Map();

    for (const item of tabItems) {
      const genres = splitGenres(item.genre);
      for (const g of genres.length > 0 ? genres : ["More to Explore"]) {
        if (!groups.has(g)) groups.set(g, []);
        groups.get(g).push(item);
      }
    }

    // biggest genres first, the catch-all row last
    return [...groups.entries()]
      .map(([genre, list]) => ({ genre, items: list }))
      .sort(
        (a, b) =>
          (a.genre === "More to Explore") - (b.genre === "More to Explore") ||
          b.items.length - a.items.length
      );
  }, [tabItems]);

  // search is done in the browser since we already have every title
  const searchResults = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return q ? items.filter((i) => i.title.toLowerCase().includes(q)) : [];
  }, [items, searchTerm]);

  const switchTab = (next) => {
    setTab(next);
    setExpandedGenre(null);
  };

  const jumpToGenre = (genre) => {
    document
      .getElementById(`genre-${slugify(genre)}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ---------- search results view ----------
  if (searchTerm) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Results for “{searchTerm}”</h1>
          {!loading && (
            <span className="page-sub">
              {searchResults.length}{" "}
              {searchResults.length === 1 ? "title" : "titles"}
            </span>
          )}
        </div>

        {loading ? (
          <p className="muted">Searching...</p>
        ) : error ? (
          <p className="text-error">{error}</p>
        ) : searchResults.length === 0 ? (
          <div className="empty-state">
            <h2>No matches</h2>
            <p>Try a different title, or clear the search to browse everything.</p>
          </div>
        ) : (
          <div className="card-grid card-grid--flush">
            {searchResults.map((item) => (
              <PosterCard
                key={item.id}
                item={item}
                onPlay={handlePlay}
                onAdd={handleAdd}
              />
            ))}
          </div>
        )}
        {toastEl}
      </div>
    );
  }

  // ---------- normal homepage ----------
  const tabName = tab === "movie" ? "Movies" : "TV Shows";
  const hasHero = loading || featured.length > 0;

  return (
    <div className="home">
      {loading ? (
        <div className="hero hero--skeleton skeleton" aria-hidden="true" />
      ) : (
        featured.length > 0 && (
          <HeroCarousel items={featured} onPlay={handlePlay} onAdd={handleAdd} />
        )
      )}

      <div className={`home-content ${hasHero ? "" : "home-content--no-hero"}`}>
        <ContinueWatchingSection onPlay={handlePlay} />

        <section id="browse" aria-label="Browse">
          <div className="browse-header">
            <h2 className="section-title">Browse {tabName}</h2>

            <div className="tabs" role="tablist" aria-label="Content type">
              <button
                role="tab"
                aria-selected={tab === "movie"}
                className={`tab ${tab === "movie" ? "is-active" : ""}`}
                onClick={() => switchTab("movie")}
              >
                Movies
              </button>
              <button
                role="tab"
                aria-selected={tab === "tv_show"}
                className={`tab ${tab === "tv_show" ? "is-active" : ""}`}
                onClick={() => switchTab("tv_show")}
              >
                TV Shows
              </button>
            </div>
          </div>

          {error && (
            <p className="text-error" style={{ padding: "0 var(--gutter)" }}>
              {error}
            </p>
          )}

          {loading ? (
            <SkeletonRows />
          ) : (
            <>
              {/* genre shortcuts */}
              <div className="chips">
                {genreRows.map((row) => (
                  <button
                    key={row.genre}
                    className="chip-btn"
                    onClick={() => jumpToGenre(row.genre)}
                  >
                    {row.genre}
                  </button>
                ))}
              </div>

              <ContentRow
                key={`popular-${tab}`} // new row per tab so the scroll position resets
                id={`popular-${tab}`}
                title={`Popular ${tabName}`}
                items={popularItems}
                onPlay={handlePlay}
                onAdd={handleAdd}
              />

              {genreRows.map((row) => (
                <ContentRow
                  key={`${tab}-${row.genre}`}
                  id={`genre-${slugify(row.genre)}`}
                  title={row.genre}
                  items={row.items}
                  onPlay={handlePlay}
                  onAdd={handleAdd}
                  showCount
                  expanded={expandedGenre === row.genre}
                  onToggleExpand={() =>
                    setExpandedGenre(
                      expandedGenre === row.genre ? null : row.genre
                    )
                  }
                />
              ))}
            </>
          )}
        </section>
      </div>

      {toastEl}
    </div>
  );
}

// =========================================================
// Watchlist page
// =========================================================
function WatchlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { token } = useAuth();
  const expireSession = useExpireSession();
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

      if (res.status === 401) {
        expireSession(true);
        return;
      }

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

  // watchlist rows have their own id, the content's id is content_id
  const play = (item) =>
    navigate(`/watch/${item.content_id}`, {
      state: { item: { ...item, id: item.content_id } },
    });

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">My List</h1>
        {!loading && items.length > 0 && (
          <span className="page-sub">
            {items.length} {items.length === 1 ? "title" : "titles"} ·{" "}
            {items.filter((i) => i.watched).length} watched
          </span>
        )}
      </div>

      {loading ? (
        <div className="list-grid" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <div className="skeleton" key={i} style={{ height: 192 }} />
          ))}
        </div>
      ) : error && items.length === 0 ? (
        <p className="text-error">{error}</p>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <h2>Your list is empty</h2>
          <p>Tap the + on any movie or show to save it here.</p>
          <Link className="btn btn-primary" to="/">
            Browse titles
          </Link>
        </div>
      ) : (
        <div className="list-grid">
          {error && (
            // errors from marking watched / removing (the list itself still loaded)
            <p className="text-error" style={{ gridColumn: "1 / -1", margin: 0 }}>
              {error}
            </p>
          )}
          {items.map((item) => {
            const title = item.title || `Content #${item.content_id}`;

            return (
              <article key={item.id} className="list-card card">
                <div className="card-media">
                  <button
                    className="card-poster"
                    onClick={() => play(item)}
                    aria-label={`Play ${title} trailer`}
                  >
                    {item.poster_url ? (
                      <img
                        src={resizeTmdbImage(item.poster_url, "w342")}
                        alt=""
                        loading="lazy"
                      />
                    ) : (
                      <span className="card-noimg">No image</span>
                    )}
                    <span className="card-overlay">
                      <span className="card-play">
                        <PlayIcon size={20} />
                      </span>
                    </span>
                    {item.watched && (
                      <span className="badge-watched">
                        <CheckIcon size={11} /> Watched
                      </span>
                    )}
                  </button>
                </div>

                <div className="list-card-body">
                  <h3 className="list-card-title">{title}</h3>
                  <MetaRow item={item} maxGenres={0} />
                  {item.genre && (
                    <p className="list-card-genres">{item.genre}</p>
                  )}
                  {item.notes && (
                    <p className="list-card-notes">Notes: {item.notes}</p>
                  )}

                  <div className="list-card-actions">
                    <button
                      onClick={() => play(item)}
                      className="btn btn-sm btn-primary"
                    >
                      <PlayIcon size={14} /> Trailer
                    </button>
                    <button
                      onClick={() => handleToggleWatched(item)}
                      className={`btn btn-sm ${
                        item.watched ? "btn-success" : "btn-ghost"
                      }`}
                      aria-pressed={item.watched}
                    >
                      <CheckIcon size={14} />
                      {item.watched ? "Watched" : "Mark watched"}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="btn btn-sm btn-icon btn-danger-ghost"
                      aria-label={`Remove ${title} from My List`}
                      title="Remove"
                    >
                      <TrashIcon size={15} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =========================================================
// YouTube trailer player
// =========================================================

// loads YouTube's player script once. It lets us read the trailer's real position and length
let youTubeApiPromise = null;
function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);

  if (!youTubeApiPromise) {
    youTubeApiPromise = new Promise((resolve, reject) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve(window.YT);
      };

      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.onerror = () => {
        youTubeApiPromise = null; // allow a retry next time
        reject(new Error("YouTube player script failed to load"));
      };
      document.head.appendChild(script);
    });
  }
  return youTubeApiPromise;
}

// plays a trailer and calls onProgress(currentSeconds, durationSeconds) every 10s while it plays,
// when it's paused or ends, and when the page is left
function TrailerPlayer({ videoKey, title, startSeconds, onProgress }) {
  const hostRef = useRef(null);
  const [failed, setFailed] = useState(false);

  // keep the newest callback without re-creating the player
  const onProgressRef = useRef(onProgress);
  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  // the start time only matters when the player is first created, so ignore later changes
  const [startAt] = useState(startSeconds);

  useEffect(() => {
    let player = null;
    let timer = null;
    let cancelled = false;
    const host = hostRef.current;

    const report = () => {
      try {
        if (typeof player?.getCurrentTime !== "function") return; // not ready yet
        const current = Math.floor(player.getCurrentTime());
        const duration = Math.floor(player.getDuration());
        if (current > 0 && duration > 0) onProgressRef.current(current, duration);
      } catch (err) {
        console.error("Error reading trailer position:", err);
      }
    };

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;

        // YouTube replaces this element with its iframe, so give it one React doesn't manage
        const el = document.createElement("div");
        host.appendChild(el);

        player = new YT.Player(el, {
          videoId: videoKey,
          playerVars: { autoplay: 1, rel: 0, start: startAt },
          events: {
            onStateChange: (e) => {
              clearInterval(timer);
              if (e.data === YT.PlayerState.PLAYING) {
                timer = setInterval(report, 10000); // Every 10 seconds
              } else if (
                e.data === YT.PlayerState.PAUSED ||
                e.data === YT.PlayerState.ENDED
              ) {
                report();
              }
            },
          },
        });
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      clearInterval(timer);
      report(); // save where they were when leaving the page
      player?.destroy?.();
      host.innerHTML = "";
    };
  }, [videoKey, startAt]);

  // if YouTube's script is blocked, still show the trailer, just without saving progress
  if (failed) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0&start=${startAt}`}
        title={`${title} trailer`}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return <div ref={hostRef} className="player-host" />;
}

// =========================================================
// Page that plays the title's trailer using the YouTube embed player
// =========================================================
function WatchPage() {
  // If your route is /watch/:id, and the URL is /watch/7, then id === "7". That tells WatchPage which content to show.
  const { contentId } = useParams(); // /watch/:contentId
  const navigate = useNavigate(); // lets user go back or go to another page in coded
  const location = useLocation();
  const [toastEl, showToast] = useToast();
  const { token } = useAuth();
  const expireSession = useExpireSession();
  const addToWatchlist = useAddToWatchlist();

  // item may be passed from Browse/Watchlist via location.state (so the page shows instantly)
  const passedItem = location.state?.item || null;

  const [item, setItem] = useState(passedItem); // content we're trying to watch
  const [notFound, setNotFound] = useState(false);
  const [trailerKey, setTrailerKey] = useState(undefined); // YouTube video key. undefined = still loading, null = no trailer
  const [savedProgress, setSavedProgress] = useState(null); // { seconds, duration } of the trailer, null until loaded

  // only these two fields matter for the TMDB lookup below
  const itemType = item?.type;
  const tmdbId = item?.tmdb_id;

  // Always load the full details by id (adds the description/backdrop, and makes the page work after a refresh)
  useEffect(() => {
    const loadItem = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/content/${contentId}`);
        if (res.ok) {
          setItem(await res.json());
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Error loading content:", err);
        setNotFound(true);
      }
    };

    loadItem();
  }, [contentId]);

  // Load where the user left off in this trailer
  useEffect(() => {
    const loadProgress = async () => {
      if (token) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/progress/${contentId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.status === 401) {
            expireSession(true);
            return;
          }

          if (res.ok) {
            const data = await res.json();
            setSavedProgress({
              seconds: data.progress_seconds || 0,
              duration: data.duration_seconds || 0,
            });
            return;
          }
        } catch (err) {
          console.error("Error loading progress:", err);
        }
      }

      setSavedProgress({ seconds: 0, duration: 0 }); // start from the beginning
    };

    loadProgress();
  }, [contentId, token, expireSession]);

  // Save the trailer's real position (called by TrailerPlayer only while a trailer is playing)
  const saveProgress = useCallback(
    (progressSeconds, durationSeconds) => {
      if (!token) return;

      fetch(`${API_BASE_URL}/api/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contentId: parseInt(contentId, 10),
          progressSeconds,
          durationSeconds,
        }),
      })
        .then((res) => {
          if (res.status === 401) expireSession(true);
        })
        .catch((err) => console.error("Error saving progress:", err));
    },
    [token, contentId, expireSession]
  );

  // Load the trailer's YouTube key from our backend (which asks TMDB)
  useEffect(() => {
    if (!tmdbId) return;

    const loadTrailer = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/tmdb/trailer/${itemType}/${tmdbId}`
        );

        if (res.ok) {
          const data = await res.json();
          setTrailerKey(data.youtube_key);
        } else {
          setTrailerKey(null); // TMDB has no trailer for this title
        }
      } catch (err) {
        console.error("Error loading trailer:", err);
        setTrailerKey(null);
      }
    };

    loadTrailer();
  }, [itemType, tmdbId]);

  // resume where they left off, unless they had (nearly) finished it -> start over
  const resumeFrom =
    savedProgress && savedProgress.seconds < savedProgress.duration * 0.95
      ? savedProgress.seconds
      : 0;

  // if this page was opened directly (no history in our app), "Back" goes home instead of leaving the site
  const goBack = () =>
    location.key === "default" ? navigate("/") : navigate(-1);

  const handleAdd = async () =>
    showToast(await addToWatchlist(parseInt(contentId, 10)));

  return (
    <div className="watch">
      {item?.backdrop_url && (
        <div
          className="watch-backdrop"
          style={{ backgroundImage: `url(${item.backdrop_url})` }}
        />
      )}

      <div className="watch-inner">
        {/* back button */}
        <button className="btn btn-ghost btn-sm watch-back" onClick={goBack}>
          <ChevronLeftIcon size={16} /> Back
        </button>

        {/* if we do have an item, show all its details, if not show an error */}
        {item ? (
          <>
            {/* player frame */}
            <div className="player">
              {trailerKey && savedProgress ? (
                // this is what actually shows the video player on screen
                <TrailerPlayer
                  key={trailerKey}
                  videoKey={trailerKey}
                  title={item.title}
                  startSeconds={resumeFrom}
                  onProgress={saveProgress}
                />
              ) : trailerKey === undefined || !savedProgress ? (
                // still waiting on the trailer lookup / saved progress
                <div className="player-msg">
                  <span className="spinner" aria-hidden="true" />
                  Loading trailer...
                </div>
              ) : (
                // TMDB had no trailer for this title
                <div className="player-msg">
                  Sorry, there&apos;s no trailer available for this title.
                </div>
              )}
            </div>

            <div className="watch-details">
              <div>
                <h1 className="watch-title">{item.title}</h1>
                <MetaRow item={item} />
                {trailerKey && resumeFrom > 0 && (
                  <p className="watch-resume">
                    Resuming trailer from {formatTime(resumeFrom)}
                  </p>
                )}
                {item.overview && (
                  <p className="watch-overview">{item.overview}</p>
                )}
              </div>

              <button className="btn btn-primary" onClick={handleAdd}>
                <PlusIcon /> Add to My List
              </button>
            </div>
          </>
        ) : notFound ? (
          <p className="text-error">
            We couldn&apos;t find that title. Please go back and choose another.
          </p>
        ) : (
          <div className="player">
            <div className="player-msg">
              <span className="spinner" aria-hidden="true" />
            </div>
          </div>
        )}
      </div>

      {toastEl}
    </div>
  );
}

// =========================================================
// Login + Register
// =========================================================

// the public demo account (also listed in the README). the server resets its list on every login
const DEMO_LOGIN = { identifier: "demo", password: "WatchDemo2026" };

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const location = useLocation();

  // set by expireSession when an old login stopped working. read it once, then clear it
  const [sessionExpired] = useState(
    () => sessionStorage.getItem("sessionExpired") === "1"
  );
  useEffect(() => {
    sessionStorage.removeItem("sessionExpired");
  }, []);

  // email or username, the server accepts either
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // shared by the form and the "Use the demo account" button
  const logIn = async (loginId, loginPassword) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // "email" too, so a backend that hasn't been redeployed yet still understands it
        body: JSON.stringify({
          identifier: loginId,
          email: loginId,
          password: loginPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      // saves the token + user (in localStorage too, so a refresh keeps you logged in)
      login(data.token, data.user);

      // go back to the page that asked them to log in (e.g. a trailer), otherwise home
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    logIn(identifier, password);
  };

  return (
    <div className="auth">
      <div className="auth-card">
        <Link to="/" className="brand">
          Watch<span>Streamify</span>
        </Link>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">
          Log in to keep your list and pick up where you left off.
        </p>

        {sessionExpired && (
          <p className="form-error" style={{ marginBottom: 16 }}>
            Your session expired. Please log in again.
          </p>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">Email or username</span>
            <input
              className="field-input"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Password</span>
            <input
              className="field-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="btn btn-primary btn-lg btn-block"
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log in"}
          </button>

          {/* for recruiters / reviewers: logs into the shared demo account listed in the README */}
          <button
            className="btn btn-ghost btn-lg btn-block"
            type="button"
            disabled={loading}
            onClick={() => {
              setIdentifier(DEMO_LOGIN.identifier);
              setPassword(DEMO_LOGIN.password);
              logIn(DEMO_LOGIN.identifier, DEMO_LOGIN.password);
            }}
          >
            Use the demo account
          </button>
        </form>

        <p className="auth-switch">
          New here?{" "}
          <Link to="/register" state={location.state}>
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const location = useLocation();
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

      // saves the token + user (in localStorage too, so a refresh keeps you logged in)
      login(data.token, data.user);

      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      console.error("Register error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-card">
        <Link to="/" className="brand">
          Watch<span>Streamify</span>
        </Link>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-sub">
          Save movies and shows to your list and track what you&apos;ve
          watched.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">Username</span>
            <input
              className="field-input"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Email</span>
            <input
              className="field-input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Password</span>
            <input
              className="field-input"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="btn btn-primary btn-lg btn-block"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <Link to="/login" state={location.state}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default App;
