import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import toast from "react-hot-toast";
import {
  clearInvoice,
  setInvoiceType,
  setCustomer,
} from "./invoiceSlice";
import { createInvoiceApi } from "../../api/invoiceApi";
import { printPDF } from "../../utils/pdf";
import { saveOfflineInvoice } from "../../utils/offlineQueue";
import ProductSearch from "./components/ProductSearch";
import CustomerSearch from "./components/CustomerSearch";
import InvoiceRow from "./components/InvoiceRow";
import InvoiceSummary from "./components/InvoiceSummary";
import { addItem } from "./invoiceSlice";

// ─── Apni shop ki info yahan fill karo ───────────────────
const shop = {
  name: "Your Shop Name",
  address1: "Shop #1, Main Bazar",
  address2: "Karachi, Sindh",
  phone: "0300-0000000",
  ntn: "",
};
// ─────────────────────────────────────────────────────────

export default function POS() {
  const dispatch = useDispatch();

  const {
    items,
    invoiceType,
    customerId,
    customerName,
    paidAmount,
    previousBalance,
  } = useSelector((s) => s.invoice);

  const [loading, setLoading] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);

  const subtotal = items.reduce((acc, i) => acc + i.total, 0);

  const grandTotal =
    subtotal + (invoiceType === "wholesaler" ? previousBalance : 0);

  const createInvoice = async () => {
    if (items.length === 0) {
      toast.error("Add at least one product");
      return;
    }

    if (invoiceType === "wholesaler" && !customerId) {
      toast.error("Select a customer for wholesaler invoice");
      return;
    }

    setLoading(true);

    const payload = {
      products: items,
      invoice_type: invoiceType,
      paid_amount: paidAmount,
      ...(customerId && { customerId }),
    };

    try {
      const res = await createInvoiceApi(payload);

      setLastInvoice(res.data);

      // ── Auto PDF Print ──
      setTimeout(() => {
        printPDF("invoice-print");
      }, 500);

      dispatch(clearInvoice());

      toast.success("Invoice created!");
    } catch (err) {
      if (!navigator.onLine) {
        saveOfflineInvoice(payload);

        toast.success("Saved offline — will sync when connected");

        dispatch(clearInvoice());
      } else {
        toast.error(
          err.response?.data?.message || "Failed to create invoice"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Point of Sale</h1>

          <p className="text-ink-500 text-sm mt-0.5">
            Create invoices for retail or wholesale
          </p>
        </div>

        {/* Invoice type toggle */}
        <div className="flex items-center bg-parchment border border-ink-200 rounded-xl p-1">
          {["retailer", "wholesaler"].map((type) => (
            <button
              key={type}
              onClick={() => dispatch(setInvoiceType(type))}
              className={`px-5 py-2 rounded-lg text-sm font-display font-semibold transition-all capitalize ${
                invoiceType === type
                  ? "bg-ink-950 text-cream shadow-sm"
                  : "text-ink-500 hover:text-ink-900"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Customer select — wholesaler only */}
      {invoiceType === "wholesaler" && (
        <div className="card p-4 animate-fade-in">
          <label className="text-xs font-display font-semibold uppercase tracking-widest text-ink-500 mb-2 block">
            Customer
          </label>

          <CustomerSearch
            value={customerName}
            onSelect={(c) => dispatch(setCustomer(c))}
          />

          {customerId && previousBalance > 0 && (
            <p className="text-xs text-ember-600 mt-2 flex items-center gap-1.5">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>

              Previous balance: Rs.{" "}
              {previousBalance.toFixed(2)} will be added
            </p>
          )}
        </div>
      )}

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left: Products */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div className="card p-3">
            <ProductSearch
              onSelect={(p) => dispatch(addItem(p))}
            />
          </div>

          <div className="card flex-1 overflow-hidden flex flex-col">
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-ink-400 p-8">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="mb-3 opacity-30"
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>

                <p className="text-sm font-medium">
                  No products added yet
                </p>

                <p className="text-xs mt-1">
                  Search and select products above
                </p>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="table-head">Product</th>
                      <th className="table-head">Unit</th>
                      <th className="table-head">Qty</th>
                      <th className="table-head">Price</th>
                      <th className="table-head">Disc.</th>
                      <th className="table-head">Total</th>
                      <th className="table-head w-10"></th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((item, i) => (
                      <InvoiceRow
                        key={`${item.product}-${i}`}
                        item={item}
                        index={i}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: Summary */}
        <div className="w-72 flex-shrink-0">
          <InvoiceSummary
            onSubmit={createInvoice}
            loading={loading}
          />
        </div>
      </div>

      {/* Last invoice success bar */}
      {lastInvoice && (
        <div className="card p-4 border-jade-300 bg-jade-500/5 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-jade-700">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>

              <span className="text-sm font-semibold">
                Invoice #
                {lastInvoice._id?.slice(-6).toUpperCase()} created
              </span>
            </div>

            <div className="flex gap-2">
              {/* Print Receipt button */}
              <button
                onClick={() => printPDF("invoice-print")}
                className="btn-secondary text-xs py-1.5"
              >
                Print Receipt
              </button>

              {/* Dismiss button */}
              <button
                onClick={() => setLastInvoice(null)}
                className="text-ink-400 hover:text-ink-700 p-1"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Invoice */}
      {lastInvoice && (
        <div className="hidden">
          <div
            id="invoice-print"
            className="bg-white text-black p-4 w-[300px]"
          >
            <div className="text-center border-b pb-2 mb-2">
              <h2 className="font-bold text-lg">
                {shop.name}
              </h2>

              <p className="text-xs">{shop.address1}</p>

              <p className="text-xs">{shop.address2}</p>

              <p className="text-xs">{shop.phone}</p>
            </div>

            <div className="text-xs mb-3">
              <p>
                Invoice ID:
                {" "}
                <b>
                  {lastInvoice._id?.slice(-6).toUpperCase()}
                </b>
              </p>

              <p>
                Type:
                {" "}
                <b>{lastInvoice.invoice_type}</b>
              </p>

              <p>
                Customer:
                {" "}
                <b>
                  {customerName || "Walk-in Customer"}
                </b>
              </p>
            </div>

            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th align="left">Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th align="right">Total</th>
                </tr>
              </thead>

              <tbody>
                {(lastInvoice.products || []).map((item, i) => (
                  <tr key={i}>
                    <td>{item.name}</td>

                    <td align="center">
                      {item.quantity}
                    </td>

                    <td align="center">
                      {item.price}
                    </td>

                    <td align="right">
                      {item.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-3 border-t pt-2 text-sm">
              <div className="flex justify-between">
                <span>Grand Total</span>

                <span>
                  Rs. {grandTotal}
                </span>
              </div>
            </div>

            <p className="text-center text-[10px] mt-4">
              Thank you for shopping
            </p>
          </div>
        </div>
      )}
    </div>
  );
}