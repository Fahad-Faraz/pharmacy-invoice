import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { setAuth } from "./authSlice";
import { loginApi } from "../../api/authApi";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const dispatch = useDispatch();
  const nav = useNavigate();


  // ✅ THIS WAS MISSING
  const { token, user } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  console.log("Working")
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await loginApi(form);

      console.log("LOGIN RESPONSE:", res.data);
      console.log(res.data.user);

      dispatch(setAuth(res.data));

      console.log("dispatch done");

      toast.success("Welcome back!");
    } catch (err) {
      console.log(err.response?.data);
      toast.error(err.response?.data?.message || "Login failed");
    }
  };

  // ✅ Redirect logic
  // useEffect(() => {
  //   console.log("Redux state:", { token, user });

  //   if (token && user) {
  //     const role = user.role?.toLowerCase();

  //     console.log("REDIRECT ROLE:", role);

  //     if (role === "admin") {
  //       // nav("/");
  //       console.log(token)
  //     } else if (role === "cashier") {
  //       // nav("/pos");
  //     }
  //   }
  // }, [token, user,]);

  return (
    <div className="min-h-screen bg-[#0f0d0b] flex items-center justify-center p-4 relative overflow-hidden">

      <div className="absolute top-[-80px] left-[-80px] w-[320px] h-[320px] bg-teal-500 opacity-[0.08] rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-60px] right-[-60px] w-[260px] h-[260px] bg-teal-400 opacity-[0.06] rounded-full blur-[70px] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)`,
          backgroundSize: "36px 36px",
        }}
      />

      <div className="relative w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-[60px] h-[60px] bg-teal-500 rounded-2xl mb-4" style={{ boxShadow: "0 8px 32px rgba(20,184,166,0.25)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
            </svg>
          </div>
          <h1 className="text-[26px] font-semibold text-white tracking-tight">RxManager</h1>
          <p className="text-[13px] text-zinc-600 mt-1">Pharmacy Management System</p>
        </div>

        {/* Card */}
        <div className="bg-[#161310] border border-white/[0.07] rounded-[20px] p-7" style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>

          {/* Card header */}
          <div className="flex items-center gap-2.5 mb-6 pb-5 border-b border-white/[0.06]">
            <div className="w-9 h-9 rounded-[10px] bg-teal-500/10 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Sign in to continue</p>
              <p className="text-xs text-zinc-600">Enter your credentials below</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-600 mb-2 block">
                Email address
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input
                  type="email"
                  name="email"
                  placeholder="admin@pharmacy.com"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full bg-[#0f0d0b] border border-white/[0.09] rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-white placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500/50 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-600 mb-2 block">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  placeholder="••••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full bg-[#0f0d0b] border border-white/[0.09] rounded-xl pl-9 pr-10 py-2.5 text-[13px] text-white placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500/50 transition-all"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors">
                  {showPass ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-500 hover:bg-teal-400 text-white font-semibold py-[11px] rounded-xl transition-all duration-200 text-[13px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
              style={{ boxShadow: "0 4px 20px rgba(20,184,166,0.2)" }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Status bar */}
          <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" style={{ boxShadow: "0 0 6px rgba(34,197,94,0.5)" }} />
            <span className="text-xs text-zinc-600">All systems operational</span>
            <span className="ml-auto text-[11px] text-zinc-800 font-mono">v1.0.0</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-4 mt-5">
          <div className="flex items-center gap-1.5">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#27272a" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="text-[11px] text-zinc-800">SSL Secured</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-zinc-800" />
          <span className="text-[11px] text-zinc-800">RxManager © 2025</span>
          <div className="w-1 h-1 rounded-full bg-zinc-800" />
          <span className="text-[11px] text-zinc-800">Pharmacy Platform</span>
        </div>

      </div>
    </div>
  );
}