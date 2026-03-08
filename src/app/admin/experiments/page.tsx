"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FlaskConical,
  Plus,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  X,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Variant {
  id?: string;
  name: string;
  weight: number;
  is_control: boolean;
  config: string; // JSON string
}

interface Experiment {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  target_page: string;
  target_component: string | null;
  traffic_pct: number;
  status: "draft" | "active" | "paused" | "completed";
  created_at: string;
  variants: Variant[];
}

interface VariantResult {
  variant_name: string;
  impressions: number;
  conversions: number;
  rate: number;
  lift: number | null;
  p_value: number | null;
}

interface ExperimentResults {
  experiment_id: string;
  total_impressions: number;
  total_conversions: number;
  variants: VariantResult[];
}

interface FormVariant {
  name: string;
  weight: string;
  is_control: boolean;
  config: string;
}

interface FormState {
  name: string;
  slug: string;
  description: string;
  target_page: string;
  target_component: string;
  traffic_pct: string;
  variants: FormVariant[];
}

const TARGET_PAGES = ["/", "/shop", "/checkout", "/bundles"];

const emptyVariant: FormVariant = {
  name: "",
  weight: "50",
  is_control: false,
  config: "{}",
};

const emptyForm: FormState = {
  name: "",
  slug: "",
  description: "",
  target_page: "/",
  target_component: "",
  traffic_pct: "100",
  variants: [
    { name: "Control", weight: "50", is_control: true, config: "{}" },
    { name: "Variant B", weight: "50", is_control: false, config: "{}" },
  ],
};

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------------------
// Status badge helpers
// ---------------------------------------------------------------------------

function statusBadgeStyle(status: Experiment["status"]): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: "0.2rem 0.7rem",
    borderRadius: "9999px",
    fontSize: "0.72rem",
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
  };

  switch (status) {
    case "draft":
      return {
        ...base,
        background: "rgba(156,163,175,0.12)",
        color: "#9ca3af",
      };
    case "active":
      return {
        ...base,
        background: "rgba(16,185,129,0.12)",
        color: "#10b981",
      };
    case "paused":
      return {
        ...base,
        background: "rgba(245,158,11,0.12)",
        color: "#f59e0b",
      };
    case "completed":
      return {
        ...base,
        background: "rgba(59,130,246,0.12)",
        color: "#3b82f6",
      };
  }
}

function StatusBadge({ status }: { status: Experiment["status"] }) {
  return (
    <span style={statusBadgeStyle(status)}>
      {status === "active" && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#10b981",
            animation: "pulse 2s infinite",
          }}
        />
      )}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Significance badge
// ---------------------------------------------------------------------------

function SignificanceBadge({ pValue }: { pValue: number | null }) {
  if (pValue === null) {
    return (
      <span
        style={{
          padding: "0.15rem 0.5rem",
          borderRadius: "9999px",
          fontSize: "0.7rem",
          fontWeight: 600,
          background: "rgba(156,163,175,0.12)",
          color: "#9ca3af",
        }}
      >
        N/A
      </span>
    );
  }

  if (pValue < 0.05) {
    return (
      <span
        style={{
          padding: "0.15rem 0.5rem",
          borderRadius: "9999px",
          fontSize: "0.7rem",
          fontWeight: 600,
          background: "rgba(16,185,129,0.12)",
          color: "#10b981",
        }}
      >
        Significant
      </span>
    );
  }

  if (pValue < 0.1) {
    return (
      <span
        style={{
          padding: "0.15rem 0.5rem",
          borderRadius: "9999px",
          fontSize: "0.7rem",
          fontWeight: 600,
          background: "rgba(245,158,11,0.12)",
          color: "#f59e0b",
        }}
      >
        Marginal
      </span>
    );
  }

  return (
    <span
      style={{
        padding: "0.15rem 0.5rem",
        borderRadius: "9999px",
        fontSize: "0.7rem",
        fontWeight: 600,
        background: "rgba(239,68,68,0.12)",
        color: "#ef4444",
      }}
    >
      Not Significant
    </span>
  );
}

