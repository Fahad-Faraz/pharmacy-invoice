import API from "./axios";

export const getAnalyticsApi = () => API.get("/analytics");
export const getDemandApi = () => API.get("/demand");