import { useEffect, useState } from "react";
import axios from "axios";
import {
  TrendingUp, Target, Award, Clock, CheckCircle,
  AlertCircle, ChevronDown, ChevronUp, Calendar,
  BarChart2, Star, FileText
} from "lucide-react";
import EmployeeLayout from "./EmployeeLayout";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const getRatingLabel = (score) => {
  if (score >= 90) return { label: "Outstanding",          color: "#16a34a", bg: "#f0fdf4" };
  if (score >= 75) return { label: "Exceeds Expectations", color: "#2563eb", bg: "#eff6ff" };
  if (score >= 60) return { label: "Meets Expectations",   color: "#d97706", bg: "#fffbeb" };
  if (score >= 45) return { label: "Needs Improvement",    color: "#ea580c", bg: "#fff7ed" };
  return              { label: "Unsatisfactory",           color: "#dc2626", bg: "#fef2f2" };
};

const getProgressColor = (pct) => {
  if (pct >= 100) return "#16a34a";
  if (pct >= 75)  return "#2563eb";
  if (pct >= 50)  return "#d97706";
  return "#dc2626";
};

function ScoreRing({ score, size = 120 }) {
  const strokeW = size > 180 ? 14 : 10;
  const r = (size - strokeW * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(score, 100) / 100) * circ;
  const { label, color } = getRatingLabel(score);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={strokeW}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeW}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s ease" }}/>
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size*0.24, fontWeight: 900, color, lineHeight: 1 }}>{score}%</span>
        <span style={{ fontSize: Math.max(size*0.085, 11), color: "#6b7280", marginTop: 4, textAlign: "center", padding: "0 10px", fontWeight: 600 }}>{label}</span>
      </div>
    </div>
  );
}

function KpiBar({ item, actual }) {
  const pct = actual ? Math.min(Math.round((actual / item.target) * 100), 150) : 0;
  const color = getProgressColor(pct);
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="perf-kpi-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <div>
          <span style={{ fontWeight: 600, fontSize: 14, color: "#1f2937" }}>{item.kpi_name}</span>
          <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, background: "#f3f4f6", color: "#6b7280", padding: "2px 7px", borderRadius: 4 }}>{item.weight}% weight</span>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color }}>{actual ?? "—"} / {item.target} {item.unit}</span>
          <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 700, color: pct >= 100 ? "#16a34a" : "#6b7280" }}>{actual ? `${pct}%` : "Pending"}</span>
        </div>
      </div>
      <div style={{ background: "#f3f4f6", borderRadius: 99, height: 10, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: color, borderRadius: 99, transition: "width 1s ease" }}/>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 11, color: "#9ca3af", textTransform: "capitalize" }}>{item.frequency}</span>
        {pct >= 100 && <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>✓ Target met!</span>}
      </div>
    </div>
  );
}

