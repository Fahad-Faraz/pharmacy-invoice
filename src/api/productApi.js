import API from "./axios";

export const getProductsApi = (params) =>
  API.get("/products", { params });

export const addProductApi = (data) =>
  API.post("/products", data);

export const updateProductApi = (id, data) =>
  API.put(`/products/${id}`, data);

export const deleteProductApi = (id) =>
  API.delete(`/products/${id}`);

export const searchProductsApi = (q) =>
  API.get(`/products/search?q=${q}`);

export const addPurchaseApi = (data) =>
  API.post("/purchase", data);

// CSV Import
export const importProductsApi = (formData) =>
  API.post("/import/products", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// Excel Import (NEW)
export const importExcelApi = (formData) =>
  API.post("/import/products", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// Company CSV Export (NEW)
export const exportCompanyApi = (company) =>
  API.get(`/import/export/company/${encodeURIComponent(company)}`, {
    responseType: "blob",
  });