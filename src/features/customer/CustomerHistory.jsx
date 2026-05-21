import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getInvoicesApi } from "../../api/invoiceApi";
import { getCustomersApi } from "../../api/customerApi";

export default function CustomerHistory() {
  const { id } = useParams();

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await getCustomersApi();
      return res.data;
    },
  });

  const customer = customers?.find((c) => c._id === id);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["invoices", "customer", id],
    queryFn: async () => {
      const res = await getInvoicesApi({ customerId: id });
      return res.data;
    },
    enabled: !!id,
  });

  const activeInvoices = invoices?.filter((i) => !i.isReturned) || [];
  const totalSpent = activeInvoices.reduce((a, i) => a + i.grand_total, 0);
  const totalPaid = activeInvoices.reduce((a, i) => a + i.paid_amount, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/customers" className="text-ink-400 hover:text-ink-700 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <div>
          <h1 className="page-title">{customer?.customer_name || "Customer"}</h1>
          <p className="text-ink-500 text-sm mt-0.5">Code: {customer?.customer_code}</p>
        </div>
      </div>

      {/* Stats */}
      {customer && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <p className="text-xs font-display font-semibold uppercase tracking-widest text-ink-400">Total Purchase</p>
            <p className="text-xl font-display font-bold text-ink-800 mt-1 font-mono">Rs. {customer.total_purchase?.toFixed(0)}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs font-display font-semibold uppercase tracking-widest text-ink-400">Balance Due</p>
            <p className={`text-xl font-display font-bold mt-1 font-mono ${customer.pending_balance > 0 ? "text-rose-500" : "text-jade-600"}`}>
              Rs. {customer.pending_balance?.toFixed(0)}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-xs font-display font-semibold uppercase tracking-widest text-ink-400">Invoices</p>
            <p className="text-xl font-display font-bold text-ink-800 mt-1">{activeInvoices.length}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs font-display font-semibold uppercase tracking-widest text-ink-400">Type</p>
            <p className="text-xl font-display font-bold text-ink-800 mt-1 capitalize">{customer.type}</p>
          </div>
        </div>
      )}

      {/* Invoice history */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-ink-100">
          <h3 className="font-display font-semibold text-ink-800">Invoice History</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-head">Invoice</th>
              <th className="table-head">Date</th>
              <th className="table-head">Items</th>
              <th className="table-head">Grand Total</th>
              <th className="table-head">Paid</th>
              <th className="table-head">Remaining</th>
              <th className="table-head">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-10 text-ink-400">Loading…</td></tr>
            ) : invoices?.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-ink-400">No invoices found</td></tr>
            ) : (
              invoices?.map((inv) => (
                <tr key={inv._id} className="hover:bg-parchment/50 transition-colors">
                  <td className="table-cell">
                    <Link to={`/invoice/${inv._id}`} className="font-mono text-xs text-teal-600 hover:text-teal-700 font-semibold">
                      #{inv._id?.slice(-8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="table-cell text-ink-500 text-xs">{inv.date?.day}/{inv.date?.month}/{inv.date?.year}</td>
                  <td className="table-cell text-center text-ink-600">{inv.products?.length}</td>
                  <td className="table-cell font-mono font-semibold text-ink-900">Rs. {inv.grand_total?.toFixed(0)}</td>
                  <td className="table-cell font-mono text-jade-600">Rs. {inv.paid_amount?.toFixed(0)}</td>
                  <td className="table-cell font-mono text-rose-500">Rs. {inv.remaining_balance?.toFixed(0)}</td>
                  <td className="table-cell">
                    {inv.isReturned ? <span className="badge-red">Returned</span> : <span className="badge-green">Active</span>}
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