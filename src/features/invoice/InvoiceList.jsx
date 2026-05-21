import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getInvoicesApi } from "../../api/invoiceApi";
import { getCustomersApi } from "../../api/customerApi";

export default function InvoiceList() {
  const [customerId, setCustomerId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["invoices", customerId, from, to],
    queryFn: async () => {
      const params = {};
      if (customerId) params.customerId = customerId;
      if (from) params.from = from;
      if (to) params.to = to;
      const res = await getInvoicesApi(params);
      return res.data;
    },
  });

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await getCustomersApi();
      return res.data;
    },
  });

  const totalSales = invoices?.filter(i => !i.isReturned).reduce((a, i) => a + i.grand_total, 0) || 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="text-ink-500 text-sm mt-0.5">
            {invoices?.length || 0} invoices · Rs. {totalSales.toFixed(0)} total
          </p>
        </div>
        <Link to="/pos" className="btn-primary flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Invoice
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 flex gap-3 flex-wrap">
        <select
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="input-field flex-1 min-w-40"
        >
          <option value="">All Customers</option>
          {customers?.map((c) => (
            <option key={c._id} value={c._id}>{c.customer_name}</option>
          ))}
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input-field w-40" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input-field w-40" />
        <button onClick={() => { setCustomerId(""); setFrom(""); setTo(""); }} className="btn-secondary">
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-head">Invoice</th>
              <th className="table-head">Date</th>
              <th className="table-head">Type</th>
              <th className="table-head">Customer</th>
              <th className="table-head">Items</th>
              <th className="table-head">Grand Total</th>
              <th className="table-head">Paid</th>
              <th className="table-head">Balance</th>
              <th className="table-head">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-ink-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-ink-200 border-t-ink-600 rounded-full animate-spin"/>
                    Loading invoices…
                  </div>
                </td>
              </tr>
            ) : invoices?.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-ink-400">No invoices found</td>
              </tr>
            ) : (
              invoices?.map((inv) => (
                <tr key={inv._id} className="hover:bg-parchment/50 transition-colors">
                  <td className="table-cell">
                    <Link to={`/invoice/${inv._id}`} className="font-mono text-xs text-teal-600 hover:text-teal-700 font-semibold">
                      #{inv._id?.slice(-8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="table-cell text-ink-600 text-xs">
                    {inv.date?.day}/{inv.date?.month}/{inv.date?.year}
                  </td>
                  <td className="table-cell">
                    <span className={inv.invoice_type === "wholesaler" ? "badge-orange" : "badge-gray"}>
                      {inv.invoice_type}
                    </span>
                  </td>
                  <td className="table-cell text-ink-700">{inv.customer?.customer_name || "—"}</td>
                  <td className="table-cell text-center text-ink-600">{inv.products?.length}</td>
                  <td className="table-cell font-mono font-semibold text-ink-900">Rs. {inv.grand_total?.toFixed(0)}</td>
                  <td className="table-cell font-mono text-jade-600">Rs. {inv.paid_amount?.toFixed(0)}</td>
                  <td className="table-cell font-mono text-rose-500">Rs. {inv.remaining_balance?.toFixed(0)}</td>
                  <td className="table-cell">
                    {inv.isReturned ? (
                      <span className="badge-red">Returned</span>
                    ) : (
                      <span className="badge-green">Active</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}