// src/api/posts.js - Blog post API calls
import client from './client';

// Get all published posts
export const getPosts = async (params = {}) => {
  const response = await client.get('/posts/', { params });
  return response.data;
};

// Get featured posts
export const getFeaturedPosts = async (limit = 5) => {
  const response = await client.get('/posts/featured', { params: { limit } });
  return response.data;
};

// Get a single post by slug
export const getPost = async (slug) => {
  const response = await client.get(`/posts/${slug}`);
  return response.data;
};

// Create a new post (admin)
export const createPost = async (postData) => {
  const response = await client.post('/posts/', postData);
  return response.data;
};

// Update a post (admin)
export const updatePost = async (slug, postData) => {
  const response = await client.put(`/posts/${slug}`, postData);
  return response.data;
};

// Delete a post (admin)
export const deletePost = async (slug) => {
  await client.delete(`/posts/${slug}`);
};

// Publish a draft post (admin)
export const publishPost = async (slug) => {
  const response = await client.post(`/posts/${slug}/publish`);
  return response.data;
};