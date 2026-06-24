// src/api/search.js - Archive search + pagination
import client from './client';

export const searchPosts = async ({ q = '', page = 1, pageSize = 9 } = {}) => {
  const params = new URLSearchParams({ q, page: String(page), page_size: String(pageSize) });
  const res = await client.get(`/search/posts?${params.toString()}`);
  return res.data; // { items, total, page, page_size, pages }
};