import { useEffect, useState } from "react";
import axios from "axios";
import {
  ClipboardList, CheckCircle, Clock, ChevronDown,
  ChevronUp, Send, AlertCircle, Star
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function SelfAssessment() {
  const [assignment, setAssignment] = useState(null);
  const [existing, setExisting] = useState(null);
  const [form, setForm] = useState({ items: [], overall_comment: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);
  const employeeId = localStorage.getItem("employeeId");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      // Get active assignment with template KPIs
      const assignRes = await axios.get(`${API_BASE}/api/kpi-assignments/${employeeId}`);
      if (assignRes.data.success && assignRes.data.data) {
        const assign = assignRes.data.data;
        setAssignment(assign);

        // Initialize form items from template KPI items
        const kpiItems = assign.template_id?.kpi_items || [];
        const initItems = kpiItems.map(item => ({
          kpi_item_id: item._id,
          kpi_name: item.kpi_name,
          target: item.target,
          unit: item.unit,
          weight: item.weight,
          self_value: "",
          self_comment: ""
        }));

        // Check if already submitted
        const existingRes = await axios.get(
          `${API_BASE}/api/self-assessment/by-assignment/${assign._id}`
        );
        if (existingRes.data.success && existingRes.data.data) {
          const prev = existingRes.data.data;
          setExisting(prev);
          setSubmitted(true);
          // Pre-fill form with existing data
          const filledItems = initItems.map(item => {
            const prevItem = prev.items.find(p => p.kpi_item_id === item.kpi_item_id);
            return prevItem ? { ...item, self_value: prevItem.self_value, self_comment: prevItem.self_comment || "" } : item;
          });
          setForm({ items: filledItems, overall_comment: prev.overall_comment || "" });
        } else {
          setForm({ items: initItems, overall_comment: "" });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleItemChange = (idx, field, value) => {
    setForm(f => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...f, items };
    });
  };

  const getProgress = (item) => {
    if (!item.self_value || !item.target) return 0;
    return Math.min(Math.round((parseFloat(item.self_value) / item.target) * 100), 150);
  };

  const getProgressColor = (pct) => {
    if (pct >= 100) return "#16a34a";
    if (pct >= 75) return "#2563eb";
    if (pct >= 50) return "#d97706";
    return "#dc2626";
  };

  const isFormValid = () => {
    return form.items.every(item => item.self_value !== "" && item.self_value !== null);
  };

  const calcOverallScore = () => {
    if (!form.items.length) return 0;
    let total = 0;
    form.items.forEach(item => {
      const pct = Math.min((parseFloat(item.self_value) / item.target) * 100, 100);
      total += (isNaN(pct) ? 0 : pct) * (item.weight / 100);
    });
    return Math.round(total);
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return showToast("Please fill all KPI values", "error");
    setSaving(true);
    try {
      const payload = {
        employee_id: employeeId,
        assignment_id: assignment._id,
        period: assignment.period,
        items: form.items.map(i => ({
          kpi_item_id: i.kpi_item_id,
          kpi_name: i.kpi_name,
          target: i.target,
          unit: i.unit,
          self_value: parseFloat(i.self_value),
          self_comment: i.self_comment
        })),
        overall_comment: form.overall_comment
      };

      const res = await axios.post(`${API_BASE}/api/self-assessment`, payload);
      if (res.data.success) {
        showToast(res.data.updated ? "Assessment updated successfully!" : "Self assessment submitted!");
        setSubmitted(true);
        setExisting(res.data.data);
      } else {
        showToast(res.data.message || "Submission failed", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Server error", "error");
    } finally {
      setSaving(false);
    }
  };

  const overallScore = calcOverallScore();

  const getRatingLabel = (score) => {
    if (score >= 90) return { label: "Outstanding", color: "#16a34a" };
    if (score >= 75) return { label: "Exceeds Expectations", color: "#2563eb" };
    if (score >= 60) return { label: "Meets Expectations", color: "#d97706" };
    if (score >= 45) return { label: "Needs Improvement", color: "#ea580c" };
    return { label: "Unsatisfactory", color: "#dc2626" };
  };

  // ── Loading ──────────────────────────────────────────
  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 40, height: 40, border: "4px solid #e5e7eb",
          borderTopColor: "#2563eb", borderRadius: "50%",
          animation: "spin 0.8s linear infinite", margin: "0 auto 12px"
        }} />
        <p style={{ color: "#6b7280", fontSize: 14 }}>Loading assessment...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  // ── No Assignment ────────────────────────────────────
  if (!assignment) return (
    <div style={{ padding: "28px 32px", fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: "60px 0",
        textAlign: "center", border: "1px solid #e5e7eb"
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
        <h3 style={{ color: "#1f2937", marginBottom: 8 }}>No KPIs Assigned Yet</h3>
        <p style={{ color: "#6b7280", fontSize: 14 }}>Your HR team hasn't assigned KPIs to you yet.</p>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: "#f4f6fb", minHeight: "100vh", padding: "28px 32px" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 24, zIndex: 9999,
          background: toast.type === "error" ? "#ff4d4f" : "#52c41a",
          color: "#fff", padding: "12px 20px", borderRadius: 8,
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)", fontWeight: 500, fontSize: 14
        }}>{toast.msg}</div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a2e" }}>Self Assessment</h2>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
            {assignment.period} · {assignment.template_id?.role} · {assignment.template_id?.department}
          </p>
        </div>
        {submitted && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#f0fdf4", border: "1px solid #bbf7d0",
            borderRadius: 8, padding: "8px 14px"
          }}>
            <CheckCircle size={16} color="#16a34a" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#16a34a" }}>Submitted</span>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>

        {/* LEFT — KPI Form */}
        <div>

          {/* Info Banner */}
          <div style={{
            background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10,
            padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start"
          }}>
            <AlertCircle size={18} color="#2563eb" style={{ marginTop: 1, flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 13, color: "#1e40af", lineHeight: 1.5 }}>
              Rate yourself honestly for each KPI. Enter your actual achievement value and optionally add a comment explaining your performance.
              {submitted && " You can update and resubmit before HR finalizes the review."}
            </p>
          </div>

          {/* KPI Items */}
          {form.items.map((item, idx) => {
            const pct = getProgress(item);
            const color = getProgressColor(pct);
            const isOpen = expandedItem === idx;

            return (
              <div key={idx} style={{
                background: "#fff", borderRadius: 12, marginBottom: 14,
                border: `1px solid ${item.self_value !== "" ? "#e5e7eb" : "#fde68a"}`,
                overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
              }}>
                {/* KPI Header */}
                <div
                  onClick={() => setExpandedItem(isOpen ? null : idx)}
                  style={{
                    padding: "16px 20px", cursor: "pointer",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: isOpen ? "#f8fafc" : "#fff"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: item.self_value !== "" ? "#f0fdf4" : "#fffbeb",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16
                    }}>
                      {item.self_value !== "" ? "✅" : "⏳"}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#1f2937" }}>{item.kpi_name}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
                        Target: {item.target} {item.unit} · Weight: {item.weight}%
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {item.self_value !== "" && (
                      <div style={{ textAlign: "right" }}>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color }}>{pct}%</p>
                        <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>{item.self_value} / {item.target}</p>
                      </div>
                    )}
                    {isOpen ? <ChevronUp size={18} color="#9ca3af" /> : <ChevronDown size={18} color="#9ca3af" />}
                  </div>
                </div>

                {/* Progress Bar (if value entered) */}
                {item.self_value !== "" && (
                  <div style={{ padding: "0 20px 4px" }}>
                    <div style={{ background: "#f3f4f6", borderRadius: 99, height: 6, overflow: "hidden" }}>
                      <div style={{
                        width: `${Math.min(pct, 100)}%`, height: "100%",
                        background: color, borderRadius: 99, transition: "width 0.5s ease"
                      }} />
                    </div>
                  </div>
                )}

                {/* Expanded Form */}
                {isOpen && (
                  <div style={{ padding: "16px 20px", borderTop: "1px solid #f3f4f6" }}>
                    <div style={{ marginBottom: 14 }}>
                      <label style={labelStyle}>Your Achievement *</label>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <input
                          type="number"
                          value={item.self_value}
                          onChange={e => handleItemChange(idx, "self_value", e.target.value)}
                          placeholder={`e.g. ${item.target}`}
                          min="0"
                          style={{ ...inputStyle, maxWidth: 160 }}
                        />
                        <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>{item.unit}</span>
                        <span style={{ fontSize: 13, color: "#9ca3af" }}>out of target {item.target} {item.unit}</span>
                      </div>
                    </div>

                    {/* Live feedback */}
                    {item.self_value !== "" && (
                      <div style={{
                        background: `${color}15`, borderRadius: 8,
                        padding: "8px 12px", marginBottom: 14,
                        display: "flex", justifyContent: "space-between", alignItems: "center"
                      }}>
                        <span style={{ fontSize: 13, color, fontWeight: 600 }}>
                          {pct >= 100 ? "🎉 Target exceeded!" : pct >= 75 ? "👍 Good progress!" : pct >= 50 ? "⚠️ Needs more effort" : "🔴 Below target"}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 800, color }}>{pct}%</span>
                      </div>
                    )}

                    <div>
                      <label style={labelStyle}>Comment (Optional)</label>
                      <textarea
                        value={item.self_comment}
                        onChange={e => handleItemChange(idx, "self_comment", e.target.value)}
                        placeholder="Explain your achievement, challenges faced, or any context..."
                        rows={3}
                        style={{ ...inputStyle, resize: "vertical" }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Overall Comment */}
          <div style={{
            background: "#fff", borderRadius: 12, padding: "20px",
            border: "1px solid #e5e7eb", marginBottom: 20
          }}>
            <label style={{ ...labelStyle, fontSize: 14 }}>
              Overall Comment for this Period
            </label>
            <textarea
              value={form.overall_comment}
              onChange={e => setForm(f => ({ ...f, overall_comment: e.target.value }))}
              placeholder="Summarize your overall performance this period, key achievements, challenges, and goals for next period..."
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={saving || !isFormValid()}
            style={{
              width: "100%", padding: "14px 0", border: "none", borderRadius: 10,
              background: saving || !isFormValid() ? "#93c5fd" : "#2563eb",
              color: "#fff", fontWeight: 700, fontSize: 15,
              cursor: saving || !isFormValid() ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8
            }}
          >
            <Send size={18} />
            {saving ? "Submitting..." : submitted ? "Update & Resubmit" : "Submit Self Assessment"}
          </button>

          {!isFormValid() && (
            <p style={{ textAlign: "center", fontSize: 12, color: "#f59e0b", marginTop: 8 }}>
              ⚠️ Please fill in all KPI achievement values before submitting
            </p>
          )}
        </div>

        {/* RIGHT — Summary Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Score Preview */}
          <div style={{
            background: "#fff", borderRadius: 14, padding: 20,
            border: "1px solid #e5e7eb", textAlign: "center"
          }}>
            <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>
              Your Self Score
            </p>
            <div style={{
              fontSize: 52, fontWeight: 900,
              color: getRatingLabel(overallScore).color, lineHeight: 1
            }}>{overallScore}%</div>
            <p style={{
              margin: "8px 0 12px", fontSize: 13, fontWeight: 700,
              color: getRatingLabel(overallScore).color
            }}>{getRatingLabel(overallScore).label}</p>
            <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>
              Based on your self-reported values
            </p>
          </div>

          {/* KPI Completion Status */}
          <div style={{
            background: "#fff", borderRadius: 14, padding: 20,
            border: "1px solid #e5e7eb"
          }}>
            <p style={{ margin: "0 0 14px", fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>
              Completion Status
            </p>
            {form.items.map((item, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 0", borderBottom: i < form.items.length - 1 ? "1px solid #f3f4f6" : "none"
              }}>
                <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{item.kpi_name}</span>
                <span style={{ fontSize: 13 }}>
                  {item.self_value !== "" ? (
                    <span style={{ color: "#16a34a", fontWeight: 700 }}>✓ {item.self_value} {item.unit}</span>
                  ) : (
                    <span style={{ color: "#f59e0b", fontWeight: 600 }}>Pending</span>
                  )}
                </span>
              </div>
            ))}
            <div style={{
              marginTop: 12, padding: "8px 12px",
              background: "#f8fafc", borderRadius: 8,
              display: "flex", justifyContent: "space-between"
            }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>Filled</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#2563eb" }}>
                {form.items.filter(i => i.self_value !== "").length} / {form.items.length}
              </span>
            </div>
          </div>

          {/* Submission Info */}
          <div style={{
            background: submitted ? "#f0fdf4" : "#fffbeb",
            border: `1px solid ${submitted ? "#bbf7d0" : "#fde68a"}`,
            borderRadius: 14, padding: 16
          }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              {submitted
                ? <CheckCircle size={18} color="#16a34a" />
                : <Clock size={18} color="#d97706" />
              }
              <span style={{ fontWeight: 700, fontSize: 13, color: submitted ? "#16a34a" : "#d97706" }}>
                {submitted ? "Assessment Submitted" : "Not Yet Submitted"}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>
              {submitted
                ? `Submitted for ${assignment.period}. HR will review and finalize your score.`
                : "Fill all KPI values and submit. HR will review your assessment."}
            </p>
          </div>

          {/* Period Info */}
          <div style={{
            background: "#fff", borderRadius: 14, padding: 16,
            border: "1px solid #e5e7eb"
          }}>
            <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 13, color: "#1a1a2e" }}>Period Details</p>
            {[
              { label: "Period", value: assignment.period },
              { label: "Role", value: assignment.template_id?.role },
              { label: "Department", value: assignment.template_id?.department },
              { label: "Total KPIs", value: form.items.length },
            ].map((d, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between",
                padding: "6px 0", borderBottom: i < 3 ? "1px solid #f3f4f6" : "none",
                fontSize: 13
              }}>
                <span style={{ color: "#6b7280" }}>{d.label}</span>
                <span style={{ fontWeight: 600, color: "#1f2937" }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 };
const inputStyle = {
  width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8,
  fontSize: 13, color: "#1a1a2e", background: "#fff", boxSizing: "border-box", outline: "none"
};