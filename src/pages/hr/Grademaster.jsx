import { useState, useEffect } from "react";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api/grade-master`;

// ─── Default Grade Data (L1–L10 per your SOP document) ───────────────────────
const DEFAULT_GRADES = [
  { level: "L1", designation: "Executive",                   experience_range: "0–2 Years",  core_responsibility: "Execute assigned operational tasks with accuracy",          performance_expectation: "Complete task ownership & learning agility",        bgr_stage: "Build" },
  { level: "L2", designation: "Senior Executive",            experience_range: "2–4 Years",  core_responsibility: "Support team leaders; handle independent tasks",           performance_expectation: "Quality performance with minimal supervision",       bgr_stage: "Build" },
  { level: "L3", designation: "Assistant Manager (AM)",      experience_range: "3–6 Years",  core_responsibility: "Manage small teams; assist in process improvement",        performance_expectation: "Consistent delivery & basic leadership",             bgr_stage: "Build" },
  { level: "L4", designation: "Manager (M)",                 experience_range: "5–8 Years",  core_responsibility: "Lead department/team; drive KPIs",                         performance_expectation: "Achieve departmental goals & mentor juniors",        bgr_stage: "Grow"  },
  { level: "L5", designation: "Senior Manager (Sr. M)",      experience_range: "7–10 Years", core_responsibility: "Manage multiple teams; oversee strategy execution",         performance_expectation: "Strategic alignment & operational efficiency",       bgr_stage: "Grow"  },
  { level: "L6", designation: "General Manager (GM)",        experience_range: "10–13 Years",core_responsibility: "Oversee business units; cross-functional collaboration",    performance_expectation: "Business growth & cross-department synergy",         bgr_stage: "Grow"  },
  { level: "L7", designation: "Associate Vice President (AVP)", experience_range: "12–15 Years", core_responsibility: "Lead multiple functions; strategic initiatives",       performance_expectation: "Innovation & leadership excellence",                 bgr_stage: "Grow"  },
  { level: "L8", designation: "Vice President (VP)",         experience_range: "14–18 Years",core_responsibility: "Define business strategies; lead key verticals",            performance_expectation: "Long-term value creation & transformation",          bgr_stage: "Retain"},
  { level: "L9", designation: "Director",                    experience_range: "18–22 Years",core_responsibility: "Drive company-wide policies and major decisions",           performance_expectation: "Organizational leadership & governance",             bgr_stage: "Retain"},
  { level: "L10",designation: "CXO (C-Level Executives)",    experience_range: "20+ Years",  core_responsibility: "Shape corporate vision, strategy, and culture",             performance_expectation: "Visionary leadership & sustainable growth",          bgr_stage: "Retain"},
];

const BGR_OPTIONS   = ["Build", "Grow", "Retain"];
const defaultForm   = { level: "", designation: "", experience_range: "", core_responsibility: "", performance_expectation: "", bgr_stage: "Build", salary_band_min: "", salary_band_max: "", notes: "" };

const BGR_META = {
  Build:  { color: "#059669", bg: "#d1fae5", border: "#6ee7b7", desc: "L1–L3 · Attracting & building entry-level talent" },
  Grow:   { color: "#2563eb", bg: "#dbeafe", border: "#93c5fd", desc: "L4–L7 · Leadership development & performance elevation" },
  Retain: { color: "#d97706", bg: "#fef3c7", border: "#fcd34d", desc: "L8–L10 · Recognition, stability & corporate mentorship" },
};

const STYLES = `
  .gm-page { padding: 28px 32px; }
  .gm-header { flex-direction: row; align-items: center; }
  .gm-header-actions { flex-direction: row; }
  .gm-table-wrap { display: block; }
  .gm-cards-wrap { display: none; }
  .modal-grid-2 { grid-template-columns: 1fr 1fr; }
  .modal-grid-3 { grid-template-columns: 1fr 1fr 1fr; }

  @media (max-width: 900px) {
    .gm-table-wrap { display: none !important; }
    .gm-cards-wrap { display: block !important; }
  }
  @media (max-width: 768px) {
    .gm-page { padding: 16px; }
    .gm-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px; }
    .gm-header-actions { flex-direction: column !important; width: 100%; }
    .gm-header-actions button { width: 100%; justify-content: center; }
    .modal-grid-2 { grid-template-columns: 1fr !important; }
    .modal-grid-3 { grid-template-columns: 1fr !important; }
    .modal-footer { flex-direction: column !important; }
    .modal-footer button { width: 100%; }
    .modal-inner { padding: 16px !important; }
  }
