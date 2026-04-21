import { useState, useEffect } from "react";
import axios from "axios";
import EmployeeLayout from "./EmployeeLayout";
import {
  TrendingUp, Award, Calendar, ChevronRight,
  Star, ArrowUpRight, Clock, CheckCircle, X
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const RATING_COLORS = {
  Excellent: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  Good:      { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  Average:   { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
  Poor:      { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  "":        { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" },
};

const Modal = ({ children, onClose }) => (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
    zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center",
    padding: 16,
  }} onClick={onClose}>
    <div onClick={e => e.stopPropagation()} style={{
      background: "#fff", borderRadius: 16, width: "100%", maxWidth: 560,
      maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    }}>
      {children}
    </div>
  </div>
);

export default function EmployeeAppraisal() {
  const [appraisals, setAppraisals] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState(null);

  const employeeId = localStorage.getItem("employeeId");

  useEffect(() => {
    const fetchData = async () => {
      if (!employeeId) { setLoading(false); return; }
      try {
        const res = await axios.get(`${API_BASE}/api/appraisals/employee/${employeeId}`);
        setAppraisals(res.data?.data || res.data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const latest = appraisals[0];

  if (loading) return (
    <EmployeeLayout>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #2563eb", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ color: "#6b7280", fontSize: 13 }}>Loading appraisals...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    </EmployeeLayout>
  );

  return (
    <EmployeeLayout>
      <div style={{
        padding: "28px 24px", background: "#f8fafc", minHeight: "100vh",
        fontFamily: "'DM Sans', sans-serif", maxWidth: 900, margin: "0 auto",
      }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#111827" }}>My Appraisals</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9ca3af" }}>
            View your performance appraisal history
          </p>
        </div>

        {/* Latest Appraisal Highlight */}
        {latest && (
          <div style={{
            background: "linear-gradient(135deg, #1e40af, #2563eb)",
            borderRadius: 16, padding: "24px 28px", marginBottom: 24, color: "#fff",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: -30, right: -30,
              width: 160, height: 160, borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
            }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, opacity: 0.7, marginBottom: 8, textTransform: "uppercase" }}>
                Latest Appraisal
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{latest.title}</div>
              <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 20 }}>
                {latest.appraisal_type} •{" "}
                {latest.period_from ? new Date(latest.period_from).toLocaleDateString("en-IN") : ""} —{" "}
                {latest.period_to   ? new Date(latest.period_to).toLocaleDateString("en-IN")   : ""}
              </div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {[
                  { label: "Performance Score", value: `${latest.performance_score || 0}%` },
                  { label: "HR Rating",         value: latest.hr_rating || "—"             },
                  { label: "Increment",         value: latest.increment_percent > 0 ? `+${latest.increment_percent}%` : "—" },
                  { label: "Promotion",         value: latest.promotion ? "Yes ✅" : "No"  },
                ].map((s, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 16px" }}>
                    <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 600, textTransform: "uppercase", marginBottom: 3 }}>{s.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No appraisals */}
        {appraisals.length === 0 && (
          <div style={{
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14,
            padding: "60px 20px", textAlign: "center",
          }}>
            <Award size={48} color="#e5e7eb" style={{ display: "block", margin: "0 auto 12px" }} />
            <p style={{ color: "#6b7280", fontSize: 14, fontWeight: 500 }}>
              No appraisals published yet
            </p>
            <p style={{ color: "#9ca3af", fontSize: 12 }}>
              Once HR publishes your appraisal, it will appear here
            </p>
          </div>
        )}

        {/* Appraisal Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {appraisals.map((a, i) => {
            const rStyle = RATING_COLORS[a.hr_rating || ""] || RATING_COLORS[""];
            return (
              <div key={a._id} style={{
                background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14,
                padding: "18px 20px", cursor: "pointer",
                transition: "box-shadow 0.2s, transform 0.15s",
              }}
                onClick={() => setSelected(a)}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: i === 0 ? "#fef3c7" : "#f3f4f6",
                        color: i === 0 ? "#d97706" : "#374151",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 700, flexShrink: 0,
                      }}>{i + 1}</span>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111827" }}>{a.title}</h3>
                      {a.hr_rating && (
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: "3px 10px",
                          borderRadius: 99, background: rStyle.bg,
                          color: rStyle.color, border: `1px solid ${rStyle.border}`,
                        }}>{a.hr_rating}</span>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
                        <Calendar size={12} /> {a.appraisal_type}
                      </span>
                      <span style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={12} />
                        {a.period_from ? new Date(a.period_from).toLocaleDateString("en-IN") : ""}
                        {" → "}
                        {a.period_to   ? new Date(a.period_to).toLocaleDateString("en-IN")   : ""}
                      </span>
                      {a.increment_percent > 0 && (
                        <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                          <ArrowUpRight size={12} /> +{a.increment_percent}% Increment
                        </span>
                      )}
                      {a.promotion && (
                        <span style={{ fontSize: 12, color: "#7c3aed", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                          <Star size={12} /> Promoted
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={18} color="#9ca3af" style={{ flexShrink: 0, marginTop: 4 }} />
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>Performance Score</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>{a.performance_score || 0}%</span>
                  </div>
                  <div style={{ height: 6, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{
                      width: `${a.performance_score || 0}%`, height: "100%",
                      background: a.performance_score >= 80 ? "#16a34a" : a.performance_score >= 60 ? "#2563eb" : "#d97706",
                      borderRadius: 99, transition: "width 0.6s ease",
                    }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail Modal */}
        {selected && (
          <Modal onClose={() => setSelected(null)}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111827" }}>{selected.title}</h2>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} color="#6b7280" />
              </button>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[
                  { label: "Appraisal Type",   value: selected.appraisal_type },
                  { label: "Status",            value: selected.status },
                  { label: "Period From",       value: selected.period_from ? new Date(selected.period_from).toLocaleDateString("en-IN") : "—" },
                  { label: "Period To",         value: selected.period_to   ? new Date(selected.period_to).toLocaleDateString("en-IN")   : "—" },
                  { label: "Performance Score", value: `${selected.performance_score || 0}%` },
                  { label: "HR Rating",         value: selected.hr_rating || "—" },
                  { label: "Increment",         value: selected.increment_percent > 0 ? `+${selected.increment_percent}%` : "—" },
                  { label: "Promotion",         value: selected.promotion ? `Yes${selected.new_designation ? ` → ${selected.new_designation}` : ""}` : "No" },
                ].map((item, i) => (
                  <div key={i} style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{item.value}</div>
                  </div>
                ))}
                {selected.remarks && (
                  <div style={{ gridColumn: "1/-1", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "14px" }}>
                    <div style={{ fontSize: 10, color: "#92400e", fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>HR Remarks</div>
                    <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{selected.remarks}</div>
                  </div>
                )}
              </div>
            </div>
          </Modal>
        )}
      </div>
    </EmployeeLayout>
  );
}