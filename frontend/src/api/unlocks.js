// src/api/unlocks.js - Pay-to-unlock API calls
import client from './client';

// Start checkout for a premium post -> returns Stripe Checkout URL
export const startCheckout = async (slug) => {
  const response = await client.post('/unlocks/checkout', { slug });
  return response.data; // { url }
};

// After the Stripe success redirect (?unlocked=SESSION_ID)
export const confirmUnlock = async (sessionId) => {
  const response = await client.post('/unlocks/confirm', { session_id: sessionId });
  return response.data; // { token, post }
};

// Returning visitor / emailed ?key= token
export const verifyUnlock = async (slug, token) => {
  const response = await client.post('/unlocks/verify', { slug, token });
  return response.data; // { token, post }
};

// ----- Local token storage (per-post, browser-remembered access) -----
const keyFor = (slug) => `unlock:${slug}`;

export const getStoredToken = (slug) => {
  try {
    return localStorage.getItem(keyFor(slug));
  } catch {
    return null;
  }
};

export const storeToken = (slug, token) => {
  try {
    localStorage.setItem(keyFor(slug), token);
  } catch {
    /* storage blocked (private mode) — fine, they can use the email link */
  }
};