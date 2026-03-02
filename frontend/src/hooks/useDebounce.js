import { useState, useEffect, useCallback } from 'react';

export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debouncedValue;
}

export function useDebouncedCallback(callback, delay) {
  const [timeoutId, setTimeoutId] = useState(null);

  const debounced = useCallback(
    (...args) => {
      if (timeoutId) clearTimeout(timeoutId);
      const id = setTimeout(() => {
        callback(...args);
        setTimeoutId(null);
      }, delay);
      setTimeoutId(id);
    },
    [callback, delay]
  );

  useEffect(() => () => timeoutId && clearTimeout(timeoutId), [timeoutId]);

  return debounced;
}
