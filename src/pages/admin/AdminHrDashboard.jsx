import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const BAR_COLORS = ["#4F8CFF", "#41E37A", "#FFB300", "#F472B6", "#A78BFA", "#22D3EE", "#FB923C", "#94A3B8", "#F87171", "#34D399"];

const timeAgo = (d) => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-IN");
};

const fmtDay = (s) => (s ? new Date(s + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "-");

function KpiCard({ title, value, bg, color, sub, to }) {
  const body = (
    <div className="p-3 p-md-4 text-center rounded-4 h-100" style={{ background: bg }}>
      <h6 className="text-muted mb-2" style={{ fontSize: "0.85rem" }}>{title}</h6>
      <h2 className="fw-bold mb-1" style={{ color }}>{value}</h2>
      {sub && <div className="text-secondary" style={{ fontSize: "0.78rem" }}>{sub}</div>}
    </div>
  );
  return to ? <Link to={to} style={{ textDecoration: "none", color: "inherit" }}>{body}</Link> : body;
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

const Empty = ({ text = "No data yet" }) => (
  <div className="text-center text-muted py-4" style={{ fontSize: "0.9rem" }}>{text}</div>
);

function Skeleton() {
  return (
    <div className="placeholder-glow">
      <div className="row g-3 mb-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="col-lg-3 col-md-6">
            <div className="placeholder rounded-4 w-100" style={{ height: 120 }} />
          </div>
        ))}
      </div>
      <div className="placeholder rounded-4 w-100" style={{ height: 280 }} />
    </div>
  );
}

const STATUS_STYLE = {
  draft: { bg: "warning", text: "dark", label: "Draft – approval pending" },
  approved: { bg: "info", text: "dark", label: "Approved – payment pending" },
  paid: { bg: "success", text: "white", label: "Paid" },
};

const MEDALS = ["🥇", "🥈", "🥉"];
const AWARD_LABEL = { spot: "Spot Award", monthly_star: "Star of the Month", innovation: "Innovation Award" };

