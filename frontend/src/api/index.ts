import axios from 'axios';
import { API_URL, APP_ENV } from '@env';
import { configureMockApi } from './mockApi';

const API = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

if (APP_ENV === 'mock') configureMockApi(API);

export default API;
