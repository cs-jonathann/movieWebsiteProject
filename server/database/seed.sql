-- Seed data for content table
-- TMDB IDs for popular movies and TV shows

-- Movies
INSERT INTO content (tmdb_id, title, type, poster_url, release_year, genre) VALUES
(550, 'Fight Club', 'movie', 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', 1999, 'Drama'),
(238, 'The Godfather', 'movie', 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', 1972, 'Crime'),
(424, 'Schindler''s List', 'movie', 'https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg', 1993, 'Drama'),
(13, 'Forrest Gump', 'movie', 'https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', 1994, 'Drama'),
(27205, 'Inception', 'movie', 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', 2010, 'Sci-Fi'),
(155, 'The Dark Knight', 'movie', 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', 2008, 'Action'),
(122, 'The Lord of the Rings: The Return of the King', 'movie', 'https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg', 2003, 'Fantasy'),
(120, 'The Lord of the Rings: The Fellowship of the Ring', 'movie', 'https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg', 2001, 'Fantasy'),
(429, 'The Good, the Bad and the Ugly', 'movie', 'https://image.tmdb.org/t/p/w500/bX2xnavhMYjWDoZp1VM6VnU1xwe.jpg', 1966, 'Western'),
(278, 'The Shawshank Redemption', 'movie', 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', 1994, 'Drama'),
(11216, 'Cinema Paradiso', 'movie', 'https://image.tmdb.org/t/p/w500/8SRUfRUi6x4O68n0VCbD6aK2li8.jpg', 1988, 'Drama'),
(497, 'The Green Mile', 'movie', 'https://image.tmdb.org/t/p/w500/velWPhVMQeQKcxggNEU8YmIo52R.jpg', 1999, 'Drama'),
(240, 'The Godfather Part II', 'movie', 'https://image.tmdb.org/t/p/w500/hek3koDUyRQk7FhHZkH6KqJZqX.jpg', 1974, 'Crime'),
(680, 'Pulp Fiction', 'movie', 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', 1994, 'Crime');

-- TV Shows
INSERT INTO content (tmdb_id, title, type, poster_url, release_year, genre) VALUES
(1396, 'Breaking Bad', 'tv_show', 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg', 2008, 'Crime'),
(1399, 'Game of Thrones', 'tv_show', 'https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg', 2011, 'Fantasy'),
(60574, 'Peaky Blinders', 'tv_show', 'https://image.tmdb.org/t/p/w500/6PX0r5TRRU5y0jZ70My1romtgSX.jpg', 2013, 'Crime'),
(1398, 'The Sopranos', 'tv_show', 'https://image.tmdb.org/t/p/w500/rTc7ZXdroqjkKivFPvCPXeXz8fw.jpg', 1999, 'Crime'),
(66732, 'Stranger Things', 'tv_show', 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg', 2016, 'Sci-Fi'),
(456, 'The Simpsons', 'tv_show', 'https://image.tmdb.org/t/p/w500/2IWouJK4gkg0dkvq6v4C4QLvxNH.jpg', 1989, 'Comedy'),
(1418, 'The Wire', 'tv_show', 'https://image.tmdb.org/t/p/w500/4lbclF2e7fEMQ5On1n7SC0M8o7f.jpg', 2002, 'Crime');

