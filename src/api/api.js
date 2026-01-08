import axios from 'axios';
import { getToken } from '../utils/authStorage';

const api = axios.create({
baseURL: 'https://api.imperiummmm.in/api',
  timeout: 10000,
});

// Attach JWT to every request
api.interceptors.request.use(   
  async (config) => {
    const token = await getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Global response handler (optional but recommended)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('Unauthorized — token invalid or expired');
      // Future: force logout here
    }
    return Promise.reject(error);
  }
);

export default api;
