// utils/offlineQueue.js
export const saveOfflineInvoice = (invoice) => {
  const queue = JSON.parse(localStorage.getItem("offline")) || [];
  queue.push(invoice);
  localStorage.setItem("offline", JSON.stringify(queue));
};