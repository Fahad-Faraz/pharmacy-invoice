import API from "./axios";

export const getProductsApi = (params) => API.get("/products", { params });
export const addProductApi = (data) => API.post("/products", data);
export const updateProductApi = (id, data) => API.put(`/products/${id}`, data);
export const deleteProductApi = (id) => API.delete(`/products/${id}`);
export const searchProductsApi = (q) => API.get(`/products/search?q=${q}`);
export const addPurchaseApi = (data) => API.post("/purchase", data);
export const importProductsApi = (formData) =>
  API.post("/import/products", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });