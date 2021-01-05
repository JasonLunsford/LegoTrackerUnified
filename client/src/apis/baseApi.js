import axios from 'axios';

export const baseApi = axios.create({
    baseURL: 'http://localhost:8181/api'
});
