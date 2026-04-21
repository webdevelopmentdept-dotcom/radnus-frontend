import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Users, UserCheck, UserX, Clock, Briefcase, FileText,
  TrendingUp, Target, Award, Star, CalendarCheck, BookOpen,
  MessageSquare, ChevronRight, ArrowUpRight, ArrowDownRight,
  CheckCircle, AlertCircle, BarChart2, Activity, Zap, Medal,
  UserPlus, RefreshCw
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import HRLayout from "./HRLayout";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const COLORS = {
  blue:   "#2563eb",
  indigo: "#4f46e5",
  green:  "#16a34a",
  amber:  "#d97706",
  red:    "#dc2626",
  purple: "#7c3aed",
  teal:   "#0d9488",
  sky:    "#0ea5e9",
};

/* ── responsive grid styles ── */
const styles = `
  .hr-grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 32px;
  }
  .hr-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 32px;
  }
  .hr-grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 20px;
    margin-bottom: 32px;
  }
  .hr-grid-6 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 32px;
  }
  .hr-grid-recruit-inner {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 18px;
  }
  .top-performers-table {
    width: 100%;
    border-collapse: collapse;
  }
  .table-wrapper {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .hr-header {
    padding: 14px 32px;
  }
  .hr-main {
    padding: 28px 32px;
    max-width: 1400px;
    margin: 0 auto;
  }
  @media (max-width: 1024px) {
    .hr-grid-4 {
      grid-template-columns: repeat(2, 1fr);
    }
    .hr-grid-6 {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (max-width: 768px) {
    .hr-header {
      padding: 12px 16px;
    }
    .hr-main {
      padding: 16px;
    }
    .hr-grid-4 {
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    .hr-grid-2 {
      grid-template-columns: 1fr;
      gap: 14px;
      margin-bottom: 20px;
    }
    .hr-grid-3 {
      grid-template-columns: 1fr;
      gap: 14px;
      margin-bottom: 20px;
    }
    .hr-grid-6 {
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    .hr-grid-recruit-inner {
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .top-performers-table th:nth-child(4),
    .top-performers-table th:nth-child(5),
    .top-performers-table td:nth-child(4),
    .top-performers-table td:nth-child(5) {
      display: none;
    }
  }
  @media (max-width: 480px) {
    .hr-grid-4 {
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .hr-grid-6 {
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .hr-grid-recruit-inner {
      grid-template-columns: 1fr 1fr;
    }
    .top-performers-table th:nth-child(3),
    .top-performers-table td:nth-child(3) {
      display: none;
    }
  }
`;

