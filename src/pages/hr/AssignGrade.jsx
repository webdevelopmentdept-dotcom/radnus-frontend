// pages/hr/dashboard/grading/AssignGrade.jsx
// FIX: Dept salary band shows ONLY the band matching the employee's department + selected grade

import { useEffect, useState } from "react";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api`;

const BGR_META = {
  Build:  { color: "#059669", bg: "#d1fae5", border: "#6ee7b7" },
  Grow:   { color: "#2563eb", bg: "#dbeafe", border: "#93c5fd" },
  Retain: { color: "#d97706", bg: "#fef3c7", border: "#fcd34d" },
};

const CHANGE_TYPE_META = {
  initial: { label: "Initial",  color: "#6b7280", bg: "#f3f4f6", icon: "🎖️" },
  promote: { label: "Promoted", color: "#16a34a", bg: "#f0fdf4", icon: "⬆️" },
  demote:  { label: "Demoted",  color: "#dc2626", bg: "#fef2f2", icon: "⬇️" },
  lateral: { label: "Lateral",  color: "#2563eb", bg: "#eff6ff", icon: "↔️" },
};

const SCALE_POINTS = [
  { key: "min", label: "Minimum",  short: "A", color: "#059669", bg: "#ecfdf5", border: "#6ee7b7", desc: "Entry of band" },
  { key: "mid", label: "Midpoint", short: "B", color: "#2563eb", bg: "#eff6ff", border: "#93c5fd", desc: "Market reference / target" },
  { key: "max", label: "Maximum",  short: "C", color: "#d97706", bg: "#fff7ed", border: "#fcd34d", desc: "Ceiling of band" },
];

const fmt = (v) => v ? `₹${Number(v).toLocaleString("en-IN")}` : null;

const getScaleValue = (band, point) => {
  if (!band) return null;
  if (point === "min") return band.salary_band_min;
  if (point === "mid") return band.salary_band_mid;
  if (point === "max") return band.salary_band_max;
  return null;
};

const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const STYLES = `
  .ag-page { padding: 28px 32px; }
  .ag-header { flex-direction: row; align-items: center; }
  .ag-table-wrap { display: block; }
  .ag-cards-wrap { display: none; }

  @media (max-width: 900px) {
    .ag-table-wrap { display: none !important; }
    .ag-cards-wrap { display: block !important; }
  }
  @media (max-width: 768px) {
    .ag-page { padding: 16px !important; }
    .ag-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px; }
  }

  .scale-radio-group { display: flex; gap: 10px; flex-wrap: wrap; }
  .scale-radio-btn {
    flex: 1; min-width: 90px;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    padding: 10px 12px;
    cursor: pointer;
    transition: all 0.18s;
    background: #fff;
    position: relative;
    text-align: center;
  }
  .scale-radio-btn.active-min { border-color: #6ee7b7; background: #ecfdf5; }
  .scale-radio-btn.active-mid { border-color: #93c5fd; background: #eff6ff; }
  .scale-radio-btn.active-max { border-color: #fcd34d; background: #fff7ed; }
  .scale-radio-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }

  .scale-badge {
    display: inline-flex; align-items: center; gap: 5px;
    border-radius: 8px; padding: 3px 10px;
    font-size: 12px; font-weight: 700;
    border: 1px solid;
  }

  .track-bar { position: relative; height: 6px; background: #e5e7eb; border-radius: 99px; margin: 8px 0 4px; }
  .track-fill { position: absolute; left: 0; top: 0; height: 6px; border-radius: 99px;
    background: linear-gradient(90deg, #059669 0%, #2563eb 50%, #d97706 100%); width: 100%; }
  .track-dot { position: absolute; top: 50%; transform: translate(-50%, -50%);
    width: 14px; height: 14px; border-radius: 50%; border: 3px solid #fff;
    box-shadow: 0 0 0 2px currentColor; transition: left 0.3s; }

  select.ag-select {
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    padding-right: 30px !important;
  }
`;

const defaultForm = {
  employee_id: "",
  grade_id: "",
  effective_date: "",
  reason: "",
  salary_scale_point: "",
};

// ── Grade History Timeline ────────────────────────────────────────────────────
function HistoryTimeline({ history }) {
  if (!history || history.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
        <p style={{ fontSize: 13 }}>No grade changes recorded yet.</p>
      </div>
    );
  }
  const sorted = [...history].sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at));
  return (
    <div style={{ position: "relative", paddingLeft: 24 }}>
      <div style={{ position: "absolute", left: 8, top: 0, bottom: 0, width: 2, background: "#e5e7eb", borderRadius: 99 }} />
      {sorted.map((h, i) => {
        const meta    = CHANGE_TYPE_META[h.change_type] || CHANGE_TYPE_META.initial;
        const bgrMeta = BGR_META[h.bgr_stage] || BGR_META.Build;
        const spMeta  = SCALE_POINTS.find(s => s.key === h.salary_scale_point);
        return (
          <div key={h._id || i} style={{ position: "relative", marginBottom: i < sorted.length - 1 ? 20 : 0 }}>
            <div style={{ position: "absolute", left: -20, top: 6, width: 12, height: 12, borderRadius: "50%", background: meta.color, border: "2px solid #fff", boxShadow: `0 0 0 2px ${meta.color}40` }} />
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 15 }}>{meta.icon}</span>
                  <span style={{ background: meta.bg, color: meta.color, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{meta.label}</span>
                  <span style={{ background: "#1a1a2e", color: "#fff", fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 6 }}>
                    {h.grade_level || h.grade_id?.level || "—"}
                  </span>
                  <span style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>{h.grade_designation || h.grade_id?.designation || "—"}</span>
                  {spMeta && (
                    <span style={{ background: spMeta.bg, color: spMeta.color, border: `1px solid ${spMeta.border}`, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                      @ Scale {spMeta.short}
                    </span>
                  )}
                </div>
                <span style={{ background: bgrMeta.bg, color: bgrMeta.color, border: `1px solid ${bgrMeta.border}`, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, flexShrink: 0 }}>
                  {h.bgr_stage || h.grade_id?.bgr_stage || "—"}
                </span>
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "#6b7280" }}>
                <span>📅 Effective: <strong style={{ color: "#374151" }}>{formatDate(h.effective_date)}</strong></span>
                <span>🕐 Changed: <strong style={{ color: "#374151" }}>{formatDate(h.changed_at)}</strong></span>
              </div>
              {h.reason && (
                <p style={{ margin: "6px 0 0", fontSize: 12, color: "#374151", fontStyle: "italic", background: "#f8fafc", borderRadius: 6, padding: "5px 8px" }}>
                  "{h.reason}"
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Dept Salary Band Info Box (modal) ─────────────────────────────────────────
function DeptSalaryBandInfo({ band, loading, deptName }) {
  if (loading) {
    return (
      <div style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#9ca3af" }}>
        ⏳ Loading department salary band...
      </div>
    );
  }
  if (!band) return null;

  const hasAny = band.salary_band_min || band.salary_band_mid || band.salary_band_max;
  if (!hasAny) return null;

  return (
    <div style={{
      borderRadius: 10, padding: "14px 16px", marginBottom: 16,
      border: "1.5px solid #bfdbfe",
      background: "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          🏢 {band.department_name || deptName} — Salary Band for {band.grade_level || band.grade_id?.level}
        </span>
        {band.promotion_timeline && (
          <span style={{ fontSize: 11, color: "#6b7280", background: "#f3f4f6", borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>
            ⏱ Promotion: {band.promotion_timeline}
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {band.salary_band_min && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 8, padding: "5px 12px", fontSize: 13, fontWeight: 700, border: "1px solid #6ee7b7", background: "#ecfdf5", color: "#059669" }}>
            <span style={{ fontSize: 10, opacity: 0.7 }}>A</span> {fmt(band.salary_band_min)}
          </div>
        )}
        {band.salary_band_mid && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 8, padding: "5px 12px", fontSize: 13, fontWeight: 700, border: "1px solid #93c5fd", background: "#eff6ff", color: "#2563eb" }}>
            <span style={{ fontSize: 10, opacity: 0.7 }}>B</span> {fmt(band.salary_band_mid)}
          </div>
        )}
        {band.salary_band_max && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 8, padding: "5px 12px", fontSize: 13, fontWeight: 700, border: "1px solid #fcd34d", background: "#fff7ed", color: "#d97706" }}>
            <span style={{ fontSize: 10, opacity: 0.7 }}>C</span> {fmt(band.salary_band_max)}
          </div>
        )}
      </div>
      {band.salary_band_min && band.salary_band_max && (
        <div style={{ marginTop: 8, fontSize: 11, color: "#6b7280" }}>
          Band spread: <strong style={{ color: "#374151" }}>{fmt(Number(band.salary_band_max) - Number(band.salary_band_min))}</strong>
        </div>
      )}
    </div>
  );
}

// ── Salary Scale Selector ─────────────────────────────────────────────────────
function SalaryScaleSelector({ grade, deptBand, value, onChange }) {
  const activeBand = (deptBand && (deptBand.salary_band_min || deptBand.salary_band_mid || deptBand.salary_band_max))
    ? deptBand : grade;

  const hasScale = activeBand && (activeBand.salary_band_min || activeBand.salary_band_mid || activeBand.salary_band_max);

  if (!grade) return null;
  if (!hasScale) {
    return (
      <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#92400e" }}>
        ⚠️ This grade has no salary band configured. You can still assign the grade.
      </div>
    );
  }

  const dotLeft = value === "min" ? "0%" : value === "mid" ? "50%" : value === "max" ? "100%" : null;
  const usingDept = deptBand && (deptBand.salary_band_min || deptBand.salary_band_mid || deptBand.salary_band_max);

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>
        Salary Scale Point
        <span style={{ color: "#9ca3af", fontWeight: 400, marginLeft: 4 }}>— Where does this employee sit?</span>
        {usingDept && (
          <span style={{ marginLeft: 8, fontSize: 10, background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>
            Dept Band
          </span>
        )}
      </label>

      <div className="scale-radio-group">
        {SCALE_POINTS.map(sp => {
          const val = getScaleValue(activeBand, sp.key);
          if (!val) return null;
          const isActive = value === sp.key;
          return (
            <div key={sp.key}
              className={`scale-radio-btn${isActive ? ` active-${sp.key}` : ""}`}
              onClick={() => onChange(isActive ? "" : sp.key)}>
              {isActive && (
                <div style={{ position: "absolute", top: 6, right: 8, width: 16, height: 16, borderRadius: "50%", background: sp.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>✓</span>
                </div>
              )}
              <div style={{ fontSize: 11, fontWeight: 700, color: sp.color, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                Scale {sp.short}
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: isActive ? sp.color : "#374151" }}>{fmt(val)}</div>
              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 3 }}>{sp.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Visual track */}
      <div style={{ marginTop: 10, padding: "10px 14px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>
          <span>{fmt(activeBand.salary_band_min) || "—"}</span>
          <span>{fmt(activeBand.salary_band_mid) || "—"}</span>
          <span>{fmt(activeBand.salary_band_max) || "—"}</span>
        </div>
        <div className="track-bar">
          <div className="track-fill" />
          {dotLeft && (
            <div className="track-dot"
              style={{ left: dotLeft, color: SCALE_POINTS.find(s => s.key === value)?.color || "#2563eb", background: SCALE_POINTS.find(s => s.key === value)?.color || "#2563eb" }} />
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9ca3af" }}>
          <span>A — Min</span><span>B — Mid</span><span>C — Max</span>
        </div>
        {value && (
          <div style={{ marginTop: 8, textAlign: "center", fontSize: 12 }}>
            <span style={{ color: "#6b7280" }}>Selected: </span>
            <strong style={{ color: SCALE_POINTS.find(s => s.key === value)?.color }}>
              Scale {SCALE_POINTS.find(s => s.key === value)?.short} — {fmt(getScaleValue(activeBand, value))}
            </strong>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Scale Point Badge ─────────────────────────────────────────────────────────
function ScalePointBadge({ point }) {
  if (!point) return <span style={{ color: "#d1d5db", fontSize: 12 }}>—</span>;
  const sp = SCALE_POINTS.find(s => s.key === point);
  if (!sp) return null;
  return (
    <span className="scale-badge" style={{ background: sp.bg, color: sp.color, borderColor: sp.border }}>
      Scale {sp.short}
    </span>
  );
}

// ── Dept Salary Badge (table column) ─────────────────────────────────────────
function DeptSalaryBadge({ assignment, deptBands }) {
  const empDeptName = assignment.employee_id?.department;
  const empDeptId   = assignment.employee_id?.department_id || assignment.employee_id?.departmentId;
  const gradeId     = assignment.grade_id?._id?.toString() || assignment.grade_id?.toString();
  const scalePoint  = assignment.salary_scale_point;

  const band = deptBands.find(b => {
    const bGrade = b.grade_id?._id?.toString() || b.grade_id?.toString();
    const bDept  = b.department_id?._id?.toString() || b.department_id?.toString();
    const matchGrade = bGrade === gradeId;
    const matchDept  = (empDeptId && bDept === empDeptId.toString())
                    || (empDeptName && b.department_name === empDeptName);
    return matchGrade && matchDept;
  });

  if (!band || !scalePoint) return <ScalePointBadge point={scalePoint} />;

  const sp  = SCALE_POINTS.find(s => s.key === scalePoint);
  const val = getScaleValue(band, scalePoint);
  if (!sp || !val) return <ScalePointBadge point={scalePoint} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span className="scale-badge" style={{ background: sp.bg, color: sp.color, borderColor: sp.border }}>
        Scale {sp.short} · {fmt(val)}
      </span>
      <span style={{ fontSize: 10, color: "#9ca3af" }}>{band.department_name || "Dept band"}</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AssignGrade() {
  const [employees,   setEmployees]   = useState([]);
  const [grades,      setGrades]      = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [deptBands,   setDeptBands]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);

  const [form,          setForm]          = useState(defaultForm);
  const [editingId,     setEditingId]     = useState(null);
  const [showModal,     setShowModal]     = useState(false);
  const [viewItem,      setViewItem]      = useState(null);
  const [viewTab,       setViewTab]       = useState("details");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast,         setToast]         = useState(null);

  const [modalDeptBand,        setModalDeptBand]        = useState(null);
  const [modalDeptBandLoading, setModalDeptBandLoading] = useState(false);

  const [activeTab,   setActiveTab]   = useState("assignments");
  const [filterGrade, setFilterGrade] = useState("All");
  const [searchText,  setSearchText]  = useState("");

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (!form.employee_id || !form.grade_id) {
      setModalDeptBand(null);
      return;
    }

    const emp = employees.find(e => e._id === form.employee_id);
    if (!emp) { setModalDeptBand(null); return; }

    const empDeptName = emp.department;
    const empDeptId   = emp.department_id || emp.departmentId;
    const gradeId     = form.grade_id;

    setModalDeptBandLoading(true);

    const matched = deptBands.find(b => {
      const bGrade = b.grade_id?._id?.toString() || b.grade_id?.toString();
      const bDept  = b.department_id?._id?.toString() || b.department_id?.toString();

      const matchGrade = bGrade === gradeId;
      const matchDept  = (empDeptId && bDept === empDeptId.toString())
                      || (empDeptName && b.department_name === empDeptName);
      return matchGrade && matchDept;
    }) || null;

    setModalDeptBand(matched);
    setModalDeptBandLoading(false);
  }, [form.employee_id, form.grade_id, employees, deptBands]);

  // ── Fetch All ──────────────────────────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [empRes, grdRes, asgRes, dbRes] = await Promise.all([
        fetch(`${API_BASE}/hr/employees`),
        fetch(`${API_BASE}/grade-master`),
        fetch(`${API_BASE}/assign-grade`),
        fetch(`${API_BASE}/dept-grade-salary`),
      ]);
      const empData = await empRes.json();
      const grdData = await grdRes.json();
      const asgData = await asgRes.json();
      const dbData  = await dbRes.json();

      const allEmps = Array.isArray(empData) ? empData : empData?.data || [];
      setEmployees(allEmps.filter(emp => emp.status === "active"));
      setGrades(grdData.data || []);
      setDeptBands(dbData.data || []);

      let hrList = [];
      try {
        const hrRes  = await fetch(`${API_BASE}/hr/employees`);
        const hrData = await hrRes.json();
        hrList = Array.isArray(hrData) ? hrData : hrData?.data || [];
      } catch (_) {}

      const rawAssignments = asgData.data || [];
      const mergedAssignments = rawAssignments.map(a => {
        const empObjId = a.employee_id?._id || a.employee_id;
        const hrMatch  = hrList.find(e => e._id === empObjId);
        if (hrMatch && a.employee_id && typeof a.employee_id === "object") {
          return { ...a, employee_id: { ...a.employee_id, employee_id: hrMatch.employeeId || a.employee_id.employee_id || "" } };
        }
        return a;
      });
      setAssignments(mergedAssignments);
    } catch {
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.employee_id || !form.grade_id || !form.effective_date)
      return showToast("Please fill all required fields", "error");
    setSaving(true);
    try {
      const url    = editingId ? `${API_BASE}/assign-grade/${editingId}` : `${API_BASE}/assign-grade`;
      const method = editingId ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        showToast(editingId ? "Assignment updated!" : "Grade assigned successfully!");
        fetchAll();
        closeModal();
      } else showToast(data.message || "Something went wrong", "error");
    } catch { showToast("Server error", "error"); }
    finally  { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      const res  = await fetch(`${API_BASE}/assign-grade/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { showToast("Assignment removed"); fetchAll(); }
      else showToast(data.message || "Delete failed", "error");
    } catch { showToast("Delete failed", "error"); }
    setDeleteConfirm(null);
  };

  const showToast  = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };
  const closeModal = () => { setShowModal(false); setEditingId(null); setForm(defaultForm); setModalDeptBand(null); };
  const openCreate = () => { setForm(defaultForm); setEditingId(null); setShowModal(true); };
  const openEdit   = (a) => {
    setForm({
      employee_id:        a.employee_id?._id || a.employee_id,
      grade_id:           a.grade_id?._id    || a.grade_id,
      effective_date:     a.effective_date    ? a.effective_date.slice(0, 10) : "",
      reason:             "",
      salary_scale_point: a.salary_scale_point || "",
    });
    setEditingId(a._id);
    setShowModal(true);
  };
  const openView = (a) => { setViewItem(a); setViewTab("details"); };

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedGrade = grades.find(g => g._id === form.grade_id);
  const selectedEmp   = employees.find(e => e._id === form.employee_id);

  const usedLevels = [...new Set(assignments.map(a => a.grade_id?.level).filter(Boolean))]
    .sort((a, b) => parseInt(a.replace("L", "")) - parseInt(b.replace("L", "")));

  const filtered = assignments
    .filter(a => {
      const matchGrade  = filterGrade === "All" || a.grade_id?.level === filterGrade;
      const matchSearch = !searchText ||
        a.employee_id?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        a.employee_id?.employee_id?.toLowerCase().includes(searchText.toLowerCase()) ||
        a.grade_id?.level?.toLowerCase().includes(searchText.toLowerCase()) ||
        a.grade_id?.designation?.toLowerCase().includes(searchText.toLowerCase());
      return matchGrade && matchSearch;
    })
    .sort((a, b) => parseInt((a.grade_id?.level || "L0").replace("L", "")) - parseInt((b.grade_id?.level || "L0").replace("L", "")));

  const bgrCounts = { Build: 0, Grow: 0, Retain: 0 };
  assignments.forEach(a => { const s = a.grade_id?.bgr_stage; if (s && bgrCounts[s] !== undefined) bgrCounts[s]++; });

  const allHistory = assignments.flatMap(a =>
    (a.grade_history || []).map(h => ({
      ...h,
      employee_name: a.employee_id?.name || "—",
      employee_eid:  a.employee_id?.employee_id || "",
    }))
  ).sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at));

  const getAssignmentDeptBand = (assignment) => {
    const empDeptName = assignment.employee_id?.department;
    const empDeptId   = assignment.employee_id?.department_id || assignment.employee_id?.departmentId;
    const gradeId     = assignment.grade_id?._id?.toString() || assignment.grade_id?.toString();
    return deptBands.find(b => {
      const bGrade = b.grade_id?._id?.toString() || b.grade_id?.toString();
      const bDept  = b.department_id?._id?.toString() || b.department_id?.toString();
      const matchGrade = bGrade === gradeId;
      const matchDept  = (empDeptId && bDept === empDeptId.toString())
                      || (empDeptName && b.department_name === empDeptName);
      return matchGrade && matchDept;
    }) || null;
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    // ✅ SCROLL FIX: overflowY auto + height 100vh added
    <div
      className="ag-page"
      style={{
        fontFamily: "'Segoe UI', sans-serif",
        minHeight: "100vh",
        height: "100vh",
        overflowY: "auto",
        boxSizing: "border-box",
        background: "#f4f6fb",
      }}
    >
      <style>{STYLES}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 16, zIndex: 9999, background: toast.type === "error" ? "#ff4d4f" : "#52c41a", color: "#fff", padding: "12px 20px", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", fontWeight: 500, fontSize: 14, maxWidth: "calc(100vw - 32px)" }}>
          {toast.type === "error" ? "⚠️ " : "✅ "}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="ag-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1a1a2e" }}>Assign Grade</h2>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>Assign corporate grade levels to employees — BGR Framework</p>
        </div>
        <button onClick={openCreate}
          style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" }}>
          + Assign Grade
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 24 }}>
        {Object.entries(BGR_META).map(([stage, meta]) => (
          <div key={stage} style={{ background: "#fff", border: `1.5px solid ${meta.border}`, borderRadius: 12, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: meta.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>{stage}</span>
              <span style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>{bgrCounts[stage]}</span>
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "#6b7280" }}>Employees assigned</p>
          </div>
        ))}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total</span>
            <span style={{ background: "#f3f4f6", color: "#374151", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>{assignments.length}</span>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#6b7280" }}>Total assignments</p>
        </div>
      </div>

      {/* Main Tabs */}
      <div style={{ display: "flex", gap: 4, background: "#fff", borderRadius: 10, padding: 4, border: "1px solid #e5e7eb", marginBottom: 20, width: "fit-content" }}>
        {[
          { id: "assignments", label: `🎖️ Assignments (${assignments.length})` },
          { id: "history",     label: `📋 Grade History (${allHistory.length})` },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ padding: "8px 20px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13, background: activeTab === tab.id ? "#1a1a2e" : "transparent", color: activeTab === tab.id ? "#fff" : "#6b7280", transition: "all 0.2s", whiteSpace: "nowrap" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════ TAB 1 — ASSIGNMENTS ════ */}
      {activeTab === "assignments" && (
        <>
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 16 }}>🔍</span>
              <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Search employee or grade..."
                style={{ width: "100%", padding: "8px 10px 8px 32px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, color: "#374151", background: "#fff", boxSizing: "border-box", outline: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["All", ...usedLevels].map(f => (
                <button key={f} onClick={() => setFilterGrade(f)}
                  style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid", fontSize: 13, fontWeight: 600, cursor: "pointer", background: filterGrade === f ? "#2563eb" : "#fff", color: filterGrade === f ? "#fff" : "#6b7280", borderColor: filterGrade === f ? "#2563eb" : "#e5e7eb" }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>Loading assignments...</div>
          ) : assignments.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: 12, padding: "60px 0", textAlign: "center", border: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎖️</div>
              <p style={{ color: "#6b7280", fontSize: 15, marginBottom: 20 }}>No grade assignments yet.</p>
              <button onClick={openCreate} style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 600, cursor: "pointer" }}>+ Assign First Grade</button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: 12, padding: "40px 0", textAlign: "center", border: "1px solid #e5e7eb" }}>
              <p style={{ color: "#6b7280" }}>No assignments match your filter.</p>
              <button onClick={() => { setFilterGrade("All"); setSearchText(""); }}
                style={{ marginTop: 8, background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Clear filters</button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="ag-table-wrap" style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflowX: "auto", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e5e7eb" }}>
                      {["Employee", "Emp ID", "Grade", "Designation", "BGR Stage", "Dept Salary (Scale)", "Effective Date", "Changes", "Actions"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#374151", whiteSpace: "nowrap", fontSize: 13 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a, i) => {
                      const meta         = BGR_META[a.grade_id?.bgr_stage] || BGR_META.Build;
                      const historyCount = (a.grade_history || []).length;
                      return (
                        <tr key={a._id}
                          style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa", transition: "background 0.15s" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#f0f4ff"}
                          onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafafa"}>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#1a1a2e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                                {(a.employee_id?.name || "?")[0].toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: "#1a1a2e" }}>{a.employee_id?.name || "—"}</div>
                                {a.employee_id?.department && <div style={{ fontSize: 11, color: "#9ca3af" }}>{a.employee_id.department}</div>}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px", color: "#6b7280", fontSize: 13 }}>{a.employee_id?.employee_id || "—"}</td>
                          <td style={{ padding: "14px 16px" }}>
                            <span style={{ background: "#1a1a2e", color: "#fff", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 800 }}>{a.grade_id?.level || "—"}</span>
                          </td>
                          <td style={{ padding: "14px 16px", color: "#374151", fontSize: 13 }}>{a.grade_id?.designation || "—"}</td>
                          <td style={{ padding: "14px 16px" }}>
                            {a.grade_id?.bgr_stage ? (
                              <span style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700 }}>{a.grade_id.bgr_stage}</span>
                            ) : "—"}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <DeptSalaryBadge assignment={a} deptBands={deptBands} />
                          </td>
                          <td style={{ padding: "14px 16px", color: "#6b7280", fontSize: 13 }}>{formatDate(a.effective_date)}</td>
                          <td style={{ padding: "14px 16px" }}>
                            <span style={{ background: historyCount > 1 ? "#eff6ff" : "#f3f4f6", color: historyCount > 1 ? "#2563eb" : "#9ca3af", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>
                              {historyCount} change{historyCount !== 1 ? "s" : ""}
                            </span>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => openView(a)} style={{ padding: "6px 14px", border: "1px solid #e5e7eb", borderRadius: 7, background: "#fff", color: "#374151", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>View</button>
                              <button onClick={() => openEdit(a)} style={{ padding: "6px 14px", border: "1px solid #2563eb", borderRadius: 7, background: "#eff6ff", color: "#2563eb", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Edit</button>
                              <button onClick={() => setDeleteConfirm(a._id)} style={{ padding: "6px 14px", border: "1px solid #fecaca", borderRadius: 7, background: "#fff5f5", color: "#ef4444", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Remove</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="ag-cards-wrap">
                {filtered.map(a => {
                  const meta         = BGR_META[a.grade_id?.bgr_stage] || BGR_META.Build;
                  const historyCount = (a.grade_history || []).length;
                  const sp           = SCALE_POINTS.find(s => s.key === a.salary_scale_point);
                  const deptBand     = getAssignmentDeptBand(a);
                  const scaleVal     = deptBand ? getScaleValue(deptBand, a.salary_scale_point) : getScaleValue(a.grade_id, a.salary_scale_point);
                  return (
                    <div key={a._id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                      <div style={{ background: "#1a1a2e", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>
                            {(a.employee_id?.name || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{a.employee_id?.name || "—"}</div>
                            <div style={{ color: "#9ca3af", fontSize: 12 }}>{a.employee_id?.employee_id || ""}{a.employee_id?.department ? ` · ${a.employee_id.department}` : ""}</div>
                          </div>
                        </div>
                        <span style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{a.grade_id?.bgr_stage || "—"}</span>
                      </div>
                      <div style={{ padding: "14px 18px" }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
                          <span style={{ background: "#1a1a2e", color: "#fff", borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 800 }}>{a.grade_id?.level || "—"}</span>
                          <span style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>{a.grade_id?.designation || "—"}</span>
                          {sp && scaleVal && (
                            <span style={{ background: sp.bg, color: sp.color, border: `1px solid ${sp.border}`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
                              Scale {sp.short} · {fmt(scaleVal)}
                            </span>
                          )}
                          <span style={{ marginLeft: "auto", background: historyCount > 1 ? "#eff6ff" : "#f3f4f6", color: historyCount > 1 ? "#2563eb" : "#9ca3af", borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
                            {historyCount} change{historyCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>
                          Effective: <strong style={{ color: "#374151" }}>{formatDate(a.effective_date)}</strong>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => openView(a)} style={{ flex: 1, padding: "9px 0", border: "1px solid #e5e7eb", borderRadius: 7, background: "#fff", color: "#374151", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>View</button>
                          <button onClick={() => openEdit(a)} style={{ flex: 1, padding: "9px 0", border: "1px solid #2563eb", borderRadius: 7, background: "#eff6ff", color: "#2563eb", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Edit</button>
                          <button onClick={() => setDeleteConfirm(a._id)} style={{ flex: 1, padding: "9px 0", border: "1px solid #fecaca", borderRadius: 7, background: "#fff5f5", color: "#ef4444", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Remove</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* ════ TAB 2 — GRADE HISTORY ════ */}
      {activeTab === "history" && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 24 }}>
          <p style={{ margin: "0 0 20px", fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>All Grade Changes — Timeline</p>
          {allHistory.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
              <p>No grade changes recorded yet.</p>
            </div>
          ) : (
            <div style={{ position: "relative", paddingLeft: 24 }}>
              <div style={{ position: "absolute", left: 8, top: 0, bottom: 0, width: 2, background: "#e5e7eb", borderRadius: 99 }} />
              {allHistory.map((h, i) => {
                const meta    = CHANGE_TYPE_META[h.change_type] || CHANGE_TYPE_META.initial;
                const bgrMeta = BGR_META[h.bgr_stage || h.grade_id?.bgr_stage] || BGR_META.Build;
                const spMeta  = SCALE_POINTS.find(s => s.key === h.salary_scale_point);
                return (
                  <div key={h._id || i} style={{ position: "relative", marginBottom: i < allHistory.length - 1 ? 16 : 0 }}>
                    <div style={{ position: "absolute", left: -20, top: 8, width: 12, height: 12, borderRadius: "50%", background: meta.color, border: "2px solid #fff", boxShadow: `0 0 0 2px ${meta.color}40` }} />
                    <div style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 14 }}>{meta.icon}</span>
                          <span style={{ fontWeight: 700, color: "#1a1a2e", fontSize: 13 }}>{h.employee_name}</span>
                          {h.employee_eid && <span style={{ fontSize: 11, color: "#9ca3af" }}>({h.employee_eid})</span>}
                          <span style={{ background: meta.bg, color: meta.color, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{meta.label}</span>
                          <span style={{ background: "#1a1a2e", color: "#fff", fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 6 }}>
                            {h.grade_level || h.grade_id?.level || "—"}
                          </span>
                          <span style={{ fontSize: 12, color: "#374151" }}>{h.grade_designation || h.grade_id?.designation || "—"}</span>
                          {spMeta && (
                            <span style={{ background: spMeta.bg, color: spMeta.color, border: `1px solid ${spMeta.border}`, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                              @ Scale {spMeta.short}
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                          <span style={{ background: bgrMeta.bg, color: bgrMeta.color, border: `1px solid ${bgrMeta.border}`, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                            {h.bgr_stage || h.grade_id?.bgr_stage || "—"}
                          </span>
                          <span style={{ fontSize: 11, color: "#9ca3af" }}>{formatDate(h.changed_at)}</span>
                        </div>
                      </div>
                      {h.reason && <p style={{ margin: 0, fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>"{h.reason}"</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════ VIEW MODAL ════ */}
      {viewItem && (() => {
        const meta         = BGR_META[viewItem.grade_id?.bgr_stage] || BGR_META.Build;
        const spMeta       = SCALE_POINTS.find(s => s.key === viewItem.salary_scale_point);
        const viewDeptBand = getAssignmentDeptBand(viewItem);
        const activeBand   = (viewDeptBand && (viewDeptBand.salary_band_min || viewDeptBand.salary_band_mid || viewDeptBand.salary_band_max))
          ? viewDeptBand : viewItem.grade_id;
        const spVal = getScaleValue(activeBand, viewItem.salary_scale_point);
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
              <div style={{ background: "#1a1a2e", padding: "20px 24px", borderRadius: "14px 14px 0 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16 }}>
                      {(viewItem.employee_id?.name || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, color: "#fff", fontSize: 17, fontWeight: 700 }}>{viewItem.employee_id?.name || "—"}</h3>
                      <p style={{ margin: "3px 0 0", color: "#9ca3af", fontSize: 13 }}>
                        {viewItem.employee_id?.employee_id || ""}
                        {viewItem.employee_id?.department ? ` · ${viewItem.employee_id.department}` : ""}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setViewItem(null)} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 16 }}>✕</button>
                </div>
              </div>

              <div style={{ display: "flex", gap: 4, padding: "12px 20px", background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                {[
                  { id: "details", label: "📄 Details" },
                  { id: "history", label: `📋 History (${(viewItem.grade_history || []).length})` },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setViewTab(tab.id)}
                    style={{ padding: "7px 16px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13, background: viewTab === tab.id ? "#2563eb" : "transparent", color: viewTab === tab.id ? "#fff" : "#6b7280" }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={{ padding: 24 }}>
                {viewTab === "details" && (
                  <>
                    <div style={{ background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <span style={{ background: "#1a1a2e", color: "#fff", borderRadius: 6, padding: "4px 12px", fontSize: 14, fontWeight: 900 }}>{viewItem.grade_id?.level || "—"}</span>
                        <span style={{ fontWeight: 700, color: "#1a1a2e", fontSize: 15 }}>{viewItem.grade_id?.designation || "—"}</span>
                        <span style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700, marginLeft: "auto" }}>
                          {viewItem.grade_id?.bgr_stage || "—"}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: "#6b7280" }}>
                        Experience: <strong style={{ color: "#374151" }}>{viewItem.grade_id?.experience_range || "—"}</strong>
                      </div>
                    </div>

                    {viewDeptBand ? (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>
                          🏢 {viewDeptBand.department_name} — Salary Band for {viewDeptBand.grade_level || viewDeptBand.grade_id?.level}
                        </div>
                        <div style={{ padding: "14px 16px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e5e7eb" }}>
                          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                            {SCALE_POINTS.map(sp => {
                              const val    = getScaleValue(viewDeptBand, sp.key);
                              const isThis = viewItem.salary_scale_point === sp.key;
                              if (!val) return null;
                              return (
                                <div key={sp.key} style={{ flex: 1, minWidth: 80, background: isThis ? sp.bg : "#fff", border: `${isThis ? "2px" : "1px"} solid ${isThis ? sp.border : "#e5e7eb"}`, borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: isThis ? sp.color : "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 3 }}>
                                    Scale {sp.short}{isThis && " ◀"}
                                  </div>
                                  <div style={{ fontSize: 13, fontWeight: 800, color: isThis ? sp.color : "#374151" }}>{fmt(val)}</div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="track-bar">
                            <div className="track-fill" />
                            {spMeta && (
                              <div className="track-dot" style={{
                                left: spMeta.key === "min" ? "0%" : spMeta.key === "mid" ? "50%" : "100%",
                                color: spMeta.color, background: spMeta.color,
                              }} />
                            )}
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
                            <span>A — Min</span><span>B — Mid</span><span>C — Max</span>
                          </div>
                          {spMeta && spVal ? (
                            <div style={{ marginTop: 8, textAlign: "center", fontSize: 13, fontWeight: 700, color: spMeta.color }}>
                              Employee sits at Scale {spMeta.short}: {fmt(spVal)}
                            </div>
                          ) : (
                            <div style={{ marginTop: 8, textAlign: "center", fontSize: 12, color: "#9ca3af" }}>Scale point not assigned yet</div>
                          )}
                          {viewDeptBand.promotion_timeline && (
                            <div style={{ marginTop: 8, textAlign: "center", fontSize: 12, color: "#6b7280" }}>
                              Promotion Timeline: <strong style={{ color: "#374151" }}>{viewDeptBand.promotion_timeline}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}

                    {[
                      { label: "Core Responsibility",    value: viewItem.grade_id?.core_responsibility },
                      { label: "Performance Expectation", value: viewItem.grade_id?.performance_expectation },
                    ].map(row => row.value ? (
                      <div key={row.label} style={{ marginBottom: 12, padding: "12px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e5e7eb" }}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 5 }}>{row.label}</label>
                        <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{row.value}</p>
                      </div>
                    ) : null)}

                    <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                      <span style={{ fontWeight: 600, color: "#374151", fontSize: 13 }}>📅 Effective Date</span>
                      <span style={{ fontWeight: 700, color: "#1a1a2e", fontSize: 14 }}>{formatDate(viewItem.effective_date)}</span>
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => { setViewItem(null); openEdit(viewItem); }}
                        style={{ flex: 1, padding: "10px 0", border: "1px solid #2563eb", borderRadius: 8, background: "#eff6ff", color: "#2563eb", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
                        Edit Assignment
                      </button>
                      <button onClick={() => setViewItem(null)}
                        style={{ flex: 1, padding: "10px 0", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
                        Close
                      </button>
                    </div>
                  </>
                )}
                {viewTab === "history" && <HistoryTimeline history={viewItem.grade_history || []} />}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ════ ASSIGN / EDIT MODAL ════ */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 600, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1a1a2e" }}>
                  {editingId ? "Edit / Change Grade" : "Assign Grade to Employee"}
                </h3>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "#6b7280" }}>
                  {editingId ? "Grade change will be recorded in history" : "Link an employee to a grade level"}
                </p>
              </div>
              <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280" }}>✕</button>
            </div>

            <div style={{ padding: 24 }}>

              {/* Employee */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Employee *</label>
                <select value={form.employee_id}
                  onChange={e => setForm(f => ({ ...f, employee_id: e.target.value, salary_scale_point: "" }))}
                  style={inputStyle} className="ag-select">
                  <option value="">— Select Employee —</option>
                  {employees.map(e => (
                    <option key={e._id} value={e._id}>
                      {e.name}{e.employee_id ? ` (${e.employee_id})` : ""}{e.department ? ` · ${e.department}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grade */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Grade Level *</label>
                <select value={form.grade_id}
                  onChange={e => setForm(f => ({ ...f, grade_id: e.target.value, salary_scale_point: "" }))}
                  style={inputStyle} className="ag-select">
                  <option value="">— Select Grade —</option>
                  {[...grades]
                    .sort((a, b) => parseInt(a.level.replace("L", "")) - parseInt(b.level.replace("L", "")))
                    .map(g => (
                      <option key={g._id} value={g._id}>
                        {g.level} — {g.designation} ({g.bgr_stage})
                      </option>
                    ))}
                </select>
              </div>

              {/* ✅ Dept Salary Band — ONLY for this employee's department */}
              {form.employee_id && form.grade_id && (
                <DeptSalaryBandInfo
                  band={modalDeptBand}
                  loading={modalDeptBandLoading}
                  deptName={selectedEmp?.department}
                />
              )}

              {/* Employee Info */}
              {selectedEmp && (
                <div style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#6b7280" }}>
                  👤 <strong style={{ color: "#374151" }}>{selectedEmp.name}</strong>
                  {selectedEmp.department && <> · 🏢 <strong style={{ color: "#2563eb" }}>{selectedEmp.department}</strong></>}
                  {selectedEmp.employee_id && <> · ID: <strong style={{ color: "#374151" }}>{selectedEmp.employee_id}</strong></>}
                </div>
              )}

              {/* Salary Scale Selector */}
              <SalaryScaleSelector
                grade={selectedGrade}
                deptBand={modalDeptBand}
                value={form.salary_scale_point}
                onChange={val => setForm(f => ({ ...f, salary_scale_point: val }))}
              />

              {/* Effective Date */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Effective Date *</label>
                <input type="date" value={form.effective_date}
                  onChange={e => setForm(f => ({ ...f, effective_date: e.target.value }))}
                  style={inputStyle} />
              </div>

              {/* Reason */}
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>
                  Reason {editingId ? "(for grade change — optional)" : "(optional)"}
                </label>
                <input value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder={editingId ? "e.g. Annual promotion, Performance upgrade..." : "e.g. Initial onboarding grade assignment"}
                  style={inputStyle} />
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={closeModal}
                  style={{ padding: "10px 24px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={saving}
                  style={{ padding: "10px 28px", border: "none", borderRadius: 8, background: saving ? "#93c5fd" : "#2563eb", color: "#fff", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 14 }}>
                  {saving ? "Saving..." : editingId ? "Update & Save History" : "Assign Grade"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 28, maxWidth: 360, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ margin: "0 0 8px", color: "#1a1a2e" }}>Remove Assignment?</h3>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>This will remove the grade assignment and all its history from this employee.</p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setDeleteConfirm(null)}
                style={{ flex: 1, padding: "10px 0", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 8, background: "#ef4444", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 };
const inputStyle  = { width: "100%", padding: "9px 11px", border: "1px solid #d1d5db", borderRadius: 7, fontSize: 13, color: "#1a1a2e", background: "#fff", boxSizing: "border-box", outline: "none", fontFamily: "inherit" };