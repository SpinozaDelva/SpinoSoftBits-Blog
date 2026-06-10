// src/api/client.js - Axios instance for talking to FastAPI
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

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