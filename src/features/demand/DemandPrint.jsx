// features/demand/DemandPrint.jsx
import { useQuery } from "@tanstack/react-query";
import API from "../../api/axios";
import { printPDF } from "../../utils/pdf";

export default function DemandPrint() {
  const { data } = useQuery({
    queryKey: ["demand"],
    queryFn: async () => {
      const res = await API.get("/demand");
      return res.data;
    },
  });

  return (
    <div>
      <div id="print-demand">
        {Object.keys(data || {}).map((c) => (
          <div key={c}>
            <h2>{c}</h2>
            {data[c].map((p, i) => (
              <div key={i}>{p.name} - {p.quantity}</div>
            ))}
          </div>
        ))}
      </div>

      <button onClick={() => printPDF("print-demand")}>
        Print Demand
      </button>
    </div>
  );
}