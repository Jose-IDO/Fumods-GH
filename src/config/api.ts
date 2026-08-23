const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:4000';
};

export const API_URL = getApiUrl();
