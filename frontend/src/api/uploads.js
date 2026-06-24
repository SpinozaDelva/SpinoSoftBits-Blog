// src/api/uploads.js - upload an image to the backend (Supabase Storage)
import client from './client';

export const uploadImage = async (file) => {
  const fd = new FormData();
  fd.append('file', file);
  const res = await client.post('/uploads/image', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data; // { url }
};