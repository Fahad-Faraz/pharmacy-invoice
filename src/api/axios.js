import axios from "axios";

const API = axios.create({
  baseURL: "https://pharmacy-back-mlaxkwrb8-fahadfarazs-projects.vercel.app/",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    return Promise.reject(err);
  }
);

export default API;