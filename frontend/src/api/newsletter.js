// src/api/newsletter.js - Newsletter API calls
import client from './client';

// Subscribe an email to the list
export const subscribe = async (data) => {
  const response = await client.post('/newsletter/subscribe', data);
  return response.data;
};