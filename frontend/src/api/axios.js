import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000',
});

// The "Out-of-the-box" Interceptor
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        // Match your Django WWW-Authenticate header exactly
        config.headers.Authorization = `Token ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;