import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import AdminHrDashboard from "./AdminHrDashboard";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const RANGES = [
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "90d", label: "90 Days" },
  { key: "year", label: "This Year" },
  { key: "all", label: "All Time" },
];

const LOAN_MODES = [
  { key: "", label: "All" },
  { key: "bde", label: "BDE" },
  { key: "marketing", label: "Marketing" },
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const PIE_COLORS = ["#4F8CFF", "#41E37A", "#FFB300", "#F472B6", "#A78BFA", "#22D3EE", "#FB923C", "#94A3B8"];
const FUNNEL = [
  { key: "PENDING", label: "Pending", color: "#FBBF24" },
  { key: "CONTACTED", label: "Contacted", color: "#60A5FA" },
  { key: "CONVERTED", label: "Converted", color: "#34D399" },
  { key: "REJECTED", label: "Rejected", color: "#F87171" },
];

const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

// Big loan values -> Crore / Lakh so cards don't overflow
const inrShort = (n) => {
  const v = Number(n || 0);
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(2)} L`;
  return inr(v);
};

const timeAgo = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-IN");
};

/* ---------- small UI pieces ---------- */
function Trend({ current, previous }) {
  if (previous === null || previous === undefined) return null;
  if (previous === 0) {
    return current > 0 ? <small className="text-success fw-semibold">▲ new</small> : null;
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return <small className="text-muted">— no change</small>;
  return (
    <small className={`fw-semibold ${pct > 0 ? "text-success" : "text-danger"}`}>
      {pct > 0 ? "▲" : "▼"} {Math.abs(pct)}% vs previous
    </small>
  );
}

function KpiCard({ title, value, bg, color, sub, trend, to }) {
  const body = (
    <div className="p-3 p-md-4 text-center rounded-4 h-100" style={{ background: bg }}>
      <h6 className="text-muted mb-2" style={{ fontSize: "0.85rem" }}>{title}</h6>
      <h2 className="fw-bold mb-1" style={{ color }}>{value}</h2>
      {sub && <div className="text-secondary" style={{ fontSize: "0.78rem" }}>{sub}</div>}
      {trend}
    </div>
  );
  return to ? (
    <Link to={to} style={{ textDecoration: "none", color: "inherit" }}>{body}</Link>
  ) : body;
}

function Panel({ title, children, right, height }) {
  return (
    <div className="card shadow-lg border-0 rounded-4 p-4 h-100">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold text-secondary m-0">{title}</h5>
        {right}
      </div>
      <div style={height ? { height } : undefined}>{children}</div>
    </div>
  );
}

function SectionTitle({ icon, title, sub, right, to }) {
  return (
    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3 mt-2">
      <div>
        <h4 className="fw-bold m-0" style={{ color: "#1f2937" }}>{icon} {title}</h4>
        {sub && <small className="text-muted">{sub}</small>}
      </div>
      <div className="d-flex align-items-center gap-2">
        {right}
        {to && <Link to={to} className="btn btn-sm btn-outline-primary rounded-pill">View all →</Link>}
      </div>
    </div>
  );
}

const Empty = ({ text = "No data yet" }) => (
  <div className="text-center text-muted py-4" style={{ fontSize: "0.9rem" }}>{text}</div>
);

function Skeleton() {
  return (
    <div className="container mt-4 pb-5">
      <div className="placeholder-glow">
        <div className="placeholder rounded-4 w-100 mb-4" style={{ height: 110 }} />
        <div className="row g-3 mb-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="col-lg-3 col-md-6">
              <div className="placeholder rounded-4 w-100" style={{ height: 120 }} />
            </div>
          ))}
        </div>
        <div className="placeholder rounded-4 w-100" style={{ height: 280 }} />
      </div>
    </div>
  );
}

const ACTIVITY = {
  applicant: { icon: "bi-person-plus-fill", color: "#FF7A59", label: "New applicant" },
  lead: { icon: "bi-clipboard-data-fill", color: "#F59E0B", label: "New lead" },
  partner: { icon: "bi-person-badge-fill", color: "#3B82F6", label: "New partner" },
  shop: { icon: "bi-shop-window", color: "#10B981", label: "Shop owner" },
  technician: { icon: "bi-person-workspace", color: "#8B5CF6", label: "Technician" },
};

/* ================= OVERVIEW TAB ================= */
function OverviewTab() {
  const [range, setRange] = useState("all");
  const [year, setYear] = useState(new Date().getFullYear());
  const [loanMode, setLoanMode] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const q = new URLSearchParams({ range, year: String(year) });
      if (loanMode) q.set("mode", loanMode);
      const res = await fetch(`${API_BASE}/api/admin-dashboard/stats?${q.toString()}`);
      if (res.status === 401 || res.status === 403) {
        window.location.replace("/login");
        return;
      }
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to load");
      setData(json);
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [range, year, loanMode]);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) return <Skeleton />;

  if (error && !data) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger d-flex justify-content-between align-items-center rounded-4">
          <span>⚠️ Failed to load dashboard: {error}</span>
          <button className="btn btn-sm btn-outline-danger" onClick={load}>Retry</button>
        </div>
      </div>
    );
  }

  const d = data;
  const L = d.loanDetail;
  const leadsTotal = d.leads.current; // leads inside selected range
  const converted = d.leadStatus.CONVERTED;
  const conversion = leadsTotal ? Math.round((converted / leadsTotal) * 100) : 0;

  const monthlyChart = MONTHS.map((m, i) => ({
    month: m,
    Leads: d.monthlyLeads[i] || 0,
    Applicants: d.monthlyApplicants[i] || 0,
  }));

  const funnelData = FUNNEL.map((f) => ({ ...f, count: d.leadStatus[f.key] || 0 }));
  const years = [0, 1, 2, 3].map((i) => new Date().getFullYear() - i);
  const rangeText = range === "all" ? "All time" : (RANGES.find((r) => r.key === range)?.label || "");
  const tech = d.technicians;
  const shop = d.shopOwners;

  return (
    <div className="container mt-4 pb-5">
      {/* ================= HEADER ================= */}
      <div
        className="p-4 mb-4 rounded-4 shadow-lg d-flex flex-column flex-md-row gap-3 justify-content-between align-items-start align-items-md-center"
        style={{ background: "linear-gradient(135deg, #ffffff 40%, #5A2EF9 40%)", border: "1px solid #eee" }}
      >
        <div className="d-flex align-items-center">
          <div
            style={{
              width: 60, height: 60, borderRadius: 14, background: "#5A2EF9",
              display: "flex", alignItems: "center", justifyContent: "center", marginRight: 14,
            }}
          >
            <img src="https://img.icons8.com/fluency/48/combo-chart.png" alt="" style={{ width: 34 }} />
          </div>
          <div>
            <h2 className="fw-bold m-0 text-dark">Admin Dashboard</h2>
            <p className="m-0 text-secondary">Premium Analytics Panel</p>
          </div>
        </div>

        <div className="d-flex flex-column align-items-md-end gap-2">
          <div style={{ maxWidth: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <div className="btn-group btn-group-sm" style={{ flexWrap: "nowrap", whiteSpace: "nowrap" }}>
            {RANGES.map((r) => (
              <button
                key={r.key}
                className={`btn ${range === r.key ? "btn-light fw-bold" : "btn-outline-light"}`}
                onClick={() => setRange(r.key)}
              >
                {r.label}
              </button>
            ))}
          </div>
          </div>
          <div className="d-flex align-items-center gap-2 text-white" style={{ fontSize: "0.78rem" }}>
            <span>Updated {timeAgo(d.generatedAt)}</span>
            <button className="btn btn-sm btn-light py-0 px-2" onClick={load} disabled={loading}>
              {loading ? "…" : "↻ Refresh"}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-warning rounded-4 py-2">⚠️ Refresh failed: {error}</div>}

      {/* =====================================================
          1. LOAN  (most important)
      ===================================================== */}
      <SectionTitle
        icon="💰"
        title="Loan Process"
        sub={`${rangeText} · "Pending" cards are always live (all-time)`}
        to="/admin/loan-analytics"
        right={
          <div className="btn-group btn-group-sm">
            {LOAN_MODES.map((m) => (
              <button
                key={m.key || "all"}
                className={`btn ${loanMode === m.key ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setLoanMode(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>
        }
      />

      {!L ? (
        <div className="alert alert-warning rounded-4">Failed to load loan data. Please check the backend console for errors.</div>
      ) : (
        <>
          <div className="row g-3 mb-4">
            <div className="col-lg-3 col-md-6">
              <KpiCard title="Total Loan Applications" value={L.total} bg="#ECFEFF" color="#0891B2"
                sub={`Loan value ${inrShort(L.value)}`}
                trend={<Trend current={L.total} previous={L.totalPrev} />}
                to="/admin/loan-analytics" />
            </div>
            <div className="col-lg-3 col-md-6">
              <KpiCard title="Completed" value={L.completed} bg="#E8FBF1" color="#198754"
                sub={`${inrShort(L.completedValue)} · ${L.total ? Math.round((L.completed / L.total) * 100) : 0}% of total`}
                to="/admin/loan-process" />
            </div>
            <div className="col-lg-3 col-md-6">
              <KpiCard title="Document Payment Collected" value={inr(L.docCollected)} bg="#F3EEFF" color="#5A2EF9"
                sub={`${L.docPaidCount} customers paid · ${inr(L.docCollectedThisMonth)} this month`}
                trend={<Trend current={L.docCollected} previous={L.docCollectedPrev} />} />
            </div>
            <div className="col-lg-3 col-md-6">
              <KpiCard title="Document Payment Pending" value={L.docPendingCount} bg="#FFF1F0" color="#E5484D"
                sub="Live · customers who haven't reached the payment stage yet" to="/admin/loan-process" />
            </div>

            <div className="col-lg-3 col-md-6">
              <KpiCard title="In Progress" value={L.inProgress} bg="#FEFCE8" color="#CA8A04"
                sub={`Avg progress ${L.avgProgress}%`} />
            </div>
            <div className="col-lg-3 col-md-6">
              <KpiCard title="Pending (with reason)" value={L.pendingWithReason} bg="#FFF6ED" color="#DC3545"
                sub="Live · a pending reason has been marked" />
            </div>
            <div className="col-lg-3 col-md-6">
              <KpiCard title="Follow-up Pending" value={L.followupPending} bg="#EBF5FF" color="#0D6EFD"
                sub={`Live · ${L.sanctioned} sanctioned (${rangeText}) · ${inrShort(L.sanctionedValue)}`} />
            </div>
            <div className="col-lg-3 col-md-6">
              <KpiCard title="Incentive to Pay" value={L.incentiveCount} bg="#FFEAF3" color="#DB2777"
                sub={`Live · ${inr(L.incentiveAmount)} eligible for processing`} to="/admin/loan-analytics" />
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-lg-7">
              <Panel title={`Process Stage Funnel · ${rangeText}`} height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={L.funnel} layout="vertical" margin={{ top: 5, right: 25, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="label" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Customers crossed" radius={[0, 6, 6, 0]} maxBarSize={20}>
                      {L.funnel.map((f, i) => (
                        <Cell key={f.key} fill={f.key === "documentPayment" ? "#5A2EF9" : f.key === "completed" ? "#34D399" : "#60A5FA"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            </div>

            <div className="col-lg-5">
              <Panel title="Document Payment – Last 6 Months" height={300}>
                {L.docMonthly.length === 0 ? <Empty text="No payment date records" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={L.docMonthly} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${v / 1000}k` : v)} />
                      <Tooltip formatter={(v, n) => (n === "amount" ? inr(v) : v)} />
                      <Bar dataKey="amount" name="amount" fill="#5A2EF9" radius={[6, 6, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Panel>
            </div>
          </div>

          <div className="row g-4 mb-5">
            <div className="col-lg-4">
              <Panel title={`Scheme Wise · ${rangeText}`} height={260}>
                {L.schemes.length === 0 ? <Empty /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={L.schemes} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="scheme" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Applications" fill="#0891B2" radius={[6, 6, 0, 0]} maxBarSize={26} />
                      <Bar dataKey="completed" name="Completed" fill="#34D399" radius={[6, 6, 0, 0]} maxBarSize={26} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Panel>
            </div>

            <div className="col-lg-4">
              <Panel title={`Top Staff · ${rangeText}`}>
                {L.staff.length === 0 ? <Empty /> : (
                  <div className="table-responsive">
                    <table className="table table-sm align-middle mb-0">
                      <thead>
                        <tr className="text-muted" style={{ fontSize: "0.78rem" }}>
                          <th>#</th><th>Staff</th><th className="text-end">Total</th><th className="text-end">Done</th><th className="text-end">Doc ₹</th>
                        </tr>
                      </thead>
                      <tbody>
                        {L.staff.map((s, i) => (
                          <tr key={i}>
                            <td>{i + 1}</td>
                            <td className="fw-semibold">{s.name}</td>
                            <td className="text-end">{s.total}</td>
                            <td className="text-end text-success fw-semibold">{s.completed}</td>
                            <td className="text-end">{inrShort(s.docCollected)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>
            </div>

            <div className="col-lg-4">
              <Panel title="Why Loans Are Pending (live)">
                {L.reasons.length === 0 ? <Empty text="No pending reasons 👍" /> : (
                  <ul className="list-group list-group-flush">
                    {L.reasons.map((r, i) => (
                      <li key={i} className="list-group-item px-0 d-flex justify-content-between align-items-start gap-2">
                        <span style={{ fontSize: "0.88rem" }}>{r.reason}</span>
                        <span className="badge bg-danger rounded-pill">{r.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>
          </div>
        </>
      )}

      {/* =====================================================
          2. RADNUS CONNECT  (Technician first)
      ===================================================== */}
      <SectionTitle icon="🛠️" title="Radnus Connect" sub={`Technicians & Shop Owners registered · ${rangeText}`} />

      <div className="row g-3 mb-5">
        <div className="col-lg-3 col-md-6">
          <KpiCard title={range === "all" ? "Total Technicians" : "New Technicians"} value={tech.total} bg="#F3EEFF" color="#8B5CF6"
            sub={`${tech.New} new · ${tech.Available} available`}
            trend={<Trend current={tech.total} previous={tech.previous} />}
            to="/admin/radnus-connect/technicians" />
        </div>
        <div className="col-lg-3 col-md-6">
          <KpiCard title="Interview / Hired" value={`${tech.Interview} / ${tech.Hired}`} bg="#E8FBF1" color="#198754"
            sub="Technician pipeline" to="/admin/radnus-connect/technicians" />
        </div>
        <div className="col-lg-3 col-md-6">
          <KpiCard title={range === "all" ? "Total Shop Owners" : "New Shop Owners"} value={shop.total} bg="#ECFEFF" color="#0891B2"
            sub={`${shop.Pending} pending · ${shop.Open} open`}
            trend={<Trend current={shop.total} previous={shop.previous} />}
            to="/admin/radnus-connect/shop-owners" />
        </div>
        <div className="col-lg-3 col-md-6">
          <KpiCard title="Jobs In Process / Done" value={`${shop["In Process"]} / ${shop.Completed}`} bg="#FFF6ED" color="#EA580C"
            sub="Shop owner requirements" to="/admin/radnus-connect/shop-owners" />
        </div>
      </div>

      {/* =====================================================
          3. APPLICANTS (Training)
      ===================================================== */}
      <SectionTitle icon="🎓" title="Training Applicants" sub={rangeText} to="/admin/applicants" />

      <div className="row g-3 mb-3">
        <div className="col-lg-4 col-md-6">
          <KpiCard title={range === "all" ? "Total Applicants" : "New Applicants"} value={d.applicants.current} bg="#FFF6ED" color="#DC3545"
            sub={range === "all" ? "All time" : `${d.applicants.total} total overall`}
            trend={<Trend current={d.applicants.current} previous={d.applicants.previous} />}
            to="/admin/applicants" />
        </div>
        <div className="col-lg-8 col-md-6">
          <Panel title={`Course Distribution · ${rangeText}`} height={170}>
            {d.courses.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={d.courses} dataKey="count" nameKey="course" innerRadius={32} outerRadius={62}
                    paddingAngle={3} cornerRadius={4} cx="30%">
                    {d.courses.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" iconSize={9}
                    wrapperStyle={{ fontSize: "0.75rem" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Panel>
        </div>
      </div>

      <div className="mb-5">
        <Panel
          title="Monthly Applicants & Leads"
          height={260}
          right={
            <select className="form-select form-select-sm w-auto" value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyChart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Applicants" fill="#FF7A59" radius={[6, 6, 0, 0]} maxBarSize={22} />
              <Bar dataKey="Leads" fill="#3B82F6" radius={[6, 6, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* =====================================================
          4. CHANNEL PARTNER (last)
      ===================================================== */}
      <SectionTitle icon="🤝" title="Channel Partners" sub={rangeText} to="/admin/partners" />

      <div className="row g-3 mb-3">
        <div className="col-lg-3 col-md-6">
          <KpiCard title={range === "all" ? "Channel Partners" : "New Partners"} value={d.partners.current} bg="#EBF5FF" color="#0D6EFD"
            sub={`${d.partners.total} total · ${d.partners.total - d.partners.disabled} active · ${d.partners.disabled} disabled`}
            trend={<Trend current={d.partners.current} previous={d.partners.previous} />}
            to="/admin/partners" />
        </div>
        <div className="col-lg-3 col-md-6">
          <KpiCard title={range === "all" ? "Total Leads" : "New Leads"} value={leadsTotal} bg="#FFEAF3" color="#FFC107"
            sub={range === "all" ? "All time" : `${d.leads.total} total overall`}
            trend={<Trend current={d.leads.current} previous={d.leads.previous} />} to="/admin/leads" />
        </div>
        <div className="col-lg-3 col-md-6">
          <KpiCard title="Converted Leads" value={converted} bg="#E8FBF1" color="#198754"
            sub={`Conversion ${conversion}%`} to="/admin/leads" />
        </div>
        <div className="col-lg-3 col-md-6">
          <KpiCard title="Advance Collected" value={inr(d.advanceCollected.current)} bg="#F3EEFF" color="#5A2EF9"
            sub={`From partner leads · ${rangeText}`}
            trend={<Trend current={d.advanceCollected.current} previous={d.advanceCollected.previous} />}
            to="/admin/advance-records" />
        </div>
      </div>

      <div className="row g-4 mb-5">
        <div className="col-lg-4">
          <Panel title={`Lead Status · ${rangeText}`} height={240}>
            {leadsTotal === 0 ? <Empty text="No leads yet" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="label" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={24}>
                    {funnelData.map((f) => <Cell key={f.key} fill={f.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>
        </div>

        <div className="col-lg-4">
          <Panel title={`Top 5 Partners · ${rangeText}`}>
            {d.topPartners.length === 0 ? <Empty text="No partner leads yet" /> : (
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0">
                  <thead>
                    <tr className="text-muted" style={{ fontSize: "0.78rem" }}>
                      <th>#</th><th>Partner</th><th className="text-end">Leads</th><th className="text-end">Advance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.topPartners.map((p, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td className="fw-semibold">{p.name}</td>
                        <td className="text-end">{p.leads}</td>
                        <td className="text-end">{inr(p.advance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>

        <div className="col-lg-4">
          <Panel title={`Leads Pending 3+ Days (${d.staleLeads.count}) · live`}>
            {d.staleLeads.list.length === 0 ? <Empty text="No stale leads 👍" /> : (
              <ul className="list-group list-group-flush">
                {d.staleLeads.list.map((l) => (
                  <li key={l._id} className="list-group-item px-0 d-flex justify-content-between">
                    <span style={{ fontSize: "0.88rem" }}>{l.name} <small className="text-muted">· {l.partnerName}</small></span>
                    <small className="text-muted">{timeAgo(l.createdAt)}</small>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      {/* =====================================================
          5. ATTENTION + ACTIVITY
      ===================================================== */}
      <div className="row g-4">
        <div className="col-lg-6">
          <Panel title="Needs Your Attention">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-semibold">
                Employee approvals <span className="badge bg-danger ms-1">{d.pendingApprovals.count}</span>
              </span>
              <Link to="/admin/pending-approvals" style={{ fontSize: "0.8rem" }}>View all →</Link>
            </div>
            {d.pendingApprovals.list.length === 0 ? <Empty text="All clear 🎉" /> : (
              <ul className="list-group list-group-flush mb-3">
                {d.pendingApprovals.list.map((e) => (
                  <li key={e._id} className="list-group-item px-0 d-flex justify-content-between">
                    <span>{e.name} <small className="text-muted">· {e.department || "-"} / {e.designation || "-"}</small></span>
                    <small className="text-muted">{timeAgo(e.createdAt)}</small>
                  </li>
                ))}
              </ul>
            )}
            <div className="row g-2 mt-1">
              <div className="col-6">
                <div className="p-2 rounded-3 text-center" style={{ background: "#F1F5F9" }}>
                  <div className="fw-bold text-dark">{d.advances.count}</div>
                  <small className="text-muted">Pending emp. advances ({inr(d.advances.amount)})</small>
                </div>
              </div>
              <div className="col-6">
                <div className="p-2 rounded-3 text-center" style={{ background: "#F1F5F9" }}>
                  <div className="fw-bold text-dark">{d.employees.active}</div>
                  <small className="text-muted">Active employees</small>
                </div>
              </div>
            </div>
          </Panel>
        </div>

        <div className="col-lg-6">
          <Panel title="Recent Activity">
            {d.recent.length === 0 ? <Empty text="No activity yet" /> : (
              <ul className="list-unstyled m-0">
                {d.recent.map((r, i) => {
                  const a = ACTIVITY[r.type] || ACTIVITY.applicant;
                  return (
                    <li key={i} className="d-flex align-items-center gap-3 py-2 border-bottom">
                      <div
                        className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                        style={{ width: 36, height: 36, background: a.color + "22", color: a.color }}
                      >
                        <i className={`bi ${a.icon}`} />
                      </div>
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div className="fw-semibold text-truncate">{r.title || "-"}</div>
                        <small className="text-muted text-truncate d-block">
                          {a.label}{r.sub ? ` · ${r.sub}` : ""}
                        </small>
                      </div>
                      <small className="text-muted flex-shrink-0">{timeAgo(r.at)}</small>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ================= WRAPPER WITH TABS ================= */
export default function AdminDashboard() {
  const role = localStorage.getItem("admin-role");
  const canSeeHr = role !== "employee";
  const [tab, setTab] = useState("overview");

  return (
    <div>
      {canSeeHr && (
        <div className="container mt-4 mb-0">
          <ul className="nav nav-pills gap-2">
            {[
              { key: "overview", label: "📊 Overview" },
              { key: "hr", label: "👥 HR" },
            ].map((t) => (
              <li className="nav-item" key={t.key}>
                <button
                  className={`nav-link ${tab === t.key ? "active" : "bg-white text-dark border"}`}
                  onClick={() => setTab(t.key)}
                  style={tab === t.key ? { background: "#5A2EF9" } : undefined}
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "overview" || !canSeeHr ? (
        <OverviewTab />
      ) : (
        <div className="container mt-4 pb-5">
          <AdminHrDashboard />
        </div>
      )}
    </div>
  );
}