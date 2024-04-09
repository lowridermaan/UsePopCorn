import { useState, useEffect } from 'react';

// const KEY = '5T5GMF5-EZ8MTYJ-GE3C0K1-K25EYTH';
const KEY2 = '3BQ3XDC-41G4NGQ-GS8DA8P-MASZ4BC';
// const KEY3 = '4C7P9QB-DDJMTDA-PVZTJX4-HR8T7D5';
// const KEY4 = 'RXB4RSP-JAPMVRW-MVHRH44-C169YT3';
// const KEY5 = 'EAGGJ2H-BXP4PJ0-Q1MN9P1-SHK5H41';

export function useMovie (query){

    const [movies, setMovies] = useState([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(
        function () {
            // callback?.()

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
                    'X-API-KEY': KEY2,
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
    
     
          fetchMovies();
    
          return function () {
            controller.abort();
          };
        },
        [query]
      );

      return {movies, error, isLoading}
}