`;

export default function GradeMaster() {
  const [grades,        setGrades]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showModal,     setShowModal]     = useState(false);
  const [editingId,     setEditingId]     = useState(null);
  const [form,          setForm]          = useState(defaultForm);
  const [viewGrade,     setViewGrade]     = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast,         setToast]         = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [filterBGR,     setFilterBGR]     = useState("All");
  const [seeding,       setSeeding]       = useState(false);

  useEffect(() => { fetchGrades(); }, []);

  // ── API calls ──────────────────────────────────────────────────────────────
  const fetchGrades = async () => {
    try {
      const res  = await fetch(API_BASE);
      const data = await res.json();
      if (data.success) setGrades(data.data);
    } catch {
      showToast("Failed to load grades", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.level || !form.designation || !form.experience_range || !form.bgr_stage)
      return showToast("Fill all required fields", "error");
    setSaving(true);
    try {
      const url    = editingId ? `${API_BASE}/${editingId}` : API_BASE;
      const method = editingId ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data   = await res.json();
      if (data.success) {
        showToast(editingId ? "Grade updated!" : "Grade created!");
        fetchGrades();
        closeModal();
      } else showToast(data.message || "Error", "error");
    } catch { showToast("Server error", "error"); }
    finally   { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      const res  = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { showToast("Grade deleted"); fetchGrades(); }
    } catch { showToast("Delete failed", "error"); }
    setDeleteConfirm(null);
  };

  // Seed default L1–L10 grades
  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const res  = await fetch(`${API_BASE}/seed-defaults`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ grades: DEFAULT_GRADES }) });
      const data = await res.json();
      if (data.success) { showToast("Default grades seeded successfully!"); fetchGrades(); }
      else showToast(data.message || "Seed failed", "error");
    } catch { showToast("Seed failed", "error"); }
    finally { setSeeding(false); }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const showToast  = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const openCreate = () => { setForm(defaultForm); setEditingId(null); setShowModal(true); };
  const openEdit   = (g) => { setForm({ level: g.level, designation: g.designation, experience_range: g.experience_range, core_responsibility: g.core_responsibility || "", performance_expectation: g.performance_expectation || "", bgr_stage: g.bgr_stage, salary_band_min: g.salary_band_min || "", salary_band_max: g.salary_band_max || "", notes: g.notes || "" }); setEditingId(g._id); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditingId(null); setForm(defaultForm); };
  const handleFormChange = (field, value) => setForm(f => ({ ...f, [field]: value }));
const filtered = (filterBGR === "All" ? grades : grades.filter(g => g.bgr_stage === filterBGR))
  .sort((a, b) => parseInt(a.level.replace('L','')) - parseInt(b.level.replace('L','')));
  // ── BGR summary counts ─────────────────────────────────────────────────────
  const bgrCounts = { Build: 0, Grow: 0, Retain: 0 };
  grades.forEach(g => { if (bgrCounts[g.bgr_stage] !== undefined) bgrCounts[g.bgr_stage]++; });

  return (
    <div className="gm-page" style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", background: "#f4f6fb" }}>
      <style>{STYLES}</style>

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 16, zIndex: 9999, background: toast.type === "error" ? "#ff4d4f" : "#52c41a", color: "#fff", padding: "12px 20px", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", fontWeight: 500, fontSize: 14, maxWidth: "calc(100vw - 32px)" }}>
          {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div className="gm-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1a1a2e" }}>Grade Master</h2>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>Manage corporate grading levels (L1–L10) — BGR Framework</p>
        </div>
        <div className="gm-header-actions" style={{ display: "flex", gap: 10 }}>
          {grades.length === 0 && (
            <button onClick={handleSeedDefaults} disabled={seeding} style={{ background: "#f0fdf4", color: "#059669", border: "1px solid #6ee7b7", borderRadius: 8, padding: "10px 18px", fontWeight: 600, fontSize: 14, cursor: seeding ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              {seeding ? "Seeding..." : "⚡ Load Defaults"}
            </button>
          )}
          <button onClick={openCreate} style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            + Add Grade
          </button>
        </div>
      </div>

      {/* ── BGR Summary Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
        {Object.entries(BGR_META).map(([stage, meta]) => (
          <div key={stage} onClick={() => setFilterBGR(filterBGR === stage ? "All" : stage)}
            style={{ background: filterBGR === stage ? meta.bg : "#fff", border: `1.5px solid ${filterBGR === stage ? meta.border : "#e5e7eb"}`, borderRadius: 12, padding: "16px 20px", cursor: "pointer", transition: "all 0.18s", boxShadow: filterBGR === stage ? `0 2px 12px ${meta.border}` : "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: meta.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>{stage}</span>
              <span style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>{bgrCounts[stage]} levels</span>
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "#6b7280" }}>{meta.desc}</p>
          </div>
        ))}
        {/* Total */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total</span>
            <span style={{ background: "#f3f4f6", color: "#374151", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>{grades.length} levels</span>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#6b7280" }}>All active grade levels</p>
        </div>
      </div>

      {/* ── Filter Pills ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {["All", "Build", "Grow", "Retain"].map(f => (
          <button key={f} onClick={() => setFilterBGR(f)}
            style={{ padding: "6px 16px", borderRadius: 20, border: "1px solid", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
              background: filterBGR === f ? (f === "All" ? "#2563eb" : BGR_META[f]?.color) : "#fff",
              color: filterBGR === f ? "#fff" : "#6b7280",
              borderColor: filterBGR === f ? (f === "All" ? "#2563eb" : BGR_META[f]?.color) : "#e5e7eb" }}>
            {f}
          </button>
        ))}
      </div>

      {/* ── Loading ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>Loading grades...</div>
      ) : grades.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 12, padding: "60px 0", textAlign: "center", border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏢</div>
          <p style={{ color: "#6b7280", fontSize: 15, marginBottom: 4 }}>No grade levels yet.</p>
          <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 20 }}>Click "Load Defaults" to seed L1–L10 from your SOP, or add manually.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={handleSeedDefaults} disabled={seeding} style={{ background: "#f0fdf4", color: "#059669", border: "1px solid #6ee7b7", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer" }}>
              ⚡ Load Defaults (L1–L10)
            </button>
            <button onClick={openCreate} style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer" }}>
              + Add Manually
            </button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 12, padding: "40px 0", textAlign: "center", border: "1px solid #e5e7eb" }}>
          <p style={{ color: "#6b7280" }}>No grades found for "{filterBGR}" stage.</p>
        </div>
      ) : (
        <>
          {/* ── Desktop Table ── */}
          <div className="gm-table-wrap" style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e5e7eb" }}>
                  {["Level", "Designation", "Experience", "BGR Stage", "Salary Band", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#374151", whiteSpace: "nowrap", fontSize: 13 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((g, i) => {
                  const meta = BGR_META[g.bgr_stage] || BGR_META.Build;
                  return (
                    <tr key={g._id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f0f4ff"}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafafa"}>
                      {/* Level Badge */}
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ background: "#1a1a2e", color: "#fff", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 800, letterSpacing: "0.5px" }}>{g.level}</span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontWeight: 600, color: "#1a1a2e", fontSize: 14 }}>{g.designation}</span>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#6b7280", fontSize: 13 }}>{g.experience_range}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700 }}>{g.bgr_stage}</span>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#374151", fontSize: 13 }}>
                        {g.salary_band_min && g.salary_band_max
                          ? `₹${Number(g.salary_band_min).toLocaleString()} – ₹${Number(g.salary_band_max).toLocaleString()}`
                          : <span style={{ color: "#d1d5db" }}>—</span>}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => setViewGrade(g)} style={{ padding: "6px 14px", border: "1px solid #e5e7eb", borderRadius: 7, background: "#fff", color: "#374151", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>View</button>
                          <button onClick={() => openEdit(g)} style={{ padding: "6px 14px", border: "1px solid #2563eb", borderRadius: 7, background: "#eff6ff", color: "#2563eb", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Edit</button>
                          <button onClick={() => setDeleteConfirm(g._id)} style={{ padding: "6px 14px", border: "1px solid #fecaca", borderRadius: 7, background: "#fff5f5", color: "#ef4444", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Mobile Cards ── */}
          <div className="gm-cards-wrap">
            {filtered.map(g => {
              const meta = BGR_META[g.bgr_stage] || BGR_META.Build;
              return (
                <div key={g._id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  {/* Card header */}
                  <div style={{ background: "#1a1a2e", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ background: "#2563eb", color: "#fff", borderRadius: 6, padding: "4px 10px", fontSize: 13, fontWeight: 800 }}>{g.level}</span>
                      <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{g.designation}</span>
                    </div>
                    <span style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{g.bgr_stage}</span>
                  </div>
                  <div style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 10 }}>
                      <span style={{ fontSize: 12, color: "#6b7280" }}>Experience: <strong style={{ color: "#374151" }}>{g.experience_range}</strong></span>
                      {g.salary_band_min && <span style={{ fontSize: 12, color: "#6b7280" }}>Band: <strong style={{ color: "#374151" }}>₹{Number(g.salary_band_min).toLocaleString()} – ₹{Number(g.salary_band_max).toLocaleString()}</strong></span>}
                    </div>
                    {g.core_responsibility && <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 4px" }}><strong style={{ color: "#374151" }}>Role:</strong> {g.core_responsibility}</p>}
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button onClick={() => setViewGrade(g)} style={{ flex: 1, padding: "9px 0", border: "1px solid #e5e7eb", borderRadius: 7, background: "#fff", color: "#374151", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>View</button>
                      <button onClick={() => openEdit(g)} style={{ flex: 1, padding: "9px 0", border: "1px solid #2563eb", borderRadius: 7, background: "#eff6ff", color: "#2563eb", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Edit</button>
                      <button onClick={() => setDeleteConfirm(g._id)} style={{ flex: 1, padding: "9px 0", border: "1px solid #fecaca", borderRadius: 7, background: "#fff5f5", color: "#ef4444", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Delete</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════
          CREATE / EDIT MODAL
      ═══════════════════════════════════════════ */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 660, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            {/* Modal Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1a1a2e" }}>
                {editingId ? "Edit Grade Level" : "Add New Grade Level"}
              </h3>
              <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280" }}>✕</button>
            </div>

            <div className="modal-inner" style={{ padding: "24px" }}>
              {/* Row 1: Level + BGR Stage */}
              <div className="modal-grid-2" style={{ display: "grid", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Grade Level * <span style={{ color: "#9ca3af", fontWeight: 400 }}>(e.g. L1, L2)</span></label>
                  <input value={form.level} onChange={e => handleFormChange("level", e.target.value)} placeholder="L1" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>BGR Stage *</label>
                  <select value={form.bgr_stage} onChange={e => handleFormChange("bgr_stage", e.target.value)} style={inputStyle}>
                    {BGR_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 2: Designation + Experience */}
              <div className="modal-grid-2" style={{ display: "grid", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Designation *</label>
                  <input value={form.designation} onChange={e => handleFormChange("designation", e.target.value)} placeholder="e.g. Senior Manager" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Experience Range *</label>
                  <input value={form.experience_range} onChange={e => handleFormChange("experience_range", e.target.value)} placeholder="e.g. 5–8 Years" style={inputStyle} />
                </div>
              </div>

              {/* Row 3: Core Responsibility */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Core Responsibility</label>
                <textarea value={form.core_responsibility} onChange={e => handleFormChange("core_responsibility", e.target.value)}
                  placeholder="Describe the main responsibilities for this level..."
                  rows={2} style={{ ...inputStyle, resize: "vertical" }} />
              </div>

              {/* Row 4: Performance Expectation */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Performance Expectation</label>
                <textarea value={form.performance_expectation} onChange={e => handleFormChange("performance_expectation", e.target.value)}
                  placeholder="What is expected from employees at this grade?"
                  rows={2} style={{ ...inputStyle, resize: "vertical" }} />
              </div>

              {/* Row 5: Salary Band */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Salary Band (₹) <span style={{ color: "#9ca3af", fontWeight: 400 }}>— Optional</span></label>
                <div className="modal-grid-2" style={{ display: "grid", gap: 16 }}>
                  <input type="number" value={form.salary_band_min} onChange={e => handleFormChange("salary_band_min", e.target.value)} placeholder="Min (e.g. 300000)" style={inputStyle} />
                  <input type="number" value={form.salary_band_max} onChange={e => handleFormChange("salary_band_max", e.target.value)} placeholder="Max (e.g. 600000)" style={inputStyle} />
                </div>
              </div>

              {/* Row 6: Notes */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Notes <span style={{ color: "#9ca3af", fontWeight: 400 }}>— Optional</span></label>
                <textarea value={form.notes} onChange={e => handleFormChange("notes", e.target.value)}
                  placeholder="Any additional notes about this grade..."
                  rows={2} style={{ ...inputStyle, resize: "vertical" }} />
              </div>

              {/* BGR Stage Info Banner */}
              {form.bgr_stage && (
                <div style={{ background: BGR_META[form.bgr_stage]?.bg, border: `1px solid ${BGR_META[form.bgr_stage]?.border}`, borderRadius: 8, padding: "10px 14px", marginBottom: 20 }}>
                  <span style={{ fontSize: 13, color: BGR_META[form.bgr_stage]?.color, fontWeight: 600 }}>
                    {form.bgr_stage} Stage — {BGR_META[form.bgr_stage]?.desc}
                  </span>
                </div>
              )}

              {/* Footer */}
              <div className="modal-footer" style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={closeModal} style={{ padding: "10px 24px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button onClick={handleSubmit} disabled={saving} style={{ padding: "10px 28px", border: "none", borderRadius: 8, background: saving ? "#93c5fd" : "#2563eb", color: "#fff", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 14 }}>
                  {saving ? "Saving..." : editingId ? "Update Grade" : "Create Grade"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          VIEW MODAL
      ═══════════════════════════════════════════ */}
      {viewGrade && (() => {
        const meta = BGR_META[viewGrade.bgr_stage] || BGR_META.Build;
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
              {/* Header */}
              <div style={{ background: "#1a1a2e", padding: "20px 24px", borderRadius: "14px 14px 0 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ background: "#2563eb", color: "#fff", borderRadius: 8, padding: "6px 14px", fontSize: 16, fontWeight: 900 }}>{viewGrade.level}</span>
                    <div>
                      <h3 style={{ margin: 0, color: "#fff", fontSize: 17, fontWeight: 700 }}>{viewGrade.designation}</h3>
                      <p style={{ margin: "3px 0 0", color: "#9ca3af", fontSize: 13 }}>{viewGrade.experience_range}</p>
                    </div>
                  </div>
                  <button onClick={() => setViewGrade(null)} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 16 }}>✕</button>
                </div>
              </div>

              <div style={{ padding: 24 }}>
                {/* BGR Badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <span style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, borderRadius: 20, padding: "4px 14px", fontSize: 13, fontWeight: 700 }}>{viewGrade.bgr_stage} Stage</span>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>{meta.desc}</span>
                </div>

                {/* Details */}
                {[
                  { label: "Core Responsibility", value: viewGrade.core_responsibility },
                  { label: "Performance Expectation", value: viewGrade.performance_expectation },
                  { label: "Notes", value: viewGrade.notes },
                ].map(row => row.value ? (
                  <div key={row.label} style={{ marginBottom: 16, padding: "14px 16px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e5e7eb" }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>{row.label}</label>
                    <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{row.value}</p>
                  </div>
                ) : null)}

                {/* Salary Band */}
                {viewGrade.salary_band_min && (
                  <div style={{ padding: "14px 16px", background: "#f0fdf4", borderRadius: 10, border: "1px solid #6ee7b7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, color: "#059669", fontSize: 14 }}>Salary Band</span>
                    <span style={{ fontWeight: 700, color: "#059669", fontSize: 15 }}>
                      ₹{Number(viewGrade.salary_band_min).toLocaleString()} – ₹{Number(viewGrade.salary_band_max).toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Footer actions */}
                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <button onClick={() => { setViewGrade(null); openEdit(viewGrade); }}
                    style={{ flex: 1, padding: "10px 0", border: "1px solid #2563eb", borderRadius: 8, background: "#eff6ff", color: "#2563eb", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
                    Edit Grade
                  </button>
                  <button onClick={() => setViewGrade(null)}
                    style={{ flex: 1, padding: "10px 0", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════
          DELETE CONFIRM
      ═══════════════════════════════════════════ */}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 28, maxWidth: 360, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ margin: "0 0 8px", color: "#1a1a2e" }}>Delete Grade Level?</h3>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>This will remove the grade permanently. Employees assigned to this grade may be affected.</p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: "10px 0", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 8, background: "#ef4444", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 };
const inputStyle  = { width: "100%", padding: "9px 11px", border: "1px solid #d1d5db", borderRadius: 7, fontSize: 13, color: "#1a1a2e", background: "#fff", boxSizing: "border-box", outline: "none", fontFamily: "inherit" };