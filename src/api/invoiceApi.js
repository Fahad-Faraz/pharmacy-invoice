import API from "./axios";

export const createInvoiceApi = (data) => API.post("/invoices", data);
export const getInvoicesApi = (params) => API.get("/invoices", { params });
export const returnInvoiceApi = (invoiceId) =>
  API.post("/invoices/return", { invoiceId });