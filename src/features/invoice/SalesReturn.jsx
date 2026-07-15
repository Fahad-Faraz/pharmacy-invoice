import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { returnInvoiceApi, getInvoicesApi } from "../../api/invoiceApi";
import { queryClient } from "../../app/queryClient";

export default function SalesReturn() {
  const [invoiceId, setInvoiceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const inputRef = useRef(null);

  // Auto focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const { data: invoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const res = await getInvoicesApi();
      return res.data;
    },
  });

  const fetchPreview = () => {
    if (!invoiceId.trim()) {
      toast.error("Invoice ID likhein");
      return;
    }
    const found = invoices?.find(
      (i) =>
        i._id === invoiceId.trim() ||
        i._id.slice(-8).toUpperCase() === invoiceId.trim().toUpperCase()
    );
    if (!found) {
      toast.error("Invoice nahi mila");
      return;
    }
    setPreview(found);
  };

  const handleReturn = async () => {
    if (!preview) return;
    if (preview.isReturned) {
      toast.error("Yeh invoice pehle se return ho chuka hai");
      return;
    }
    const confirmed = window.confirm(
      `Invoice Rs.${preview.grand_total} return karein? Stock wapas ajayega.`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      await returnInvoiceApi(preview._id);
      toast.success("Invoice return ho gaya — stock restore ho gaya");
      setPreview(null);
      setInvoiceId("");
      queryClient.invalidateQueries(["invoices"]);
      inputRef.current?.focus();
    } catch (err) {
      toast.error(err.response?.data?.message || "Return nahi hua");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="page-title">Sales Return</h1>
        <p className="text-ink-500 text-sm mt-0.5">
          Sale reverse karein aur inventory restore karein ·{" "}
          <kbd className="kbd">Enter</kbd> search
        </p>
      </div>

      {/* Search box */}
      <div className="card p-5 space-y-4">
        <div>
          <label className="field-label mb-1.5 block">
            Invoice ID ya Reference Number
          </label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchPreview()}
              placeholder="Invoice ID ya last 8 digits likhein…"
              className="input-field flex-1 font-mono"
            />
            <button onClick={fetchPreview} className="btn-secondary px-5">
              Dhundein
            </button>
          </div>
        </div>

        {/* Recent invoices quick select */}
        {!preview && invoices && invoices.length > 0 && (
          <div>
            <p className="text-xs text-ink-400 mb-2 font-semibold uppercase tracking-widest">
              Haaliya Invoices (click karo select karne ke liye):
            </p>
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {invoices.slice(0, 15).map((inv) => (
                <button
                  key={inv._id}
                  onClick={() => {
                    if (!inv.isReturned) {
                      setInvoiceId(inv._id);
                      setPreview(inv);
                    }
                  }}
                  disabled={inv.isReturned}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                    inv.isReturned
                      ? "border-ink-100 bg-ink-50 opacity-40 cursor-not-allowed"
                      : "border-ink-200 hover:bg-parchment hover:border-teal-300 cursor-pointer"
                  }`}
                >
                  <span className="font-mono text-ink-600 text-xs font-bold">
                    #{inv._id?.slice(-8).toUpperCase()}
                  </span>
                  <span className="text-ink-700 font-semibold">
                    Rs. {inv.grand_total?.toFixed(0)}
                  </span>
                  <span className="text-ink-500 text-xs">
                    {inv.date?.day}/{inv.date?.month}/{inv.date?.year}
                  </span>
                  <span className="text-ink-500 text-xs">
                    {inv.invoice_type}
                  </span>
                  {inv.isReturned ? (
                    <span className="badge-gray">Returned</span>
                  ) : (
                    <span className="badge-green">Active</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Preview */}
      {preview && (
        <div className="card p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-ink-900 text-lg">
              Invoice Preview
            </h3>
            {preview.isReturned ? (
              <span className="badge-red">Pehle se Returned</span>
            ) : (
              <span className="badge-green">Active</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-parchment rounded-xl p-3">
              <p className="text-ink-500 text-xs uppercase tracking-wide font-semibold mb-1">
                Invoice ID
              </p>
              <p className="font-mono text-ink-900 text-xs font-bold">
                {preview._id}
              </p>
            </div>
            <div className="bg-parchment rounded-xl p-3">
              <p className="text-ink-500 text-xs uppercase tracking-wide font-semibold mb-1">
                Type
              </p>
              <p className="font-semibold text-ink-900 capitalize">
                {preview.invoice_type}
              </p>
            </div>
            <div className="bg-parchment rounded-xl p-3">
              <p className="text-ink-500 text-xs uppercase tracking-wide font-semibold mb-1">
                Date
              </p>
              <p className="text-ink-900">
                {preview.date?.day}/{preview.date?.month}/{preview.date?.year}
              </p>
            </div>
            <div className="bg-parchment rounded-xl p-3">
              <p className="text-ink-500 text-xs uppercase tracking-wide font-semibold mb-1">
                Grand Total
              </p>
              <p className="font-mono font-bold text-ink-900 text-lg">
                Rs. {preview.grand_total?.toFixed(2)}
              </p>
            </div>
            {preview.customer && (
              <div className="bg-parchment rounded-xl p-3 col-span-2">
                <p className="text-ink-500 text-xs uppercase tracking-wide font-semibold mb-1">
                  Customer
                </p>
                <p className="font-semibold text-ink-900">
                  {preview.customer?.customer_name || "—"}
                </p>
              </div>
            )}
          </div>

          {/* Products list */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-500 mb-2">
              Products
            </p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {preview.products?.map((p, i) => (
                <div
                  key={i}
                  className="flex justify-between text-sm border-b border-ink-100 pb-1.5"
                >
                  <span className="text-ink-700">
                    {p.name} × {p.quantity}
                  </span>
                  <span className="font-mono font-semibold text-ink-900">
                    Rs. {p.total?.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Return button */}
          {!preview.isReturned && (
            <div className="pt-2 border-t border-ink-100 space-y-3">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                <p className="text-rose-700 text-sm font-semibold">
                  ⚠ Yeh action sale reverse karega aur product stock wapas add ho jayega.
                  Yeh undo nahi ho sakta.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setPreview(null); setInvoiceId(""); inputRef.current?.focus(); }}
                  className="btn-secondary py-3"
                >
                  Cancel (Esc)
                </button>
                <button
                  onClick={handleReturn}
                  disabled={loading}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Ho raha hai…
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.86" />
                      </svg>
                      Return Confirm Karo
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}