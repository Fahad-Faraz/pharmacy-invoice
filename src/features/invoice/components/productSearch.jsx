import { useState, useRef, useEffect } from "react";
import { searchProductsApi } from "../../../api/productApi";

export default function ProductSearch({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = async (q) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await searchProductsApi(q);
      setResults(res.data);
      setOpen(true);
    } catch {}
    finally { setLoading(false); }
  };

  const select = (p) => {
    onSelect(p);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          value={query}
          onChange={(e) => search(e.target.value)}
          placeholder="Search product by name or barcode…"
          className="input-field pl-9"
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-ink-300 border-t-ink-700 rounded-full animate-spin"/>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-ink-200 rounded-xl shadow-xl overflow-hidden animate-fade-in">
          {results.map((p) => (
            <button
              key={p._id}
              onClick={() => select(p)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-parchment transition-colors text-left border-b border-ink-100 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-ink-900">{p.name}</p>
                <p className="text-xs text-ink-500 mt-0.5">{p.company_name || "—"} · {p.product_type}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-medium text-ink-800">
                  Rs. {p.product_type === "general" || p.product_type === "local" || p.product_type === "franchise"
                    ? p.fixed_price
                    : p.mrp}
                </p>
                <p className={`text-xs mt-0.5 ${p.quantity <= 10 ? "text-rose-500" : "text-jade-600"}`}>
                  Stock: {p.quantity}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && results.length === 0 && !loading && query.trim() && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-ink-200 rounded-xl shadow-xl p-4 text-center text-sm text-ink-500 animate-fade-in">
          No products found for "{query}"
        </div>
      )}
    </div>
  );
}