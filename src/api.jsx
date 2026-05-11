import axios from "axios";

const api = axios.create({
    baseURL: "https://pianotechpro-fgcgavetexg6hddf.eastus-01.azurewebsites.net/api",
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;

