// src/api/categories.js - Category API calls
import client from './client';

// Public: all categories (ordered) — drives theming
export const getCategories = async () => {
  const response = await client.get('/categories/');
  return response.data;
};

// Admin: create a category
export const createCategory = async (data) => {
  const response = await client.post('/categories/', data);
  return response.data;
};

// Admin: update a category (slug stays fixed)
export const updateCategory = async (slug, data) => {
  const response = await client.put(`/categories/${slug}`, data);
  return response.data;
};

// Admin: delete a category
export const deleteCategory = async (slug) => {
  await client.delete(`/categories/${slug}`);
};