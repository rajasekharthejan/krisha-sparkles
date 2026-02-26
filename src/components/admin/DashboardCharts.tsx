"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export interface RevenueDataPoint {
  date: string;   // e.g. "Feb 11"
  revenue: number;
}

export interface StatusDataPoint {
  name: string;
  value: number;
  color: string;
}

interface Props {
  revenueData: RevenueDataPoint[];
  statusData: StatusDataPoint[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#111",
        border: "1px solid rgba(201,168,76,0.3)",
        borderRadius: "8px",
        padding: "0.6rem 0.9rem",
        fontSize: "0.8rem",
      }}
    >
      <p style={{ color: "var(--muted)", margin: "0 0 2px" }}>{label}</p>
      <p style={{ color: "var(--gold)", fontWeight: 600, margin: 0 }}>
        ${Number(payload[0].value).toFixed(2)}
      </p>
    </div>
  );
}

export default function DashboardCharts({ revenueData, statusData }: Props) {
  const hasRevenue = revenueData.some((d) => d.revenue > 0);
  const hasOrders = statusData.some((d) => d.value > 0);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: "1.5rem",
        marginBottom: "2rem",
      }}
      className="admin-main-grid"
    >
      {/* ── Revenue Area Chart ─────────────────────────── */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--gold-border)",
          borderRadius: "12px",
          padding: "1.5rem",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-playfair)",
            fontSize: "1rem",
            fontWeight: 600,
            margin: "0 0 1.25rem",
          }}
        >
          Revenue — Last 14 Days
        </h2>
        {hasRevenue ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#c9a84c" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#c9a84c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#666", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#666", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
                width={45}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#c9a84c"
                strokeWidth={2}
                fill="url(#goldGradient)"
                dot={false}
                activeDot={{ r: 5, fill: "#c9a84c", stroke: "#0a0a0a", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div
            style={{
              height: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--muted)",
              fontSize: "0.875rem",
            }}
          >
            No revenue data for the last 14 days yet
          </div>
        )}
      </div>

      {/* ── Order Status Donut ─────────────────────────── */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--gold-border)",
          borderRadius: "12px",
          padding: "1.5rem",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-playfair)",
            fontSize: "1rem",
            fontWeight: 600,
            margin: "0 0 1.25rem",
          }}
        >
          Order Status
        </h2>
        {hasOrders ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusData.filter((d) => d.value > 0)}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="45%"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={3}
                stroke="none"
              >
                {statusData
                  .filter((d) => d.value > 0)
                  .map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
              </Pie>
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "0.72rem", color: "var(--muted)" }}
              />
              <Tooltip
                contentStyle={{
                  background: "#111",
                  border: "1px solid rgba(201,168,76,0.3)",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div
            style={{
              height: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--muted)",
              fontSize: "0.875rem",
            }}
          >
            No orders yet
          </div>
        )}
      </div>
    </div>
  );
}
