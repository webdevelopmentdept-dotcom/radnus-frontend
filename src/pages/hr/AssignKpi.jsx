import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const PERIOD_TYPES = ["monthly", "quarterly", "annual"];

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
const YEARS = ["2025", "2026", "2027"];
const QUARTERS = ["Q1","Q2","Q3","Q4"];

export default function AssignKpi() {
  const [employees, setEmployees] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [form, setForm] = useState({
    employee_id: "",
    template_id: "",
    period_type: "monthly",
    month: "March",
    year: "2026",
    quarter: "Q1",
    notes: ""
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [empRes, tplRes, assignRes] = await Promise.all([
        axios.get(`${API_BASE}/api/hr/approved`),
        axios.get(`${API_BASE}/api/kpi-templates`),
        axios.get(`${API_BASE}/api/kpi-assignments`)
      ]);
      if (empRes.data) setEmployees(empRes.data);
      if (tplRes.data.success) setTemplates(tplRes.data.data);
      if (assignRes.data.success) setAssignments(assignRes.data.data);
    } catch (err) {
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getPeriodLabel = () => {
    if (form.period_type === "monthly") return `${form.month} ${form.year}`;
    if (form.period_type === "quarterly") return `${form.quarter} ${form.year}`;
    return `Annual ${form.year}`;
  };

  const handleTemplateChange = (id) => {
    setForm(f => ({ ...f, template_id: id }));
    const tpl = templates.find(t => t._id === id);
    setSelectedTemplate(tpl || null);
  };

  const handleSubmit = async () => {
    if (!form.employee_id || !form.template_id) {
      return showToast("Please select employee and template", "error");
    }
    setSaving(true);
    try {
      const payload = {
        employee_id: form.employee_id,
        template_id: form.template_id,
        period: getPeriodLabel(),
        period_type: form.period_type,
        notes: form.notes
      };
      const res = await axios.post(`${API_BASE}/api/kpi-assignments`, payload);
      if (res.data.success) {
        showToast("KPI assigned successfully!");
        setShowModal(false);
        setForm({ employee_id: "", template_id: "", period_type: "monthly", month: "March", year: "2026", quarter: "Q1", notes: "" });
        setSelectedTemplate(null);
        fetchAll();
      } else {
        showToast(res.data.message || "Error assigning KPI", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Server error", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      const res = await axios.delete(`${API_BASE}/api/kpi-assignments/${id}`);
      if (res.data.success) { showToast("Assignment cancelled"); fetchAll(); }
    } catch { showToast("Failed to cancel", "error"); }
    setDeleteConfirm(null);
  };

  const getStatusStyle = (status) => {
    if (status === "active") return { color: "#16a34a", bg: "#f0fdf4" };
    if (status === "completed") return { color: "#2563eb", bg: "#eff6ff" };
    return { color: "#ef4444", bg: "#fef2f2" };
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", background: "#f4f6fb", padding: "28px 32px" }}>

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1a1a2e" }}>Assign KPIs</h2>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>Link KPI templates to employees</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          background: "#2563eb", color: "#fff", border: "none", borderRadius: 8,
          padding: "10px 20px", fontWeight: 600, fontSize: 14, cursor: "pointer"
        }}>+ Assign KPI</button>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Assignments", value: assignments.length, color: "#2563eb", bg: "#eff6ff" },
          { label: "Active", value: assignments.filter(a => a.status === "active").length, color: "#16a34a", bg: "#f0fdf4" },
          { label: "Completed", value: assignments.filter(a => a.status === "completed").length, color: "#d97706", bg: "#fffbeb" },
        ].map((s, i) => (
          <div key={i} style={{
            background: "#fff", borderRadius: 12, padding: "18px 20px",
            border: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</p>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
              {i === 0 ? "📋" : i === 1 ? "✅" : "🏁"}
            </div>
          </div>
        ))}
      </div>

      {/* Assignments Table */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #f3f4f6" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>All Assignments</h3>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "#6b7280" }}>Loading...</div>
        ) : assignments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "56px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
            <p style={{ color: "#6b7280" }}>No KPIs assigned yet. Click "Assign KPI" to get started.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Employee", "Department", "Template", "Period", "Assigned On", "Status", "Action"].map(h => (
                    <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontWeight: 700, color: "#374151", borderBottom: "2px solid #e5e7eb", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assignments.map((a, i) => {
                  const st = getStatusStyle(a.status);
                  return (
                    <tr key={a._id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: "50%", background: "#eff6ff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 700, color: "#2563eb", fontSize: 14
                          }}>
                            {a.employee_id?.name?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 600, color: "#1a1a2e" }}>{a.employee_id?.name || "Unknown"}</p>
                            <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{a.employee_id?.email || ""}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px", color: "#374151" }}>{a.employee_id?.department || "—"}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <p style={{ margin: 0, fontWeight: 600, color: "#1a1a2e" }}>{a.template_id?.template_name || "—"}</p>
                        <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{a.template_id?.role || ""}</p>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{
                          background: "#f3f4f6", color: "#374151", fontWeight: 600,
                          padding: "4px 10px", borderRadius: 6, fontSize: 13
                        }}>{a.period}</span>
                      </td>
                      <td style={{ padding: "14px 20px", color: "#6b7280", fontSize: 13 }}>
                        {new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{
                          background: st.bg, color: st.color, fontWeight: 700,
                          padding: "4px 12px", borderRadius: 20, fontSize: 12, textTransform: "capitalize"
                        }}>{a.status}</span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        {a.status === "active" && (
                          <button onClick={() => setDeleteConfirm(a._id)} style={{
                            background: "#fff5f5", color: "#ef4444", border: "1px solid #fecaca",
                            borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer"
                          }}>Cancel</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20
        }}>
          <div style={{
            background: "#fff", borderRadius: 14, width: "100%", maxWidth: 580,
            maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
          }}>
            {/* Modal Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1a1a2e" }}>Assign KPI to Employee</h3>
              <button onClick={() => { setShowModal(false); setSelectedTemplate(null); }} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280" }}>✕</button>
            </div>

            <div style={{ padding: 24 }}>

              {/* Step 1 - Select Employee */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>1. Select Employee *</label>
                <select value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))} style={inputStyle}>
                  <option value="">-- Choose Employee --</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} — {emp.designation} ({emp.department})
                    </option>
                  ))}
                </select>
                <p style={{ margin: "5px 0 0", fontSize: 12, color: "#9ca3af" }}>Only approved employees are shown</p>
              </div>

              {/* Step 2 - Select Template */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>2. Select KPI Template *</label>
                <select value={form.template_id} onChange={e => handleTemplateChange(e.target.value)} style={inputStyle}>
                  <option value="">-- Choose Template --</option>
                  {templates.map(t => (
                    <option key={t._id} value={t._id}>
                      {t.template_name} — {t.role} ({t.department})
                    </option>
                  ))}
                </select>
              </div>

              {/* Template Preview */}
              {selectedTemplate && (
                <div style={{
                  background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10,
                  padding: 16, marginBottom: 20
                }}>
                  <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 13, color: "#0369a1" }}>
                    📋 Template Preview — {selectedTemplate.kpi_items?.length} KPIs
                  </p>
                  {selectedTemplate.kpi_items?.map((item, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between",
                      padding: "6px 0", borderBottom: "1px solid #e0f2fe", fontSize: 13
                    }}>
                      <span style={{ color: "#1e40af", fontWeight: 500 }}>{item.kpi_name}</span>
                      <div style={{ display: "flex", gap: 12 }}>
                        <span style={{ color: "#6b7280" }}>Target: {item.target} {item.unit}</span>
                        <span style={{ fontWeight: 700, color: "#0369a1" }}>{item.weight}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Step 3 - Period */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>3. Review Period *</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  {PERIOD_TYPES.map(pt => (
                    <button key={pt} onClick={() => setForm(f => ({ ...f, period_type: pt }))} style={{
                      padding: "7px 16px", border: "2px solid",
                      borderColor: form.period_type === pt ? "#2563eb" : "#e5e7eb",
                      borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13,
                      background: form.period_type === pt ? "#eff6ff" : "#fff",
                      color: form.period_type === pt ? "#2563eb" : "#6b7280",
                      textTransform: "capitalize"
                    }}>{pt}</button>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {form.period_type === "monthly" && (
                    <select value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} style={inputStyle}>
                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  )}
                  {form.period_type === "quarterly" && (
                    <select value={form.quarter} onChange={e => setForm(f => ({ ...f, quarter: e.target.value }))} style={inputStyle}>
                      {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
                    </select>
                  )}
                  {form.period_type === "annual" && (
                    <div style={{ ...inputStyle, background: "#f8fafc", color: "#6b7280", display: "flex", alignItems: "center" }}>Annual</div>
                  )}
                  <select value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} style={inputStyle}>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                {/* Period Preview */}
                <div style={{
                  marginTop: 10, background: "#f8fafc", borderRadius: 8,
                  padding: "10px 14px", display: "flex", justifyContent: "space-between"
                }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>Period will be saved as:</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{getPeriodLabel()}</span>
                </div>
              </div>

              {/* Step 4 - Notes */}
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>4. Notes (Optional)</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any special instructions or targets for this employee..."
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              {/* Footer Buttons */}
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={() => { setShowModal(false); setSelectedTemplate(null); }} style={{
                  padding: "10px 24px", border: "1px solid #e5e7eb", borderRadius: 8,
                  background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer"
                }}>Cancel</button>
                <button onClick={handleSubmit} disabled={saving} style={{
                  padding: "10px 28px", border: "none", borderRadius: 8,
                  background: saving ? "#93c5fd" : "#2563eb", color: "#fff",
                  fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 14
                }}>{saving ? "Assigning..." : "Assign KPI"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirm */}
      {deleteConfirm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{
            background: "#fff", borderRadius: 12, padding: 28,
            maxWidth: 360, width: "100%", textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ margin: "0 0 8px", color: "#1a1a2e" }}>Cancel Assignment?</h3>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>
              The employee will no longer see this KPI assignment.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{
                flex: 1, padding: "10px 0", border: "1px solid #e5e7eb",
                borderRadius: 8, background: "#fff", fontWeight: 600, cursor: "pointer"
              }}>Keep It</button>
              <button onClick={() => handleCancel(deleteConfirm)} style={{
                flex: 1, padding: "10px 0", border: "none", borderRadius: 8,
                background: "#ef4444", color: "#fff", fontWeight: 700, cursor: "pointer"
              }}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 7 };
const inputStyle = {
  width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8,
  fontSize: 13, color: "#1a1a2e", background: "#fff", boxSizing: "border-box", outline: "none"
};