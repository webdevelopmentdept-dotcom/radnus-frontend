import { useEffect, useState } from "react";
import axios from "axios";
import {
  TrendingUp, Target, Award, Clock, CheckCircle,
  AlertCircle, ChevronDown, ChevronUp, Calendar,
  BarChart2, Star, FileText
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ─── Helpers ────────────────────────────────────────────────
const getRatingLabel = (score) => {
  if (score >= 90) return { label: "Outstanding", color: "#16a34a", bg: "#f0fdf4" };
  if (score >= 75) return { label: "Exceeds Expectations", color: "#2563eb", bg: "#eff6ff" };
  if (score >= 60) return { label: "Meets Expectations", color: "#d97706", bg: "#fffbeb" };
  if (score >= 45) return { label: "Needs Improvement", color: "#ea580c", bg: "#fff7ed" };
  return { label: "Unsatisfactory", color: "#dc2626", bg: "#fef2f2" };
};

const getProgressColor = (pct) => {
  if (pct >= 100) return "#16a34a";
  if (pct >= 75) return "#2563eb";
  if (pct >= 50) return "#d97706";
  return "#dc2626";
};

// ─── Circular Score Ring ─────────────────────────────────────
function ScoreRing({ score, size = 120 }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(score, 100) / 100) * circ;
  const { label, color } = getRatingLabel(score);

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={10} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={10}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center"
      }}>
        <span style={{ fontSize: size * 0.22, fontWeight: 800, color, lineHeight: 1 }}>{score}%</span>
        <span style={{ fontSize: size * 0.09, color: "#6b7280", marginTop: 2, textAlign: "center", padding: "0 8px" }}>{label}</span>
      </div>
    </div>
  );
}

// ─── KPI Progress Bar ────────────────────────────────────────
function KpiBar({ item, actual }) {
  const pct = actual ? Math.min(Math.round((actual / item.target) * 100), 150) : 0;
  const color = getProgressColor(pct);

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <div>
          <span style={{ fontWeight: 600, fontSize: 14, color: "#1f2937" }}>{item.kpi_name}</span>
          <span style={{
            marginLeft: 8, fontSize: 11, fontWeight: 700,
            background: "#f3f4f6", color: "#6b7280", padding: "2px 7px", borderRadius: 4
          }}>{item.weight}% weight</span>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color }}>
            {actual ?? "—"} / {item.target} {item.unit}
          </span>
          <span style={{
            marginLeft: 8, fontSize: 12, fontWeight: 700,
            color: pct >= 100 ? "#16a34a" : "#6b7280"
          }}>{actual ? `${pct}%` : "Pending"}</span>
        </div>
      </div>
      <div style={{ background: "#f3f4f6", borderRadius: 99, height: 10, overflow: "hidden" }}>
        <div style={{
          width: `${Math.min(pct, 100)}%`, height: "100%",
          background: color, borderRadius: 99,
          transition: "width 1s ease"
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 11, color: "#9ca3af", textTransform: "capitalize" }}>{item.frequency}</span>
        {pct >= 100 && <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>✓ Target met!</span>}
      </div>
    </div>
  );
}

