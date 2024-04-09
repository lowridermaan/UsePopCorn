import { useEffect, useState } from 'react';
import poster from './img/defaulPoster.png';
import StarRating from './StarRating';

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

const KEY = '5T5GMF5-EZ8MTYJ-GE3C0K1-K25EYTH';
// const KEY2 = '3BQ3XDC-41G4NGQ-GS8DA8P-MASZ4BC';
// const KEY3 = '4C7P9QB-DDJMTDA-PVZTJX4-HR8T7D5';
// const KEY4 = 'RXB4RSP-JAPMVRW-MVHRH44-C169YT3';
// const KEY5 = 'EAGGJ2H-BXP4PJ0-Q1MN9P1-SHK5H41';

export default function App() {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [watched, setWatched] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedId, setSelectedID] = useState(null);

  function handleSelectedMovie(id) {
    setSelectedID((selectedId) => (id === selectedId ? null : id));
  }

  function handleCloseMovie() {
    setSelectedID(null);
  }

  function handleWatched(movie) {
    setWatched((watched) => [...watched, movie]);
  }

  function handleDeleteWatched(id) {
    setWatched((watched) => watched.filter((movie) => movie.id !== id));
  }

  useEffect(
    function () {
      const controller = new AbortController();

      async function fetchMovies() {
        setIsLoading(true);
        setError('');
        try {
          const res = await fetch(
            `https://api.kinopoisk.dev/v1.4/movie/search?query=${query}`,
            {
              method: 'GET',
              headers: {
                'X-API-KEY': KEY,
              },
              signal: controller.signal,
            }
          );

          if (!res.ok) throw new Error('Проверьте соединение с интернетом');

          const data = await res.json();

          if (!Boolean(data.total)) throw new Error('Фильм не найден');

          setMovies(data.docs);
          setError('');
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error(err.message);
            setError(err.message);
          }
        } finally {
          setIsLoading(false);
        }
      }

      if (query.length < 3) {
        setMovies([]);
        setError('');
        return;
      }

      handleCloseMovie();
      fetchMovies();

      return function () {
        controller.abort();
      };
    },
    [query]
  );

  return (
    <>
      <Navigation>
        <Logo />
        <Search query={query} setQuery={setQuery} />
        <NumSearchResults movies={movies} />
      </Navigation>
      <Main>
        <BoxList>
          {isLoading && <Loader />}
          {!isLoading && !error && (
            <MoviesList movies={movies} onCLickMovie={handleSelectedMovie} />
          )}
          {error && <ErrorMessage message={error} />}
        </BoxList>
        <BoxList>
          {selectedId ? (
            <MovieDetails
              onCloseMovie={handleCloseMovie}
              selectedId={selectedId}
              onAddWatched={handleWatched}
              watched={watched}
            />
          ) : (
            <>
              <WatchedSummury watched={watched} />
              <WatchedList
                watched={watched}
                onDeleteWatched={handleDeleteWatched}
              />
            </>
          )}
        </BoxList>
      </Main>
    </>
  );
}

function Loader() {
  return <p className="loader">Ищем фильмы...</p>;
}

function ErrorMessage({ message }) {
  return (
    <p className="error">
      <span>⛔</span>
      {message}
    </p>
  );
}

function Navigation({ children }) {
  return <nav className="nav-bar">{children}</nav>;
}

function Logo() {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>usePopcorn</h1>
    </div>
  );
}

function Search({ query, setQuery }) {
  return (
    <input
      className="search"
      type="text"
      placeholder="Поиск фильмов..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}

function NumSearchResults({ movies }) {
  return (
    <p className="num-results">
      Найдено <strong>{movies.length}</strong> фильмов
    </p>
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}

function BoxList({ children }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="box">
      <button className="btn-toggle" onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? '–' : '+'}
      </button>
      {isOpen && children}
    </div>
  );
}

function MoviesList({ movies, onCLickMovie }) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <MovieItem movie={movie} key={movie.id} onCLickMovie={onCLickMovie} />
      ))}
    </ul>
  );
}

function MovieItem({ movie, onCLickMovie }) {
  return (
    <li onClick={() => onCLickMovie(movie.id)}>
      <img
        src={movie.poster.url || poster}
        alt={`${movie.name || movie.alternativeName} poster`}
      />
      <h3>
        {`${movie.name || movie.alternativeName}`}
        {movie.name ? ` (${movie.alternativeName})` : ''}
      </h3>
      <div>
        <p>
          <span>📅</span>
          <span>{movie.year}</span>
        </p>
      </div>
    </li>
  );
}

