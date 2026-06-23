// src/api/contact.js - "Work with me" inquiry
import client from './client';

export const submitInquiry = async (data) => {
  const response = await client.post('/contact/', data);
  return response.data;
};