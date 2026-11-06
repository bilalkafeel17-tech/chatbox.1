import api from './api';

export const searchUsersApi = async (query) => {
  const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
  return response.data;
};

export const fetchAllUsersApi = async () => {
  const response = await api.get('/users');
  return response.data;
};

export const fetchUserProfileApi = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

