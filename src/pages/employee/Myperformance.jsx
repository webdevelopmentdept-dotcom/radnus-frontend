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
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
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
      <div onClick={() => setOpen(o => !o)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", cursor: "pointer", background: open ? "#f8fafc" : "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Star size={18} color={color}/>
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#1f2937" }}>{review.period}</p>
            <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>Reviewed on {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13 }}>
                    <span style={{ color: "#374151" }}>{k.kpi_name}</span>
                    <div style={{ display: "flex", gap: 16 }}>
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

    const sorted = [...reviews]
      .filter(r => r.status === "finalized")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return sorted[0] || null;
  };

  const calcCurrentScore = () => {
    const hrReview = getReviewForCurrentAssignment();

    if (hrReview?.final_score != null) return hrReview.final_score;

    if (!assignment?.template_id?.kpi_items) return 0;
    const items = assignment.template_id.kpi_items;
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

  const currentReview = getReviewForCurrentAssignment();
  const isHRReviewed  = currentReview != null;
  const currentScore  = calcCurrentScore();
  const kpiItems      = assignment?.template_id?.kpi_items || [];

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
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>

      <header style={{ background: "#fff", padding: "14px 28px", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
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

      <div style={{ padding: "28px 32px", background: "#f4f6fb", minHeight: "100vh" }}>

        <div style={{ marginBottom: 28 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a2e" }}>My Performance</h2>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>Track your KPIs and review history</p>
        </div>

        {!assignment ? (
          <div style={{ background: "#fff", borderRadius: 16, padding: "60px 0", textAlign: "center", border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <h3 style={{ color: "#1f2937", marginBottom: 8 }}>No KPIs Assigned Yet</h3>
            <p style={{ color: "#6b7280", fontSize: 14 }}>Your HR team hasn't assigned KPIs to you yet. Check back soon!</p>
          </div>
        ) : (
          <>
            {isHRReviewed && (
              <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "12px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
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

            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: 20 }}>
              <div style={{ padding: "32px 36px", display: "flex", alignItems: "center", gap: 40, flexWrap: "wrap" }}>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <ScoreRing score={currentScore} size={220}/>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px" }}>Overall Performance Score</p>
                  <h1 style={{ margin: "0 0 10px", fontSize: 56, fontWeight: 900, color: getRatingLabel(currentScore).color, lineHeight: 1 }}>{currentScore}%</h1>
                  <div style={{ display: "inline-flex", alignItems: "center", background: getRatingLabel(currentScore).bg, border: `1.5px solid ${getRatingLabel(currentScore).color}40`, borderRadius: 8, padding: "6px 18px", marginBottom: 24 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: getRatingLabel(currentScore).color }}>{getRatingLabel(currentScore).label}</span>
                  </div>
                  <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
                    {[
                      { label: "Period",       value: assignment.period },
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
                <div style={{ minWidth: 210 }}>
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

            <div style={{ display: "flex", gap: 4, background: "#fff", borderRadius: 10, padding: 4, border: "1px solid #e5e7eb", marginBottom: 20, width: "fit-content" }}>
              {[
                { id: "current", label: "Current KPIs",   icon: <BarChart2 size={15}/> },
                { id: "history", label: "Review History", icon: <FileText size={15}/> },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13, background: activeTab === tab.id ? "#2563eb" : "transparent", color: activeTab === tab.id ? "#fff" : "#6b7280", transition: "all 0.2s" }}>
                  {tab.icon}{tab.label}
                </button>
              ))}
            </div>

            {activeTab === "current" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ background: "#fff", borderRadius: 14, padding: 24, border: "1px solid #e5e7eb" }}>
                  <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>KPI Progress — {assignment.period}</h3>
                  <p style={{ margin: "0 0 20px", color: "#6b7280", fontSize: 13 }}>{assignment.template_id?.role} · {assignment.template_id?.department}</p>

                  {isHRReviewed ? (
                    <>
                      {reviewKpis.map((k, i) => {
                        const pct = k.target ? Math.min(Math.round((k.actual_value / k.target) * 100), 100) : 0;
                        const color = getProgressColor(pct);
                        return (
                          <div key={i} style={{ marginBottom: 18 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
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
              <div style={{ background: "#fff", borderRadius: 14, padding: 24, border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
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