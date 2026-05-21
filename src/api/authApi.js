import API from "./axios";

export const loginApi = (data) => API.post("/auth/login", data);
export const registerApi = (data) => API.post("/auth/register", data);
export const getMeApi = () => API.get("/auth/me");