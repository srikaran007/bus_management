export const extractItems = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
};

export const extractPagination = (data) => {
  if (data && data.pagination) return data.pagination;
  return { total: 0, page: 1, limit: 10, totalPages: 1 };
};
