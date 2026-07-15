import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDemandApi } from "../../api/analyticsApi";
import { printA4 } from "../../utils/print";

export default function DemandPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["demand"],
    queryFn: async () => {
      const res = await getDemandApi();
      return res.data;
    },
  });

  const companies = Object.keys(data || {});
  const totalItems = companies.reduce((a, c) => a + data[c].length, 0);

  // Keyboard: P = print
  useEffect(() => {
    const handler = (e) => {
      if ((e.key === "p" || e.key === "P") && !e.ctrlKey) {
        e.preventDefault();
        printA4("demand-print-area");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Demand List</h1>
          <p className="text-ink-500 text-sm mt-0.5">
            {totalItems} products kam stock mein (≤10 units) ·{" "}
            <kbd className="kbd">P</kbd> print
          </p>
        </div>
        <button
          onClick={() => printA4("demand-print-area")}
          className="btn-primary flex items-center gap-2 no-print"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Print Demand (P)
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-ink-400">
          <div className="w-5 h-5 border-2 border-ink-200 border-t-ink-600 rounded-full animate-spin mr-3" />
          Load ho raha hai…
        </div>
      ) : companies.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-jade-500 mb-3">
            <svg className="w-12 h-12 mx-auto opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="font-display font-semibold text-ink-700">Sab products ka stock theek hai!</p>
          <p className="text-ink-400 text-sm mt-1">Koi item 10 se kam nahi hai</p>
        </div>
      ) : (
        <div id="demand-print-area" className="space-y-4">
          {/* Print header — only shows when printing */}
          <div className="hidden print:block text-center mb-6">
            <h1 className="text-xl font-bold">RxManager — Demand List</h1>
            <p>{new Date().toLocaleDateString("en-PK")} {new Date().toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}</p>
            <hr className="my-2" />
          </div>

          {companies.map((company) => (
            <div key={company} className="card overflow-hidden animate-fade-in">
              <div className="bg-ink-950 px-5 py-3 flex items-center justify-between">
                <h3 className="font-display font-semibold text-cream">{company}</h3>
                <span className="text-xs font-mono bg-ink-800 text-ink-300 px-2 py-0.5 rounded-full">
                  {data[company].length} items
                </span>
              </div>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-head">Product</th>
                    <th className="table-head text-right">Current Stock</th>
                    <th className="table-head text-right no-print">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data[company].map((p, i) => (
                    <tr key={i} className="hover:bg-parchment/50 transition-colors">
                      <td className="table-cell font-medium text-ink-900">{p.name}</td>
                      <td className="table-cell text-right">
                        <span
                          className={`font-mono font-bold ${
                            p.quantity === 0
                              ? "text-rose-600"
                              : p.quantity <= 5
                              ? "text-amber-500"
                              : "text-ink-700"
                          }`}
                        >
                          {p.quantity}
                        </span>
                      </td>
                      <td className="table-cell text-right no-print">
                        {p.quantity === 0 ? (
                          <span className="badge-red">Khatam</span>
                        ) : p.quantity <= 5 ? (
                          <span className="badge-orange">Critical</span>
                        ) : (
                          <span className="badge-gray">Kam</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}