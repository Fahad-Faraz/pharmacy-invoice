import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getProductsApi,
  addProductApi,
  updateProductApi,
  deleteProductApi,
  addPurchaseApi,
  importProductsApi,
  importExcelApi,
  exportCompanyApi,
  searchProductsApi,
} from "../../api/productApi";
import { queryClient } from "../../app/queryClient";
import Modal from "../../components/common/Modal";

const EMPTY_FORM = {
  name: "",
  product_type: "company",
  company_name: "",
  generic_name: "",
  prefix: "Tab",
  mrp: "",
  purchase_price: "",
  trade_price: "",
  fixed_price: "",
  quantity: "",
  discount: "",
  expiry_date: "",
  unit_structure: { box: { strips: 1 }, strip: { tablets: 10 } },
};

// Tab order for Enter key navigation in modal
const ENTER_ORDER = [
  "name","company_name","product_type","prefix","mrp",
  "trade_price","purchase_price","discount","quantity","expiry_date",
];

export default function Products() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  // Purchase modal state
  const [showPurchase, setShowPurchase] = useState(false);
  const [purchaseQuery, setPurchaseQuery] = useState("");
  const [purchaseResults, setPurchaseResults] = useState([]);
  const [purchaseSearchOpen, setPurchaseSearchOpen] = useState(false);
  const [purchaseProduct, setPurchaseProduct] = useState(null);
  const [purchaseQty, setPurchaseQty] = useState("");
  const [companyExport, setCompanyExport] = useState("");
  const [purchasePrices, setPurchasePrices] = useState({ mrp: "", trade_price: "", purchase_price: "" });

  const fileRef = useRef(null);
  const searchRef = useRef(null);
  const firstFieldRef = useRef(null);
  const purchaseSearchRef = useRef(null);
  const purchaseQtyRef = useRef(null);
  const debounceRef = useRef(null);
  const purchaseDebounce = useRef(null);

  // Global shortcuts: N = new product, P = purchase, / = search
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      const inInput = tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA";
      if (inInput) return;
      if (e.key === "n" || e.key === "N") { e.preventDefault(); openAdd(); }
      if (e.key === "p" || e.key === "P") { e.preventDefault(); openPurchaseModal(); }
      if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedSearch(val); setPage(1); }, 400);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["products", page, debouncedSearch],
    queryFn: async () => {
      const res = await getProductsApi({ page, search: debouncedSearch });
      return res.data;
    },
  });

  const products = data?.products || [];
  const totalPages = data?.totalPages || 1;

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setShowAdd(true);
    setTimeout(() => firstFieldRef.current?.focus(), 100);
  };

  const openEdit = (p) => {
    setForm({
      name: p.name || "",
      product_type: p.product_type || "company",
      company_name: p.company_name || "",
      generic_name: p.generic_name || "",
      prefix: p.prefix || "Tab",
      mrp: p.mrp || "",
      purchase_price: p.purchase_price || "",
      trade_price: p.trade_price || "",
      fixed_price: p.fixed_price || "",
      quantity: p.quantity || "",
      discount: p.discount || "",
      expiry_date: p.expiry_date ? p.expiry_date.split("T")[0] : "",
      unit_structure: p.unit_structure || { box: { strips: 1 }, strip: { tablets: 10 } },
    });
    setEditing(p._id);
    setShowAdd(true);
    setTimeout(() => firstFieldRef.current?.focus(), 100);
  };

  const f = (field, val) => setForm((prev) => ({ ...prev, [field]: val }));

  // Enter key moves to next field in modal
  const handleFieldEnter = (e, currentField) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const idx = ENTER_ORDER.indexOf(currentField);
    if (idx < ENTER_ORDER.length - 1) {
      document.getElementById(`pf-${ENTER_ORDER[idx + 1]}`)?.focus();
    } else {
      submitProduct();
    }
  };

  const submitProduct = async () => {
    if (!form.name.trim()) { toast.error("Product ka naam zaroori hai"); return; }
    setLoading(true);
    try {
      if (editing) {
        await updateProductApi(editing, form);
        toast.success("Product update ho gaya");
      } else {
        await addProductApi(form);
        toast.success("Product add ho gaya");
      }
      setShowAdd(false);
      queryClient.invalidateQueries(["products"]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error aa gaya");
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id, name) => {
    if (!window.confirm(`"${name}" delete karen?`)) return;
    try {
      await deleteProductApi(id);
      toast.success("Delete ho gaya");
      queryClient.invalidateQueries(["products"]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete nahi hua");
    }
  };

  // ── Purchase modal ──
  const openPurchaseModal = (preProduct = null) => {
    setPurchaseProduct(preProduct);
    setPurchaseQuery(preProduct ? preProduct.name : "");
    setPurchaseResults([]);
    setPurchaseSearchOpen(false);
    setPurchaseQty("");
    setPurchasePrices({
      mrp: preProduct?.mrp || "",
      trade_price: preProduct?.trade_price || "",
      purchase_price: preProduct?.purchase_price || "",
    });
    setShowPurchase(true);
    setTimeout(() => {
      if (preProduct) purchaseQtyRef.current?.focus();
      else purchaseSearchRef.current?.focus();
    }, 100);
  };

  const handlePurchaseSearch = (q) => {
    setPurchaseQuery(q);
    clearTimeout(purchaseDebounce.current);
    if (!q.trim()) { setPurchaseResults([]); setPurchaseSearchOpen(false); return; }
    purchaseDebounce.current = setTimeout(async () => {
      try {
        const res = await searchProductsApi(q);
        setPurchaseResults(res.data);
        setPurchaseSearchOpen(res.data.length > 0);
      } catch {}
    }, 200);
  };

  const selectPurchaseProduct = (p) => {
    setPurchaseProduct(p);
    setPurchaseQuery(p.name);
    setPurchaseSearchOpen(false);
    setPurchasePrices({ mrp: p.mrp || "", trade_price: p.trade_price || "", purchase_price: p.purchase_price || "" });
    setTimeout(() => purchaseQtyRef.current?.focus(), 50);
  };

  const submitPurchase = async () => {
    if (!purchaseProduct) { toast.error("Pehle product select karo"); return; }
    if (!purchaseQty || Number(purchaseQty) <= 0) { toast.error("Sahi quantity likho"); return; }
    setLoading(true);
    try {
      await addPurchaseApi({
        products: [{
          productId: purchaseProduct._id,
          quantity: Number(purchaseQty),
          mrp: purchasePrices.mrp ? Number(purchasePrices.mrp) : undefined,
          trade_price: purchasePrices.trade_price ? Number(purchasePrices.trade_price) : undefined,
          purchase_price: purchasePrices.purchase_price ? Number(purchasePrices.purchase_price) : undefined,
        }],
      });
      toast.success(`Stock update! +${purchaseQty} units`);
      setShowPurchase(false);
      queryClient.invalidateQueries(["products"]);
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
    let res;

    if (file.name.endsWith(".csv")) {
      res = await importProductsApi(fd);
    } else if (
      file.name.endsWith(".xlsx") ||
      file.name.endsWith(".xls")
    ) {
      res = await importExcelApi(fd);
    } else {
      toast.error("Sirf CSV ya Excel file allow hai");
      return;
    }

    toast.success(
      `${res.data.imported || res.data.count} products import ho gaye`
    );

    queryClient.invalidateQueries(["products"]);
  } catch (err) {
    toast.error(err.response?.data?.message || "Import failed");
  }

  e.target.value = "";
};
  const exportCompany = async () => {
  if (!companyExport.trim()) {
    toast.error("Company ka naam likho");
    return;
  }

  try {
    const res = await exportCompanyApi(companyExport);

    const url = window.URL.createObjectURL(new Blob([res.data]));

    const link = document.createElement("a");
    link.href = url;
    link.download = `${companyExport}-products.csv`;

    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);

    toast.success("CSV Download ho gayi");
  } catch (err) {
    toast.error(err.response?.data?.message || "Export failed");
  }
};
    return (
  <div className="space-y-5">
    {/* ── Header ── */}
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 className="page-title">Products</h1>
        <p className="text-ink-500 text-sm mt-0.5">
          {data?.totalProducts || 0} products ·{" "}
          <kbd className="kbd">N</kbd> naya ·{" "}
          <kbd className="kbd">P</kbd> purchase ·{" "}
          <kbd className="kbd">/</kbd> search
        </p>
      </div>

      <div className="flex gap-2 flex-wrap items-center">

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileRef}
          accept=".csv,.xlsx,.xls"
          onChange={importFile}
          className="hidden"
        />

        {/* Import Button */}
        <button
          onClick={() => fileRef.current?.click()}
          className="btn-secondary flex items-center gap-2"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>

          Import CSV / Excel
        </button>

        {/* Company Export */}
        <input
          type="text"
          value={companyExport}
          onChange={(e) => setCompanyExport(e.target.value)}
          placeholder="Company Name"
          className="input-field w-44"
        />

        <button
          onClick={exportCompany}
          className="btn-secondary"
        >
          Export CSV
        </button>

        {/* Purchase */}
        <button
          onClick={openPurchaseModal}
          className="btn-secondary flex items-center gap-2"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>

          Purchase Stock (P)
        </button>

        {/* Add Product */}
        <button
          onClick={openAdd}
          className="btn-primary flex items-center gap-2"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>

          Naya Product (N)
        </button>

      </div>
    </div>
      {/* ── Search ── */}
      <div className="card p-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Naam ya company se dhundein… (/ press karein)"
            className="input-field pl-9"
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-head">Product</th>
              <th className="table-head">Type</th>
              <th className="table-head">Company</th>
              <th className="table-head">MRP</th>
              <th className="table-head">T.Price</th>
              <th className="table-head">P.Price</th>
              <th className="table-head">Disc%</th>
              <th className="table-head">Stock</th>
              <th className="table-head">Expiry</th>
              <th className="table-head">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-ink-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-ink-200 border-t-ink-600 rounded-full animate-spin" />
                    Load ho raha hai…
                  </div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-ink-400">
                  Koi product nahi mila
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p._id} className="hover:bg-parchment/50 transition-colors">
                  <td className="table-cell">
                    <div className="font-semibold text-ink-900 text-sm">
                      {p.prefix ? `${p.prefix} ` : ""}{p.name}
                    </div>
                    {p.generic_name && (
                      <div className="text-xs text-ink-400">{p.generic_name}</div>
                    )}
                  </td>
                  <td className="table-cell">
                    <span className="badge-gray capitalize">{p.product_type}</span>
                  </td>
                  <td className="table-cell text-ink-600 text-sm">{p.company_name || "—"}</td>
                  <td className="table-cell font-mono text-sm text-ink-800">
                    {p.mrp || p.fixed_price ? `Rs.${p.mrp || p.fixed_price}` : "—"}
                  </td>
                  <td className="table-cell font-mono text-sm text-ink-600">
                    {p.trade_price ? `Rs.${p.trade_price}` : "—"}
                  </td>
                  <td className="table-cell font-mono text-sm text-ink-600">
                    {p.purchase_price ? `Rs.${p.purchase_price}` : "—"}
                  </td>
                  <td className="table-cell font-mono text-sm text-ink-600">
                    {p.discount ? `${p.discount}%` : "—"}
                  </td>
                  <td className="table-cell">
                    <span
                      className={`font-mono font-bold text-sm ${
                        p.quantity <= 0
                          ? "text-rose-600"
                          : p.quantity <= 10
                          ? "text-amber-500"
                          : "text-jade-600"
                      }`}
                    >
                      {p.quantity}
                    </span>
                  </td>
                  <td className="table-cell text-ink-500 text-xs">
                    {p.expiry_date
                      ? new Date(p.expiry_date).toLocaleDateString("en-PK")
                      : "—"}
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      {/* Purchase / Add Stock */}
                      <button
                        onClick={() => openPurchaseModal(p)}
                        title="Stock Add Karo"
                        className="p-1.5 rounded text-teal-600 hover:bg-teal-50 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                      {/* Edit */}
                      <button
                        onClick={() => openEdit(p)}
                        title="Edit"
                        className="p-1.5 rounded text-ink-600 hover:bg-ink-50 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => deleteProduct(p._id, p.name)}
                        title="Delete"
                        className="p-1.5 rounded text-rose-500 hover:bg-rose-50 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-ink-100">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Pehla
            </button>
            <span className="text-sm text-ink-500">
              Page {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Agla →
            </button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════
          ADD / EDIT PRODUCT MODAL
      ══════════════════════════════ */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title={editing ? "Product Edit Karo" : "Naya Product Add Karo"}
      >
        <div className="space-y-4">
          <p className="text-xs text-ink-400 bg-parchment rounded-lg px-3 py-2">
            Sirf <b>Naam</b> zaroori hai. Baaki fields optional hain — jo chahein bharo, jo nahi chahein chhor do.
            <br />
            <kbd className="kbd">Enter</kbd> dabao agla field,آخری field pe Enter = Save
          </p>

          {/* ─ Required ─ */}
          <div>
            <label className="field-label">
              Naam <span className="text-rose-500">*</span>
            </label>
            <input
              id="pf-name"
              ref={firstFieldRef}
              value={form.name}
              onChange={(e) => f("name", e.target.value)}
              onKeyDown={(e) => handleFieldEnter(e, "name")}
              className="input-field"
              placeholder="Product ka naam"
              autoComplete="off"
            />
          </div>

          {/* ─ Basic Info ─ */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Company</label>
              <input
                id="pf-company_name"
                value={form.company_name}
                onChange={(e) => f("company_name", e.target.value)}
                onKeyDown={(e) => handleFieldEnter(e, "company_name")}
                className="input-field"
                placeholder="Getz, Abbott…"
              />
            </div>
            <div>
              <label className="field-label">Type</label>
              <select
                id="pf-product_type"
                value={form.product_type}
                onChange={(e) => f("product_type", e.target.value)}
                onKeyDown={(e) => handleFieldEnter(e, "product_type")}
                className="input-field"
              >
                <option value="company">Company</option>
                <option value="local">Local</option>
                <option value="franchise">Franchise</option>
                <option value="general">General</option>
              </select>
            </div>
            <div>
              <label className="field-label">Prefix</label>
              <select
                id="pf-prefix"
                value={form.prefix}
                onChange={(e) => f("prefix", e.target.value)}
                onKeyDown={(e) => handleFieldEnter(e, "prefix")}
                className="input-field"
              >
                {["Tab", "Cap", "Inj", "Syp", "Eye Drop", "Nasal spray", "Drop"].map(
                  (x) => <option key={x} value={x}>{x}</option>
                )}
              </select>
            </div>
            <div>
              <label className="field-label">Generic / Salt Name</label>
              <input
                value={form.generic_name}
                onChange={(e) => f("generic_name", e.target.value)}
                className="input-field"
                placeholder="Optional"
              />
            </div>
          </div>

          {/* ─ Pricing ─ */}
          <div className="border-t border-ink-100 pt-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-400 mb-3">
              Prices (Optional)
            </p>
            <div className="grid grid-cols-2 gap-3">
              {isFixed ? (
                <div>
                  <label className="field-label">Fixed Price</label>
                  <input
                    type="number"
                    id="pf-mrp"
                    value={form.fixed_price}
                    onChange={(e) => f("fixed_price", e.target.value)}
                    onKeyDown={(e) => handleFieldEnter(e, "mrp")}
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
              ) : (
                <div>
                  <label className="field-label">MRP</label>
                  <input
                    type="number"
                    id="pf-mrp"
                    value={form.mrp}
                    onChange={(e) => f("mrp", e.target.value)}
                    onKeyDown={(e) => handleFieldEnter(e, "mrp")}
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
              )}
              <div>
                <label className="field-label">Trade Price (TP)</label>
                <input
                  type="number"
                  id="pf-trade_price"
                  value={form.trade_price}
                  onChange={(e) => f("trade_price", e.target.value)}
                  onKeyDown={(e) => handleFieldEnter(e, "trade_price")}
                  className="input-field"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="field-label">Purchase Price (PP)</label>
                <input
                  type="number"
                  id="pf-purchase_price"
                  value={form.purchase_price}
                  onChange={(e) => f("purchase_price", e.target.value)}
                  onKeyDown={(e) => handleFieldEnter(e, "purchase_price")}
                  className="input-field"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="field-label">Discount %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  id="pf-discount"
                  value={form.discount}
                  onChange={(e) => f("discount", e.target.value)}
                  onKeyDown={(e) => handleFieldEnter(e, "discount")}
                  className="input-field"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* ─ Stock & Expiry ─ */}
          <div className="border-t border-ink-100 pt-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-400 mb-3">
              Stock & Expiry (Optional)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Opening Stock</label>
                <input
                  type="number"
                  id="pf-quantity"
                  value={form.quantity}
                  onChange={(e) => f("quantity", e.target.value)}
                  onKeyDown={(e) => handleFieldEnter(e, "quantity")}
                  className="input-field"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="field-label">Expiry Date</label>
                <input
                  type="date"
                  id="pf-expiry_date"
                  value={form.expiry_date}
                  onChange={(e) => f("expiry_date", e.target.value)}
                  onKeyDown={(e) => handleFieldEnter(e, "expiry_date")}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* ─ Unit structure (company only) ─ */}
          {form.product_type === "company" && (
            <div className="border-t border-ink-100 pt-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-400 mb-3">
                Pack Structure (Optional)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Strips per Box</label>
                  <input
                    type="number"
                    value={form.unit_structure.box.strips}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        unit_structure: {
                          ...prev.unit_structure,
                          box: { strips: Number(e.target.value) },
                        },
                      }))
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="field-label">Tablets per Strip</label>
                  <input
                    type="number"
                    value={form.unit_structure.strip.tablets}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        unit_structure: {
                          ...prev.unit_structure,
                          strip: { tablets: Number(e.target.value) },
                        },
                      }))
                    }
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowAdd(false)}
              className="btn-secondary flex-1"
            >
              Cancel (Esc)
            </button>
            <button
              onClick={submitProduct}
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? "Save ho raha hai…" : editing ? "Update Karo" : "Add Karo"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ══════════════════════════════
          PURCHASE STOCK MODAL
      ══════════════════════════════ */}
      <Modal
        open={showPurchase}
        onClose={() => setShowPurchase(false)}
        title="Purchase / Stock Add Karo"
      >
        <div className="space-y-4">
          <p className="text-xs text-ink-400 bg-parchment rounded-lg px-3 py-2">
            Product search karein → Quantity likhen → Prices update karein (optional) → Save
          </p>

          {/* Product search */}
          <div className="relative">
            <label className="field-label mb-1 block">
              Product <span className="text-rose-500">*</span>
            </label>
            <input
              ref={purchaseSearchRef}
              value={purchaseQuery}
              onChange={(e) => handlePurchaseSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && purchaseResults.length > 0) selectPurchaseProduct(purchaseResults[0]);
                if (e.key === "ArrowDown" && purchaseResults.length > 0) purchaseQtyRef.current?.focus();
              }}
              placeholder="Product naam likhein…"
              className="input-field"
              autoComplete="off"
            />
            {purchaseSearchOpen && purchaseResults.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-ink-200 rounded-xl shadow-xl overflow-hidden">
                {purchaseResults.slice(0, 8).map((p) => (
                  <button
                    key={p._id}
                    onClick={() => selectPurchaseProduct(p)}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-parchment transition-colors text-left border-b border-ink-100 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{p.name}</p>
                      <p className="text-xs text-ink-500">{p.company_name || "—"} · Stock: {p.quantity}</p>
                    </div>
                    <span className="font-mono text-xs text-ink-600">
                      MRP: {p.mrp || p.fixed_price || "—"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected product info */}
          {purchaseProduct && (
            <div className="bg-parchment rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-ink-900">{purchaseProduct.name}</p>
                <p className="text-xs text-ink-500">{purchaseProduct.company_name || "—"}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-ink-500">Maujuda Stock</p>
                <p className="font-mono font-bold text-ink-800 text-lg">{purchaseProduct.quantity}</p>
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="field-label mb-1 block">
              Kitni Quantity Aayi? <span className="text-rose-500">*</span>
            </label>
            <input
              ref={purchaseQtyRef}
              type="number"
              value={purchaseQty}
              onChange={(e) => setPurchaseQty(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") document.getElementById("purch-mrp")?.focus();
              }}
              className="input-field text-2xl font-mono font-bold text-center"
              placeholder="0"
            />
          </div>

          {/* Price update */}
          <div className="border-t border-ink-100 pt-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-400 mb-3">
              Prices Update Karo (Optional — Khali chhor do same rakhne ke liye)
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="field-label">Naya MRP</label>
                <input
                  id="purch-mrp"
                  type="number"
                  value={purchasePrices.mrp}
                  onChange={(e) => setPurchasePrices((p) => ({ ...p, mrp: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") document.getElementById("purch-tp")?.focus(); }}
                  className="input-field"
                  placeholder="Same rahne do"
                />
              </div>
              <div>
                <label className="field-label">Naya TP</label>
                <input
                  id="purch-tp"
                  type="number"
                  value={purchasePrices.trade_price}
                  onChange={(e) => setPurchasePrices((p) => ({ ...p, trade_price: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") document.getElementById("purch-pp")?.focus(); }}
                  className="input-field"
                  placeholder="Same rahne do"
                />
              </div>
              <div>
                <label className="field-label">Naya PP</label>
                <input
                  id="purch-pp"
                  type="number"
                  value={purchasePrices.purchase_price}
                  onChange={(e) => setPurchasePrices((p) => ({ ...p, purchase_price: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") submitPurchase(); }}
                  className="input-field"
                  placeholder="Same rahne do"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setShowPurchase(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={submitPurchase}
              disabled={loading || !purchaseProduct}
              className="btn-primary flex-1"
            >
              {loading
                ? "Save ho raha hai…"
                : `Stock Add Karo${purchaseQty ? ` (+${purchaseQty})` : ""}`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}