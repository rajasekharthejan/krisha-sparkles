"use client";

import dynamic from "next/dynamic";
import type { RevenueDataPoint, StatusDataPoint } from "./DashboardCharts";

// recharts uses browser APIs — must be loaded client-side only.
// This thin wrapper lives in a Client Component so that ssr:false is valid.
const DashboardCharts = dynamic(() => import("./DashboardCharts"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "260px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--muted)",
        fontSize: "0.875rem",
      }}
    >
      Loading charts…
    </div>
  ),
});

interface Props {
  revenueData: RevenueDataPoint[];
  statusData: StatusDataPoint[];
}

export default function ChartsLoader({ revenueData, statusData }: Props) {
  return <DashboardCharts revenueData={revenueData} statusData={statusData} />;
}
