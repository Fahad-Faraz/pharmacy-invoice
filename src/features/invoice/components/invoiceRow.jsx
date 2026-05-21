import { useDispatch } from "react-redux";
import { updateItem, removeItem } from "../invoiceSlice";

export default function InvoiceRow({ item, index }) {
  const dispatch = useDispatch();

  const update = (field, value) =>
    dispatch(updateItem({ index, field, value }));

  return (
    <tr className="group hover:bg-parchment/50 transition-colors">
      <td className="table-cell font-medium">
        <div className="font-medium text-ink-900">{item.name}</div>
      </td>
      <td className="table-cell">
        <select
          value={item.unit || "tablet"}
          onChange={(e) => update("unit", e.target.value)}
          className="text-xs bg-parchment border border-ink-200 rounded-md px-2 py-1 text-ink-700 focus:outline-none focus:ring-1 focus:ring-ink-400"
        >
          <option value="tablet">Tablet</option>
          <option value="strip">Strip</option>
          <option value="box">Box</option>
        </select>
      </td>
      <td className="table-cell w-28">
        <input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) => update("quantity", e.target.value)}
          className="w-20 bg-cream border border-ink-200 rounded-md px-2 py-1 text-sm font-mono text-center focus:outline-none focus:ring-1 focus:ring-ink-400"
        />
      </td>
      <td className="table-cell w-32">
        <input
          type="number"
          min="0"
          value={item.price}
          onChange={(e) => update("price", e.target.value)}
          className="w-24 bg-cream border border-ink-200 rounded-md px-2 py-1 text-sm font-mono text-center focus:outline-none focus:ring-1 focus:ring-ink-400"
        />
      </td>
      <td className="table-cell w-28">
        <input
          type="number"
          min="0"
          value={item.discount}
          onChange={(e) => update("discount", e.target.value)}
          className="w-20 bg-cream border border-ink-200 rounded-md px-2 py-1 text-sm font-mono text-center focus:outline-none focus:ring-1 focus:ring-ink-400"
        />
      </td>
      <td className="table-cell font-mono font-semibold text-ink-900">
        Rs. {item.total?.toFixed(2)}
      </td>
      <td className="table-cell">
        <button
          onClick={() => dispatch(removeItem(index))}
          className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-600 transition-all p-1 rounded"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </td>
    </tr>
  );
}