import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getCustomersApi,
  createCustomerApi,
  importCustomersApi,
} from "../../api/customerApi";
import { queryClient } from "../../app/queryClient";
import Modal from "../../components/common/Modal";

export default function Customers() {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    type: "retailer",
    pending_balance: "",
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const fileRef = useRef(null);
  const searchRef = useRef(null);
  const nameRef = useRef(null);

  // Shortcut: N = new customer, / = search
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setShowAdd(true);
        setTimeout(() => nameRef.current?.focus(), 100);
      }
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await getCustomersApi();
      return res.data;
    },
  });

  const filtered = customers?.filter(
    (c) =>
      c.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.customer_code?.includes(search)
  );

  const submit = async () => {
    if (!form.customer_name.trim()) {
      toast.error("Naam zaroori hai");
      return;
    }
    setLoading(true);
    try {
      await createCustomerApi({
        ...form,
        pending_balance: Number(form.pending_balance) || 0,
      });
      toast.success("Customer add ho gaya");
      setShowAdd(false);
      setForm({ customer_name: "", type: "retailer", pending_balance: "" });
      queryClient.invalidateQueries(["customers"]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error aa gaya");
    } finally {
      setLoading(false);
    }
  };

  const importFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await importCustomersApi(fd);
      toast.success(`${res.data.count} customers import ho gaye`);
      queryClient.invalidateQueries(["customers"]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Import fail");
    }
    e.target.value = "";
  };

  const totalBalance =
    customers?.reduce((a, c) => a + (c.pending_balance || 0), 0) || 0;
  const totalPurchase =
    customers?.reduce((a, c) => a + (c.total_purchase || 0), 0) || 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="text-ink-500 text-sm mt-0.5">
            {customers?.length || 0} customers ·{" "}
            <kbd className="kbd">N</kbd> naya ·{" "}
            <kbd className="kbd">/</kbd> search
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".csv"
            ref={fileRef}
            onChange={importFile}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="btn-secondary flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            CSV Import
          </button>
          <button
            onClick={() => {
              setShowAdd(true);
              setTimeout(() => nameRef.current?.focus(), 100);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Naya Customer (N)
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-xs font-display font-semibold uppercase tracking-widest text-ink-400">
            Total Customers
          </p>
          <p className="text-2xl font-display font-bold text-ink-800 mt-1">
            {customers?.length || 0}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-xs font-display font-semibold uppercase tracking-widest text-ink-400">
            Total Receivable
          </p>
          <p className="text-2xl font-display font-bold text-rose-500 mt-1">
            Rs. {totalBalance.toFixed(0)}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-xs font-display font-semibold uppercase tracking-widest text-ink-400">
            Total Purchase
          </p>
          <p className="text-2xl font-display font-bold text-jade-600 mt-1">
            Rs. {totalPurchase.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="card p-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Naam ya code se dhundein… (/ press karein)"
            className="input-field pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-head">Customer</th>
              <th className="table-head">Code</th>
              <th className="table-head">Type</th>
              <th className="table-head">Total Purchase</th>
              <th className="table-head">Balance Due</th>
              <th className="table-head">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-ink-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-ink-200 border-t-ink-600 rounded-full animate-spin" />
                    Load ho raha hai…
                  </div>
                </td>
              </tr>
            ) : filtered?.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-ink-400">
                  Koi customer nahi mila
                </td>
              </tr>
            ) : (
              filtered?.map((c) => (
                <tr
                  key={c._id}
                  className="hover:bg-parchment/50 transition-colors"
                >
                  <td className="table-cell font-semibold text-ink-900">
                    {c.customer_name}
                  </td>
                  <td className="table-cell font-mono text-ink-500 text-xs">
                    {c.customer_code}
                  </td>
                  <td className="table-cell">
                    <span
                      className={
                        c.type === "wholesaler" ? "badge-orange" : "badge-gray"
                      }
                    >
                      {c.type}
                    </span>
                  </td>
                  <td className="table-cell font-mono text-ink-700">
                    Rs. {c.total_purchase?.toFixed(0) || 0}
                  </td>
                  <td className="table-cell">
                    <span
                      className={`font-mono font-bold ${
                        c.pending_balance > 0
                          ? "text-rose-500"
                          : "text-jade-600"
                      }`}
                    >
                      Rs. {c.pending_balance?.toFixed(0) || 0}
                    </span>
                  </td>
                  <td className="table-cell">
                    <Link
                      to={`/customers/${c._id}`}
                      className="text-teal-600 hover:text-teal-700 text-sm font-semibold transition-colors"
                    >
                      History →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Naya Customer Add Karo"
      >
        <div className="space-y-4">
          <div>
            <label className="field-label mb-1.5 block">
              Naam <span className="text-rose-500">*</span>
            </label>
            <input
              ref={nameRef}
              value={form.customer_name}
              onChange={(e) =>
                setForm({ ...form, customer_name: e.target.value })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") document.getElementById("cust-type")?.focus();
              }}
              className="input-field"
              placeholder="Customer ka naam"
            />
          </div>
          <div>
            <label className="field-label mb-1.5 block">Type</label>
            <select
              id="cust-type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") document.getElementById("cust-bal")?.focus();
              }}
              className="input-field"
            >
              <option value="retailer">Retailer</option>
              <option value="wholesaler">Wholesaler</option>
            </select>
          </div>
          <div>
            <label className="field-label mb-1.5 block">
              Opening Balance (Optional)
            </label>
            <input
              id="cust-bal"
              type="number"
              value={form.pending_balance}
              onChange={(e) =>
                setForm({ ...form, pending_balance: e.target.value })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              className="input-field"
              placeholder="0.00"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAdd(false)}
              className="btn-secondary flex-1"
            >
              Cancel (Esc)
            </button>
            <button
              onClick={submit}
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? "Add ho raha hai…" : "Add Karo"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}