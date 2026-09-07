import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PIE_COLORS = ["#2A3EB1", "#0F9D80", "#F5A623", "#E5484D", "#7C5CFC", "#0EA5E9"];

export default function AdminLoanAnalytics() {
  const API = import.meta.env.VITE_API_BASE_URL;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const loadOverview = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);

      const res = await fetch(`${API}/api/admin-loan-analytics/overview?${params.toString()}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error("LOAN ANALYTICS OVERVIEW ERROR", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatRupee = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="ala-root">
      <style>{`
        .ala-root {
          --lp-bg: #F6F7FB;
          --lp-surface: #FFFFFF;
          --lp-border: #E4E7EE;
          --lp-text: #101828;
          --lp-text-muted: #64748B;
          --lp-primary: #2A3EB1;
          --lp-primary-soft: #EEF1FD;
          --lp-accent: #0F9D80;
          --lp-accent-soft: #E7F7F2;
          --lp-radius-lg: 16px;
          --lp-radius-md: 12px;
          --lp-radius-sm: 8px;
          --lp-shadow-sm: 0 1px 2px rgba(16, 24, 40, 0.06);
          font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
          color: var(--lp-text);
        }
        .ala-filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; align-items: center; }
        .ala-filters input {
          padding: 6px 10px; border: 1px solid var(--lp-border); border-radius: var(--lp-radius-sm);
          font-size: 13px; background: var(--lp-surface);
        }
        .ala-reset-btn {
          padding: 6px 12px; border: 1px solid var(--lp-border); border-radius: var(--lp-radius-sm);
          font-size: 12.5px; font-weight: 700; background: var(--lp-surface);
          color: var(--lp-primary); cursor: pointer;
        }
        .ala-reset-btn:hover { background: var(--lp-primary-soft); }

        .ala-metrics-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px; margin-bottom: 20px;
        }
        .ala-metric-card {
          background: var(--lp-surface); border: 1px solid var(--lp-border);
          border-radius: var(--lp-radius-md); box-shadow: var(--lp-shadow-sm);
          padding: 12px 14px;
        }
        .ala-metric-label {
          font-size: 10.5px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.04em; color: var(--lp-text-muted); margin-bottom: 4px;
        }
        .ala-metric-value { font-size: 20px; font-weight: 800; color: var(--lp-text); line-height: 1.2; }
        .ala-metric-value.accent { color: var(--lp-accent); }
        .ala-metric-value.primary { color: var(--lp-primary); }

        .ala-grid-2 { display: grid; grid-template-columns: 1.3fr 1fr; gap: 16px; margin-bottom: 16px; }
        .ala-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px; }
        @media (max-width: 1100px) { .ala-grid-2, .ala-grid-3 { grid-template-columns: 1fr; } }

        .ala-panel {
          background: var(--lp-surface); border: 1px solid var(--lp-border);
          border-radius: var(--lp-radius-md); box-shadow: var(--lp-shadow-sm);
          padding: 16px;
        }
        .ala-panel-title { font-size: 13px; font-weight: 700; margin-bottom: 12px; }
        .ala-panel-sub { font-size: 11px; color: var(--lp-text-muted); margin-top: -8px; margin-bottom: 12px; }

        /* ── Funnel ── */
        .ala-funnel-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .ala-funnel-label { width: 170px; font-size: 12px; font-weight: 600; flex-shrink: 0; }
        .ala-funnel-track { flex: 1; height: 18px; background: var(--lp-bg); border-radius: 20px; overflow: hidden; }
        .ala-funnel-fill { height: 100%; background: linear-gradient(90deg, var(--lp-primary), var(--lp-accent)); border-radius: 20px; }
        .ala-funnel-count { width: 42px; text-align: right; font-size: 12px; font-weight: 700; flex-shrink: 0; }

        /* ── Tables ── */
        .ala-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
        .ala-table th {
          text-align: left; padding: 8px 10px; background: var(--lp-bg);
          font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.04em;
          color: var(--lp-text-muted); font-weight: 700; border-bottom: 1px solid var(--lp-border);
        }
        .ala-table td { padding: 8px 10px; border-bottom: 1px solid var(--lp-border); }
        .ala-table tr:last-child td { border-bottom: none; }
        .ala-rank-badge {
          display: inline-flex; align-items: center; justify-content: center;
          width: 20px; height: 20px; border-radius: 50%; font-size: 10.5px; font-weight: 800;
          background: var(--lp-primary-soft); color: var(--lp-primary);
        }
        .ala-rank-badge.gold { background: #FFF4D6; color: #B98900; }

        /* ── Recent activity ── */
        .ala-activity-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--lp-border); font-size: 12.5px; }
        .ala-activity-item:last-child { border-bottom: none; }
        .ala-activity-name { font-weight: 700; }
        .ala-activity-sub { font-size: 11px; color: var(--lp-text-muted); }
        .ala-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; white-space: nowrap; }
        .ala-badge.done { background: var(--lp-accent-soft); color: var(--lp-accent); }
        .ala-badge.progress { background: var(--lp-primary-soft); color: var(--lp-primary); }

        .ala-empty { color: var(--lp-text-muted); font-size: 12.5px; padding: 12px 0; }
      `}</style>

      <div style={{ marginBottom: 12 }}>
        <h4 style={{ fontWeight: 700, marginBottom: 2, fontSize: 16 }}>Loan Analytics</h4>
        <p style={{ color: "var(--lp-text-muted)", fontSize: 12.5, marginBottom: 0 }}>
          Overall performance, scheme mix and stage-wise bottlenecks across the BDE loan process.
        </p>
      </div>

      <div className="ala-filters">
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} title="From Date" />
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} title="To Date" />
        <button type="button" className="ala-reset-btn" onClick={loadOverview}>Apply</button>
        <button
          type="button"
          className="ala-reset-btn"
          onClick={() => { clearFilters(); setTimeout(loadOverview, 0); }}
        >
          Reset
        </button>
      </div>

      {loading && !data && <p className="ala-empty">Loading analytics…</p>}

      {data && (
        <>
          {/* ── Summary cards ── */}
          <div className="ala-metrics-grid">
            <div className="ala-metric-card">
              <div className="ala-metric-label">Total Applications</div>
              <div className="ala-metric-value">{data.summary.totalApplications}</div>
            </div>
            <div className="ala-metric-card">
              <div className="ala-metric-label">Total Revenue</div>
              <div className="ala-metric-value">{formatRupee(data.summary.totalRevenue)}</div>
            </div>
            <div className="ala-metric-card">
              <div className="ala-metric-label">Completed Revenue</div>
              <div className="ala-metric-value accent">{formatRupee(data.summary.completedRevenue)}</div>
            </div>
            <div className="ala-metric-card">
              <div className="ala-metric-label">Completed</div>
              <div className="ala-metric-value accent">{data.summary.completedCount}</div>
            </div>
            <div className="ala-metric-card">
              <div className="ala-metric-label">In Progress</div>
              <div className="ala-metric-value primary">{data.summary.inProgressCount}</div>
            </div>
            <div className="ala-metric-card">
              <div className="ala-metric-label">Avg Progress</div>
              <div className="ala-metric-value">{data.summary.avgProgress}%</div>
            </div>
            <div className="ala-metric-card">
              <div className="ala-metric-label">Pending Cases</div>
              <div className="ala-metric-value">{data.summary.pendingCount}</div>
            </div>
          </div>

          {/* ── Monthly trend + Scheme pie ── */}
          <div className="ala-grid-2">
            <div className="ala-panel">
              <div className="ala-panel-title">Monthly Trend</div>
              <div className="ala-panel-sub">Applications & revenue over time</div>
              {data.monthlyTrend.length === 0 ? (
                <div className="ala-empty">No date-wise data yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={data.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EE" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                    />
                    <Tooltip formatter={(v, name) => (name === "Revenue" ? formatRupee(v) : v)} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="applications" name="Applications" fill="#2A3EB1" radius={[6, 6, 0, 0]} barSize={36} />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke="#0F9D80" strokeWidth={2.5} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="ala-panel">
              <div className="ala-panel-title">Scheme-wise Mix</div>
              <div className="ala-panel-sub">PMEGP / UYEGP / AABCS split</div>
              {data.schemeBreakdown.length === 0 ? (
                <div className="ala-empty">No scheme data yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={data.schemeBreakdown}
                      dataKey="applications"
                      nameKey="scheme"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={(d) => `${d.scheme}: ${d.applications}`}
                    >
                      {data.schemeBreakdown.map((entry, i) => (
                        <Cell key={entry.scheme} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Stage-wise funnel ── */}
          <div className="ala-panel" style={{ marginBottom: 16 }}>
            <div className="ala-panel-title">Stage-wise Funnel</div>
            <div className="ala-panel-sub">How many applications have crossed each checklist stage — spot the bottleneck</div>
            {data.funnel.map((stage) => {
              const max = data.summary.totalApplications || 1;
              const pct = Math.round((stage.count / max) * 100);
              return (
                <div className="ala-funnel-row" key={stage.key}>
                  <div className="ala-funnel-label">{stage.label}</div>
                  <div className="ala-funnel-track">
                    <div className="ala-funnel-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="ala-funnel-count">{stage.count}</div>
                </div>
              );
            })}
          </div>

          {/* ── Telecaller leaderboard + Recent activity ── */}
          <div className="ala-grid-2">
            <div className="ala-panel">
              <div className="ala-panel-title">Telecaller Leaderboard</div>
              <div className="ala-panel-sub">Ranked by revenue</div>
              {data.staffBreakdown.length === 0 ? (
                <div className="ala-empty">No telecaller data yet.</div>
              ) : (
                <table className="ala-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Telecaller</th>
                      <th>Applications</th>
                      <th>Revenue</th>
                      <th>Completed</th>
                      <th>Conv. %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.staffBreakdown.map((s, i) => (
                      <tr key={s._id || s.staffName}>
                        <td><span className={`ala-rank-badge ${i === 0 ? "gold" : ""}`}>{i + 1}</span></td>
                        <td style={{ fontWeight: 600 }}>{s.staffName || "Unknown"}</td>
                        <td>{s.applications}</td>
                        <td>{formatRupee(s.revenue)}</td>
                        <td>{s.completedCount}</td>
                        <td>{s.conversionRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="ala-panel">
              <div className="ala-panel-title">Recent Activity</div>
              <div className="ala-panel-sub">Latest updated customer records</div>
              {data.recentActivity.length === 0 ? (
                <div className="ala-empty">No recent activity.</div>
              ) : (
                data.recentActivity.map((c) => (
                  <div className="ala-activity-item" key={c._id}>
                    <div>
                      <div className="ala-activity-name">{c.customerName}</div>
                      <div className="ala-activity-sub">
                        {c.staffName || "—"} · {c.scheme || "No scheme"} ·{" "}
                        {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString("en-IN") : "—"}
                      </div>
                    </div>
                    <span className={`ala-badge ${c.status === "COMPLETED" ? "done" : "progress"}`}>
                      {c.status === "COMPLETED" ? "Completed" : `${c.processPercent ?? 0}%`}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Bank-wise & Business type breakdown ── */}
          <div className="ala-grid-2">
            <div className="ala-panel">
              <div className="ala-panel-title">Bank-wise Distribution</div>
              <div className="ala-panel-sub">Top banks by application count</div>
              {data.bankBreakdown.length === 0 ? (
                <div className="ala-empty">No bank data yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.bankBreakdown} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EE" />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="bankName" tick={{ fontSize: 11 }} width={110} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2A3EB1" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="ala-panel">
              <div className="ala-panel-title">Business Type Distribution</div>
              <div className="ala-panel-sub">Top business types by application count</div>
              {data.businessTypeBreakdown.length === 0 ? (
                <div className="ala-empty">No business type data yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.businessTypeBreakdown} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EE" />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="businessType" tick={{ fontSize: 11 }} width={110} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0F9D80" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Pending reasons ── */}
          {data.pendingReasons.length > 0 && (
            <div className="ala-panel">
              <div className="ala-panel-title">Pending Reasons Summary</div>
              <div className="ala-panel-sub">Why applications are stuck, grouped by reason</div>
              <table className="ala-table">
                <thead>
                  <tr>
                    <th>Reason</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pendingReasons.map((r) => (
                    <tr key={r.reason}>
                      <td>{r.reason}</td>
                      <td>{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}