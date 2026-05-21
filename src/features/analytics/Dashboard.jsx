import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { useAnalytics } from "./useAnalytics";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

function StatCard({ label, value, sub, color = "teal" }) {
  const colors = {
    teal: "bg-teal-500/10 text-teal-600",
    jade: "bg-jade-500/10 text-jade-600",
    ember: "bg-ember-500/10 text-ember-600",
    rose: "bg-rose-500/10 text-rose-600",
  };
  return (
    <div className="stat-card">
      <p className="text-xs font-display font-semibold uppercase tracking-widest text-ink-400">{label}</p>
      <p className={`text-2xl font-display font-bold mt-1 ${colors[color]}`}>
        Rs. {typeof value === "number" ? value.toFixed(0) : "—"}
      </p>
      {sub && <p className="text-xs text-ink-400 mt-1">{sub}</p>}
    </div>
  );
}

function getLastNDays(dailyData, n) {
  const entries = Object.entries(dailyData || {});
  return entries.slice(-n);
}

function getMonthlyData(monthlyData) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return Object.entries(monthlyData || {}).map(([key, val]) => {
    const [month, year] = key.split("-");
    return { label: `${months[parseInt(month) - 1]} ${year}`, value: val };
  });
}

export default function Dashboard() {
  const { data, isLoading } = useAnalytics();

  const dailyEntries = getLastNDays(data?.daily, 14);
  const monthlyEntries = getMonthlyData(data?.monthly);

  const todayKey = (() => {
    const d = new Date();
    return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
  })();

  const todaySales = data?.daily?.[todayKey] || 0;

  const thisMonthKey = (() => {
    const d = new Date();
    return `${d.getMonth() + 1}-${d.getFullYear()}`;
  })();
  const monthSales = data?.monthly?.[thisMonthKey] || 0;

  const thisYear = new Date().getFullYear();
  const yearSales = data?.yearly?.[thisYear] || 0;

  const chartDefaults = {
    plugins: { legend: { display: false }, tooltip: { mode: "index" } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: "JetBrains Mono", size: 10 }, color: "#afa88e" } },
      y: { grid: { color: "#e8e5dc" }, ticks: { font: { family: "JetBrains Mono", size: 10 }, color: "#afa88e" } },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 text-ink-400">
      <div className="w-6 h-6 border-2 border-ink-200 border-t-ink-600 rounded-full animate-spin mr-3"/>
      Loading analytics…
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-ink-500 text-sm mt-0.5">Sales performance & analytics overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Sales" value={todaySales} color="teal" />
        <StatCard label="This Month" value={monthSales} sub={`${thisMonthKey}`} color="jade" />
        <StatCard label="This Year" value={yearSales} sub={`${thisYear}`} color="ember" />
        <StatCard label="Total Profit" value={data?.totalProfit} color="rose" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily sales - last 14 days */}
        <div className="card p-5">
          <h3 className="font-display font-semibold text-ink-800 mb-4 text-sm">Daily Sales (last 14 days)</h3>
          <div className="h-48">
            <Line
              data={{
                labels: dailyEntries.map(([k]) => k),
                datasets: [{
                  label: "Sales",
                  data: dailyEntries.map(([, v]) => v),
                  borderColor: "#14b8a6",
                  backgroundColor: "rgba(20,184,166,0.1)",
                  fill: true,
                  tension: 0.4,
                  pointRadius: 3,
                  pointBackgroundColor: "#14b8a6",
                }],
              }}
              options={chartDefaults}
            />
          </div>
        </div>

        {/* Monthly sales */}
        <div className="card p-5">
          <h3 className="font-display font-semibold text-ink-800 mb-4 text-sm">Monthly Sales</h3>
          <div className="h-48">
            <Bar
              data={{
                labels: monthlyEntries.map((e) => e.label),
                datasets: [{
                  label: "Sales",
                  data: monthlyEntries.map((e) => e.value),
                  backgroundColor: "#231f1a",
                  borderRadius: 6,
                  borderSkipped: false,
                }],
              }}
              options={chartDefaults}
            />
          </div>
        </div>
      </div>

      {/* Yearly breakdown */}
      {data?.yearly && (
        <div className="card p-5">
          <h3 className="font-display font-semibold text-ink-800 mb-4 text-sm">Annual Sales</h3>
          <div className="h-40">
            <Bar
              data={{
                labels: Object.keys(data.yearly),
                datasets: [{
                  label: "Annual Sales",
                  data: Object.values(data.yearly),
                  backgroundColor: "#f97316",
                  borderRadius: 6,
                  borderSkipped: false,
                }],
              }}
              options={chartDefaults}
            />
          </div>
        </div>
      )}
    </div>
  );
}