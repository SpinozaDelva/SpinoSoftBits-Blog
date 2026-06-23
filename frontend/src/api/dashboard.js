// src/api/dashboard.js - Admin overview
import client from './client';

export const getOverview = async () => {
  const response = await client.get('/dashboard/overview');
  return response.data;
};