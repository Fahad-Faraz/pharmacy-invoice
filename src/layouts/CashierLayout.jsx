import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";

export default function CashierLayout({ children }) {
  const dispatch = useDispatch();
  const nav = useNavigate();
  const { user } = useSelector((s) => s.auth);

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <header className="bg-ink-950 text-cream px-6 py-3 flex items-center justify-between no-print">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-teal-500 rounded-lg flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
              </svg>
            </div>
            <span className="font-display font-bold text-sm">RxManager</span>
          </div>
          <nav className="flex gap-1">
            {[
              { label: "POS", to: "/pos" },
              { label: "Invoices", to: "/invoices" },
              { label: "Return", to: "/return" },
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-display font-medium transition-colors ${
                    isActive ? "bg-ink-800 text-cream" : "text-ink-400 hover:text-cream"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-ink-400 text-xs">{user?.name} · Cashier</span>
          <button
            onClick={() => { dispatch(logout()); nav("/login"); }}
            className="text-ink-400 hover:text-rose-400 text-xs transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="flex-1 p-5">{children}</main>
    </div>
  );
}