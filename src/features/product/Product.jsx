import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getProductsApi,
  addProductApi,
  updateProductApi,
  deleteProductApi,
  addPurchaseApi,
  importProductsApi,
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

export default function Products() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPurchase, setShowPurchase] = useState(false);
  const [purchaseProduct, setPurchaseProduct] = useState(null);
  const [purchaseQty, setPurchaseQty] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  const debounceRef = useRef(null);
  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
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

  const openAdd = () => { setForm(EMPTY_FORM); setEditing(null); setShowAdd(true); };
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
  };

  const f = (field, val) => setForm((prev) => ({ ...prev, [field]: val }));

  const submit = async () => {
    if (!form.name) { toast.error("Product name is required"); return; }
    setLoading(true);
    try {
      const payload = { ...form };
      if (editing) {
        await updateProductApi(editing, payload);
        toast.success("Product updated");
      } else {
        await addProductApi(payload);
        toast.success("Product added");
      }
      setShowAdd(false);
      queryClient.invalidateQueries(["products"]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await deleteProductApi(id);
      toast.success("Deleted");
      queryClient.invalidateQueries(["products"]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const openPurchase = (p) => {
    setPurchaseProduct(p);
    setPurchaseQty("");
    setPurchasePrice(p.purchase_price || "");
    setShowPurchase(true);
  };

  const submitPurchase = async () => {
    if (!purchaseQty || purchaseQty <= 0) { toast.error("Enter valid quantity"); return; }
    setLoading(true);
    try {
      await addPurchaseApi({
        products: [{
          productId: purchaseProduct._id,
          quantity: Number(purchaseQty),
          purchase_price: Number(purchasePrice) || undefined,
        }],
      });
      toast.success("Stock updated");
      setShowPurchase(false);
      queryClient.invalidateQueries(["products"]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
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
      const res = await importProductsApi(fd);
      toast.success(`Imported ${res.data.count} products`);
      queryClient.invalidateQueries(["products"]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Import failed");
    }
    e.target.value = "";
  };

  const isFixed = form.product_type === "general" || form.product_type === "local" || form.product_type === "franchise";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="text-ink-500 text-sm mt-0.5">{data?.totalProducts || 0} products in inventory</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input type="file" accept=".csv" ref={fileRef} onChange={importFile} className="hidden" />
          <button onClick={() => fileRef.current?.click()} className="btn-secondary flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Import CSV
          </button>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Product
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card p-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name, company…"
            className="input-field pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-head">Product</th>
              <th className="table-head">Type</th>
              <th className="table-head">Company</th>
              <th className="table-head">MRP</th>
              <th className="table-head">Purchase</th>
              <th className="table-head">Discount</th>
              <th className="table-head">Stock</th>
              <th className="table-head">Expiry</th>
              <th className="table-head">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={9} className="text-center py-12 text-ink-400">Loading…</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-12 text-ink-400">No products found</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p._id} className="hover:bg-parchment/50 transition-colors">
                  <td className="table-cell">
                    <div className="font-medium text-ink-900">{p.name}</div>
                  </td>
                  <td className="table-cell">
                    <span className="badge-gray capitalize">{p.product_type}</span>
                  </td>
                  <td className="table-cell text-ink-600">{p.company_name || "—"}</td>
                  <td className="table-cell font-mono text-ink-800">
                    Rs. {p.mrp || p.fixed_price || 0}
                  </td>
                  <td className="table-cell font-mono text-ink-600">Rs. {p.purchase_price || 0}</td>
                  <td className="table-cell font-mono text-ink-600">
                    {p.discount ? `${p.discount}%` : "—"}
                  </td>
                  <td className="table-cell">
                    <span className={`font-mono font-semibold ${
                      p.quantity <= 0 ? "text-rose-600" : p.quantity <= 10 ? "text-ember-500" : "text-jade-600"
                    }`}>
                      {p.quantity}
                    </span>
                  </td>
                  <td className="table-cell text-ink-500 text-xs">
                    {p.expiry_date ? new Date(p.expiry_date).toLocaleDateString("en-PK") : "—"}
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      <button onClick={() => openPurchase(p)} title="Add Stock" className="p-1.5 rounded text-teal-600 hover:bg-teal-50 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                      </button>
                      <button onClick={() => openEdit(p)} title="Edit" className="p-1.5 rounded text-ink-600 hover:bg-ink-50 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button onClick={() => deleteProduct(p._id, p.name)} title="Delete" className="p-1.5 rounded text-rose-500 hover:bg-rose-50 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-ink-100">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-ink-500">Page {page} of {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={editing ? "Edit Product" : "Add Product"}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-display font-semibold uppercase tracking-widest text-ink-500 mb-1 block">Name *</label>
              <input value={form.name} onChange={(e) => f("name", e.target.value)} className="input-field" placeholder="Product name" />
            </div>

            <div>
              <label className="text-xs font-display font-semibold uppercase tracking-widest text-ink-500 mb-1 block">Type</label>
              <select value={form.product_type} onChange={(e) => f("product_type", e.target.value)} className="input-field">
                <option value="company">Company</option>
                <option value="local">Local</option>
                <option value="franchise">Franchise</option>
                <option value="general">General</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-display font-semibold uppercase tracking-widest text-ink-500 mb-1 block">Prefix</label>
              <select value={form.prefix} onChange={(e) => f("prefix", e.target.value)} className="input-field">
                {["Tab","Cap","Inj","Syp","Eye Drop","Nasal spray","Drop"].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-display font-semibold uppercase tracking-widest text-ink-500 mb-1 block">Company</label>
              <input value={form.company_name} onChange={(e) => f("company_name", e.target.value)} className="input-field" placeholder="Company name" />
            </div>

            <div>
              <label className="text-xs font-display font-semibold uppercase tracking-widest text-ink-500 mb-1 block">Generic Name</label>
              <input value={form.generic_name} onChange={(e) => f("generic_name", e.target.value)} className="input-field" placeholder="Generic / salt name" />
            </div>

            {isFixed ? (
              <div>
                <label className="text-xs font-display font-semibold uppercase tracking-widest text-ink-500 mb-1 block">Fixed Price</label>
                <input type="number" value={form.fixed_price} onChange={(e) => f("fixed_price", e.target.value)} className="input-field" placeholder="0.00" />
              </div>
            ) : (
              <div>
                <label className="text-xs font-display font-semibold uppercase tracking-widest text-ink-500 mb-1 block">MRP *</label>
                <input type="number" value={form.mrp} onChange={(e) => f("mrp", e.target.value)} className="input-field" placeholder="0.00" />
              </div>
            )}

            <div>
              <label className="text-xs font-display font-semibold uppercase tracking-widest text-ink-500 mb-1 block">Purchase Price</label>
              <input type="number" value={form.purchase_price} onChange={(e) => f("purchase_price", e.target.value)} className="input-field" placeholder="0.00" />
            </div>

            <div>
              <label className="text-xs font-display font-semibold uppercase tracking-widest text-ink-500 mb-1 block">Trade Price</label>
              <input type="number" value={form.trade_price} onChange={(e) => f("trade_price", e.target.value)} className="input-field" placeholder="0.00" />
            </div>

            <div>
              <label className="text-xs font-display font-semibold uppercase tracking-widest text-ink-500 mb-1 block">Discount (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.discount}
                onChange={(e) => f("discount", e.target.value)}
                className="input-field"
                placeholder="0"
              />
            </div>

            <div>
              <label className="text-xs font-display font-semibold uppercase tracking-widest text-ink-500 mb-1 block">Initial Stock</label>
              <input type="number" value={form.quantity} onChange={(e) => f("quantity", e.target.value)} className="input-field" placeholder="0" />
            </div>

            <div>
              <label className="text-xs font-display font-semibold uppercase tracking-widest text-ink-500 mb-1 block">Expiry Date</label>
              <input type="date" value={form.expiry_date} onChange={(e) => f("expiry_date", e.target.value)} className="input-field" />
            </div>

            {form.product_type === "company" && (
              <>
                <div>
                  <label className="text-xs font-display font-semibold uppercase tracking-widest text-ink-500 mb-1 block">Strips per Box</label>
                  <input type="number" value={form.unit_structure.box.strips}
                    onChange={(e) => setForm(prev => ({ ...prev, unit_structure: { ...prev.unit_structure, box: { strips: Number(e.target.value) } } }))}
                    className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-display font-semibold uppercase tracking-widest text-ink-500 mb-1 block">Tablets per Strip</label>
                  <input type="number" value={form.unit_structure.strip.tablets}
                    onChange={(e) => setForm(prev => ({ ...prev, unit_structure: { ...prev.unit_structure, strip: { tablets: Number(e.target.value) } } }))}
                    className="input-field" />
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={submit} disabled={loading} className="btn-primary flex-1">
              {loading ? "Saving…" : editing ? "Update Product" : "Add Product"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Purchase Modal */}
      <Modal open={showPurchase} onClose={() => setShowPurchase(false)} title="Add Stock Purchase">
        {purchaseProduct && (
          <div className="space-y-4">
            <div className="bg-parchment rounded-lg p-3">
              <p className="font-semibold text-ink-900">{purchaseProduct.name}</p>
              <p className="text-sm text-ink-500">Current Stock: <span className="font-mono font-semibold">{purchaseProduct.quantity}</span></p>
            </div>
            <div>
              <label className="text-xs font-display font-semibold uppercase tracking-widest text-ink-500 mb-1.5 block">Quantity Received</label>
              <input type="number" value={purchaseQty} onChange={(e) => setPurchaseQty(e.target.value)} className="input-field" placeholder="0" />
            </div>
            <div>
              <label className="text-xs font-display font-semibold uppercase tracking-widest text-ink-500 mb-1.5 block">New Purchase Price (optional)</label>
              <input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} className="input-field" placeholder="Leave blank to keep current" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPurchase(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={submitPurchase} disabled={loading} className="btn-success flex-1">
                {loading ? "Updating…" : "Update Stock"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}