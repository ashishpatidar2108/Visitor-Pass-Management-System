import axios from 'axios';

import { getToken } from '../utils/authStorage';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const serverUrl =
  import.meta.env.VITE_SERVER_URL || apiUrl.replace(/\/api\/?$/, '');

const api = axios.create({ baseURL: apiUrl });

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function getServerAssetUrl(assetPath) {
  return assetPath ? `${serverUrl}${assetPath}` : '';
}

export default api;
