// features/analytics/CustomerProfit.jsx
import { useAnalytics } from "./useAnalytics";
import { useQuery } from "@tanstack/react-query";
import API from "../../api/axios";

export default function CustomerProfit() {
  const { data } = useAnalytics();

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await API.get("/customers");
      return res.data;
    },
  });

  return (
    <div className="p-4">
      <h1>Customer Profit</h1>

      {customers?.map((c) => (
        <div key={c._id} className="border p-2 mb-2">
          {c.customer_name} → Profit:{" "}
          {data?.customerProfit?.[c._id] || 0}
        </div>
      ))}
    </div>
  );
}