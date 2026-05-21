import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getInvoicesApi } from "../../api/invoiceApi";
import { printPDF } from "../../utils/pdf";

export default function InvoiceDetail() {
  const { id } = useParams();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const res = await getInvoicesApi();
      return res.data;
    },
  });

  const inv = invoices?.find((i) => i._id === id);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 text-ink-400">
      <div className="w-6 h-6 border-2 border-ink-200 border-t-ink-600 rounded-full animate-spin mr-3"/>
      Loading…
    </div>
  );

  if (!inv) return (
    <div className="text-center py-16">
      <p className="text-ink-500">Invoice not found</p>
      <Link to="/invoices" className="text-teal-600 text-sm mt-2 inline-block">← Back to invoices</Link>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Actions - no-print */}
      <div className="no-print flex items-center justify-between mb-5">
        <Link to="/invoices" className="text-ink-500 hover:text-ink-900 text-sm flex items-center gap-1.5 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </Link>
        <div className="flex gap-2">
          {inv.isReturned && <span className="badge-red">Returned</span>}
          <button
            onClick={() => printPDF("invoice-print")}
            className="btn-primary flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Print Receipt
          </button>
        </div>
      </div>

      {/* Printable invoice */}
      <div id="invoice-print" className="card p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink-950">RxManager</h1>
            <p className="text-ink-500 text-sm">Pharmacy Management System</p>
          </div>
          <div className="text-right">
            <p className="font-display font-bold text-ink-900 text-lg">INVOICE</p>
            <p className="font-mono text-teal-600 font-semibold">#{inv._id?.slice(-8).toUpperCase()}</p>
            <p className="text-ink-500 text-sm mt-1">
              {inv.date?.day}/{inv.date?.month}/{inv.date?.year}
            </p>
          </div>
        </div>

        <div className="border-t border-ink-200"/>

        {/* Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-display font-semibold uppercase tracking-widest text-ink-400 mb-1">Invoice Type</p>
            <p className="text-ink-800 font-medium capitalize">{inv.invoice_type}</p>
          </div>
          {inv.customer && (
            <div>
              <p className="text-xs font-display font-semibold uppercase tracking-widest text-ink-400 mb-1">Customer</p>
              <p className="text-ink-800 font-medium">{inv.customer.customer_name}</p>
              <p className="text-ink-500 text-xs">Code: {inv.customer.customer_code}</p>
            </div>
          )}
        </div>

        {/* Products table */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-ink-200">
              <th className="text-left py-2 text-xs font-display font-semibold uppercase tracking-wide text-ink-500">Product</th>
              <th className="text-center py-2 text-xs font-display font-semibold uppercase tracking-wide text-ink-500">Qty</th>
              <th className="text-right py-2 text-xs font-display font-semibold uppercase tracking-wide text-ink-500">Price</th>
              <th className="text-right py-2 text-xs font-display font-semibold uppercase tracking-wide text-ink-500">Disc.</th>
              <th className="text-right py-2 text-xs font-display font-semibold uppercase tracking-wide text-ink-500">Total</th>
            </tr>
          </thead>
          <tbody>
            {inv.products?.map((p, i) => (
              <tr key={i} className="border-b border-ink-100">
                <td className="py-2.5 text-ink-800">{p.name}</td>
                <td className="py-2.5 text-center font-mono text-ink-600">{p.quantity}</td>
                <td className="py-2.5 text-right font-mono">Rs. {p.price?.toFixed(2)}</td>
                <td className="py-2.5 text-right font-mono text-rose-500">- Rs. {(p.discount || 0).toFixed(2)}</td>
                <td className="py-2.5 text-right font-mono font-semibold">Rs. {p.total?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between text-ink-600">
              <span>Subtotal</span>
              <span className="font-mono">Rs. {inv.subtotal?.toFixed(2)}</span>
            </div>
            {inv.previous_balance > 0 && (
              <div className="flex justify-between text-ember-600">
                <span>Previous Balance</span>
                <span className="font-mono">Rs. {inv.previous_balance?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-ink-900 border-t border-ink-200 pt-2">
              <span>Grand Total</span>
              <span className="font-mono">Rs. {inv.grand_total?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-jade-600">
              <span>Amount Paid</span>
              <span className="font-mono">Rs. {inv.paid_amount?.toFixed(2)}</span>
            </div>
            <div className={`flex justify-between font-semibold border-t border-ink-200 pt-2 ${
              inv.remaining_balance > 0 ? "text-rose-600" : "text-jade-600"
            }`}>
              <span>{inv.remaining_balance > 0 ? "Balance Due" : "Change"}</span>
              <span className="font-mono">Rs. {Math.abs(inv.remaining_balance)?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-ink-200 pt-4 text-center">
          <p className="text-xs text-ink-400">Thank you for your business · RxManager Pharmacy System</p>
        </div>
      </div>
    </div>
  );
}