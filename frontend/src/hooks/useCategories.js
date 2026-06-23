// src/hooks/useCategories.js - fetch the live category list
import { useState, useEffect } from 'react';
import { getCategories } from '../api/categories';

export default function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let on = true;
    getCategories()
      .then((data) => {
        if (on) setCategories(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error('Failed to load categories', err))
      .finally(() => {
        if (on) setLoaded(true);
      });
    return () => {
      on = false;
    };
  }, []);

  return { categories, loaded };
}