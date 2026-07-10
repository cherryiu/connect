import axios from 'axios';
import { API_URL } from '@env';

const API = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default API;
