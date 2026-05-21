import { useSelector, useDispatch } from "react-redux";
import { setPaidAmount } from "../invoiceSlice";

export default function InvoiceSummary({ onSubmit, loading }) {
  const { items, invoiceType, previousBalance, paidAmount } = useSelector(
    (s) => s.invoice
  );
  const dispatch = useDispatch();

  const subtotal = items.reduce((acc, i) => acc + i.total, 0);
  const grandTotal = subtotal + (invoiceType === "wholesaler" ? previousBalance : 0);
  const remaining = grandTotal - paidAmount;

  return (
    <div className="card p-5 flex flex-col gap-4 sticky top-4">
      <h3 className="font-display font-semibold text-ink-900 text-base">Order Summary</h3>

      <div className="space-y-2.5 text-sm">
        <div className="flex justify-between text-ink-600">
          <span>Items ({items.length})</span>
          <span className="font-mono">Rs. {subtotal.toFixed(2)}</span>
        </div>

        {invoiceType === "wholesaler" && previousBalance > 0 && (
          <div className="flex justify-between text-ember-600">
            <span>Previous Balance</span>
            <span className="font-mono">Rs. {previousBalance.toFixed(2)}</span>
          </div>
        )}

        <div className="border-t border-ink-100 pt-2.5 flex justify-between font-semibold text-ink-900">
          <span>Grand Total</span>
          <span className="font-mono text-base">Rs. {grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <div>
        <label className="text-xs font-display font-semibold uppercase tracking-widest text-ink-500 mb-1.5 block">
          Amount Paid
        </label>
        <input
          type="number"
          min="0"
          value={paidAmount || ""}
          onChange={(e) => dispatch(setPaidAmount(e.target.value))}
          placeholder="0.00"
          className="input-field font-mono"
        />
      </div>

      {paidAmount > 0 && (
        <div className={`flex justify-between text-sm font-semibold rounded-lg px-3 py-2 ${
          remaining <= 0
            ? "bg-jade-500/10 text-jade-600"
            : "bg-rose-500/10 text-rose-600"
        }`}>
          <span>{remaining <= 0 ? "Change" : "Remaining"}</span>
          <span className="font-mono">Rs. {Math.abs(remaining).toFixed(2)}</span>
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={loading || items.length === 0}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin"/>
            Processing…
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Generate Invoice
          </>
        )}
      </button>
    </div>
  );
}