/* ── tiny helpers ───────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, sub, color = COLORS.blue, trend }) => (
  <div style={{
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: "16px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    borderTop: `3px solid ${color}`,
    transition: "box-shadow .2s",
    minWidth: 0,
  }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"}
    onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div style={{ background: `${color}15`, borderRadius: 10, padding: 8, flexShrink: 0 }}>
        <Icon size={18} color={color} />
      </div>
      {trend !== undefined && (
        <span style={{
          fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 2,
          color: trend >= 0 ? COLORS.green : COLORS.red
        }}>
          {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2, lineHeight: 1.3 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

const SectionTitle = ({ title, sub }) => (
  <div style={{ marginBottom: 14 }}>
    <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>{title}</h2>
    {sub && <p style={{ fontSize: 12, color: "#9ca3af", margin: "3px 0 0" }}>{sub}</p>}
  </div>
);

const Badge = ({ label, color }) => (
  <span style={{
    fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 99,
    background: `${color}18`, color: color, whiteSpace: "nowrap",
  }}>{label}</span>
);

/* ── custom tooltip ─────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
      <p style={{ margin: 0, fontWeight: 600, color: "#374151" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: "3px 0 0", color: p.color }}>{p.name}: <b>{p.value}</b></p>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export default function HRDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ── state ── */
  const [empStats,      setEmpStats]      = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [deptDist,      setDeptDist]      = useState([]);
  const [recruitment,   setRecruitment]   = useState({ applicants: 0, jobPostings: 0, selected: 0, waiting: 0, rejected: 0 });
  const [attendance,    setAttendance]    = useState({ present: 0, absent: 0, late: 0, onLeave: 0 });
  const [leaveStats,    setLeaveStats]    = useState({ pending: 0, approved: 0, rejected: 0 });
  const [kpiStats,      setKpiStats]      = useState({ templates: 0, assigned: 0, reviewed: 0 });
  const [okrStats,      setOkrStats]      = useState({ total: 0, onTrack: 0, atRisk: 0 });
  const [recognition,   setRecognition]   = useState({ awards: 0, bonuses: 0, nominations: 0 });
  const [feedback360,   setFeedback360]   = useState({ cycles: 0, submissions: 0, pending: 0 });
  const [training,      setTraining]      = useState({ roadmaps: 0, enrolled: 0, completed: 0 });
  const [topEmployees,  setTopEmployees]  = useState([]);

  const [monthlyTrend] = useState([
    { month: "Oct", joined: 8,  left: 2 },
    { month: "Nov", joined: 12, left: 3 },
    { month: "Dec", joined: 6,  left: 4 },
    { month: "Jan", joined: 15, left: 2 },
    { month: "Feb", joined: 10, left: 5 },
    { month: "Mar", joined: 18, left: 3 },
    { month: "Apr", joined: 14, left: 2 },
  ]);

  /* ── safe get helper ── */
  const safeGet = async (url) => {
    try {
      const res = await axios.get(url);
      return res.data;
    } catch (err) {
      console.error(`Error fetching ${url}:`, err.message);
      return null;
    }
  };

  const pick = (d, ...keys) => {
    if (!d) return 0;
    for (const k of keys) {
      const v = d?.[k];
      if (typeof v === "number" && v > 0) return v;
    }
    if (Array.isArray(d)) return d.length;
    if (Array.isArray(d?.data)) return d.data.length;
    return 0;
  };

  /* ── fetch all ── */
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [allEmp, pendingEmp, approvedEmp, rejectedEmp] = await Promise.all([
          safeGet(`${API_BASE}/api/employee/employees`),
          safeGet(`${API_BASE}/api/employee/employees?status=pending`),
          safeGet(`${API_BASE}/api/employee/employees?status=approved`),
          safeGet(`${API_BASE}/api/employee/employees?status=rejected`),
        ]);

        setEmpStats({
          total: pick(allEmp, "total", "length"),
          pending: pick(pendingEmp, "total", "length"),
          approved: pick(approvedEmp, "total", "length"),
          rejected: pick(rejectedEmp, "total", "length"),
        });

        const dept = await safeGet(`${API_BASE}/api/employee/employees/department-distribution`);
        if (dept) setDeptDist(dept?.data || dept || []);

        const [apps, jobs] = await Promise.all([
          safeGet(`${API_BASE}/api/applicants`),
          safeGet(`${API_BASE}/api/jobs`),
        ]);

        setRecruitment({
          applicants: pick(apps, "total", "length"),
          jobPostings: pick(jobs, "total", "length"),
          selected: apps?.selected || 0,
          waiting: apps?.waiting || 0,
          rejected: apps?.rejected || 0,
        });

        const att = await safeGet(`${API_BASE}/api/attendance/today`);
        if (att) {
          const d = att?.data || att;
          setAttendance({
            present: d.present || d.presentCount || 0,
            absent: d.absent || d.absentCount || 0,
            late: d.late || d.lateCount || 0,
            onLeave: d.onLeave || d.leaveCount || 0,
          });
        }

        const leave = await safeGet(`${API_BASE}/api/leave-requests`);
        if (leave) {
          const d = leave?.data || leave;
          setLeaveStats({
            pending: d.pending || 0,
            approved: d.approved || 0,
            rejected: d.rejected || 0
          });
        }

        const [tpl, assigned, reviewed] = await Promise.all([
          safeGet(`${API_BASE}/api/kpi-templates`),
          safeGet(`${API_BASE}/api/kpi-assignments`),
          safeGet(`${API_BASE}/api/performance-reviews`),
        ]);

        setKpiStats({
          templates: pick(tpl, "total", "length"),
          assigned: pick(assigned, "total", "length"),
          reviewed: pick(reviewed, "total", "length"),
        });

        const okr = await safeGet(`${API_BASE}/api/okr-dashboard`);
        if (okr) {
          const d = okr?.data || okr;
          setOkrStats({ total: d.total || 0, onTrack: d.onTrack || 0, atRisk: d.atRisk || 0 });
        }

        const [awd, bon, nom] = await Promise.all([
          safeGet(`${API_BASE}/api/employee-awards`),
          safeGet(`${API_BASE}/api/impact-bonus`),
          safeGet(`${API_BASE}/api/feedback-nominations`),
        ]);

        setRecognition({
          awards: pick(awd, "total", "length"),
          bonuses: pick(bon, "total", "length"),
          nominations: pick(nom, "total", "length"),
        });

        const [cycles, subs] = await Promise.all([
          safeGet(`${API_BASE}/api/feedback-cycles`),
          safeGet(`${API_BASE}/api/feedback-submissions`),
        ]);

        setFeedback360({
          cycles: pick(cycles, "total", "length"),
          submissions: pick(subs, "total", "length"),
          pending: subs?.pending || subs?.data?.filter?.(s => s.status === "pending")?.length || 0,
        });

        const train = await safeGet(`${API_BASE}/api/training/stats`);
        if (train) {
          const d = train?.data || train;
          setTraining({
            roadmaps: pick(train, "total", "length"),
            enrolled: d.enrolled || 0,
            completed: d.completed || 0,
          });
        }

        const top = await safeGet(`${API_BASE}/api/kpi-assignments/top-performers`);
        if (top) setTopEmployees(top?.data || top || []);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please check if the backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  /* ── chart data ── */
  const deptChartData = deptDist.length > 0
    ? deptDist.map(d => ({ name: d.department || d.name, value: d.count || d.total || 0 }))
    : [];

  const recruitPieData = [
    { name: "Selected", value: recruitment.selected },
    { name: "Waiting",  value: recruitment.waiting  },
    { name: "Rejected", value: recruitment.rejected },
  ].filter(d => d.value > 0);

  const attendancePieData = [
    { name: "Present",  value: attendance.present  },
    { name: "Absent",   value: attendance.absent   },
    { name: "Late",     value: attendance.late     },
    { name: "On Leave", value: attendance.onLeave  },
  ].filter(d => d.value > 0);

  const PIE_COLORS_RECRUIT    = [COLORS.green, COLORS.amber, COLORS.red];
  const PIE_COLORS_ATTENDANCE = [COLORS.blue, COLORS.red, COLORS.amber, COLORS.purple];

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <RefreshCw size={32} color={COLORS.blue} style={{ animation: "spin 1s linear infinite" }} />
        <p style={{ color: "#6b7280", marginTop: 12, fontSize: 14 }}>Loading dashboard...</p>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "16px" }}>
      <div style={{ textAlign: "center", padding: "20px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, maxWidth: "400px", width: "100%" }}>
        <AlertCircle size={48} color="#dc2626" />
        <h3 style={{ fontSize: 18, fontWeight: 600, color: "#111827", marginTop: 12, marginBottom: 8 }}>Error Loading Dashboard</h3>
        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 16 }}>{error}</p>
        <div style={{ fontSize: 12, color: "#9ca3af", background: "#f3f4f6", padding: "12px", borderRadius: 6, marginBottom: 16, textAlign: "left" }}>
          <p style={{ margin: "0 0 4px" }}><strong>API Base URL:</strong> {API_BASE}</p>
          <p style={{ margin: "0 0 4px" }}><strong>Check if:</strong></p>
          <ul style={{ marginLeft: "20px", marginTop: 4, marginBottom: 0 }}>
            <li>Backend server is running</li>
            <li>API endpoints are accessible</li>
            <li>CORS is properly configured</li>
          </ul>
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{ background: "#2563eb", color: "white", border: "none", padding: "10px 20px", borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 500 }}
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{styles}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* ── Top Bar ── */}
      <header className="hr-header" style={{
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
        position: "sticky",
        top: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>HR Dashboard</h1>
          <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#6b7280", background: "#f3f4f6", padding: "5px 10px", borderRadius: 8, whiteSpace: "nowrap" }}>
            Live Data
          </span>
          <div style={{
            width: 36, height: 36, background: COLORS.blue, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0,
          }}>H</div>
        </div>
      </header>

      <div className="hr-main">

        {/* ══ SECTION 1 — Employee Stats ══ */}
        <SectionTitle title="Employee Overview" sub="Live headcount & status" />
        <div className="hr-grid-4">
          <StatCard icon={Users}     label="Total Employees" value={empStats.total}    color={COLORS.blue}   trend={5}  />
          <StatCard icon={Clock}     label="Pending"         value={empStats.pending}  color={COLORS.amber}  trend={-2} />
          <StatCard icon={UserCheck} label="Approved"        value={empStats.approved} color={COLORS.green}  trend={8}  />
          <StatCard icon={UserX}     label="Rejected"        value={empStats.rejected} color={COLORS.red}    trend={-1} />
        </div>

        {/* ══ SECTION 2 — Dept Distribution + Monthly Trend ══ */}
        <div className="hr-grid-2">

          {/* Dept bar */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 16px" }}>
            <SectionTitle title="Department Distribution" sub="Headcount per department" />
            {deptChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={deptChartData} layout="vertical" barSize={12}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} width={75} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill={COLORS.blue} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: "40px 0" }}>No department data</p>
            )}
          </div>

          {/* Monthly trend */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 16px" }}>
            <SectionTitle title="Headcount Trend" sub="Joined vs Left (last 7 months)" />
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="gradJoined" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={COLORS.blue}  stopOpacity={0.15} />
                    <stop offset="95%" stopColor={COLORS.blue}  stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradLeft" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={COLORS.red}   stopOpacity={0.15} />
                    <stop offset="95%" stopColor={COLORS.red}   stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="joined" name="Joined" stroke={COLORS.blue} fill="url(#gradJoined)" strokeWidth={2} dot={{ r: 3 }} />
                <Area type="monotone" dataKey="left"   name="Left"   stroke={COLORS.red}  fill="url(#gradLeft)"   strokeWidth={2} dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ══ SECTION 3 — Recruitment + Attendance ══ */}
        <div className="hr-grid-2">

          {/* Recruitment */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 16px" }}>
            <SectionTitle title="Recruitment Overview" sub="Applicants & postings" />
            <div className="hr-grid-recruit-inner">
              {[
                { label: "Total Applicants", value: recruitment.applicants,  color: COLORS.blue,   icon: UserPlus   },
                { label: "Job Postings",      value: recruitment.jobPostings, color: COLORS.indigo, icon: Briefcase  },
                { label: "Selected",          value: recruitment.selected,    color: COLORS.green,  icon: CheckCircle },
                { label: "Waiting",           value: recruitment.waiting,     color: COLORS.amber,  icon: AlertCircle },
              ].map((s, i) => (
                <div key={i} style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                  <s.icon size={16} color={s.color} style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af", lineHeight: 1.3 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
            {recruitPieData.length > 0 && (
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={recruitPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                    {recruitPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS_RECRUIT[i % PIE_COLORS_RECRUIT.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Attendance */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 16px" }}>
            <SectionTitle title="Today's Attendance" sub="Real-time attendance snapshot" />
            <div className="hr-grid-recruit-inner">
              {[
                { label: "Present",  value: attendance.present,  color: COLORS.blue,   icon: CheckCircle  },
                { label: "Absent",   value: attendance.absent,   color: COLORS.red,    icon: UserX        },
                { label: "Late",     value: attendance.late,     color: COLORS.amber,  icon: Clock        },
                { label: "On Leave", value: attendance.onLeave,  color: COLORS.purple, icon: CalendarCheck },
              ].map((s, i) => (
                <div key={i} style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                  <s.icon size={16} color={s.color} style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af", lineHeight: 1.3 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
            {attendancePieData.length > 0 && (
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={attendancePieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                    {attendancePieData.map((_, i) => <Cell key={i} fill={PIE_COLORS_ATTENDANCE[i % PIE_COLORS_ATTENDANCE.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ══ SECTION 4 — KPI + OKR ══ */}
        <SectionTitle title="Performance Overview" sub="KPI & OKR summary" />
        <div className="hr-grid-6">
          <StatCard icon={Target}      label="KPI Templates" value={kpiStats.templates} color={COLORS.indigo} />
          <StatCard icon={BarChart2}   label="KPIs Assigned" value={kpiStats.assigned}  color={COLORS.blue}   />
          <StatCard icon={Activity}    label="KPIs Reviewed" value={kpiStats.reviewed}  color={COLORS.teal}   />
          <StatCard icon={Zap}         label="Total OKRs"    value={okrStats.total}     color={COLORS.sky}    />
          <StatCard icon={CheckCircle} label="On Track"      value={okrStats.onTrack}   color={COLORS.green}  />
          <StatCard icon={AlertCircle} label="At Risk"       value={okrStats.atRisk}    color={COLORS.amber}  />
        </div>

        {/* ══ SECTION 5 — Recognition + 360 Feedback + Training ══ */}
        <div className="hr-grid-3">

          {/* Recognition */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 16px" }}>
            <SectionTitle title="Recognition" sub="Awards & bonuses" />
            {[
              { label: "Awards Given",  value: recognition.awards,      icon: Award,         color: COLORS.amber  },
              { label: "Impact Bonus",  value: recognition.bonuses,     icon: Star,          color: COLORS.blue   },
              { label: "Nominations",   value: recognition.nominations, icon: Medal,         color: COLORS.purple },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: i < 2 ? "1px solid #f3f4f6" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div style={{ background: `${r.color}15`, padding: 7, borderRadius: 8, flexShrink: 0 }}>
                    <r.icon size={15} color={r.color} />
                  </div>
                  <span style={{ fontSize: 13, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
                </div>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#111827", flexShrink: 0, marginLeft: 8 }}>{r.value}</span>
              </div>
            ))}
          </div>

          {/* 360 Feedback */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 16px" }}>
            <SectionTitle title="360° Feedback" sub="Cycle & submission stats" />
            {[
              { label: "Active Cycles",  value: feedback360.cycles,      icon: RefreshCw,     color: COLORS.teal   },
              { label: "Submissions",    value: feedback360.submissions, icon: MessageSquare, color: COLORS.blue   },
              { label: "Pending",        value: feedback360.pending,     icon: Clock,         color: COLORS.amber  },
            ].map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: i < 2 ? "1px solid #f3f4f6" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div style={{ background: `${f.color}15`, padding: 7, borderRadius: 8, flexShrink: 0 }}>
                    <f.icon size={15} color={f.color} />
                  </div>
                  <span style={{ fontSize: 13, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.label}</span>
                </div>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#111827", flexShrink: 0, marginLeft: 8 }}>{f.value}</span>
              </div>
            ))}
          </div>

          {/* Training */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 16px" }}>
            <SectionTitle title="Training" sub="Roadmap & completion" />
            {[
              { label: "Roadmaps",   value: training.roadmaps,  icon: BookOpen,    color: COLORS.indigo },
              { label: "Enrolled",   value: training.enrolled,  icon: Users,       color: COLORS.blue   },
              { label: "Completed",  value: training.completed, icon: CheckCircle, color: COLORS.green  },
            ].map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: i < 2 ? "1px solid #f3f4f6" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div style={{ background: `${t.color}15`, padding: 7, borderRadius: 8, flexShrink: 0 }}>
                    <t.icon size={15} color={t.color} />
                  </div>
                  <span style={{ fontSize: 13, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.label}</span>
                </div>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#111827", flexShrink: 0, marginLeft: 8 }}>{t.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ══ SECTION 6 — Top Performers ══ */}
        <SectionTitle title="Top Performers" sub="Highest KPI scorers across all departments" />
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", marginBottom: 32 }}>
          {topEmployees.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af", fontSize: 13 }}>
              <TrendingUp size={36} color="#e5e7eb" style={{ display: "block", margin: "0 auto 10px" }} />
              No top performer data available
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="top-performers-table">
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                    {["Rank", "Employee", "Department", "KPI Score", "OKR Progress", "Status"].map(h => (
                      <th key={h} style={{ padding: "11px 14px", fontSize: 11, fontWeight: 600, color: "#6b7280", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topEmployees.map((emp, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f3f4f6", transition: "background .15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{
                          width: 26, height: 26, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center",
                          background: i === 0 ? "#fef3c7" : i === 1 ? "#f3f4f6" : i === 2 ? "#fde8d8" : "#f3f4f6",
                          color: i === 0 ? "#d97706" : i === 1 ? "#374151" : i === 2 ? "#b45309" : "#374151",
                          fontSize: 11, fontWeight: 700, flexShrink: 0,
                        }}>{i + 1}</span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: "50%", background: COLORS.blue,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#fff", fontWeight: 700, fontSize: 12, flexShrink: 0,
                          }}>
                            {(emp.name || emp.employeeName || "?").charAt(0).toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 }}>{emp.name || emp.employeeName || "—"}</div>
                            <div style={{ fontSize: 10, color: "#9ca3af", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 }}>{emp.designation || emp.role || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "#374151", whiteSpace: "nowrap" }}>{emp.department || "—"}</td>
                      <td style={{ padding: "12px 14px", minWidth: 100 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ flex: 1, height: 5, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
                            <div style={{ width: `${emp.kpiScore || 0}%`, height: "100%", background: COLORS.blue, borderRadius: 99 }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#374151", minWidth: 30 }}>{emp.kpiScore || 0}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px", minWidth: 100 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ flex: 1, height: 5, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
                            <div style={{ width: `${emp.okrProgress || 0}%`, height: "100%", background: COLORS.green, borderRadius: 99 }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#374151", minWidth: 30 }}>{emp.okrProgress || 0}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <Badge
                          label={emp.status || "Active"}
                          color={emp.status === "Excellent" ? COLORS.green : emp.status === "Good" ? COLORS.blue : COLORS.amber}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}