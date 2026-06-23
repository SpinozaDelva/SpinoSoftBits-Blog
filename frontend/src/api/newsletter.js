// src/api/newsletter.js - Newsletter API calls
import client from './client';

// Public: subscribe an email to the list
export const subscribe = async (data) => {
  const response = await client.post('/newsletter/subscribe', data);
  return response.data;
};

// Admin: list subscribers
export const getSubscribers = async () => {
  const response = await client.get('/newsletter/subscribers');
  return response.data;
};

// Admin: active count
export const getSubscriberCount = async () => {
  const response = await client.get('/newsletter/count');
  return response.data;
};

// Admin: send a custom email (rich) to all or selected
export const broadcast = async (data) => {
  const response = await client.post('/newsletter/broadcast', data);
  return response.data; // { sent }
};

// Admin: email a specific post to all or selected
export const sendPost = async (data) => {
  const response = await client.post('/newsletter/send-post', data);
  return response.data; // { sent }
};