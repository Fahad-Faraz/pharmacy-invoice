import { useSelector } from "react-redux";
import InvoiceRow from "./InvoiceRow";

export default function InvoiceTable() {
  const { items } = useSelector((s) => s.invoice);

  if (items.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-16 text-center">
        <svg
          className="w-12 h-12 text-ink-200 mb-3"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
        </svg>
        <p className="font-display font-semibold text-ink-400">No items added</p>
        <p className="text-ink-300 text-sm mt-1">Search a product above to add it</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr>
            <th className="table-head">Product</th>
            <th className="table-head">Unit</th>
            <th className="table-head">Qty</th>
            <th className="table-head">Price</th>
            <th className="table-head">Discount</th>
            <th className="table-head">Total</th>
            <th className="table-head"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <InvoiceRow key={index} item={item} index={index} />
          ))}
        </tbody>
      </table>
    </div>
  );
}