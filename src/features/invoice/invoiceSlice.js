import { createSlice } from "@reduxjs/toolkit";

const slice = createSlice({
  name: "invoice",
  initialState: {
    items: [],
    invoiceType: "retailer",
    customerId: null,
    customerName: "",
    paidAmount: 0,
    previousBalance: 0,
  },
  reducers: {
    addItem: (state, action) => {
      const p = action.payload;
      const exist = state.items.find((i) => i.product === p._id);
      if (exist) {
        exist.quantity += 1;
        exist.total = exist.price * exist.quantity - (exist.discount || 0);
      } else {
        const price = p.product_type === "general" || p.product_type === "local" || p.product_type === "franchise"
          ? p.fixed_price || 0
          : p.mrp || 0;
        state.items.push({
          product: p._id,
          name: p.name,
          price,
          quantity: 1,
          discount: 0,
          unit: "tablet",
          total: price,
        });
      }
    },

    updateItem: (state, action) => {
      const { index, field, value } = action.payload;
      const item = state.items[index];
      if (!item) return;
      item[field] = field === "quantity" || field === "discount" || field === "price"
        ? Number(value) || 0
        : value;
      item.total = item.price * item.quantity - (item.discount || 0);
    },

    removeItem: (state, action) => {
      state.items.splice(action.payload, 1);
    },

    clearInvoice: (state) => {
      state.items = [];
      state.paidAmount = 0;
      state.customerId = null;
      state.customerName = "";
      state.previousBalance = 0;
    },

    setInvoiceType: (state, action) => {
      state.invoiceType = action.payload;
      if (action.payload === "retailer") {
        state.customerId = null;
        state.customerName = "";
        state.previousBalance = 0;
      }
    },

    setCustomer: (state, action) => {
      state.customerId = action.payload._id;
      state.customerName = action.payload.customer_name;
      state.previousBalance = action.payload.pending_balance || 0;
    },

    setPaidAmount: (state, action) => {
      state.paidAmount = Number(action.payload) || 0;
    },
  },
});

export const {
  addItem,
  updateItem,
  removeItem,
  clearInvoice,
  setInvoiceType,
  setCustomer,
  setPaidAmount,
} = slice.actions;

export default slice.reducer;