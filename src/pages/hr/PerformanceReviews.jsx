import { useState, useEffect } from "react";
import axios from "axios";
import {
  Calendar, ClipboardList, Clock, CheckCircle2, PartyPopper,
  Inbox, BarChart2, MousePointerClick, Filter, User, CheckCheck
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const getRatingInfo = (score) => {
  if (score >= 90) return { label: "Outstanding",           color: "#16a34a", bg: "#f0fdf4" };
  if (score >= 75) return { label: "Exceeds Expectations",  color: "#2563eb", bg: "#eff6ff" };
  if (score >= 60) return { label: "Meets Expectations",    color: "#d97706", bg: "#fffbeb" };
  if (score >= 45) return { label: "Needs Improvement",     color: "#ea580c", bg: "#fff7ed" };
  return             { label: "Unsatisfactory",             color: "#dc2626", bg: "#fef2f2" };
};

const getProgressColor = (pct) => {
  if (pct >= 100) return "#16a34a";
  if (pct >= 75)  return "#2563eb";
  if (pct >= 50)  return "#d97706";
  return "#dc2626";
};

const STYLES = `
  .pr-page { padding: 28px 32px; }
  .pr-stats { grid-template-columns: repeat(3, 1fr); }
  .pr-tabs { width: fit-content; }
  .pr-tab-btn { padding: 8px 18px; font-size: 13px; }
  .pr-logs-layout { grid-template-columns: 1fr 300px; }
  .pr-logs-filter-grid { grid-template-columns: 2fr 1fr 1fr; }
  .pr-logs-sidebar { display: flex; }
  .pr-table-wrap { display: block !important; }
  .pr-card-list { display: none !important; }
  .pr-kpi-grid { grid-template-columns: 1fr 1fr; }
  .pr-modal-header-right { flex-direction: row; align-items: center; gap: 12px; }
  .pr-modal-footer { flex-direction: row; justify-content: flex-end; }
  .pr-modal-footer button { width: auto; }

  @media (max-width: 768px) {
    .pr-page { padding: 16px !important; }
    .pr-stats { grid-template-columns: 1fr 1fr !important; }
    .pr-tabs { width: 100% !important; overflow-x: auto; display: flex !important; flex-wrap: nowrap !important; }
    .pr-tab-btn { white-space: nowrap; font-size: 12px !important; padding: 7px 12px !important; }
    .pr-table-wrap { display: none !important; }
    .pr-card-list { display: flex !important; flex-direction: column; gap: 12px; padding: 12px 16px; }
    .pr-logs-layout { grid-template-columns: 1fr !important; }
    .pr-logs-filter-grid { grid-template-columns: 1fr !important; }
    .pr-logs-sidebar { flex-direction: column; }
    .pr-kpi-grid { grid-template-columns: 1fr !important; }
    .pr-modal-header-right { flex-direction: row; gap: 8px !important; }
    .pr-modal-footer { flex-direction: column !important; gap: 10px !important; }
    .pr-modal-footer button { width: 100% !important; }
    .pr-log-entry { flex-direction: column !important; align-items: flex-start !important; gap: 6px !important; }
  }

  @media (max-width: 480px) {
    .pr-stats { grid-template-columns: 1fr !important; }
    .pr-tab-btn { font-size: 11px !important; padding: 6px 10px !important; }
    .pr-modal-header-right { gap: 6px !important; }
  }
`;

export default function PerformanceReviews() {
  const [assessments, setAssessments]               = useState([]);
  const [completedReviews, setCompletedReviews]     = useState([]);
  const [loading, setLoading]                       = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [reviewForm, setReviewForm]                 = useState({ items: [], hr_comment: "" });
  const [saving, setSaving]                         = useState(false);
  const [toast, setToast]                           = useState(null);
  const [activeTab, setActiveTab]                   = useState("pending");

  const [allAssignments, setAllAssignments]             = useState([]);
  const [selectedEmployeeLog, setSelectedEmployeeLog]   = useState("");
  const [logDateFrom, setLogDateFrom]                   = useState("");
  const [logDateTo, setLogDateTo]                       = useState("");
  const [employeeLogs, setEmployeeLogs]                 = useState([]);
  const [logTotals, setLogTotals]                       = useState({});
  const [logsLoading, setLogsLoading]                   = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [assessRes, reviewRes, assignRes] = await Promise.all([
        axios.get(`${API_BASE}/api/self-assessment/all`),
        axios.get(`${API_BASE}/api/performance-reviews/all`),
        axios.get(`${API_BASE}/api/kpi-assignments`)
      ]);
      if (assessRes.data.success) setAssessments(assessRes.data.data);
      if (reviewRes.data.success) setCompletedReviews(reviewRes.data.data);
      if (assignRes.data.success) setAllAssignments(assignRes.data.data.filter(a => a.status === "active"));
    } catch { showToast("Failed to load data", "error"); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const isReviewed = (id) => completedReviews.some(r => r.self_assessment_id === id);

  const openReview = (assessment) => {
    setSelectedAssessment(assessment);
    const items = assessment.items.map(item => ({
      kpi_item_id: item.kpi_item_id, kpi_name: item.kpi_name,
      target: item.target, unit: item.unit, weight: item.weight || 0,
      self_value: item.self_value, self_comment: item.self_comment || "",
      actual_value: item.self_value
    }));
    setReviewForm({ items, hr_comment: "" });
  };

  const handleActualChange = (idx, value) => {
    setReviewForm(f => {
      const items = [...f.items];
      items[idx] = { ...items[idx], actual_value: value };
      return { ...f, items };
    });
  };

  const calcLiveScore = () => {
    if (!reviewForm.items.length) return 0;
    const totalWeight = reviewForm.items.reduce((s, i) => s + (i.weight || 0), 0);
    const equalWeight = 100 / reviewForm.items.length;
    let total = 0;
    reviewForm.items.forEach(item => {
      const val = parseFloat(item.actual_value) || 0;
      const pct = Math.min((val / item.target) * 100, 100);
      const w = totalWeight === 0 ? equalWeight : (item.weight || 0);
      const divisor = totalWeight === 0 ? 100 : totalWeight;
      total += pct * (w / divisor);
    });
    return Math.round(total);
  };

  const calcSelfScore = (a) => {
    if (!a.items.length) return 0;
    const totalWeight = a.items.reduce((sum, i) => sum + (i.weight || 0), 0);
    const equalWeight = 100 / a.items.length;
    let s = 0;
    a.items.forEach(item => {
      const pct = Math.min((item.self_value / item.target) * 100, 100);
      const w = totalWeight === 0 ? equalWeight : (item.weight || 0);
      const divisor = totalWeight === 0 ? 100 : totalWeight;
      s += pct * (w / divisor);
    });
    return Math.round(s);
  };

  const handleSubmitReview = async () => {
    if (!reviewForm.hr_comment.trim()) return showToast("Please add HR feedback comment", "error");
    if (reviewForm.items.some(i => i.actual_value === "" || i.actual_value === null || i.actual_value === undefined))
      return showToast("Please fill all actual values", "error");
    setSaving(true);
    try {
      const payload = {
        employee_id: selectedAssessment.employee_id._id || selectedAssessment.employee_id,
        assignment_id: selectedAssessment.assignment_id?._id || selectedAssessment.assignment_id,
        self_assessment_id: selectedAssessment._id,
        period: selectedAssessment.period,
        kpi_breakdown: reviewForm.items.map(i => ({ ...i, actual_value: parseFloat(i.actual_value) })),
        hr_comment: reviewForm.hr_comment
      };
      const res = await axios.post(`${API_BASE}/api/performance-reviews`, payload);
      if (res.data.success) {
        showToast("Review finalized successfully!");
        setSelectedAssessment(null);
        fetchData();
      } else showToast(res.data.message || "Error", "error");
    } catch (err) { showToast(err.response?.data?.message || "Server error", "error"); }
    finally { setSaving(false); }
  };

  const fetchEmployeeLogs = async (employeeId, assignmentId) => {
    if (!employeeId || !assignmentId) return;
    setLogsLoading(true);
    try {
      const [logsRes, totalsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/daily-logs/${employeeId}/${assignmentId}`),
        axios.get(`${API_BASE}/api/daily-logs/totals/${employeeId}/${assignmentId}`)
      ]);
      if (logsRes.data.success) setEmployeeLogs(logsRes.data.data);
      if (totalsRes.data.success) setLogTotals(totalsRes.data.data);
    } catch { showToast("Failed to load logs", "error"); }
    finally { setLogsLoading(false); }
  };

  const handleEmployeeLogSelect = (assignmentId) => {
    setSelectedEmployeeLog(assignmentId);
    setLogDateFrom(""); setLogDateTo("");
    setEmployeeLogs([]); setLogTotals({});
    if (!assignmentId) return;
    const assignment = allAssignments.find(a => a._id === assignmentId);
    if (assignment) fetchEmployeeLogs(assignment.employee_id?._id || assignment.employee_id, assignmentId);
  };

  const filteredLogs = employeeLogs.filter(log => {
    if (logDateFrom && log.log_date < logDateFrom) return false;
    if (logDateTo   && log.log_date > logDateTo)   return false;
    return true;
  });

  const logsByDate = filteredLogs.reduce((acc, log) => {
    if (!acc[log.log_date]) acc[log.log_date] = [];
    acc[log.log_date].push(log);
    return acc;
  }, {});

  const selectedAssignmentData = allAssignments.find(a => a._id === selectedEmployeeLog);
  const liveScore = calcLiveScore();
  const { label: liveLabel, color: liveColor } = getRatingInfo(liveScore);
  const pendingAssessments = assessments.filter(a => !isReviewed(a._id));

  const STATS = [
    { label: "Total Submitted", value: assessments.length,         color: "#2563eb", bg: "#eff6ff", Icon: ClipboardList },
    { label: "Pending Review",  value: pendingAssessments.length,  color: "#d97706", bg: "#fffbeb", Icon: Clock         },
    { label: "Completed",       value: completedReviews.length,    color: "#16a34a", bg: "#f0fdf4", Icon: CheckCircle2  },
  ];

  const TABS = [
    { id: "pending",   Icon: Clock,         label: `Pending (${pendingAssessments.length})` },
    { id: "completed", Icon: CheckCircle2,  label: `Completed (${completedReviews.length})` },
    { id: "dailylogs", Icon: Calendar,      label: "Daily Logs" },
  ];

  return (
    <div className="pr-page" style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", background: "#f4f6fb" }}>
      <style>{STYLES}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 16, right: 16, left: 16, zIndex: 9999, background: toast.type === "error" ? "#ff4d4f" : "#52c41a", color: "#fff", padding: "12px 16px", borderRadius: 8, fontWeight: 600, fontSize: 13, textAlign: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", maxWidth: "calc(100vw - 32px)" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1a1a2e" }}>Performance Reviews</h2>
        <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>Review employee self assessments and finalize scores</p>
      </div>

      {/* Stats */}
      <div className="pr-stats" style={{ display: "grid", gap: 16, marginBottom: 24 }}>
        {STATS.map((s, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", border: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</p>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <s.Icon size={22} color={s.color} />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="pr-tabs" style={{ display: "flex", gap: 4, background: "#fff", borderRadius: 10, padding: 4, border: "1px solid #e5e7eb", marginBottom: 20 }}>
        {TABS.map(tab => (
          <button key={tab.id} className="pr-tab-btn" onClick={() => setActiveTab(tab.id)} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 18px", border: "none", borderRadius: 8, cursor: "pointer",
            fontWeight: 600, fontSize: 13,
            background: activeTab === tab.id ? "#2563eb" : "transparent",
            color:      activeTab === tab.id ? "#fff"    : "#6b7280"
          }}>
            <tab.Icon size={13} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── PENDING TAB ── */}
      {activeTab === "pending" && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 48, color: "#6b7280" }}>Loading...</div>
          ) : pendingAssessments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "56px 0" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}><PartyPopper size={40} color="#d1d5db" /></div>
              <p style={{ color: "#6b7280" }}>All assessments have been reviewed!</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="pr-table-wrap" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Employee","Department","Period","KPIs","Self Score","Submitted On","Action"].map(h => (
                        <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontWeight: 700, color: "#374151", borderBottom: "2px solid #e5e7eb", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pendingAssessments.map((a, i) => {
                      const selfScore = calcSelfScore(a);
                      const { color } = getRatingInfo(selfScore);
                      return (
                        <tr key={a._id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                          <td style={{ padding: "14px 20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#2563eb" }}>
                                {a.employee_id?.name?.charAt(0) || "?"}
                              </div>
                              <div>
                                <p style={{ margin: 0, fontWeight: 600, color: "#1a1a2e" }}>{a.employee_id?.name || "Unknown"}</p>
                                <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{a.employee_id?.designation || ""}</p>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "14px 20px", color: "#374151" }}>{a.employee_id?.department || "—"}</td>
                          <td style={{ padding: "14px 20px" }}><span style={{ background: "#f3f4f6", padding: "4px 10px", borderRadius: 6, fontWeight: 600, fontSize: 13 }}>{a.period}</span></td>
                          <td style={{ padding: "14px 20px", color: "#374151" }}>{a.items.length} KPIs</td>
                          <td style={{ padding: "14px 20px" }}><span style={{ fontWeight: 800, fontSize: 16, color }}>{selfScore}%</span></td>
                          <td style={{ padding: "14px 20px", color: "#6b7280", fontSize: 13 }}>{new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                          <td style={{ padding: "14px 20px" }}>
                            <button onClick={() => openReview(a)} style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 7, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Review →</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="pr-card-list">
                {pendingAssessments.map(a => {
                  const selfScore = calcSelfScore(a);
                  const { color } = getRatingInfo(selfScore);
                  return (
                    <div key={a._id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px", background: "#fff" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#2563eb", flexShrink: 0 }}>
                            {a.employee_id?.name?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, color: "#1a1a2e", fontSize: 14 }}>{a.employee_id?.name || "Unknown"}</p>
                            <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{a.employee_id?.designation || ""} · {a.employee_id?.department || ""}</p>
                          </div>
                        </div>
                        <span style={{ fontWeight: 800, fontSize: 16, color, flexShrink: 0 }}>{selfScore}%</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", fontSize: 13, marginBottom: 10 }}>
                        <div>
                          <span style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Period</span>
                          <p style={{ margin: "2px 0 0" }}><span style={{ background: "#f3f4f6", padding: "2px 8px", borderRadius: 5, fontWeight: 600, fontSize: 12 }}>{a.period}</span></p>
                        </div>
                        <div>
                          <span style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>KPIs</span>
                          <p style={{ margin: "2px 0 0", color: "#374151", fontWeight: 500 }}>{a.items.length} KPIs</p>
                        </div>
                        <div>
                          <span style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Submitted</span>
                          <p style={{ margin: "2px 0 0", color: "#6b7280", fontSize: 12 }}>{new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                        </div>
                        <div>
                          <span style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Self Score</span>
                          <p style={{ margin: "2px 0 0", fontWeight: 800, color }}>{selfScore}%</p>
                        </div>
                      </div>
                      <button onClick={() => openReview(a)} style={{ width: "100%", padding: "9px 0", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Review →</button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── COMPLETED TAB ── */}
      {activeTab === "completed" && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          {completedReviews.length === 0 ? (
            <div style={{ textAlign: "center", padding: "56px 0" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}><ClipboardList size={40} color="#d1d5db" /></div>
              <p style={{ color: "#6b7280" }}>No completed reviews yet.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="pr-table-wrap" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Employee","Department","Period","Final Score","Rating","Reviewed On"].map(h => (
                        <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontWeight: 700, color: "#374151", borderBottom: "2px solid #e5e7eb", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {completedReviews.map((r, i) => {
                      const { label, color, bg } = getRatingInfo(r.final_score);
                      return (
                        <tr key={r._id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                          <td style={{ padding: "14px 20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#2563eb" }}>
                                {r.employee_id?.name?.charAt(0) || "?"}
                              </div>
                              <div>
                                <p style={{ margin: 0, fontWeight: 600, color: "#1a1a2e" }}>{r.employee_id?.name || "—"}</p>
                                <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{r.employee_id?.designation || ""}</p>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "14px 20px", color: "#374151" }}>{r.employee_id?.department || "—"}</td>
                          <td style={{ padding: "14px 20px" }}><span style={{ background: "#f3f4f6", padding: "4px 10px", borderRadius: 6, fontWeight: 600, fontSize: 13 }}>{r.period}</span></td>
                          <td style={{ padding: "14px 20px" }}><span style={{ fontWeight: 800, fontSize: 18, color }}>{r.final_score}%</span></td>
                          <td style={{ padding: "14px 20px" }}><span style={{ background: bg, color, fontWeight: 700, padding: "4px 12px", borderRadius: 20, fontSize: 12 }}>{label}</span></td>
                          <td style={{ padding: "14px 20px", color: "#6b7280", fontSize: 13 }}>{new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="pr-card-list">
                {completedReviews.map(r => {
                  const { label, color, bg } = getRatingInfo(r.final_score);
                  return (
                    <div key={r._id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px", background: "#fff" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#2563eb", flexShrink: 0 }}>
                            {r.employee_id?.name?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, color: "#1a1a2e", fontSize: 14 }}>{r.employee_id?.name || "—"}</p>
                            <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{r.employee_id?.designation || ""} · {r.employee_id?.department || ""}</p>
                          </div>
                        </div>
                        <span style={{ background: bg, color, fontWeight: 700, padding: "4px 10px", borderRadius: 20, fontSize: 11, flexShrink: 0 }}>{label}</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", fontSize: 13 }}>
                        <div>
                          <span style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Period</span>
                          <p style={{ margin: "2px 0 0" }}><span style={{ background: "#f3f4f6", padding: "2px 8px", borderRadius: 5, fontWeight: 600, fontSize: 12 }}>{r.period}</span></p>
                        </div>
                        <div>
                          <span style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Final Score</span>
                          <p style={{ margin: "2px 0 0", fontWeight: 800, color, fontSize: 16 }}>{r.final_score}%</p>
                        </div>
                        <div>
                          <span style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Reviewed On</span>
                          <p style={{ margin: "2px 0 0", color: "#6b7280", fontSize: 12 }}>{new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── DAILY LOGS TAB ── */}
      {activeTab === "dailylogs" && (
        <div className="pr-logs-layout" style={{ display: "grid", gap: 20 }}>
          <div>
            {/* Filter Bar */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #e5e7eb", marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1a1a2e", display: "flex", alignItems: "center", gap: 8 }}>
                <Filter size={15} color="#374151" /> Filter Logs
              </h3>
              <div className="pr-logs-filter-grid" style={{ display: "grid", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Select Employee</label>
                  <select value={selectedEmployeeLog} onChange={e => handleEmployeeLogSelect(e.target.value)} style={inputStyle}>
                    <option value="">-- Select Employee --</option>
                    {allAssignments.map(a => (
                      <option key={a._id} value={a._id}>{a.employee_id?.name} — {a.period}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>From Date</label>
                  <input type="date" value={logDateFrom} onChange={e => setLogDateFrom(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>To Date</label>
                  <input type="date" value={logDateTo} onChange={e => setLogDateTo(e.target.value)} style={inputStyle} />
                </div>
              </div>
            </div>

            {/* Log List */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, border: "1px solid #e5e7eb" }}>
              {!selectedEmployeeLog ? (
                <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}><MousePointerClick size={40} color="#d1d5db" /></div>
                  <p style={{ fontWeight: 600 }}>Select an employee to view their daily logs</p>
                </div>
              ) : logsLoading ? (
                <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>Loading logs...</div>
              ) : filteredLogs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}><Inbox size={40} color="#d1d5db" /></div>
                  <p>No logs found{logDateFrom || logDateTo ? " in selected date range" : ""}.</p>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1a1a2e" }}>
                      {selectedAssignmentData?.employee_id?.name}'s Logs
                      <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 400, color: "#6b7280" }}>({filteredLogs.length} entries)</span>
                    </h3>
                    <span style={{ background: "#f3f4f6", padding: "4px 12px", borderRadius: 6, fontSize: 13, fontWeight: 600, color: "#374151" }}>{selectedAssignmentData?.period}</span>
                  </div>
                  {Object.keys(logsByDate).sort((a, b) => b.localeCompare(a)).map(date => (
                    <div key={date} style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <Calendar size={13} color="#6b7280" />
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        </span>
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>— {logsByDate[date].length} {logsByDate[date].length === 1 ? "entry" : "entries"}</span>
                      </div>
                      {logsByDate[date].map(log => (
                        <div key={log._id} className="pr-log-entry" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fafc", borderRadius: 8, marginBottom: 6, border: "1px solid #e5e7eb" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#2563eb", fontSize: 13, flexShrink: 0 }}>{log.value}</div>
                            <div>
                              <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: "#1f2937" }}>
                                {log.kpi_name} — <span style={{ color: "#2563eb" }}>{log.value} {log.unit}</span>
                              </p>
                              {log.note && <p style={{ margin: 0, fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>{log.note}</p>}
                            </div>
                          </div>
                          <span style={{ fontSize: 12, color: "#9ca3af", flexShrink: 0 }}>{new Date(log.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* RIGHT — Totals + Info */}
          <div className="pr-logs-sidebar" style={{ flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #e5e7eb" }}>
              <p style={{ margin: "0 0 14px", fontWeight: 700, fontSize: 14, color: "#1a1a2e", display: "flex", alignItems: "center", gap: 7 }}>
                <BarChart2 size={15} color="#374151" /> Running Totals
              </p>
              {!selectedEmployeeLog ? (
                <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "20px 0" }}>Select employee first</p>
              ) : Object.keys(logTotals).length === 0 ? (
                <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "20px 0" }}>No logs yet</p>
              ) : (
                selectedAssignmentData?.template_id?.kpi_items?.map((item, i) => {
                  const total = logTotals[item._id] || 0;
                  const pct = Math.min(Math.round((total / item.target) * 100), 100);
                  const color = pct >= 100 ? "#16a34a" : pct >= 75 ? "#2563eb" : pct >= 50 ? "#d97706" : "#dc2626";
                  return (
                    <div key={i} style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{item.kpi_name}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color }}>{total} / {item.target} {item.unit}</span>
                      </div>
                      <div style={{ background: "#f3f4f6", borderRadius: 99, height: 8, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.5s" }} />
                      </div>
                      <p style={{ margin: "4px 0 0", fontSize: 11, color, fontWeight: 600, textAlign: "right" }}>{pct}%</p>
                    </div>
                  );
                })
              )}
            </div>

            {selectedEmployeeLog && selectedAssignmentData && (
              <div style={{ background: "#fff", borderRadius: 14, padding: 16, border: "1px solid #e5e7eb" }}>
                <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 13, color: "#1a1a2e", display: "flex", alignItems: "center", gap: 7 }}>
                  <User size={13} color="#374151" /> Employee Info
                </p>
                {[
                  { label: "Name",        value: selectedAssignmentData.employee_id?.name },
                  { label: "Designation", value: selectedAssignmentData.employee_id?.designation || "—" },
                  { label: "Department",  value: selectedAssignmentData.employee_id?.department  || "—" },
                  { label: "Period",      value: selectedAssignmentData.period },
                  { label: "Total Logs",  value: employeeLogs.length },
                ].map((d, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 4 ? "1px solid #f3f4f6" : "none", fontSize: 13 }}>
                    <span style={{ color: "#6b7280" }}>{d.label}</span>
                    <span style={{ fontWeight: 600, color: "#1f2937" }}>{d.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── REVIEW MODAL ── */}
      {selectedAssessment && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 780, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 10, gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1a1a2e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Review — {selectedAssessment.employee_id?.name}</h3>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "#6b7280" }}>{selectedAssessment.period} · {selectedAssessment.employee_id?.designation} · {selectedAssessment.employee_id?.department}</p>
              </div>
              <div className="pr-modal-header-right" style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                <div style={{ background: getRatingInfo(liveScore).bg, borderRadius: 8, padding: "6px 12px", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 10, color: liveColor, fontWeight: 600 }}>LIVE SCORE</p>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: liveColor }}>{liveScore}%</p>
                  <p style={{ margin: 0, fontSize: 10, color: liveColor }}>{liveLabel}</p>
                </div>
                <button onClick={() => setSelectedAssessment(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6b7280" }}>✕</button>
              </div>
            </div>

            <div style={{ padding: "20px 24px" }}>
              <h4 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1a1a2e" }}>KPI Actual Values</h4>
              {reviewForm.items.map((item, idx) => {
                const selfPct   = item.self_value   ? Math.round((item.self_value / item.target) * 100) : 0;
                const actualPct = item.actual_value ? Math.min(Math.round((parseFloat(item.actual_value) / item.target) * 100), 150) : 0;
                const actualColor = getProgressColor(actualPct);
                return (
                  <div key={idx} style={{ background: "#f8fafc", borderRadius: 12, padding: 18, marginBottom: 14, border: "1px solid #e5e7eb" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#1f2937", wordBreak: "break-word" }}>{item.kpi_name}</p>
                        <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>Target: {item.target} {item.unit} · Weight: {item.weight}%</p>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: actualColor, flexShrink: 0 }}>{actualPct}%</span>
                    </div>
                    <div className="pr-kpi-grid" style={{ display: "grid", gap: 12, marginBottom: 12 }}>
                      <div style={{ background: "#fff", borderRadius: 8, padding: "10px 14px", border: "1px solid #e5e7eb" }}>
                        <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Employee Self Report</p>
                        <p style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#2563eb" }}>{item.self_value} <span style={{ fontSize: 12, fontWeight: 400 }}>{item.unit}</span></p>
                        <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>{selfPct}% of target</p>
                        {item.self_comment && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#374151", fontStyle: "italic" }}>"{item.self_comment}"</p>}
                      </div>
                      <div style={{ background: "#fff", borderRadius: 8, padding: "10px 14px", border: "2px solid #2563eb" }}>
                        <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#2563eb", textTransform: "uppercase" }}>HR Actual Value *</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input type="number" value={item.actual_value} onChange={e => handleActualChange(idx, e.target.value)} min="0"
                            style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 7, fontSize: 15, fontWeight: 700, color: actualColor, outline: "none", boxSizing: "border-box" }} />
                          <span style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>{item.unit}</span>
                        </div>
                      </div>
                    </div>
                    {item.actual_value && (
                      <div style={{ background: "#e5e7eb", borderRadius: 99, height: 8, overflow: "hidden" }}>
                        <div style={{ width: `${Math.min(actualPct, 100)}%`, height: "100%", background: actualColor, borderRadius: 99, transition: "width 0.4s ease" }} />
                      </div>
                    )}
                  </div>
                );
              })}

              {selectedAssessment.overall_comment && (
                <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                  <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "#0369a1" }}>EMPLOYEE'S OVERALL COMMENT</p>
                  <p style={{ margin: 0, fontSize: 13, color: "#374151" }}>{selectedAssessment.overall_comment}</p>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>HR Feedback & Comments *</label>
                <textarea value={reviewForm.hr_comment} onChange={e => setReviewForm(f => ({ ...f, hr_comment: e.target.value }))} placeholder="Write your feedback..." rows={4}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, color: "#1a1a2e", background: "#fff", boxSizing: "border-box", outline: "none", resize: "vertical" }} />
              </div>

              <div style={{ background: getRatingInfo(liveScore).bg, border: `1px solid ${getRatingInfo(liveScore).color}40`, borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: "#6b7280" }}>CALCULATED FINAL SCORE</p>
                  <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>Based on actual values × KPI weights</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: 32, fontWeight: 900, color: liveColor }}>{liveScore}%</p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: liveColor }}>{liveLabel}</p>
                </div>
              </div>

              <div className="pr-modal-footer" style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={() => setSelectedAssessment(null)} style={{ padding: "11px 24px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button onClick={handleSubmitReview} disabled={saving}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "11px 28px", border: "none", borderRadius: 8, background: saving ? "#93c5fd" : "#2563eb", color: "#fff", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 14 }}>
                  <CheckCheck size={15} />{saving ? "Finalizing..." : "Finalize Review"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 };
const inputStyle = { width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, color: "#1a1a2e", background: "#fff", boxSizing: "border-box", outline: "none" };