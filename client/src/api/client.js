import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor to format errors gracefully
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorObj = error.response?.data?.error || {
      message: error.message || 'Network communication error'
    };
    return Promise.reject(errorObj);
  }
);

export default api;
