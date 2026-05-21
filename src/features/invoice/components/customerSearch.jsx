import { useState, useRef, useEffect } from "react";
import { searchCustomersApi } from "../../../api/customerApi";

export default function CustomerSearch({ onSelect, value }) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  const search = async (q) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    try {
      const res = await searchCustomersApi(q);
      setResults(res.data);
      setOpen(true);
    } catch {}
  };

  const select = (c) => {
    onSelect(c);
    setQuery(c.customer_name);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <input
        value={query}
        onChange={(e) => search(e.target.value)}
        placeholder="Search customer…"
        className="input-field"
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-ink-200 rounded-xl shadow-xl overflow-hidden animate-fade-in">
          {results.map((c) => (
            <button
              key={c._id}
              onClick={() => select(c)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-parchment border-b border-ink-100 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-ink-900">{c.customer_name}</p>
                <p className="text-xs text-ink-500">Code: {c.customer_code}</p>
              </div>
              <div className="text-right">
                <p className={`text-xs font-mono ${c.pending_balance > 0 ? "text-rose-500" : "text-jade-600"}`}>
                  Balance: Rs. {c.pending_balance?.toFixed(0)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}