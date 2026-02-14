import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:8080/api'
});

instance.interceptors.request.use((config) => {
    // Ne pas ajouter le token pour login/register
    if (!config.url.includes('/auth/login') && !config.url.includes('/auth/register')) {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

export default instance;
