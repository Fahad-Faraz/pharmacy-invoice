import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import toast from "react-hot-toast";
import {
  clearInvoice,
  setInvoiceType,
  setCustomer,
  addItem,
  updateItem,
  removeItem,
  setPaidAmount,
} from "./invoiceSlice";
import { createInvoiceApi } from "../../api/invoiceApi";
import { saveOfflineInvoice } from "../../utils/offlineQueue";
import { searchProductsApi } from "../../api/productApi";
import { searchCustomersApi } from "../../api/customerApi";

// ─── Shop Info — apni pharmacy ki info yahan bharo ───────
const SHOP = {
  name: "Al-Shifa Pharmacy",
  address1: "Shop #1, Main Bazar",
  address2: "Karachi, Sindh",
  phone: "0300-0000000",
};
// ─────────────────────────────────────────────────────────

function printReceipt(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Receipt</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Courier New',monospace;font-size:12px;color:#000;background:#fff;width:72mm;}
    @media print{@page{margin:4mm;size:80mm auto;}body{width:72mm;}}
    .center{text-align:center;} .right{text-align:right;} .bold{font-weight:bold;}
    .lg{font-size:15px;} .sm{font-size:10px;}
    .divider{border-top:1px dashed #000;margin:4px 0;}
    table{width:100%;border-collapse:collapse;}
    th,td{padding:1px 2px;vertical-align:top;}
    th{font-weight:bold;border-bottom:1px solid #000;}
    .num{text-align:right;white-space:nowrap;}
  </style></head><body>${el.innerHTML}</body></html>`);
  doc.close();
  iframe.onload = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 2000);
  };
}

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

  // Product search state
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [productOpen, setProductOpen] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [activeProductIdx, setActiveProductIdx] = useState(0);

  // Customer search state
  const [customerQuery, setCustomerQuery] = useState(customerName || "");
  const [customerResults, setCustomerResults] = useState([]);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [activeCustomerIdx, setActiveCustomerIdx] = useState(0);

  const productInputRef = useRef(null);
  const paidInputRef = useRef(null);
  const productDebounce = useRef(null);
  const customerDebounce = useRef(null);

  const subtotal = items.reduce((acc, i) => acc + i.total, 0);
  const grandTotal =
    subtotal + (invoiceType === "wholesaler" ? previousBalance : 0);
  const remaining = grandTotal - paidAmount;

  // Auto-focus product search on mount
  useEffect(() => {
    setTimeout(() => productInputRef.current?.focus(), 100);
  }, []);

  // Sync customer name display
  useEffect(() => {
    setCustomerQuery(customerName || "");
  }, [customerName]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      const inInput = tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA";

      if (e.key === "F2") {
        e.preventDefault();
        productInputRef.current?.focus();
      }
      if (e.key === "F4") {
        e.preventDefault();
        paidInputRef.current?.focus();
      }
      if (e.key === "F9") {
        e.preventDefault();
        handleCreateInvoice();
      }
      if (e.key === "F1") {
        e.preventDefault();
        dispatch(
          setInvoiceType(invoiceType === "retailer" ? "wholesaler" : "retailer")
        );
      }
      if (e.key === "Escape") {
        setProductOpen(false);
        setCustomerOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [invoiceType, items, paidAmount]);

  // Product search
  const handleProductSearch = (q) => {
    setProductQuery(q);
    setActiveProductIdx(0);
    clearTimeout(productDebounce.current);
    if (!q.trim()) {
      setProductResults([]);
      setProductOpen(false);
      return;
    }
    productDebounce.current = setTimeout(async () => {
      setProductLoading(true);
      try {
        const res = await searchProductsApi(q);
        setProductResults(res.data);
        setProductOpen(res.data.length > 0);
      } catch {}
      finally {
        setProductLoading(false);
      }
    }, 200);
  };

  const selectProduct = useCallback(
    (p) => {
      dispatch(addItem(p));
      setProductQuery("");
      setProductResults([]);
      setProductOpen(false);
      productInputRef.current?.focus();
    },
    [dispatch]
  );

  const handleProductKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveProductIdx((i) => Math.min(i + 1, productResults.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveProductIdx((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (productOpen && productResults[activeProductIdx]) {
        selectProduct(productResults[activeProductIdx]);
      }
    }
    if (e.key === "Escape") {
      setProductOpen(false);
    }
  };

  // Customer search
  const handleCustomerSearch = (q) => {
    setCustomerQuery(q);
    setActiveCustomerIdx(0);
    clearTimeout(customerDebounce.current);
    if (!q.trim()) {
      setCustomerResults([]);
      setCustomerOpen(false);
      dispatch(
        setCustomer({ _id: null, customer_name: "", pending_balance: 0 })
      );
      return;
    }
    customerDebounce.current = setTimeout(async () => {
      try {
        const res = await searchCustomersApi(q);
        setCustomerResults(res.data);
        setCustomerOpen(res.data.length > 0);
      } catch {}
    }, 200);
  };

  const selectCustomer = (c) => {
    dispatch(setCustomer(c));
    setCustomerQuery(c.customer_name);
    setCustomerOpen(false);
    productInputRef.current?.focus();
  };

  const handleCustomerKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveCustomerIdx((i) => Math.min(i + 1, customerResults.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveCustomerIdx((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (customerResults[activeCustomerIdx])
        selectCustomer(customerResults[activeCustomerIdx]);
    }
  };

  const handleCreateInvoice = async () => {
    if (items.length === 0) {
      toast.error("Kam az kam ek product add karo");
      productInputRef.current?.focus();
      return;
    }
    if (invoiceType === "wholesaler" && !customerId) {
      toast.error("Wholesaler invoice ke liye customer select karo");
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
      setLastInvoice({ ...res.data, _customerName: customerName });
      dispatch(clearInvoice());
      toast.success("Invoice ban gaya!");
      setTimeout(() => {
        printReceipt("pos-receipt-print");
        setTimeout(() => productInputRef.current?.focus(), 500);
      }, 300);
    } catch (err) {
      if (!navigator.onLine) {
        saveOfflineInvoice(payload);
        toast.success("Offline save ho gaya — net aane par sync hoga");
        dispatch(clearInvoice());
      } else {
        toast.error(err.response?.data?.message || "Invoice create nahi hua");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="page-title">Point of Sale</h1>
          <p className="text-ink-500 text-xs mt-0.5">
            <kbd className="kbd">F2</kbd> Product &nbsp;
            <kbd className="kbd">F4</kbd> Payment &nbsp;
            <kbd className="kbd">F9</kbd> Invoice &nbsp;
            <kbd className="kbd">F1</kbd> Type toggle &nbsp;
            <kbd className="kbd">↑↓</kbd> List navigate &nbsp;
            <kbd className="kbd">Enter</kbd> Select
          </p>
        </div>
        {/* Invoice type toggle */}
        <div className="flex items-center bg-parchment border border-ink-200 rounded-xl p-1">
          {["retailer", "wholesaler"].map((type) => (
            <button
              key={type}
              onClick={() => dispatch(setInvoiceType(type))}
              className={`px-4 py-2 rounded-lg text-sm font-display font-semibold transition-all capitalize ${
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

      {/* ── Wholesaler customer bar ── */}
      {invoiceType === "wholesaler" && (
        <div className="card p-3 animate-fade-in">
          <label className="field-label mb-1.5 block">Customer (Wholesaler)</label>
          <div className="relative">
            <input
              value={customerQuery}
              onChange={(e) => handleCustomerSearch(e.target.value)}
              onKeyDown={handleCustomerKeyDown}
              placeholder="Customer ka naam likhein… (↑↓ + Enter)"
              className="input-field"
              autoComplete="off"
            />
            {customerOpen && customerResults.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-ink-200 rounded-xl shadow-xl overflow-hidden">
                {customerResults.map((c, i) => (
                  <button
                    key={c._id}
                    onClick={() => selectCustomer(c)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors text-left border-b border-ink-100 last:border-0 ${
                      i === activeCustomerIdx
                        ? "bg-teal-50"
                        : "hover:bg-parchment/60"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-ink-900">
                        {c.customer_name}
                      </p>
                      <p className="text-xs text-ink-500">
                        Code: {c.customer_code}
                      </p>
                    </div>
                    <span
                      className={`font-mono text-xs font-semibold ${
                        c.pending_balance > 0
                          ? "text-rose-500"
                          : "text-jade-600"
                      }`}
                    >
                      Bal: Rs.{c.pending_balance?.toFixed(0)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {customerId && previousBalance > 0 && (
            <p className="text-xs text-ember-600 mt-1.5 flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Purana balance Rs.{previousBalance.toFixed(2)} total mein add hoga
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3 flex-1 min-h-0">
        {/* ── Left: Search + Table ── */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Product search */}
          <div className="card p-3 relative">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={productInputRef}
                value={productQuery}
                onChange={(e) => handleProductSearch(e.target.value)}
                onKeyDown={handleProductKeyDown}
                placeholder="Product ka naam ya barcode likhein… (F2)"
                className="input-field pl-9 text-base"
                autoComplete="off"
              />
              {productLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-ink-300 border-t-ink-700 rounded-full animate-spin" />
              )}
            </div>

            {/* Product dropdown */}
            {productOpen && productResults.length > 0 && (
              <div className="absolute z-50 left-3 right-3 top-full mt-1 bg-white border border-ink-200 rounded-xl shadow-2xl overflow-hidden">
                {productResults.slice(0, 10).map((p, i) => (
                  <button
                    key={p._id}
                    onClick={() => selectProduct(p)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors text-left border-b border-ink-100 last:border-0 ${
                      i === activeProductIdx
                        ? "bg-teal-50 border-l-2 border-l-teal-500"
                        : "hover:bg-parchment/60"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink-900">
                        {p.name}
                      </p>
                      <p className="text-xs text-ink-400">
                        {p.company_name || "—"} · {p.product_type}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-sm font-mono font-bold text-ink-800">
                        Rs.
                        {p.product_type === "general" ||
                        p.product_type === "local" ||
                        p.product_type === "franchise"
                          ? p.fixed_price
                          : p.mrp}
                      </p>
                      <p
                        className={`text-xs ${
                          p.quantity <= 10
                            ? "text-rose-500 font-semibold"
                            : "text-jade-600"
                        }`}
                      >
                        Stock: {p.quantity}
                      </p>
                    </div>
                  </button>
                ))}
                <div className="px-4 py-1.5 bg-ink-50 text-xs text-ink-400 flex gap-3 border-t border-ink-100">
                  <span>↑↓ navigate</span>
                  <span>Enter select</span>
                  <span>Esc close</span>
                </div>
              </div>
            )}
            {productOpen &&
              productResults.length === 0 &&
              !productLoading &&
              productQuery.trim() && (
                <div className="absolute z-50 left-3 right-3 top-full mt-1 bg-white border border-ink-200 rounded-xl shadow-xl p-4 text-center text-sm text-ink-500">
                  "{productQuery}" nahi mila
                </div>
              )}
          </div>

          {/* Items table */}
          <div className="card flex-1 overflow-hidden flex flex-col">
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-ink-400 p-8">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-30">
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <p className="text-sm font-semibold">Koi product nahi add hua</p>
                <p className="text-xs mt-1">Upar search karein ya barcode scan karein</p>
              </div>
            ) : (
              <div className="overflow-auto flex-1">
                <table className="w-full">
                  <thead className="sticky top-0 z-10 bg-parchment/80">
                    <tr>
                      <th className="table-head">#</th>
                      <th className="table-head">Product</th>
                      <th className="table-head">Unit</th>
                      <th className="table-head">Qty</th>
                      <th className="table-head">Price</th>
                      <th className="table-head">Disc.</th>
                      <th className="table-head">Total</th>
                      <th className="table-head w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <POSRow key={`${item.product}-${i}`} item={item} index={i} rowNum={i + 1} />
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-ink-200 bg-parchment/30">
                      <td colSpan={6} className="table-cell text-right font-display font-semibold text-ink-600 text-sm">
                        Subtotal
                      </td>
                      <td className="table-cell font-mono font-bold text-ink-900">
                        Rs.{subtotal.toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Summary panel ── */}
        <div className="w-64 flex-shrink-0">
          <div className="card p-4 flex flex-col gap-4 sticky top-4">
            <h3 className="font-display font-semibold text-ink-900 text-base">
              Bill Summary
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-ink-600">
                <span>Items ({items.length})</span>
                <span className="font-mono">Rs.{subtotal.toFixed(2)}</span>
              </div>
              {invoiceType === "wholesaler" && previousBalance > 0 && (
                <div className="flex justify-between text-ember-600 text-xs">
                  <span>Purana Balance</span>
                  <span className="font-mono">Rs.{previousBalance.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t-2 border-ink-200 pt-2 flex justify-between font-bold text-ink-900 text-lg">
                <span>Total</span>
                <span className="font-mono text-teal-700">
                  Rs.{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <div>
              <label className="field-label mb-1 block">
                Paid Amount{" "}
                <span className="text-ink-400 font-normal normal-case">(F4)</span>
              </label>
              <input
                ref={paidInputRef}
                type="number"
                min="0"
                value={paidAmount || ""}
                onChange={(e) => dispatch(setPaidAmount(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateInvoice();
                }}
                placeholder="0.00"
                className="input-field font-mono text-xl text-center font-bold"
              />
            </div>

            {grandTotal > 0 && paidAmount > 0 && (
              <div
                className={`rounded-xl px-3 py-3 text-sm font-bold flex justify-between ${
                  remaining <= 0
                    ? "bg-jade-500/10 text-jade-700"
                    : "bg-rose-500/10 text-rose-700"
                }`}
              >
                <span>{remaining <= 0 ? "Wapas karo" : "Baqi hai"}</span>
                <span className="font-mono text-base">
                  Rs.{Math.abs(remaining).toFixed(2)}
                </span>
              </div>
            )}

            <button
              onClick={handleCreateInvoice}
              disabled={loading || items.length === 0}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-base font-bold"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
                  Ban raha hai…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Invoice Banao (F9)
                </>
              )}
            </button>

            {items.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm("Sab clear karen?"))
                    dispatch(clearInvoice());
                }}
                className="btn-secondary w-full text-sm py-2 text-rose-500 hover:text-rose-600"
              >
                Sab Clear Karo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Last invoice success bar ── */}
      {lastInvoice && (
        <div className="card p-3 border-jade-300 bg-jade-500/5 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2 text-jade-700">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="text-sm font-semibold">
              Invoice #{lastInvoice._id?.slice(-6).toUpperCase()} bana · Rs.
              {lastInvoice.grand_total?.toFixed(2)}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => printReceipt("pos-receipt-print")}
              className="btn-secondary text-xs py-1.5 flex items-center gap-1"
            >
              🖨 Print (Ctrl+P)
            </button>
            <button
              onClick={() => setLastInvoice(null)}
              className="text-ink-400 hover:text-ink-700 p-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Hidden Print Template ── */}
      {lastInvoice && (
  <div className="hidden">
    <div id="pos-receipt-print">
      <div className="center bold lg">{SHOP.name}</div>
      <div className="center sm">{SHOP.address1}</div>
      <div className="center sm">{SHOP.address2}</div>
      <div className="center sm">{SHOP.phone}</div>
      <div className="divider"></div>
      <div className="sm">Invoice: <b>#{lastInvoice._id?.slice(-6).toUpperCase()}</b></div>
      <div className="sm">Type: <b>{lastInvoice.invoice_type}</b></div>
      <div className="sm">Customer: <b>{lastInvoice._customerName || "Walk-in"}</b></div>
      <div className="sm">Date: <b>{new Date().toLocaleDateString("en-PK")} {new Date().toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}</b></div>
      <div className="divider"></div>
      <table>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Item</th>
            <th style={{ textAlign: "center" }}>Qty</th>
            <th className="num">Rate</th>
            <th className="num">Amt</th>
          </tr>
        </thead>
        <tbody>
          {(lastInvoice.products || []).map((item, i) => (
            <tr key={i}>
              <td style={{ maxWidth: "100px", wordBreak: "break-word" }}>{item.name}</td>
              <td style={{ textAlign: "center" }}>{item.quantity}</td>
              <td className="num">{Number(item.price).toFixed(0)}</td>
              <td className="num">{Number(item.total).toFixed(0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="divider"></div>
      {lastInvoice.previous_balance > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between" }} className="sm">
          <span>Prev Balance</span><span>Rs.{lastInvoice.previous_balance}</span>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between" }} className="bold lg">
        <span>TOTAL</span><span>Rs.{lastInvoice.grand_total?.toFixed(0)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }} className="sm">
        <span>Paid</span><span>Rs.{lastInvoice.paid_amount?.toFixed(0)}</span>
      </div>
      {lastInvoice.remaining_balance > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between" }} className="sm">
          <span>Balance Due</span><span>Rs.{lastInvoice.remaining_balance?.toFixed(0)}</span>
        </div>
      )}
      {lastInvoice.remaining_balance < 0 && (
        <div style={{ display: "flex", justifyContent: "space-between" }} className="sm">
          <span>Change</span><span>Rs.{Math.abs(lastInvoice.remaining_balance)?.toFixed(0)}</span>
        </div>
      )}
      <div className="divider"></div>
      <div className="center sm">Shukriya! Dobara Tashreef Layen</div>
    </div>
  </div>
  )}
    </div>
  );
  }

// ── Inline editable row ──
function POSRow({ item, index, rowNum }) {
  const dispatch = useDispatch();
  const update = (field, value) => dispatch(updateItem({ index, field, value }));

  const handleQtyKeyDown = (e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      update("quantity", Math.max(1, item.quantity + 1));
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      update("quantity", Math.max(1, item.quantity - 1));
    }
    if (e.key === "Delete" && item.quantity <= 1) {
      dispatch(removeItem(index));
    }
  };

  return (
    <tr className="group hover:bg-parchment/40 transition-colors border-b border-ink-100">
      <td className="table-cell text-ink-400 text-xs font-mono w-8">{rowNum}</td>
      <td className="table-cell">
        <div className="font-medium text-ink-900 text-sm">{item.name}</div>
      </td>
      <td className="table-cell">
        <select
          value={item.unit || "tablet"}
          onChange={(e) => update("unit", e.target.value)}
          className="text-xs bg-parchment border border-ink-200 rounded-md px-1.5 py-1 text-ink-700 focus:outline-none focus:ring-1 focus:ring-teal-400"
        >
          <option value="tablet">Tab</option>
          <option value="strip">Strip</option>
          <option value="box">Box</option>
        </select>
      </td>
      <td className="table-cell w-20">
        <input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) => update("quantity", e.target.value)}
          onKeyDown={handleQtyKeyDown}
          className="w-14 bg-cream border border-ink-200 rounded-md px-1 py-1 text-sm font-mono text-center focus:outline-none focus:ring-1 focus:ring-teal-400"
        />
      </td>
      <td className="table-cell w-24">
        <input
          type="number"
          min="0"
          value={item.price}
          onChange={(e) => update("price", e.target.value)}
          className="w-20 bg-cream border border-ink-200 rounded-md px-1 py-1 text-sm font-mono text-center focus:outline-none focus:ring-1 focus:ring-teal-400"
        />
      </td>
      <td className="table-cell w-20">
        <input
          type="number"
          min="0"
          value={item.discount}
          onChange={(e) => update("discount", e.target.value)}
          className="w-16 bg-cream border border-ink-200 rounded-md px-1 py-1 text-sm font-mono text-center focus:outline-none focus:ring-1 focus:ring-teal-400"
        />
      </td>
      <td className="table-cell font-mono font-semibold text-ink-900 text-sm">
        Rs.{item.total?.toFixed(2)}
      </td>
      <td className="table-cell">
        <button
          onClick={() => dispatch(removeItem(index))}
          title="Remove (Del when qty=1)"
          className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 transition-all p-1 rounded"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </td>
    </tr>
  );
}