// ---------------------------------------------------------------------------
// Label style helper
// ---------------------------------------------------------------------------

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.8rem",
  color: "var(--muted)",
  fontWeight: 600,
  marginBottom: "0.4rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExperiment, setEditingExperiment] = useState<Experiment | null>(
    null,
  );
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedResults, setSelectedResults] =
    useState<ExperimentResults | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const loadExperiments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/experiments");
      if (res.ok) {
        const json = await res.json();
        setExperiments(json.experiments || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExperiments();
  }, [loadExperiments]);

  // ---------------------------------------------------------------------------
  // Modal helpers
  // ---------------------------------------------------------------------------

  function openCreate() {
    setForm(emptyForm);
    setEditingExperiment(null);
    setError("");
    setShowModal(true);
  }

  function openEdit(experiment: Experiment) {
    setForm({
      name: experiment.name,
      slug: experiment.slug,
      description: experiment.description || "",
      target_page: experiment.target_page,
      target_component: experiment.target_component || "",
      traffic_pct: String(experiment.traffic_pct),
      variants: experiment.variants.map((v) => ({
        name: v.name,
        weight: String(v.weight),
        is_control: v.is_control,
        config: typeof v.config === "string" ? v.config : JSON.stringify(v.config, null, 2),
      })),
    });
    setEditingExperiment(experiment);
    setError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingExperiment(null);
    setForm(emptyForm);
    setError("");
  }

  function handleNameChange(value: string) {
    setForm((f) => ({
      ...f,
      name: value,
      slug: editingExperiment ? f.slug : slugify(value),
    }));
  }

  // ---------------------------------------------------------------------------
  // Variant form helpers
  // ---------------------------------------------------------------------------

  function addVariant() {
    setForm((f) => ({
      ...f,
      variants: [
        ...f.variants,
        {
          ...emptyVariant,
          name: `Variant ${String.fromCharCode(65 + f.variants.length)}`,
        },
      ],
    }));
  }

  function removeVariant(index: number) {
    setForm((f) => ({
      ...f,
      variants: f.variants.filter((_, i) => i !== index),
    }));
  }

  function updateVariant(
    index: number,
    field: keyof FormVariant,
    value: string | boolean,
  ) {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) => {
        if (i !== index) {
          // If setting a new control, unset others
          if (field === "is_control" && value === true) {
            return { ...v, is_control: false };
          }
          return v;
        }
        return { ...v, [field]: value };
      }),
    }));
  }

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  async function handleSave() {
    setError("");
    if (!form.name.trim()) return setError("Experiment name is required");
    if (form.variants.length < 2)
      return setError("At least 2 variants are required");
    if (!form.variants.some((v) => v.is_control))
      return setError("One variant must be marked as control");

    const pct = Number(form.traffic_pct);
    if (isNaN(pct) || pct < 1 || pct > 100)
      return setError("Traffic % must be between 1 and 100");

    // Validate variant configs are valid JSON
    for (const v of form.variants) {
      try {
        JSON.parse(v.config);
      } catch {
        return setError(`Invalid JSON config for variant "${v.name}"`);
      }
    }

    setSaving(true);
    try {
      const body = {
        id: editingExperiment?.id || undefined,
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        description: form.description.trim() || undefined,
        target_page: form.target_page,
        target_component: form.target_component.trim() || undefined,
        traffic_pct: pct,
        variants: form.variants.map((v) => ({
          name: v.name.trim(),
          weight: Number(v.weight),
          config: JSON.parse(v.config),
          is_control: v.is_control,
        })),
      };

      const res = await fetch("/api/admin/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to save experiment");
      } else {
        closeModal();
        loadExperiments();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete experiment "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch("/api/admin/experiments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setExperiments((e) => e.filter((x) => x.id !== id));
        if (selectedResults?.experiment_id === id) {
          setSelectedResults(null);
        }
      } else {
        const json = await res.json();
        alert(json.error || "Failed to delete experiment");
      }
    } finally {
      setDeleting(null);
    }
  }

  async function handleStatusChange(
    id: string,
    newStatus: Experiment["status"],
  ) {
    try {
      const res = await fetch(`/api/admin/experiments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setExperiments((exps) =>
          exps.map((e) => (e.id === id ? { ...e, status: newStatus } : e)),
        );
      } else {
        const json = await res.json();
        alert(json.error || "Failed to update status");
      }
    } catch {
      alert("Failed to update status");
    }
  }

  async function loadResults(experimentId: string) {
    setLoadingResults(true);
    try {
      const res = await fetch(`/api/admin/experiments/${experimentId}/results`);
      if (res.ok) {
        const json = await res.json();
        setSelectedResults(json);
      } else {
        alert("Failed to load results");
      }
    } finally {
      setLoadingResults(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Recharts custom tooltip
  // ---------------------------------------------------------------------------

  function CustomTooltip({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
  }) {
    if (!active || !payload?.length) return null;
    return (
      <div
        style={{
          background: "var(--elevated)",
          border: "1px solid var(--gold-border)",
          borderRadius: "8px",
          padding: "0.6rem 0.85rem",
          fontSize: "0.8rem",
        }}
      >
        <p style={{ margin: 0, fontWeight: 600 }}>{label}</p>
        <p style={{ margin: "2px 0 0", color: "var(--gold)" }}>
          {payload[0].value.toFixed(2)}% conversion
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div style={{ padding: "2rem" }}>
      {/* Pulse animation for active badge */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "1.75rem",
              fontWeight: 700,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
            }}
          >
            <FlaskConical size={24} style={{ color: "var(--gold)" }} />
            Experiments
          </h1>
          <p
            style={{
              color: "var(--muted)",
              fontSize: "0.875rem",
              marginTop: "0.25rem",
            }}
          >
            {experiments.length} experiment
            {experiments.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn-gold"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.875rem",
          }}
        >
          <Plus size={16} />
          New Experiment
        </button>
      </div>

      {/* Results Panel */}
      {selectedResults && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--gold-border)",
            borderRadius: "12px",
            padding: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.25rem",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-playfair)",
                fontSize: "1.25rem",
                fontWeight: 700,
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <BarChart3 size={18} style={{ color: "var(--gold)" }} />
              Experiment Results
            </h2>
            <button
              onClick={() => setSelectedResults(null)}
              style={{
                background: "none",
                border: "none",
                color: "var(--muted)",
                cursor: "pointer",
                padding: "0.25rem",
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Summary Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            {[
              {
                label: "Total Impressions",
                value: selectedResults.total_impressions.toLocaleString(),
              },
              {
                label: "Total Conversions",
                value: selectedResults.total_conversions.toLocaleString(),
              },
              {
                label: "Overall Rate",
                value:
                  selectedResults.total_impressions > 0
                    ? `${((selectedResults.total_conversions / selectedResults.total_impressions) * 100).toFixed(2)}%`
                    : "0%",
              },
            ].map((card) => (
              <div
                key={card.label}
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--gold-border)",
                  borderRadius: "10px",
                  padding: "1rem",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    color: "var(--muted)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    margin: "0 0 0.35rem",
                  }}
                >
                  {card.label}
                </p>
                <p
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "var(--gold)",
                    margin: 0,
                    fontFamily: "var(--font-playfair)",
                  }}
                >
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          {/* Bar Chart */}
          {selectedResults.variants.length > 0 && (
            <div
              style={{
                background: "var(--bg)",
                border: "1px solid var(--gold-border)",
                borderRadius: "10px",
                padding: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <p
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  margin: "0 0 0.75rem",
                }}
              >
                Conversion Rate by Variant
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={selectedResults.variants.map((v) => ({
                    name: v.variant_name,
                    rate: v.rate,
                  }))}
                  margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="goldGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#c9a84c" stopOpacity={1} />
                      <stop
                        offset="100%"
                        stopColor="#c9a84c"
                        stopOpacity={0.4}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(201,168,76,0.1)"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "var(--muted)", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(201,168,76,0.2)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "var(--muted)", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(201,168,76,0.2)" }}
                    tickLine={false}
                    unit="%"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="rate"
                    fill="url(#goldGradient)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Stats Table */}
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Variant</th>
                  <th>Impressions</th>
                  <th>Conversions</th>
                  <th>Rate</th>
                  <th>Lift vs Control</th>
                  <th>P-value</th>
                  <th>Significance</th>
                </tr>
              </thead>
              <tbody>
                {selectedResults.variants.map((v) => (
                  <tr key={v.variant_name}>
                    <td style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                      {v.variant_name}
                    </td>
                    <td
                      style={{
                        color: "var(--muted)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {v.impressions.toLocaleString()}
                    </td>
                    <td
                      style={{
                        color: "var(--muted)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {v.conversions.toLocaleString()}
                    </td>
                    <td
                      style={{
                        fontWeight: 700,
                        color: "var(--gold)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {v.rate.toFixed(2)}%
                    </td>
                    <td
                      style={{
                        fontSize: "0.875rem",
                        color:
                          v.lift === null
                            ? "var(--muted)"
                            : v.lift >= 0
                              ? "#10b981"
                              : "#ef4444",
                        fontWeight: 600,
                      }}
                    >
                      {v.lift === null
                        ? "Control"
                        : `${v.lift >= 0 ? "+" : ""}${v.lift.toFixed(1)}%`}
                    </td>
                    <td
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--muted)",
                      }}
                    >
                      {v.p_value !== null ? v.p_value.toFixed(4) : "--"}
                    </td>
                    <td>
                      <SignificanceBadge pValue={v.p_value} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            color: "var(--muted)",
          }}
        >
          Loading experiments...
        </div>
      ) : experiments.length === 0 ? (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--gold-border)",
            borderRadius: "16px",
            padding: "4rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <FlaskConical
            size={56}
            strokeWidth={1}
            style={{ color: "var(--gold)", opacity: 0.4 }}
          />
          <h3
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "1.25rem",
              margin: 0,
            }}
          >
            No experiments yet
          </h3>
          <p
            style={{
              color: "var(--muted)",
              fontSize: "0.875rem",
              margin: 0,
            }}
          >
            Create your first A/B test to start optimizing conversions.
          </p>
          <button onClick={openCreate} className="btn-gold">
            Create First Experiment
          </button>
        </div>
      ) : (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--gold-border)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Target</th>
                  <th>Traffic %</th>
                  <th>Variants</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {experiments.map((exp) => (
                  <tr key={exp.id}>
                    {/* Name + slug */}
                    <td>
                      <div>
                        <p
                          style={{
                            fontWeight: 600,
                            margin: 0,
                            fontSize: "0.9rem",
                          }}
                        >
                          {exp.name}
                        </p>
                        <p
                          style={{
                            color: "var(--muted)",
                            fontSize: "0.75rem",
                            margin: "2px 0 0",
                            fontFamily: "monospace",
                          }}
                        >
                          {exp.slug}
                        </p>
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      <StatusBadge status={exp.status} />
                    </td>

                    {/* Target */}
                    <td>
                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.84rem",
                            fontFamily: "monospace",
                          }}
                        >
                          {exp.target_page}
                        </p>
                        {exp.target_component && (
                          <p
                            style={{
                              color: "var(--muted)",
                              fontSize: "0.72rem",
                              margin: "2px 0 0",
                            }}
                          >
                            {exp.target_component}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Traffic % */}
                    <td
                      style={{
                        fontWeight: 600,
                        color: "var(--gold)",
                        fontSize: "0.9rem",
                      }}
                    >
                      {exp.traffic_pct}%
                    </td>

                    {/* Variants */}
                    <td
                      style={{
                        color: "var(--muted)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {exp.variants?.length || 0} variant
                      {(exp.variants?.length || 0) !== 1 ? "s" : ""}
                    </td>

                    {/* Actions */}
                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.4rem",
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        {/* View Results */}
                        <button
                          onClick={() => loadResults(exp.id)}
                          disabled={loadingResults}
                          style={{
                            background: "none",
                            border: "1px solid var(--gold-border)",
                            color: "var(--gold)",
                            borderRadius: "6px",
                            padding: "0.35rem 0.6rem",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            fontSize: "0.78rem",
                          }}
                        >
                          <BarChart3 size={13} />
                          Results
                        </button>

                        {/* Status actions */}
                        {exp.status === "draft" && (
                          <button
                            onClick={() =>
                              handleStatusChange(exp.id, "active")
                            }
                            style={{
                              background: "none",
                              border: "1px solid rgba(16,185,129,0.3)",
                              color: "#10b981",
                              borderRadius: "6px",
                              padding: "0.35rem 0.6rem",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              fontSize: "0.78rem",
                            }}
                          >
                            <Play size={13} />
                            Activate
                          </button>
                        )}

                        {exp.status === "active" && (
                          <button
                            onClick={() =>
                              handleStatusChange(exp.id, "paused")
                            }
                            style={{
                              background: "none",
                              border: "1px solid rgba(245,158,11,0.3)",
                              color: "#f59e0b",
                              borderRadius: "6px",
                              padding: "0.35rem 0.6rem",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              fontSize: "0.78rem",
                            }}
                          >
                            <Pause size={13} />
                            Pause
                          </button>
                        )}

                        {exp.status === "paused" && (
                          <>
                            <button
                              onClick={() =>
                                handleStatusChange(exp.id, "active")
                              }
                              style={{
                                background: "none",
                                border: "1px solid rgba(16,185,129,0.3)",
                                color: "#10b981",
                                borderRadius: "6px",
                                padding: "0.35rem 0.6rem",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                fontSize: "0.78rem",
                              }}
                            >
                              <Play size={13} />
                              Resume
                            </button>
                            <button
                              onClick={() =>
                                handleStatusChange(exp.id, "completed")
                              }
                              style={{
                                background: "none",
                                border: "1px solid rgba(59,130,246,0.3)",
                                color: "#3b82f6",
                                borderRadius: "6px",
                                padding: "0.35rem 0.6rem",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                fontSize: "0.78rem",
                              }}
                            >
                              <CheckCircle size={13} />
                              Complete
                            </button>
                          </>
                        )}

                        {(exp.status === "active" ||
                          exp.status === "paused") && (
                          <button
                            onClick={() =>
                              handleStatusChange(exp.id, "completed")
                            }
                            style={{
                              background: "none",
                              border: "1px solid rgba(59,130,246,0.3)",
                              color: "#3b82f6",
                              borderRadius: "6px",
                              padding: "0.35rem 0.6rem",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              fontSize: "0.78rem",
                              ...(exp.status === "paused"
                                ? { display: "none" }
                                : {}),
                            }}
                          >
                            <CheckCircle size={13} />
                            Complete
                          </button>
                        )}

                        {/* Edit */}
                        <button
                          onClick={() => openEdit(exp)}
                          style={{
                            background: "none",
                            border: "1px solid var(--gold-border)",
                            color: "var(--gold)",
                            borderRadius: "6px",
                            padding: "0.35rem 0.6rem",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            fontSize: "0.78rem",
                          }}
                        >
                          Edit
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(exp.id, exp.name)}
                          disabled={deleting === exp.id}
                          style={{
                            background: "none",
                            border: "1px solid rgba(239,68,68,0.3)",
                            color: "#ef4444",
                            borderRadius: "6px",
                            padding: "0.35rem 0.6rem",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            fontSize: "0.78rem",
                            opacity: deleting === exp.id ? 0.5 : 1,
                          }}
                        >
                          <Trash2 size={13} />
                          {deleting === exp.id ? "..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            zIndex: 1000,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "2rem 1rem",
            overflowY: "auto",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--gold-border)",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "720px",
              padding: "2rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              margin: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-playfair)",
                  fontSize: "1.35rem",
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                {editingExperiment ? "Edit Experiment" : "New Experiment"}
              </h2>
              <button
                onClick={closeModal}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--muted)",
                  cursor: "pointer",
                  padding: "0.25rem",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "8px",
                  padding: "0.75rem 1rem",
                  color: "#ef4444",
                  fontSize: "0.875rem",
                }}
              >
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label style={labelStyle}>Experiment Name *</label>
              <input
                className="input-dark"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Homepage Hero CTA Color"
                style={{ width: "100%" }}
              />
            </div>

            {/* Slug */}
            <div>
              <label style={labelStyle}>Slug</label>
              <input
                className="input-dark"
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value }))
                }
                placeholder="homepage-hero-cta-color"
                style={{
                  width: "100%",
                  fontFamily: "monospace",
                  fontSize: "0.875rem",
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                className="input-dark"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
                placeholder="What is this experiment testing?"
                style={{ width: "100%", resize: "vertical" }}
              />
            </div>

            {/* Target Page + Component row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <div>
                <label style={labelStyle}>Target Page *</label>
                <select
                  className="input-dark"
                  value={form.target_page}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, target_page: e.target.value }))
                  }
                  style={{ width: "100%" }}
                >
                  {TARGET_PAGES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Target Component</label>
                <input
                  className="input-dark"
                  value={form.target_component}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      target_component: e.target.value,
                    }))
                  }
                  placeholder="e.g. HeroBanner"
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            {/* Traffic % */}
            <div>
              <label style={labelStyle}>Traffic Allocation (%)</label>
              <input
                className="input-dark"
                type="number"
                min="1"
                max="100"
                value={form.traffic_pct}
                onChange={(e) =>
                  setForm((f) => ({ ...f, traffic_pct: e.target.value }))
                }
                placeholder="100"
                style={{ width: "160px" }}
              />
              <p
                style={{
                  color: "var(--muted)",
                  fontSize: "0.75rem",
                  marginTop: "0.3rem",
                }}
              >
                Percentage of visitors who will see this experiment
              </p>
            </div>

            {/* Variants */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.5rem",
                }}
              >
                <label style={{ ...labelStyle, marginBottom: 0 }}>
                  Variants ({form.variants.length})
                </label>
                <button
                  type="button"
                  onClick={addVariant}
                  style={{
                    background: "none",
                    border: "1px solid var(--gold-border)",
                    color: "var(--gold)",
                    borderRadius: "6px",
                    padding: "0.3rem 0.65rem",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    fontSize: "0.78rem",
                  }}
                >
                  <Plus size={13} />
                  Add Variant
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {form.variants.map((variant, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "var(--bg)",
                      border: variant.is_control
                        ? "1px solid var(--gold)"
                        : "1px solid var(--gold-border)",
                      borderRadius: "10px",
                      padding: "1rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.75rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: variant.is_control
                              ? "var(--gold)"
                              : "var(--text)",
                          }}
                        >
                          Variant {idx + 1}
                        </span>
                        {variant.is_control && (
                          <span
                            style={{
                              padding: "0.1rem 0.45rem",
                              borderRadius: "9999px",
                              fontSize: "0.65rem",
                              fontWeight: 600,
                              background: "rgba(201,168,76,0.15)",
                              color: "var(--gold)",
                            }}
                          >
                            CONTROL
                          </span>
                        )}
                      </div>
                      {form.variants.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeVariant(idx)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            padding: "0.15rem",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 80px",
                        gap: "0.75rem",
                        marginBottom: "0.75rem",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            ...labelStyle,
                            fontSize: "0.7rem",
                          }}
                        >
                          Name
                        </label>
                        <input
                          className="input-dark"
                          value={variant.name}
                          onChange={(e) =>
                            updateVariant(idx, "name", e.target.value)
                          }
                          placeholder="e.g. Control, Variant B"
                          style={{ width: "100%" }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            ...labelStyle,
                            fontSize: "0.7rem",
                          }}
                        >
                          Weight
                        </label>
                        <input
                          className="input-dark"
                          type="number"
                          min="1"
                          max="100"
                          value={variant.weight}
                          onChange={(e) =>
                            updateVariant(idx, "weight", e.target.value)
                          }
                          style={{ width: "100%" }}
                        />
                      </div>
                    </div>

                    {/* Control checkbox */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginBottom: "0.75rem",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={variant.is_control}
                        onChange={(e) =>
                          updateVariant(idx, "is_control", e.target.checked)
                        }
                        id={`control-${idx}`}
                        style={{ accentColor: "#c9a84c" }}
                      />
                      <label
                        htmlFor={`control-${idx}`}
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--muted)",
                          cursor: "pointer",
                        }}
                      >
                        This is the control variant
                      </label>
                    </div>

                    {/* Config JSON */}
                    <div>
                      <label
                        style={{
                          ...labelStyle,
                          fontSize: "0.7rem",
                        }}
                      >
                        Config (JSON)
                      </label>
                      <textarea
                        className="input-dark"
                        value={variant.config}
                        onChange={(e) =>
                          updateVariant(idx, "config", e.target.value)
                        }
                        rows={3}
                        placeholder='{"buttonColor": "#c9a84c", "headline": "Shop Now"}'
                        style={{
                          width: "100%",
                          fontFamily: "monospace",
                          fontSize: "0.8rem",
                          resize: "vertical",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={closeModal}
                className="btn-gold-outline"
                style={{ fontSize: "0.875rem" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn-gold"
                style={{
                  fontSize: "0.875rem",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving
                  ? "Saving..."
                  : editingExperiment
                    ? "Update Experiment"
                    : "Create Experiment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
