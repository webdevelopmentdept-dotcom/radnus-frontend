// pages/hr/dashboard/grading/DeptGradeSalary.jsx — FIXED VERSION
// Bug fix: department_id after populate becomes {_id, name, status} object
// So _deptId extraction must handle both object and string cases

import { useEffect, useState } from "react";

const API       = `${import.meta.env.VITE_API_BASE_URL}/api/dept-grade-salary`;
const DEPT_API  = `${import.meta.env.VITE_API_BASE_URL}/api/departments`;
const GRADE_API = `${import.meta.env.VITE_API_BASE_URL}/api/grade-master`;

const fmt = (v) => v ? `₹${Number(v).toLocaleString("en-IN")}` : "—";

// ── KEY FIX: extract dept _id whether populated (object) or raw (string/ObjectId)
const extractDeptId = (department_id) => {
  if (!department_id) return "";
  // After populate → { _id: "...", name: "...", status: "..." }
  if (typeof department_id === "object" && department_id._id)
    return department_id._id.toString();
  // Raw ObjectId or string
  return department_id.toString();
};

export default function DeptGradeSalary() {
  const [records,     setRecords]     = useState([]);
  const [departments, setDepartments] = useState([]);
  const [grades,      setGrades]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [selDept,     setSelDept]     = useState("");
  const [showModal,   setShowModal]   = useState(false);
  const [editingId,   setEditingId]   = useState(null);
  const [toast,       setToast]       = useState(null);
  const [saving,      setSaving]      = useState(false);

  const [form, setForm] = useState({
    department_id: "", department_name: "",
    grade_id: "", grade_level: "",
    posting: "",
    years_in_role: "",
    salary_band_min: "", salary_band_mid: "", salary_band_max: "",
    promotion_timeline: "", notes: "",
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [rRes, dRes, gRes] = await Promise.all([
        fetch(API),
        fetch(`${DEPT_API}?status=active`),
        fetch(GRADE_API),
      ]);
      const r = await rRes.json();
      const d = await dRes.json();
      const g = await gRes.json();

      // ── FIXED: handle both populated object and raw string ──────────────
      const recs = (r.data || []).map(rec => ({
        ...rec,
        _deptId: extractDeptId(rec.department_id),
      }));

      // Debug: log to verify
      console.log("📦 DGS records:", recs.map(r => ({
        _deptId: r._deptId,
        grade: r.grade_level,
        dept_name: r.department_name,
      })));

      setRecords(recs);

      const deptList = (d.data || d || []).filter(x => x.status === "active");
      setDepartments(deptList);

      const sortedGrades = (g.data || []).sort(
        (a, b) => parseInt(a.level.replace("L", "")) - parseInt(b.level.replace("L", ""))
      );
      setGrades(sortedGrades);

      // Auto-select first dept if none selected
      if (!selDept && deptList.length > 0) {
        setSelDept(deptList[0]._id.toString());
      }
    } catch (err) {
      console.error("fetchAll error:", err);
      showToast("Failed to load data", "error");
    } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!form.department_id || !form.grade_id)
      return showToast("Select department and grade", "error");
    setSaving(true);
    try {
      const url    = editingId ? `${API}/${editingId}` : API;
      const method = editingId ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        showToast(editingId ? "Updated!" : "Salary band saved!");
        fetchAll();
        closeModal();
      } else showToast(data.message || "Error", "error");
    } catch { showToast("Server error", "error"); }
    finally  { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this salary band?")) return;
    try {
      await fetch(`${API}/${id}`, { method: "DELETE" });
      showToast("Deleted"); fetchAll();
    } catch { showToast("Error", "error"); }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const closeModal = () => {
    setShowModal(false); setEditingId(null);
    setForm({
      department_id: "", department_name: "",
      grade_id: "", grade_level: "",
      posting: "", years_in_role: "",
      salary_band_min: "", salary_band_mid: "",
      salary_band_max: "", promotion_timeline: "", notes: "",
    });
  };

  const openCreate = (deptId) => {
    const dept = departments.find(d => d._id?.toString() === deptId?.toString());
    setForm(f => ({ ...f, department_id: deptId, department_name: dept?.name || "" }));
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (rec) => {
    setForm({
      department_id:      extractDeptId(rec.department_id),
      department_name:    rec.department_name
        || (typeof rec.department_id === "object" ? rec.department_id?.name : "") || "",
      grade_id:           rec.grade_id?._id || rec.grade_id,
      grade_level:        rec.grade_level || rec.grade_id?.level || "",
      posting:            rec.posting || "",
      years_in_role:      rec.years_in_role || "",
      salary_band_min:    rec.salary_band_min || "",
      salary_band_mid:    rec.salary_band_mid || "",
      salary_band_max:    rec.salary_band_max || "",
      promotion_timeline: rec.promotion_timeline || "",
      notes:              rec.notes || "",
    });
    setEditingId(rec._id);
    setShowModal(true);
  };

  // ── FIXED filter: compare _deptId (always string) with selDept (always string)
  const deptRecords = records
    .filter(r => selDept ? r._deptId === selDept.toString() : true)
    .sort((a, b) => {
      const aL = parseInt((a.grade_level || a.grade_id?.level || "L0").replace("L", ""));
      const bL = parseInt((b.grade_level || b.grade_id?.level || "L0").replace("L", ""));
      return aL - bL;
    });

  // Count records per dept tab badge
  const countForDept = (dId) =>
    records.filter(r => r._deptId === dId?.toString()).length;

  const selDeptName = departments.find(
    d => d._id?.toString() === selDept?.toString()
  )?.name || "";

  return (
    <div style={{
      padding: 28, fontFamily: "'Segoe UI', sans-serif",
      minHeight: "100vh", background: "#f4f6fb",
    }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 16, zIndex: 9999,
          background: toast.type === "error" ? "#ff4d4f" : "#52c41a",
          color: "#fff", padding: "12px 20px", borderRadius: 8,
          fontWeight: 500, fontSize: 14,
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        }}>
          {toast.type === "error" ? "⚠️ " : "✅ "}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 24,
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1a1a2e" }}>
            Department Salary Bands
          </h2>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
            Set department-specific salary ranges per grade level (A / B / C scale)
          </p>
        </div>
        <button onClick={() => openCreate(selDept)} style={{
          background: "#2563eb", color: "#fff", border: "none",
          borderRadius: 8, padding: "10px 20px", fontWeight: 600,
          fontSize: 14, cursor: "pointer",
        }}>
          + Add Salary Band
        </button>
      </div>

      {/* Department Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {departments.map(d => {
          const isActive = d._id?.toString() === selDept?.toString();
          const count    = countForDept(d._id);
          return (
            <button key={d._id} onClick={() => setSelDept(d._id?.toString())}
              style={{
                padding: "8px 18px", borderRadius: 20,
                border: isActive ? "2px solid #2563eb" : "1px solid #e5e7eb",
                background: isActive ? "#2563eb" : "#fff",
                color: isActive ? "#fff" : "#374151",
                fontWeight: 600, fontSize: 13, cursor: "pointer",
                whiteSpace: "nowrap", transition: "all 0.15s",
              }}>
              {d.name}
              {/* Always show badge — 0 also shown to confirm filtering is right */}
              <span style={{
                marginLeft: 6,
                background: isActive ? "rgba(255,255,255,0.3)" : (count > 0 ? "#eff6ff" : "#f3f4f6"),
                color: isActive ? "#fff" : (count > 0 ? "#2563eb" : "#9ca3af"),
                borderRadius: 10, padding: "1px 7px",
                fontSize: 11, fontWeight: 700,
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
          Loading...
        </div>
      ) : selDept ? (
        <div style={{
          background: "#fff", borderRadius: 14,
          border: "1px solid #e5e7eb", overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>

          {/* Dark Header */}
          <div style={{
            background: "#1a1a2e", padding: "16px 24px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <h3 style={{ margin: 0, color: "#fff", fontSize: 16, fontWeight: 700 }}>
                {selDeptName} — Career Growth Plan
              </h3>
              <p style={{ margin: "3px 0 0", color: "#9ca3af", fontSize: 12 }}>
                {deptRecords.length} grade level{deptRecords.length !== 1 ? "s" : ""} configured
              </p>
            </div>
            <button onClick={() => openCreate(selDept)} style={{
              background: "rgba(255,255,255,0.15)", color: "#fff",
              border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8,
              padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}>
              + Add Level
            </button>
          </div>

          {deptRecords.length === 0 ? (
            <div style={{ textAlign: "center", padding: "50px 0", color: "#9ca3af" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
              <p style={{ fontSize: 15, marginBottom: 20 }}>
                No salary bands configured for {selDeptName} yet.
              </p>
              <button onClick={() => openCreate(selDept)} style={{
                background: "#2563eb", color: "#fff", border: "none",
                borderRadius: 8, padding: "10px 24px", fontWeight: 600, cursor: "pointer",
              }}>
                Configure Now
              </button>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 700 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e5e7eb" }}>
                    {["Grade", "Posting", "Scale (A / B / C)", "Years in Role", "Promotion Timeline", "Actions"].map(h => (
                      <th key={h} style={{
                        padding: "12px 16px", textAlign: "left",
                        fontWeight: 700, color: "#374151",
                        fontSize: 13, whiteSpace: "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deptRecords.map((rec, i) => {
                    const level = rec.grade_level || rec.grade_id?.level || "—";
                    return (
                      <tr key={rec._id} style={{
                        borderBottom: "1px solid #f3f4f6",
                        background: i % 2 === 0 ? "#fff" : "#fafafa",
                        transition: "background 0.15s",
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f0f4ff"}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafafa"}>

                        {/* Grade */}
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{
                            background: "#1a1a2e", color: "#fff",
                            borderRadius: 6, padding: "4px 10px",
                            fontSize: 12, fontWeight: 800,
                          }}>{level}</span>
                        </td>

                        {/* Posting */}
                        <td style={{ padding: "14px 16px", color: "#374151", fontSize: 13 }}>
                          {rec.posting || <span style={{ color: "#d1d5db" }}>—</span>}
                        </td>

                        {/* Scale A/B/C */}
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {rec.salary_band_min && (
                              <span style={{
                                background: "#ecfdf5", color: "#059669",
                                border: "1px solid #6ee7b7", borderRadius: 6,
                                padding: "3px 8px", fontSize: 12, fontWeight: 700,
                              }}>A: {fmt(rec.salary_band_min)}</span>
                            )}
                            {rec.salary_band_mid && (
                              <span style={{
                                background: "#eff6ff", color: "#2563eb",
                                border: "1px solid #93c5fd", borderRadius: 6,
                                padding: "3px 8px", fontSize: 12, fontWeight: 700,
                              }}>B: {fmt(rec.salary_band_mid)}</span>
                            )}
                            {rec.salary_band_max && (
                              <span style={{
                                background: "#fff7ed", color: "#d97706",
                                border: "1px solid #fcd34d", borderRadius: 6,
                                padding: "3px 8px", fontSize: 12, fontWeight: 700,
                              }}>C: {fmt(rec.salary_band_max)}</span>
                            )}
                            {!rec.salary_band_min && !rec.salary_band_mid && !rec.salary_band_max && (
                              <span style={{ color: "#d1d5db" }}>—</span>
                            )}
                          </div>
                        </td>

                        {/* Years in Role */}
                        <td style={{ padding: "14px 16px", color: "#6b7280", fontSize: 13 }}>
                          {rec.years_in_role || <span style={{ color: "#d1d5db" }}>—</span>}
                        </td>

                        {/* Promotion Timeline */}
                        <td style={{ padding: "14px 16px", color: "#374151", fontSize: 13 }}>
                          {rec.promotion_timeline || <span style={{ color: "#d1d5db" }}>—</span>}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => openEdit(rec)} style={{
                              padding: "6px 14px", border: "1px solid #2563eb",
                              borderRadius: 7, background: "#eff6ff", color: "#2563eb",
                              fontSize: 12, fontWeight: 500, cursor: "pointer",
                            }}>Edit</button>
                            <button onClick={() => handleDelete(rec._id)} style={{
                              padding: "6px 14px", border: "1px solid #fecaca",
                              borderRadius: 7, background: "#fff5f5", color: "#ef4444",
                              fontSize: 12, fontWeight: 500, cursor: "pointer",
                            }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
          Select a department above to view its salary bands.
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          zIndex: 1000, display: "flex", alignItems: "center",
          justifyContent: "center", padding: 16,
        }}>
          <div style={{
            background: "#fff", borderRadius: 14, width: "100%",
            maxWidth: 560, maxHeight: "90vh", overflowY: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}>

            {/* Modal Header */}
            <div style={{
              padding: "20px 24px", borderBottom: "1px solid #e5e7eb",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              position: "sticky", top: 0, background: "#fff", zIndex: 1,
            }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1a1a2e" }}>
                {editingId ? "Edit Salary Band" : "Add Salary Band"}
              </h3>
              <button onClick={closeModal} style={{
                background: "none", border: "none",
                fontSize: 20, cursor: "pointer", color: "#6b7280",
              }}>✕</button>
            </div>

            <div style={{ padding: 24 }}>

              {/* Department */}
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Department *</label>
                <select value={form.department_id}
                  onChange={e => {
                    const dept = departments.find(d => d._id?.toString() === e.target.value);
                    setForm(f => ({
                      ...f,
                      department_id:   e.target.value,
                      department_name: dept?.name || "",
                    }));
                  }}
                  style={inp}>
                  <option value="">— Select Department —</option>
                  {departments.map(d => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Grade */}
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Grade Level *</label>
                <select value={form.grade_id}
                  onChange={e => {
                    const g = grades.find(x => x._id?.toString() === e.target.value);
                    setForm(f => ({
                      ...f,
                      grade_id:    e.target.value,
                      grade_level: g?.level || "",
                    }));
                  }}
                  style={inp}>
                  <option value="">— Select Grade —</option>
                  {grades.map(g => (
                    <option key={g._id} value={g._id}>
                      {g.level} — {g.designation}
                    </option>
                  ))}
                </select>
              </div>

              {/* Posting + Years in Role */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                gap: 12, marginBottom: 16,
              }}>
                <div>
                  <label style={lbl}>Posting</label>
                  <input value={form.posting}
                    onChange={e => setForm(f => ({ ...f, posting: e.target.value }))}
                    placeholder="e.g. Sales Trainee"
                    style={inp} />
                </div>
                <div>
                  <label style={lbl}>Years in Role</label>
                  <input value={form.years_in_role}
                    onChange={e => setForm(f => ({ ...f, years_in_role: e.target.value }))}
                    placeholder="e.g. 0 – 1 Year"
                    style={inp} />
                </div>
              </div>

              {/* Salary Band */}
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>
                  Salary Scale — A / B / C (₹)
                  <span style={{ color: "#9ca3af", fontWeight: 400, marginLeft: 4, fontSize: 11 }}>
                    A=Entry · B=Target · C=Max
                  </span>
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  {[
                    { key: "salary_band_min", label: "A — Minimum", color: "#059669", bg: "#ecfdf5", border: "#6ee7b7" },
                    { key: "salary_band_mid", label: "B — Target",  color: "#2563eb", bg: "#eff6ff", border: "#93c5fd" },
                    { key: "salary_band_max", label: "C — Maximum", color: "#d97706", bg: "#fff7ed", border: "#fcd34d" },
                  ].map(s => (
                    <div key={s.key}>
                      <label style={{ ...lbl, color: s.color }}>{s.label}</label>
                      <input type="number"
                        value={form[s.key]}
                        onChange={e => setForm(f => ({ ...f, [s.key]: e.target.value }))}
                        placeholder="e.g. 25000"
                        style={{
                          ...inp,
                          borderColor: form[s.key] ? s.border : "#d1d5db",
                          background:  form[s.key] ? s.bg    : "#fff",
                        }} />
                    </div>
                  ))}
                </div>

                {/* Preview */}
                {(form.salary_band_min || form.salary_band_mid || form.salary_band_max) && (
                  <div style={{
                    marginTop: 10, padding: "10px 14px",
                    background: "#f8fafc", borderRadius: 8,
                    border: "1px solid #e5e7eb", fontSize: 13, color: "#374151",
                  }}>
                    <strong>Preview: </strong>
                    {[form.salary_band_min, form.salary_band_mid, form.salary_band_max]
                      .map((v, i) => v ? `${["A", "B", "C"][i]}: ${fmt(v)}` : null)
                      .filter(Boolean).join("  ·  ")}
                  </div>
                )}
              </div>

              {/* Promotion Timeline */}
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Promotion Timeline</label>
                <input value={form.promotion_timeline}
                  onChange={e => setForm(f => ({ ...f, promotion_timeline: e.target.value }))}
                  placeholder="e.g. 1–2 Years"
                  style={inp} />
              </div>

              {/* Notes */}
              <div style={{ marginBottom: 24 }}>
                <label style={lbl}>Notes</label>
                <textarea value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  style={{ ...inp, resize: "vertical" }}
                  placeholder="Any additional info..." />
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={closeModal} style={{
                  padding: "10px 24px", border: "1px solid #e5e7eb",
                  borderRadius: 8, background: "#fff", color: "#374151",
                  fontWeight: 600, cursor: "pointer",
                }}>Cancel</button>
                <button onClick={handleSubmit} disabled={saving} style={{
                  padding: "10px 28px", border: "none", borderRadius: 8,
                  background: saving ? "#93c5fd" : "#2563eb", color: "#fff",
                  fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
                  fontSize: 14,
                }}>
                  {saving ? "Saving..." : editingId ? "Update" : "Save Band"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const lbl = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: "#374151", marginBottom: 5,
};
const inp = {
  width: "100%", padding: "9px 11px", border: "1px solid #d1d5db",
  borderRadius: 7, fontSize: 13, color: "#1a1a2e", background: "#fff",
  boxSizing: "border-box", outline: "none", fontFamily: "inherit",
};