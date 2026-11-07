const getApiUrl = () => {
  return (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:4000')).replace(/\/$/, '');
};

export const API_URL = getApiUrl();