export default function AdminHrDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin-hr-dashboard/stats`);
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
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) return <Skeleton />;

  if (error && !data) {
    return (
      <div className="alert alert-danger d-flex justify-content-between align-items-center rounded-4">
        <span>⚠️ HR dashboard load aagala: {error}</span>
        <button className="btn btn-sm btn-outline-danger" onClick={load}>Retry</button>
      </div>
    );
  }

  const d = data;
  const att = d.attendance;
  const latest = d.payroll.latest;
  const st = latest ? STATUS_STYLE[latest.status] || STATUS_STYLE.draft : null;

  const payrollChart = d.payrollTrend.map((p) => ({
    label: `${MONTHS[p.month - 1]} ${String(p.year).slice(2)}`,
    "Net Pay": p.total_net_pay || 0,
  }));

  return (
    <>
      <div className="d-flex justify-content-end align-items-center gap-2 mb-3" style={{ fontSize: "0.8rem" }}>
        <span className="text-muted">Updated {timeAgo(d.generatedAt)}</span>
        <button className="btn btn-sm btn-outline-secondary py-0 px-2" onClick={load} disabled={loading}>
          {loading ? "…" : "↻ Refresh"}
        </button>
      </div>

      {error && <div className="alert alert-warning rounded-4 py-2">⚠️ Refresh fail aachu: {error}</div>}

      {/* ================= KPI ROW ================= */}
      <div className="row g-3 mb-4">
        <div className="col-lg-3 col-md-6">
          <KpiCard title="Active Employees" value={d.workforce.active} bg="#EBF5FF" color="#0D6EFD"
            sub={`${d.workforce.hrms} HRMS · ${d.workforce.machine} machine staff`} />
        </div>
        <div className="col-lg-3 col-md-6">
          <KpiCard
            title="Present Today"
            value={att.isHoliday ? "Holiday" : att.present}
            bg="#E8FBF1" color="#198754"
            sub={att.isHoliday ? "Weekend / Holiday" : `${att.presentPct}% of ${att.expected} · ${att.onTime} on time · ${att.late} late${att.halfDay ? ` · ${att.halfDay} half day` : ""}`}
          />
        </div>
        <div className="col-lg-3 col-md-6">
          <KpiCard title="On Leave Today" value={d.leaveOnToday.count} bg="#FEFCE8" color="#CA8A04"
            sub={att.isHoliday ? "" : `${att.absent} absent / not in yet`} />
        </div>
        <div className="col-lg-3 col-md-6">
          <KpiCard title="Pending Leave Requests" value={d.leave.count} bg="#FFF1F0" color="#E5484D" sub="Waiting for approval" />
        </div>

        <div className="col-lg-3 col-md-6">
          <KpiCard
            title="Latest Payroll (Net)"
            value={latest ? inr(latest.total_net_pay) : "—"}
            bg="#F3EEFF" color="#5A2EF9"
            sub={latest ? `${MONTHS[latest.month - 1]} ${latest.year} · ${latest.total_employees} employees` : "No payroll yet"}
          />
        </div>
        <div className="col-lg-3 col-md-6">
          <KpiCard title="Pending Approvals" value={d.workforce.pendingApproval} bg="#FFF6ED" color="#DC3545"
            sub="New employees awaiting admin" to="/admin/pending-approvals" />
        </div>
        <div className="col-lg-3 col-md-6">
          <KpiCard title="Pending Advances" value={d.advances.count} bg="#ECFEFF" color="#0891B2" sub={inr(d.advances.amount)} />
        </div>
        <div className="col-lg-3 col-md-6">
          <KpiCard title="Attrition" value={`${d.workforce.attritionPct}%`} bg="#FFEAF3" color="#DB2777"
            sub={`${d.workforce.exited} exited overall`} />
        </div>
      </div>

      {/* ================= WORKFORCE + ATTENDANCE ================= */}
      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <Panel title="Department Headcount" height={300}>
            {d.departments.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.departments} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="department" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Employees" radius={[0, 6, 6, 0]} maxBarSize={22}>
                    {d.departments.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>
        </div>

        <div className="col-lg-6">
          <Panel title="Attendance – Last 7 Days" height={300}>
            {d.attendanceTrend.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.attendanceTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Present" stackId="a" fill="#34D399" maxBarSize={30} />
                  <Bar dataKey="Leave" stackId="a" fill="#FBBF24" maxBarSize={30} />
                  <Bar dataKey="Absent" stackId="a" fill="#F87171" radius={[6, 6, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>
        </div>
      </div>

      {/* ================= PAYROLL ================= */}
      <div className="row g-4 mb-4">
        <div className="col-lg-7">
          <Panel title="Payroll – Last 6 Months (Net Pay)" height={280}>
            {payrollChart.length === 0 ? <Empty text="No payroll runs yet" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={payrollChart} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v)} />
                  <Tooltip formatter={(v) => inr(v)} />
                  <Bar dataKey="Net Pay" fill="#5A2EF9" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>
        </div>

        <div className="col-lg-5">
          <Panel title="Latest Payroll Run">
            {!latest ? <Empty text="No payroll runs yet" /> : (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="m-0 fw-bold">{MONTHS[latest.month - 1]} {latest.year}</h4>
                  <span className={`badge bg-${st.bg} text-${st.text}`}>{st.label}</span>
                </div>
                <table className="table table-sm mb-0">
                  <tbody>
                    <tr><td className="text-muted">Employees</td><td className="text-end fw-semibold">{latest.total_employees}</td></tr>
                    <tr><td className="text-muted">Total Gross</td><td className="text-end fw-semibold">{inr(latest.total_gross)}</td></tr>
                    <tr><td className="text-muted">Deductions</td><td className="text-end fw-semibold text-danger">- {inr(latest.total_deductions)}</td></tr>
                    <tr><td className="fw-bold">Net Pay</td><td className="text-end fw-bold text-success">{inr(latest.total_net_pay)}</td></tr>
                  </tbody>
                </table>
                {d.payroll.draftCount > 0 && (
                  <div className="alert alert-warning py-2 mt-3 mb-0" style={{ fontSize: "0.85rem" }}>
                    ⚠️ {d.payroll.draftCount} payroll run draft-la irukku, approval pending.
                  </div>
                )}
                {d.payroll.approvedUnpaid > 0 && (
                  <div className="alert alert-info py-2 mt-2 mb-0" style={{ fontSize: "0.85rem" }}>
                    💸 {d.payroll.approvedUnpaid} payroll run approved, innum paid mark aagala.
                  </div>
                )}
              </>
            )}
          </Panel>
        </div>
      </div>

      {/* ================= LEAVE ================= */}
      <div className="row g-4 mb-4">
        <div className="col-lg-4">
          <Panel title={`Pending Leave Requests (${d.leave.count})`}>
            {d.leave.list.length === 0 ? <Empty text="No pending leaves 🎉" /> : (
              <ul className="list-group list-group-flush">
                {d.leave.list.map((l) => (
                  <li key={l._id} className="list-group-item px-0">
                    <div className="d-flex justify-content-between">
                      <span className="fw-semibold">{l.employee_name || "-"}</span>
                      <small className="text-muted">{timeAgo(l.createdAt)}</small>
                    </div>
                    <small className="text-muted">
                      {l.leave_type} · {fmtDay(l.from_date)}{l.to_date !== l.from_date ? ` → ${fmtDay(l.to_date)}` : ""}
                      {l.current_stage === "team_lead" ? " · with Team Lead" : l.current_stage === "hr" ? " · with HR" : ""}
                    </small>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="col-lg-4">
          <Panel title={`On Leave Today (${d.leaveOnToday.count})`}>
            {d.leaveOnToday.list.length === 0 ? <Empty text="Everyone is in 👍" /> : (
              <ul className="list-group list-group-flush">
                {d.leaveOnToday.list.map((l) => (
                  <li key={l._id} className="list-group-item px-0 d-flex justify-content-between">
                    <span>
                      <span className="fw-semibold">{l.employee_name || "-"}</span>
                      <small className="text-muted d-block">{l.department || "-"} · {l.leave_type}{l.is_half_day ? " (half day)" : ""}</small>
                    </span>
                    <small className="text-muted">till {fmtDay(l.to_date)}</small>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="col-lg-4">
          <Panel title="Leave Type Usage (This Year)" height={250}>
            {d.leaveTypes.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.leaveTypes} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="type" width={90} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Approved leaves" fill="#F59E0B" radius={[0, 6, 6, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>
        </div>
      </div>

      {/* ================= PERFORMANCE ================= */}
      <div className="row g-4 mb-4">
        <div className="col-lg-7">
          <Panel
            title="🏆 Top Performers"
            right={d.topPerformers.period && <span className="badge bg-light text-dark border">{d.topPerformers.period}</span>}
          >
            {d.topPerformers.list.length === 0 ? <Empty text="Finalized performance reviews innum illa" /> : (
              <ul className="list-unstyled m-0">
                {d.topPerformers.list.map((p) => (
                  <li key={p.rank} className="d-flex align-items-center gap-3 py-2 border-bottom">
                    <div style={{ width: 36, fontSize: "1.4rem", textAlign: "center" }}>
                      {MEDALS[p.rank - 1] || <span className="text-muted fs-6">#{p.rank}</span>}
                    </div>
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <div className="fw-semibold text-truncate">{p.name}</div>
                      <small className="text-muted text-truncate d-block">
                        {p.department || "-"}{p.designation ? ` · ${p.designation}` : ""}
                      </small>
                    </div>
                    <div className="text-end flex-shrink-0">
                      <div className="fw-bold text-success">{Number(p.score).toFixed(1)}%</div>
                      {p.rating && <small className="text-muted">{p.rating}</small>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="col-lg-5">
          <Panel title="⭐ Recent Awards">
            {d.stars.length === 0 ? <Empty text="No announced awards yet" /> : (
              <ul className="list-unstyled m-0">
                {d.stars.map((s, i) => (
                  <li key={i} className="py-2 border-bottom">
                    <div className="fw-semibold">{s.name}</div>
                    <small className="text-muted">
                      {AWARD_LABEL[s.type] || s.type}{s.period ? ` · ${s.period}` : ""}{s.department ? ` · ${s.department}` : ""}
                    </small>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      {/* ================= JOINERS / EXITS ================= */}
      <div className="row g-4">
        <div className="col-lg-6">
          <Panel title={`Joined This Month (${d.joiners.count})`}>
            {d.joiners.list.length === 0 ? <Empty text="No new joiners this month" /> : (
              <ul className="list-group list-group-flush">
                {d.joiners.list.map((e) => (
                  <li key={e._id} className="list-group-item px-0 d-flex justify-content-between">
                    <span>{e.name} <small className="text-muted">· {e.department || "-"} / {e.designation || "-"}</small></span>
                    <small className="text-muted">{timeAgo(e.createdAt)}</small>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
        <div className="col-lg-6">
          <Panel title={`Exited This Month (${d.exits.count})`}>
            {d.exits.list.length === 0 ? <Empty text="No exits this month 👍" /> : (
              <ul className="list-group list-group-flush">
                {d.exits.list.map((e) => (
                  <li key={e._id} className="list-group-item px-0 d-flex justify-content-between">
                    <span>{e.name} <small className="text-muted">· {e.department || "-"}</small></span>
                    <span className={`badge ${e.exitType === "fired" ? "bg-danger" : "bg-secondary"}`}>{e.exitType || "exited"}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}