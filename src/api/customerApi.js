import API from "./axios";

export const getCustomersApi = () => API.get("/customers");
export const createCustomerApi = (data) => API.post("/customers", data);
export const searchCustomersApi = (q) => API.get(`/customers/search?q=${q}`);
export const importCustomersApi = (formData) =>
  API.post("/import/customers", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });