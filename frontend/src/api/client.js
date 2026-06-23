// src/api/client.js - Axios instance for talking to the FastAPI backend
import axios from 'axios';

// Dev falls back to localhost. In production, set VITE_API_URL in Vercel to your
// Railway backend WITH the /api suffix, e.g.
//   VITE_API_URL=https://<your-service>.up.railway.app/api
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create an axios instance with the base URL
const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach the auth token to every request (if it exists)
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;