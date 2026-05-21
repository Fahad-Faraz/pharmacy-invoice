import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { returnInvoiceApi, getInvoicesApi } from "../../api/invoiceApi";
import { queryClient } from "../../app/queryClient";

export default function SalesReturn() {
  const [invoiceId, setInvoiceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const { data: invoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const res = await getInvoicesApi();
      return res.data;
    },
  });

  const fetchPreview = () => {
    if (!invoiceId.trim()) { toast.error("Enter an Invoice ID"); return; }
    const found = invoices?.find((i) => i._id === invoiceId.trim() || i._id.slice(-8).toUpperCase() === invoiceId.trim().toUpperCase());
    if (!found) { toast.error("Invoice not found"); return; }
    setPreview(found);
  };

  const handleReturn = async () => {
    if (!preview) return;
    if (preview.isReturned) { toast.error("Already returned"); return; }
    const confirmed = window.confirm(`Return invoice Rs. ${preview.grand_total}? This will restore stock.`);
    if (!confirmed) return;

    setLoading(true);
    try {
      await returnInvoiceApi(preview._id);
      toast.success("Invoice returned & stock restored");
      setPreview(null);
      setInvoiceId("");
      queryClient.invalidateQueries(["invoices"]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Return failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">Sales Return</h1>
        <p className="text-ink-500 text-sm mt-0.5">Reverse a sale and restore inventory</p>
      </div>

      <div className="card p-5 space-y-4">
        <div>
          <label className="text-xs font-display font-semibold uppercase tracking-widest text-ink-500 mb-1.5 block">
            Invoice ID or Reference
          </label>
          <div className="flex gap-2">
            <input
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchPreview()}
              placeholder="Enter invoice ID…"
              className="input-field flex-1"
            />
            <button onClick={fetchPreview} className="btn-secondary px-5">
              Lookup
            </button>
          </div>
        </div>

        {/* Recent invoices quick select */}
        {!preview && invoices && (
          <div>
            <p className="text-xs text-ink-400 mb-2 font-display font-medium">Recent invoices:</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {invoices.slice(0, 10).map((inv) => (
                <button
                  key={inv._id}
                  onClick={() => { setInvoiceId(inv._id); setPreview(inv); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors ${
                    inv.isReturned
                      ? "border-ink-100 bg-ink-50 opacity-50 cursor-not-allowed"
                      : "border-ink-200 hover:bg-parchment"
                  }`}
                  disabled={inv.isReturned}
                >
                  <span className="font-mono text-ink-600 text-xs">#{inv._id?.slice(-8).toUpperCase()}</span>
                  <span className="text-ink-800">Rs. {inv.grand_total}</span>
                  <span className="text-ink-500">{inv.date?.day}/{inv.date?.month}/{inv.date?.year}</span>
                  {inv.isReturned && <span className="badge-gray">Returned</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {preview && (
        <div className="card p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-ink-900">Invoice Preview</h3>
            {preview.isReturned ? (
              <span className="badge-red">Already Returned</span>
            ) : (
              <span className="badge-orange">Active</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-parchment rounded-lg p-3">
              <p className="text-ink-500 text-xs uppercase tracking-wide font-display font-medium mb-1">Invoice ID</p>
              <p className="font-mono text-ink-900 text-xs">{preview._id}</p>
            </div>
            <div className="bg-parchment rounded-lg p-3">
              <p className="text-ink-500 text-xs uppercase tracking-wide font-display font-medium mb-1">Type</p>
              <p className="font-medium text-ink-900 capitalize">{preview.invoice_type}</p>
            </div>
            <div className="bg-parchment rounded-lg p-3">
              <p className="text-ink-500 text-xs uppercase tracking-wide font-display font-medium mb-1">Date</p>
              <p className="text-ink-900">{preview.date?.day}/{preview.date?.month}/{preview.date?.year}</p>
            </div>
            <div className="bg-parchment rounded-lg p-3">
              <p className="text-ink-500 text-xs uppercase tracking-wide font-display font-medium mb-1">Grand Total</p>
              <p className="font-mono font-semibold text-ink-900">Rs. {preview.grand_total}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-display font-semibold uppercase tracking-widest text-ink-500 mb-2">Products</p>
            <div className="space-y-1">
              {preview.products?.map((p, i) => (
                <div key={i} className="flex justify-between text-sm border-b border-ink-100 pb-1.5">
                  <span className="text-ink-700">{p.name} × {p.quantity}</span>
                  <span className="font-mono text-ink-900">Rs. {p.total}</span>
                </div>
              ))}
            </div>
          </div>

          {!preview.isReturned && (
            <div className="pt-2 border-t border-ink-100">
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 mb-3">
                <p className="text-rose-700 text-sm font-medium">⚠ This will reverse the sale and restore all product stock.</p>
              </div>
              <button
                onClick={handleReturn}
                disabled={loading}
                className="btn-danger w-full flex items-center justify-center gap-2 py-3"
              >
                {loading ? "Processing…" : "Confirm Return & Refund"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}