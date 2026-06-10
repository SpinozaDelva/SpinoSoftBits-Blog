// src/api/auth.js - Authentication API calls
import client from './client';

// Register a new user
export const register = async (userData) => {
  const response = await client.post('/auth/register', userData);
  return response.data;
};

// Login - returns token and saves it
export const login = async (email, password) => {
  const response = await client.post('/auth/login', { email, password });
  const { access_token } = response.data;
  localStorage.setItem('token', access_token);
  return response.data;
};

// Logout - removes token
export const logout = () => {
  localStorage.removeItem('token');
};

// Get current logged-in user
export const getCurrentUser = async () => {
  const response = await client.get('/auth/me');
  return response.data;
};

// Check if user is logged in
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};