function ReviewCard({ review }) {
  const [open, setOpen] = useState(false);
  const { label, color, bg } = getRatingLabel(review.final_score);
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", marginBottom: 12, background: "#fff" }}>
      <div onClick={() => setOpen(o => !o)} className="perf-review-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", cursor: "pointer", background: open ? "#f8fafc" : "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Star size={18} color={color}/>
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#1f2937" }}>{review.period}</p>
            <p style={{ margin: 0, fontSize: 12, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Reviewed on {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color }}>{review.final_score}%</p>
            <p style={{ margin: 0, fontSize: 11, color, fontWeight: 600 }}>{label}</p>
          </div>
          {open ? <ChevronUp size={18} color="#9ca3af"/> : <ChevronDown size={18} color="#9ca3af"/>}
        </div>
      </div>
      {open && (
        <div style={{ padding: "0 18px 18px", borderTop: "1px solid #f3f4f6" }}>
          {review.hr_comment && (
            <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 14px", margin: "14px 0 0" }}>
              <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#6b7280" }}>HR FEEDBACK</p>
              <p style={{ margin: 0, fontSize: 14, color: "#374151" }}>{review.hr_comment}</p>
            </div>
          )}
          {review.kpi_breakdown?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#6b7280" }}>KPI BREAKDOWN</p>
              {review.kpi_breakdown.map((k, i) => {
                const achPct = k.target ? Math.round((k.actual_value / k.target) * 100) : 0;
                return (
                  <div key={i} className="perf-kpi-breakdown-row" style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13, gap: 8 }}>
                    <span style={{ color: "#374151" }}>{k.kpi_name}</span>
                    <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
                      <span style={{ color: "#6b7280" }}>{k.actual_value} / {k.target} {k.unit}</span>
                      <span style={{ fontWeight: 700, color: getProgressColor(achPct) }}>{achPct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyPerformance() {
  const [assignment, setAssignment] = useState(null);
  const [actuals, setActuals]       = useState({});
  const [reviews, setReviews]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState("current");
  const [employee, setEmployee]     = useState(null);

  const employeeId = localStorage.getItem("employeeId");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const empRes = await axios.get(`${API_BASE}/api/employee/me/${employeeId}`);
      setEmployee(empRes.data);

      const assignRes = await axios.get(`${API_BASE}/api/kpi-assignments/${employeeId}`);
      if (assignRes.data.success && assignRes.data.data) {
        const assign = assignRes.data.data;
        setAssignment(assign);

        // ✅ FIX: kpi-actuals இல்லை — Self Assessment-லிருந்து actuals படி
        try {
          const saRes = await axios.get(`${API_BASE}/api/self-assessment/by-assignment/${assign._id}`);
          if (saRes.data.success && saRes.data.data) {
            const map = {};
            saRes.data.data.items.forEach(item => {
              map[item.kpi_item_id] = item.self_value;
            });
            setActuals(map);
          }
        } catch (e) {
          console.log("No self assessment yet");
        }
      }

      const reviewRes = await axios.get(`${API_BASE}/api/performance-reviews/${employeeId}`);
      if (reviewRes.data.success) {
        setReviews(reviewRes.data.data);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getReviewForCurrentAssignment = () => {
    if (!reviews.length || !assignment) return null;

    const byAssignmentId = reviews.find(r =>
      r.assignment_id?.toString() === assignment._id?.toString()
    );
    if (byAssignmentId) return byAssignmentId;

    const byPeriod = reviews.find(r =>
      r.period?.trim().toLowerCase() === assignment.period?.trim().toLowerCase()
    );
    if (byPeriod) return byPeriod;

    // ✅ FIX: current assignment (July)-க்கு exact review இல்லைனா,
    // வேற period-ன review-ஐ (June) எடுத்து காட்டாதே — null return பண்ணு
    return null;
  };

  const calcCurrentScore = (reviewOverride) => {
  const hrReview = reviewOverride || getReviewForCurrentAssignment();
  if (hrReview?.final_score != null) return hrReview.final_score;

  const items = assignment?.month_version_id?.kpi_items || assignment?.template_id?.kpi_items || [];
  if (!items.length) return 0;
  const totalWeight = items.reduce((s, i) => s + (i.weight || 0), 0);
  const equalWeight = 100 / items.length;
  let total = 0;
  items.forEach(item => {
    const actual = actuals[item._id] || 0;
    const pct = Math.min((actual / item.target) * 100, 100);
    const w = totalWeight === 0 ? equalWeight : (item.weight || 0);
    const divisor = totalWeight === 0 ? 100 : totalWeight;
    total += pct * (w / divisor);
  });
  return Math.round(total);
};

  const getLatestCompletedReview = () => {
  if (!reviews.length) return null;
  return [...reviews].sort(
    (a, b) => new Date(b.createdAt || b.reviewed_at) - new Date(a.createdAt || a.reviewed_at)
  )[0];
};

const exactReview = getReviewForCurrentAssignment();
const fallbackReview = exactReview ? null : getLatestCompletedReview();
const currentReview = exactReview || fallbackReview;
const isHRReviewed  = currentReview != null;
const isShowingLastMonth = !exactReview && !!fallbackReview;
const currentScore  = calcCurrentScore(currentReview);
  const kpiItems = assignment?.month_version_id?.kpi_items || assignment?.template_id?.kpi_items || [];


  const reviewKpis  = currentReview?.kpi_breakdown || [];
  const metTargets  = isHRReviewed
    ? reviewKpis.filter(k => (k.actual_value || 0) >= k.target).length
    : kpiItems.filter(item => (actuals[item._id] || 0) >= item.target).length;
  const totalKpis   = isHRReviewed ? reviewKpis.length : kpiItems.length;

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "4px solid #e5e7eb", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }}/>
        <p style={{ color: "#6b7280", fontSize: 14 }}>Loading performance data...</p>
        <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  return (
    <EmployeeLayout>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }

        /* ── Internal page header — EmployeeLayout already shows its own mobile
           topbar (hamburger + page title), so this component's header is
           desktop-only to avoid a duplicate header on mobile ── */
        .perf-header { }
        @media (max-width: 767px) {
          .perf-header { display: none !important; }
        }

        .perf-page { padding: 28px 32px; background: #f4f6fb; min-height: 100vh; }
        @media (max-width: 767px) {
          .perf-page { padding: 16px 12px 40px; }
        }

        .perf-title { margin: 0; font-size: 22px; font-weight: 800; color: #1a1a2e; }
        @media (max-width: 767px) { .perf-title { font-size: 18px; } }

        .perf-subtitle { margin: 4px 0 0; color: #6b7280; font-size: 14px; }
        @media (max-width: 767px) { .perf-subtitle { font-size: 12.5px; } }

        .perf-empty-card { background: #fff; border-radius: 16px; padding: 60px 0; text-align: center; border: 1px solid #e5e7eb; }
        @media (max-width: 767px) { .perf-empty-card { padding: 40px 16px; border-radius: 14px; } }

        .perf-alert { background: #f0fdf4; border: 1px solid #86efac; border-radius: 10px; padding: 12px 18px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
        @media (max-width: 767px) { .perf-alert { padding: 10px 12px; gap: 8px; } }

        .perf-hero-card { background: #fff; border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden; margin-bottom: 20px; }
        @media (max-width: 767px) { .perf-hero-card { border-radius: 14px; margin-bottom: 14px; } }

        .perf-hero-inner { padding: 32px 36px; display: flex; align-items: center; gap: 40px; flex-wrap: wrap; }
        @media (max-width: 767px) {
          .perf-hero-inner { padding: 18px 16px; gap: 16px; flex-direction: column; align-items: stretch; }
        }

        .perf-ring-wrap { display: flex; justify-content: center; }
        @media (max-width: 480px) { .perf-ring-wrap { transform: scale(0.78); margin: -12px 0; } }
        @media (max-width: 380px) { .perf-ring-wrap { transform: scale(0.64); margin: -26px 0; } }

        .perf-score-info { flex: 1; min-width: 200px; }
        @media (max-width: 767px) { .perf-score-info { min-width: 0; text-align: center; } }

        .perf-score-num { font-size: 56px; }
        @media (max-width: 767px) { .perf-score-num { font-size: 40px; } }

        .perf-badge { padding: 6px 18px; margin-bottom: 24px; }
        @media (max-width: 767px) { .perf-badge { padding: 5px 14px; margin-bottom: 16px; } }

        .perf-stats-row { display: flex; gap: 32px; flex-wrap: wrap; }
        @media (max-width: 767px) { .perf-stats-row { gap: 16px 24px; justify-content: center; } }

        .perf-rating-scale { min-width: 210px; }
        @media (max-width: 767px) { .perf-rating-scale { min-width: 0; width: 100%; margin-top: 4px; } }

        .perf-tabs { display: flex; gap: 4px; background: #fff; border-radius: 10px; padding: 4px; border: 1px solid #e5e7eb; margin-bottom: 20px; width: fit-content; }
        @media (max-width: 767px) { .perf-tabs { width: 100%; margin-bottom: 14px; } }
        .perf-tab-btn { display: flex; align-items: center; gap: 6px; padding: 8px 18px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px; transition: all 0.2s; font-family: inherit; }
        @media (max-width: 767px) { .perf-tab-btn { flex: 1; justify-content: center; padding: 9px 8px; } }

        .perf-card-pad { padding: 24px; }
        @media (max-width: 767px) { .perf-card-pad { padding: 14px; border-radius: 14px; } }

        .perf-kpi-row { flex-wrap: wrap; gap: 6px; }
        @media (max-width: 480px) {
          .perf-kpi-row { flex-direction: column; align-items: flex-start !important; }
          .perf-kpi-row > div:last-child { text-align: left !important; }
        }

        .perf-review-head { flex-wrap: wrap; gap: 10px; }

        .perf-kpi-breakdown-row { flex-wrap: wrap; }
      `}</style>

      <header className="perf-header" style={{ background: "#fff", padding: "14px 28px", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontWeight: 700, color: "#2563eb", fontSize: 15 }}>My Performance</span>
          {isHRReviewed && (
            <span style={{ fontSize: 11, fontWeight: 700, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", padding: "3px 10px", borderRadius: 20 }}>
              ✓ HR Reviewed
            </span>
          )}
          <div style={{ marginLeft: "auto", width: 40, height: 40, borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 }}>
            {employee?.name?.charAt(0) || "E"}
          </div>
        </div>
      </header>

      <div className="perf-page">

        <div style={{ marginBottom: 28 }}>
          <h2 className="perf-title">My Performance</h2>
          <p className="perf-subtitle">Track your KPIs and review history</p>
        </div>

        {!assignment ? (
          <div className="perf-empty-card">
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <h3 style={{ color: "#1f2937", marginBottom: 8 }}>No KPIs Assigned Yet</h3>
            <p style={{ color: "#6b7280", fontSize: 14 }}>Your HR team hasn't assigned KPIs to you yet. Check back soon!</p>
          </div>
        ) : (
          <>
            {isHRReviewed && (
              <div className="perf-alert">
                <CheckCircle size={18} color="#16a34a" />
                <div>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#15803d" }}>HR Review Completed — </span>
                  <span style={{ fontSize: 13, color: "#166534" }}>
                    Your final score for <strong>{currentReview.period}</strong> is{" "}
                    <strong>{currentReview.final_score}%</strong> ({getRatingLabel(currentReview.final_score).label})
                  </span>
                </div>
              </div>
            )}

            <div className="perf-hero-card">
              <div className="perf-hero-inner">
                <div className="perf-ring-wrap">
                  <ScoreRing score={currentScore} size={220}/>
                </div>
                <div className="perf-score-info">
                  <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px" }}>Overall Performance Score</p>
                  <h1 className="perf-score-num" style={{ margin: "0 0 10px", fontWeight: 900, color: getRatingLabel(currentScore).color, lineHeight: 1 }}>{currentScore}%</h1>
                  <div className="perf-badge" style={{ display: "inline-flex", alignItems: "center", background: getRatingLabel(currentScore).bg, border: `1.5px solid ${getRatingLabel(currentScore).color}40`, borderRadius: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: getRatingLabel(currentScore).color }}>{getRatingLabel(currentScore).label}</span>
                  </div>
                  <div className="perf-stats-row">
                    {[
  { label: "Period",       value: isHRReviewed ? currentReview.period : assignment.period },
  { label: "Total KPIs",   value: totalKpis },
  { label: "Targets Met",  value: `${metTargets} / ${totalKpis}` },
  { label: "Past Reviews", value: reviews.length },
].map((s, i) => (
                      <div key={i}>
                        <p style={{ margin: 0, fontSize: 11, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 18, fontWeight: 800, color: "#1a1a2e" }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="perf-rating-scale">
                  <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>Rating Scale</p>
                  {[
                    { range: "90–100%", label: "Outstanding",          color: "#16a34a" },
                    { range: "75–89%",  label: "Exceeds Expectations", color: "#2563eb" },
                    { range: "60–74%",  label: "Meets Expectations",   color: "#d97706" },
                    { range: "45–59%",  label: "Needs Improvement",    color: "#ea580c" },
                    { range: "< 45%",   label: "Unsatisfactory",       color: "#dc2626" },
                  ].map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < 4 ? "1px solid #f3f4f6" : "none", gap: 12 }}>
                      <span style={{ fontSize: 12, color: "#6b7280", minWidth: 56 }}>{r.range}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: r.color, background: `${r.color}15`, padding: "3px 10px", borderRadius: 4, whiteSpace: "nowrap" }}>{r.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="perf-tabs">
              {[
                { id: "current", label: "Current KPIs",   icon: <BarChart2 size={15}/> },
                { id: "history", label: "Review History", icon: <FileText size={15}/> },
              ].map(tab => (
                <button key={tab.id} className="perf-tab-btn" onClick={() => setActiveTab(tab.id)} style={{ background: activeTab === tab.id ? "#2563eb" : "transparent", color: activeTab === tab.id ? "#fff" : "#6b7280" }}>
                  {tab.icon}{tab.label}
                </button>
              ))}
            </div>

            {activeTab === "current" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div className="perf-card-pad" style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb" }}>
                  <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>
  KPI Progress — {isHRReviewed ? currentReview.period : assignment.period}
</h3>
{isShowingLastMonth && (
  <p style={{ margin: "0 0 12px", fontSize: 12, color: "#2563eb", fontWeight: 600 }}>
    📅 Showing your last reviewed month ({currentReview.period}) — {assignment.period} review pending
  </p>
)}
                  <p style={{ margin: "0 0 20px", color: "#6b7280", fontSize: 13 }}>{assignment.template_id?.role} · {assignment.template_id?.department}</p>

                  {isHRReviewed ? (
                    <>
                      {reviewKpis.map((k, i) => {
                        const pct = k.target ? Math.min(Math.round((k.actual_value / k.target) * 100), 100) : 0;
                        const color = getProgressColor(pct);
                        return (
                          <div key={i} style={{ marginBottom: 18 }}>
                            <div className="perf-kpi-row" style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                              <div>
                                <span style={{ fontWeight: 600, fontSize: 14, color: "#1f2937" }}>{k.kpi_name}</span>
                                <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, background: "#f3f4f6", color: "#6b7280", padding: "2px 7px", borderRadius: 4 }}>{k.weight}% weight</span>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color }}>{k.actual_value ?? "—"} / {k.target} {k.unit}</span>
                                <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 700, color: pct >= 100 ? "#16a34a" : color }}>{pct}%</span>
                              </div>
                            </div>
                            <div style={{ background: "#f3f4f6", borderRadius: 99, height: 10, overflow: "hidden" }}>
                              <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 1s ease" }}/>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                              <span style={{ fontSize: 11, color: "#9ca3af" }}>HR Verified</span>
                              {pct >= 100 && <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>✓ Target met!</span>}
                            </div>
                          </div>
                        );
                      })}
                      {currentReview.hr_comment && (
                        <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 14px", marginTop: 16, border: "1px solid #e5e7eb" }}>
                          <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#6b7280" }}>HR FEEDBACK</p>
                          <p style={{ margin: 0, fontSize: 14, color: "#374151" }}>{currentReview.hr_comment}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    kpiItems.length === 0
                      ? <p style={{ color: "#9ca3af", textAlign: "center", padding: "40px 0" }}>No KPI items found.</p>
                      : kpiItems.map(item => <KpiBar key={item._id} item={item} actual={actuals[item._id]}/>)
                  )}

                  <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", marginTop: 8, border: "1px solid #e5e7eb" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                      {isHRReviewed ? "HR Final Score" : "Overall Weighted Score (Live)"}
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: getRatingLabel(currentScore).color }}>{currentScore}%</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="perf-card-pad" style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>Past Performance Reviews</h3>
                {reviews.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "50px 0" }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>📊</div>
                    <p style={{ color: "#6b7280" }}>No reviews completed yet. Your first review will appear here.</p>
                  </div>
                ) : (
                  reviews.map((r, i) => <ReviewCard key={i} review={r}/>)
                )}
              </div>
            )}
          </>
        )}
      </div>
    </EmployeeLayout>
  );
}