// ─── Review History Card ─────────────────────────────────────
function ReviewCard({ review }) {
  const [open, setOpen] = useState(false);
  const { label, color, bg } = getRatingLabel(review.final_score);

  return (
    <div style={{
      border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden",
      marginBottom: 12, background: "#fff"
    }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 18px", cursor: "pointer", background: open ? "#f8fafc" : "#fff"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: bg, display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Star size={18} color={color} />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#1f2937" }}>{review.period}</p>
            <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
              Reviewed on {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color }}>{review.final_score}%</p>
            <p style={{ margin: 0, fontSize: 11, color, fontWeight: 600 }}>{label}</p>
          </div>
          {open ? <ChevronUp size={18} color="#9ca3af" /> : <ChevronDown size={18} color="#9ca3af" />}
        </div>
      </div>
      {open && (
        <div style={{ padding: "0 18px 18px", borderTop: "1px solid #f3f4f6" }}>
          {review.hr_comment && (
            <div style={{
              background: "#f8fafc", borderRadius: 8, padding: "12px 14px", margin: "14px 0 0"
            }}>
              <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#6b7280" }}>HR FEEDBACK</p>
              <p style={{ margin: 0, fontSize: 14, color: "#374151" }}>{review.hr_comment}</p>
            </div>
          )}
          {review.kpi_breakdown && review.kpi_breakdown.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#6b7280" }}>KPI BREAKDOWN</p>
              {review.kpi_breakdown.map((k, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "8px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13
                }}>
                  <span style={{ color: "#374151" }}>{k.kpi_name}</span>
                  <div style={{ display: "flex", gap: 16 }}>
                    <span style={{ color: "#6b7280" }}>{k.actual} / {k.target} {k.unit}</span>
                    <span style={{ fontWeight: 700, color: getProgressColor(Math.round((k.actual / k.target) * 100)) }}>
                      {Math.round((k.actual / k.target) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function MyPerformance() {
  const [assignment, setAssignment] = useState(null);
  const [actuals, setActuals] = useState({});
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("current");
  const employeeId = localStorage.getItem("employeeId");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch current KPI assignment
      const assignRes = await axios.get(`${API_BASE}/api/kpi-assignments/${employeeId}`);
      if (assignRes.data.success && assignRes.data.data) {
        setAssignment(assignRes.data.data);

        // Fetch actuals for this assignment
        const actualsRes = await axios.get(`${API_BASE}/api/kpi-actuals/${assignRes.data.data._id}`);
        if (actualsRes.data.success) {
          // Map actuals by kpi_item_id
          const map = {};
          actualsRes.data.data.forEach(a => { map[a.kpi_item_id] = a.actual_value; });
          setActuals(map);
        }
      }

      // Fetch past reviews
      const reviewRes = await axios.get(`${API_BASE}/api/performance-reviews/${employeeId}`);
      if (reviewRes.data.success) setReviews(reviewRes.data.data);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate current overall score from actuals
  const calcCurrentScore = () => {
    if (!assignment || !assignment.template_id?.kpi_items) return 0;
    let total = 0;
    assignment.template_id.kpi_items.forEach(item => {
      const actual = actuals[item._id] || 0;
      const pct = Math.min((actual / item.target) * 100, 100);
      total += pct * (item.weight / 100);
    });
    return Math.round(total);
  };

  const currentScore = calcCurrentScore();
  const kpiItems = assignment?.template_id?.kpi_items || [];
  const metTargets = kpiItems.filter(item => (actuals[item._id] || 0) >= item.target).length;

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 40, height: 40, border: "4px solid #e5e7eb",
          borderTopColor: "#2563eb", borderRadius: "50%",
          animation: "spin 0.8s linear infinite", margin: "0 auto 12px"
        }} />
        <p style={{ color: "#6b7280", fontSize: 14 }}>Loading performance data...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  return (
    <div style={{
      fontFamily: "'Segoe UI', sans-serif",
      background: "#f4f6fb", minHeight: "100vh", padding: "28px 32px"
    }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a2e" }}>My Performance</h2>
        <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
          Track your KPIs and review history
        </p>
      </div>

      {/* No assignment state */}
      {!assignment ? (
        <div style={{
          background: "#fff", borderRadius: 16, padding: "60px 0",
          textAlign: "center", border: "1px solid #e5e7eb"
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <h3 style={{ color: "#1f2937", marginBottom: 8 }}>No KPIs Assigned Yet</h3>
          <p style={{ color: "#6b7280", fontSize: 14 }}>Your HR team hasn't assigned KPIs to you yet. Check back soon!</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16, marginBottom: 24
          }}>
            {[
              {
                icon: <TrendingUp size={22} color="#2563eb" />,
                bg: "#eff6ff", label: "Current Score",
                value: `${currentScore}%`, sub: getRatingLabel(currentScore).label,
                color: getRatingLabel(currentScore).color
              },
              {
                icon: <Target size={22} color="#16a34a" />,
                bg: "#f0fdf4", label: "KPIs Assigned",
                value: kpiItems.length, sub: "Total KPIs", color: "#16a34a"
              },
              {
                icon: <CheckCircle size={22} color="#16a34a" />,
                bg: "#f0fdf4", label: "Targets Met",
                value: `${metTargets}/${kpiItems.length}`, sub: "This period", color: "#16a34a"
              },
              {
                icon: <Award size={22} color="#d97706" />,
                bg: "#fffbeb", label: "Past Reviews",
                value: reviews.length, sub: "Total reviews", color: "#d97706"
              },
              {
                icon: <Calendar size={22} color="#7c3aed" />,
                bg: "#f5f3ff", label: "Review Period",
                value: assignment.period || "—",
                sub: assignment.template_id?.template_name || "", color: "#7c3aed"
              },
            ].map((card, i) => (
              <div key={i} style={{
                background: "#fff", borderRadius: 12, padding: "18px 20px",
                border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10, background: card.bg,
                  display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12
                }}>{card.icon}</div>
                <p style={{ margin: "0 0 2px", fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{card.label}</p>
                <p style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 800, color: card.color }}>{card.value}</p>
                <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{
            display: "flex", gap: 4, background: "#fff",
            borderRadius: 10, padding: 4, border: "1px solid #e5e7eb",
            marginBottom: 20, width: "fit-content"
          }}>
            {[
              { id: "current", label: "Current KPIs", icon: <BarChart2 size={15} /> },
              { id: "history", label: "Review History", icon: <FileText size={15} /> },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 18px", border: "none", borderRadius: 8, cursor: "pointer",
                fontWeight: 600, fontSize: 13,
                background: activeTab === tab.id ? "#2563eb" : "transparent",
                color: activeTab === tab.id ? "#fff" : "#6b7280",
                transition: "all 0.2s"
              }}>{tab.icon}{tab.label}</button>
            ))}
          </div>

          {/* Current KPIs Tab */}
          {activeTab === "current" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>

              {/* KPI Progress */}
              <div style={{
                background: "#fff", borderRadius: 14, padding: "24px",
                border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
              }}>
                <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>
                  KPI Progress — {assignment.period}
                </h3>
                <p style={{ margin: "0 0 20px", color: "#6b7280", fontSize: 13 }}>
                  {assignment.template_id?.role} · {assignment.template_id?.department}
                </p>

                {kpiItems.length === 0 ? (
                  <p style={{ color: "#9ca3af", textAlign: "center", padding: "40px 0" }}>No KPI items found.</p>
                ) : (
                  kpiItems.map((item) => (
                    <KpiBar key={item._id} item={item} actual={actuals[item._id]} />
                  ))
                )}

                {/* Weight total reminder */}
                <div style={{
                  background: "#f8fafc", borderRadius: 8, padding: "10px 14px",
                  display: "flex", justifyContent: "space-between", marginTop: 8
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Overall Weighted Score</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: getRatingLabel(currentScore).color }}>
                    {currentScore}%
                  </span>
                </div>
              </div>

              {/* Score Ring Panel */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{
                  background: "#fff", borderRadius: 14, padding: 24,
                  border: "1px solid #e5e7eb", textAlign: "center",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
                }}>
                  <p style={{ margin: "0 0 16px", fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>Overall Score</p>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                    <ScoreRing score={currentScore} size={140} />
                  </div>
                  <div style={{
                    background: getRatingLabel(currentScore).bg,
                    borderRadius: 8, padding: "10px 14px"
                  }}>
                    <p style={{ margin: 0, fontWeight: 700, color: getRatingLabel(currentScore).color, fontSize: 14 }}>
                      {getRatingLabel(currentScore).label}
                    </p>
                  </div>
                </div>

                {/* Rating Scale Reference */}
                <div style={{
                  background: "#fff", borderRadius: 14, padding: 20,
                  border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
                }}>
                  <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 13, color: "#1a1a2e" }}>Rating Scale</p>
                  {[
                    { range: "90–100%", label: "Outstanding", color: "#16a34a" },
                    { range: "75–89%", label: "Exceeds Expectations", color: "#2563eb" },
                    { range: "60–74%", label: "Meets Expectations", color: "#d97706" },
                    { range: "45–59%", label: "Needs Improvement", color: "#ea580c" },
                    { range: "< 45%", label: "Unsatisfactory", color: "#dc2626" },
                  ].map((r, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "center", padding: "6px 0",
                      borderBottom: i < 4 ? "1px solid #f3f4f6" : "none"
                    }}>
                      <span style={{ fontSize: 12, color: "#6b7280" }}>{r.range}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: r.color,
                        background: `${r.color}18`, padding: "2px 8px", borderRadius: 4
                      }}>{r.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Review History Tab */}
          {activeTab === "history" && (
            <div style={{
              background: "#fff", borderRadius: 14, padding: 24,
              border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
            }}>
              <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>
                Past Performance Reviews
              </h3>
              {reviews.length === 0 ? (
                <div style={{ textAlign: "center", padding: "50px 0" }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>📊</div>
                  <p style={{ color: "#6b7280" }}>No reviews completed yet. Your first review will appear here.</p>
                </div>
              ) : (
                reviews.map((r, i) => <ReviewCard key={i} review={r} />)
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}