function MovieDetails({ selectedId, onCloseMovie, onAddWatched, watched }) {
  // https://api.kinopoisk.dev/v1.4/movie/{id}

  // new Date('2010-07-22T00:00:00.000Z').toLocaleDateString('ru-RU',{day:'numeric',month: 'long', year:'numeric'})

  const [movie, setMovie] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [userRating, setUserRating] = useState('');

  const isWatched = watched.map((movie) => movie.id).includes(selectedId);
  const watchedUserRating = watched.find(
    (movie) => movie.id === selectedId
  )?.userRating;

  function handleAdd() {
    const newMovie = {
      id: selectedId,
      title: movie.name,
      poster: movie.poster.url,
      rating: movie.rating.kp,
      userRating,
      runtime: movie.movieLength,
    };

    onAddWatched(newMovie);
    onCloseMovie();
  }

  useEffect(
    function () {
      async function getMovieById() {
        setIsLoading(true);
        try {
          const res = await fetch(
            `https://api.kinopoisk.dev/v1.4/movie/${selectedId}`,
            {
              method: 'GET',
              headers: {
                'X-API-KEY': KEY,
              },
            }
          );

          if (!res.ok) throw new Error('что-то пошло не так'); //код оштибки 404

          const data = await res.json();

          setMovie(data);
          setIsLoading(false);
        } catch (err) {
          console.error(err);
        }
      }
      getMovieById();
    },
    [selectedId]
  );

  useEffect(
    function () {
      if (!movie.name) return;
      document.title = `Movie | ${movie.name}`;

      return function () {
        document.title = 'usePopCorn';
      };
    },
    [movie.name]
  );

  useEffect(
    function () {
      function callback(e) {
        if (e.code === 'Escape') {
          onCloseMovie();
        }
      }

      document.addEventListener('keydown', callback);

      return function () {
        document.removeEventListener('keydown', callback);
      };
    },
    [onCloseMovie]
  );

  const premiere = new Date(movie.premiere?.world).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const { persons } = movie;
  let actors = '';
  let director = '';

  if (persons) {
    actors = persons
      .filter((person) => person.profession === 'актеры')
      .map((actor) => actor.name)
      .join(', ');

    director = persons
      .filter((person) => person.profession === 'редакторы')
      .map((director) => director.name)
      .join(', ');
  }

  return (
    <div className="details">
      {!isLoading ? (
        <>
          <header>
            <button className="btn-back" onClick={onCloseMovie}>
              &larr;
            </button>
            <img
              src={movie.poster?.url || poster}
              alt={`poster of ${movie.name}`}
            />
            <div className="details-overview">
              <h2>{movie.name}</h2>
              <p>
                {premiere} &bull; {movie.movieLength} мин
              </p>
              <p>{movie.genres?.map((genre) => genre.name).join(', ')}</p>
              <p>
                <span>⭐</span>
                Кинопоиск: {movie.rating?.kp}, Imdb: {movie.rating?.imdb}
              </p>
            </div>
          </header>

          <section>
            <div className="rating">
              {!isWatched ? (
                <>
                  <StarRating
                    maxRating={10}
                    size={24}
                    onSetRating={setUserRating}
                  />
                  {userRating ? (
                    <button className="btn-add" onClick={handleAdd}>
                      + Add to list
                    </button>
                  ) : null}
                </>
              ) : (
                <p>
                  Вы оценили этот фильм на {watchedUserRating} <span>⭐</span>
                </p>
              )}
            </div>

            <p>
              <em>{movie.description}</em>
            </p>
            <p>Актеры: {actors}</p>
            <p>Режисер: {director}</p>
          </section>
        </>
      ) : (
        <Loader />
      )}
    </div>
  );
}

function WatchedSummury({ watched }) {
  const avgImdbRating = average(watched.map((movie) => movie.rating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));

  return (
    <div className="summary">
      <h2>Просмотренные фильмы</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} </span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating.toFixed(2)}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating.toFixed(2)}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{Math.trunc(avgRuntime)} мин</span>
        </p>
      </div>
    </div>
  );
}

function WatchedList({ watched, onDeleteWatched }) {
  return (
    <ul className="list">
      {watched.map((movie) => (
        <WatchedItem
          movie={movie}
          key={movie.id}
          onDeleteWatched={onDeleteWatched}
        />
      ))}
    </ul>
  );
}

function WatchedItem({ movie, onDeleteWatched }) {
  return (
    <li>
      <img src={movie.poster || poster} alt={`${movie.title} poster`} />
      <h3>{movie.title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.rating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.runtime} min</span>
        </p>
        <button
          className="btn-delete"
          onClick={() => onDeleteWatched(movie.id)}
        >
          X
        </button>
      </div>
    </li>
  );
}
