  // features/analytics/SalesChart.jsx
  import { Line } from "react-chartjs-2";

  export default function SalesChart({ data }) {
    return (
      <Line
        data={{
          labels: Object.keys(data || {}),
          datasets: [
            {
              label: "Value",
              data: Object.values(data || {}),
            },
          ],
        }}
      />
    );
  }