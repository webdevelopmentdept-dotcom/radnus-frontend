import { useEffect, useState } from "react";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api`;

// ─── BGR Meta ─────────────────────────────────────────────────────────────────
const BGR_META = {
  Build:  { color: "#059669", bg: "#d1fae5", border: "#6ee7b7", light: "#f0fdf4" },
  Grow:   { color: "#2563eb", bg: "#dbeafe", border: "#93c5fd", light: "#eff6ff" },
  Retain: { color: "#d97706", bg: "#fef3c7", border: "#fcd34d", light: "#fffbeb" },
};

const CHANGE_TYPE_META = {
  initial : { label: "Initial",  color: "#6b7280", bg: "#f3f4f6", icon: "🎖️" },
  promote : { label: "Promoted", color: "#16a34a", bg: "#f0fdf4", icon: "⬆️" },
  demote  : { label: "Demoted",  color: "#dc2626", bg: "#fef2f2", icon: "⬇️" },
  lateral : { label: "Lateral",  color: "#2563eb", bg: "#eff6ff", icon: "↔️" },
};

const TABS = [
  { id: "overview",     label: "📊 Overview"       },
  { id: "distribution", label: "📈 Distribution"   },
  { id: "history",      label: "📋 Change History"  },
  { id: "employees",    label: "👥 Employee Report" },
];

const STYLES = `
  .gr-page { padding: 28px 32px; }
  .gr-table-wrap { display: block; }
  .gr-cards-wrap { display: none; }
  .gr-stats-grid { grid-template-columns: repeat(4, 1fr); }
  .gr-dist-grid  { grid-template-columns: 1fr 1fr; }

  @media (max-width: 1100px) {
    .gr-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
  }
  @media (max-width: 900px) {
    .gr-table-wrap { display: none !important; }
    .gr-cards-wrap { display: block !important; }
    .gr-dist-grid  { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 768px) {
    .gr-page { padding: 16px !important; }
    .gr-stats-grid { grid-template-columns: 1fr 1fr !important; }
  }
  @media (max-width: 420px) {
    .gr-stats-grid { grid-template-columns: 1fr !important; }
  }
`;

const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────
function BarChart({ data, maxVal }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.map((item, i) => {
        const pct = maxVal > 0 ? (item.count / maxVal) * 100 : 0;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, flexShrink: 0, textAlign: "right" }}>
              <span style={{ background: "#1a1a2e", color: "#fff", borderRadius: 4, padding: "2px 6px", fontSize: 11, fontWeight: 800 }}>{item.label}</span>
            </div>
            <div style={{ flex: 1, background: "#f3f4f6", borderRadius: 99, height: 10, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: item.color || "#2563eb", borderRadius: 99, transition: "width 0.8s cubic-bezier(.4,0,.2,1)" }}/>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", width: 28, textAlign: "right", flexShrink: 0 }}>{item.count}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Donut Chart (SVG) ────────────────────────────────────────────────────────
function DonutChart({ segments, size = 120, thickness = 22 }) {
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2, cy = size / 2;

  let cumulative = 0;
  const total = segments.reduce((s, x) => s + x.value, 0);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={thickness}/>
        {segments.map((seg, i) => {
          const frac   = total > 0 ? seg.value / total : 0;
          const dash   = frac * circ;
          const offset = circ - cumulative * circ / total;
          cumulative  += seg.value;
          if (seg.value === 0) return null;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={seg.color} strokeWidth={thickness}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-((1 - cumulative / total + frac) * circ - circ)}
              style={{ transition: "stroke-dasharray 0.8s" }}/>
          );
        })}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: "#1a1a2e", lineHeight: 1 }}>{total}</span>
        <span style={{ fontSize: 9, color: "#9ca3af", fontWeight: 600 }}>TOTAL</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GradeReports() {
  const [assignments, setAssignments] = useState([]);
  const [grades,      setGrades]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState("overview");
  const [toast,       setToast]       = useState(null);

  // Filters for Employee Report tab
  const [filterBGR,   setFilterBGR]   = useState("All");
  const [filterLevel, setFilterLevel] = useState("All");
  const [searchText,  setSearchText]  = useState("");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [grdRes, asgRes] = await Promise.all([
        fetch(`${API_BASE}/grade-master`),
        fetch(`${API_BASE}/assign-grade`),
      ]);
      const grdData = await grdRes.json();
      const asgData = await asgRes.json();
      setGrades(grdData.data || []);

      // ── Merge real employeeId from HR list (same fix as Dashboard/MyProfile) ──
      let hrList = [];
      try {
        const hrRes  = await fetch(`${API_BASE}/hr/employees`);
        const hrData = await hrRes.json();
        hrList = Array.isArray(hrData) ? hrData : hrData?.data || [];
      } catch (_) {}

      const rawAssignments = asgData.data || [];
      const merged = rawAssignments.map(a => {
        const empObjId = a.employee_id?._id || a.employee_id;
        const hrMatch  = hrList.find(e => e._id === empObjId);
        if (hrMatch && a.employee_id && typeof a.employee_id === "object") {
          return {
            ...a,
            employee_id: {
              ...a.employee_id,
              employee_id: hrMatch.employeeId || a.employee_id.employee_id || "",
            },
          };
        }
        return a;
      });
      setAssignments(merged);
    } catch {
      showToast("Failed to load report data", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  // ── Computed Analytics ─────────────────────────────────────────────────────
  const totalAssigned   = assignments.length;
  const totalGradeLevels = grades.length;

  // BGR counts
  const bgrCounts = { Build: 0, Grow: 0, Retain: 0 };
  assignments.forEach(a => {
    const s = a.grade_id?.bgr_stage;
    if (s && bgrCounts[s] !== undefined) bgrCounts[s]++;
  });

  // Per-level counts
  const levelCounts = {};
  assignments.forEach(a => {
    const lvl = a.grade_id?.level;
    if (lvl) levelCounts[lvl] = (levelCounts[lvl] || 0) + 1;
  });

  const levelChartData = Object.entries(levelCounts)
    .sort((a, b) => parseInt(a[0].replace("L","")) - parseInt(b[0].replace("L","")))
    .map(([label, count]) => {
      const grade   = grades.find(g => g.level === label);
      const stage   = grade?.bgr_stage || "Build";
      return { label, count, color: BGR_META[stage]?.color || "#2563eb", stage };
    });

  const maxLevelCount = Math.max(...levelChartData.map(d => d.count), 1);

  // All history
  const allHistory = assignments
    .flatMap(a => (a.grade_history || []).map(h => ({
      ...h,
      employee_name: a.employee_id?.name || "—",
      employee_eid:  a.employee_id?.employee_id || "",
      employee_dept: a.employee_id?.department || "—",
    })))
    .sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at));

  // Change type summary
  const changeCounts = { initial: 0, promote: 0, demote: 0, lateral: 0 };
  allHistory.forEach(h => { if (changeCounts[h.change_type] !== undefined) changeCounts[h.change_type]++; });

  // Employees with multiple changes (movement tracking)
  const moversMap = {};
  assignments.forEach(a => {
    const hist = a.grade_history || [];
    if (hist.length > 1) {
      moversMap[a._id] = {
        name:   a.employee_id?.name || "—",
        eid:    a.employee_id?.employee_id || "",
        dept:   a.employee_id?.department || "—",
        level:  a.grade_id?.level || "—",
        desg:   a.grade_id?.designation || "—",
        stage:  a.grade_id?.bgr_stage || "—",
        moves:  hist.length - 1,
        latest: hist.sort((x,y) => new Date(y.changed_at) - new Date(x.changed_at))[0],
      };
    }
  });
  const movers = Object.values(moversMap).sort((a, b) => b.moves - a.moves);

  // Unassigned count
  const unassigned = "—"; // Would need employee total from API

  // Filtered employees list
  const filteredEmps = assignments.filter(a => {
    const matchBGR   = filterBGR   === "All" || a.grade_id?.bgr_stage === filterBGR;
    const matchLevel = filterLevel === "All" || a.grade_id?.level     === filterLevel;
    const matchSearch = !searchText ||
      a.employee_id?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      a.employee_id?.employee_id?.toLowerCase().includes(searchText.toLowerCase()) ||
      a.employee_id?.department?.toLowerCase().includes(searchText.toLowerCase()) ||
      a.grade_id?.designation?.toLowerCase().includes(searchText.toLowerCase());
    return matchBGR && matchLevel && matchSearch;
  }).sort((a, b) => parseInt((a.grade_id?.level||"L0").replace("L","")) - parseInt((b.grade_id?.level||"L0").replace("L","")));

  const usedLevels = [...new Set(assignments.map(a => a.grade_id?.level).filter(Boolean))]
    .sort((a,b) => parseInt(a.replace("L","")) - parseInt(b.replace("L","")));

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", background: "#f4f6fb" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #e5e7eb", borderTopColor: "#2563eb", borderRadius: "50%", animation: "_spin .7s linear infinite", margin: "0 auto 12px" }}/>
        <p style={{ color: "#6b7280", fontSize: 14 }}>Loading report data...</p>
        <style>{`@keyframes _spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  );

  return (
    <div className="gr-page" style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", background: "#f4f6fb" }}>
      <style>{STYLES}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 16, zIndex: 9999, background: toast.type === "error" ? "#ff4d4f" : "#52c41a", color: "#fff", padding: "12px 20px", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,.15)", fontWeight: 500, fontSize: 14 }}>
          {toast.type === "error" ? "⚠️ " : "✅ "}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1a1a2e" }}>Grade Reports</h2>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>Analytics & insights on employee grading — BGR Framework</p>
        </div>
        <button onClick={fetchAll}
          style={{ background: "#fff", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 8, padding: "9px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
          🔄 Refresh
        </button>
      </div>

      {/* ── KPI Summary Cards ─────────────────────────── */}
      <div className="gr-stats-grid" style={{ display: "grid", gap: 14, marginBottom: 24 }}>
        {/* Total Assigned */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Assigned</p>
              <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: "#1a1a2e", lineHeight: 1 }}>{totalAssigned}</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>Employees with grades</p>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f0f4ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🎖️</div>
          </div>
        </div>

        {/* Build */}
        <div style={{ background: BGR_META.Build.light, borderRadius: 14, border: `1.5px solid ${BGR_META.Build.border}`, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: BGR_META.Build.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>Build Stage</p>
              <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: BGR_META.Build.color, lineHeight: 1 }}>{bgrCounts.Build}</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>L1–L3 · Entry level</p>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: BGR_META.Build.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🌱</div>
          </div>
          {totalAssigned > 0 && (
            <div style={{ marginTop: 12, background: BGR_META.Build.bg, borderRadius: 99, height: 6, overflow: "hidden" }}>
              <div style={{ width: `${(bgrCounts.Build / totalAssigned) * 100}%`, height: "100%", background: BGR_META.Build.color, borderRadius: 99, transition: "width 0.8s" }}/>
            </div>
          )}
          {totalAssigned > 0 && (
            <p style={{ margin: "5px 0 0", fontSize: 11, color: BGR_META.Build.color, fontWeight: 600 }}>
              {Math.round((bgrCounts.Build / totalAssigned) * 100)}% of workforce
            </p>
          )}
        </div>

        {/* Grow */}
        <div style={{ background: BGR_META.Grow.light, borderRadius: 14, border: `1.5px solid ${BGR_META.Grow.border}`, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: BGR_META.Grow.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>Grow Stage</p>
              <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: BGR_META.Grow.color, lineHeight: 1 }}>{bgrCounts.Grow}</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>L4–L7 · Leadership</p>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: BGR_META.Grow.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📈</div>
          </div>
          {totalAssigned > 0 && (
            <div style={{ marginTop: 12, background: BGR_META.Grow.bg, borderRadius: 99, height: 6, overflow: "hidden" }}>
              <div style={{ width: `${(bgrCounts.Grow / totalAssigned) * 100}%`, height: "100%", background: BGR_META.Grow.color, borderRadius: 99, transition: "width 0.8s" }}/>
            </div>
          )}
          {totalAssigned > 0 && (
            <p style={{ margin: "5px 0 0", fontSize: 11, color: BGR_META.Grow.color, fontWeight: 600 }}>
              {Math.round((bgrCounts.Grow / totalAssigned) * 100)}% of workforce
            </p>
          )}
        </div>

        {/* Retain */}
        <div style={{ background: BGR_META.Retain.light, borderRadius: 14, border: `1.5px solid ${BGR_META.Retain.border}`, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: BGR_META.Retain.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>Retain Stage</p>
              <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: BGR_META.Retain.color, lineHeight: 1 }}>{bgrCounts.Retain}</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>L8–L10 · Senior</p>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: BGR_META.Retain.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⭐</div>
          </div>
          {totalAssigned > 0 && (
            <div style={{ marginTop: 12, background: BGR_META.Retain.bg, borderRadius: 99, height: 6, overflow: "hidden" }}>
              <div style={{ width: `${(bgrCounts.Retain / totalAssigned) * 100}%`, height: "100%", background: BGR_META.Retain.color, borderRadius: 99, transition: "width 0.8s" }}/>
            </div>
          )}
          {totalAssigned > 0 && (
            <p style={{ margin: "5px 0 0", fontSize: 11, color: BGR_META.Retain.color, fontWeight: 600 }}>
              {Math.round((bgrCounts.Retain / totalAssigned) * 100)}% of workforce
            </p>
          )}
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 4, background: "#fff", borderRadius: 10, padding: 4, border: "1px solid #e5e7eb", marginBottom: 20, width: "fit-content", flexWrap: "wrap" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ padding: "8px 18px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13, background: activeTab === tab.id ? "#1a1a2e" : "transparent", color: activeTab === tab.id ? "#fff" : "#6b7280", transition: "all 0.2s", whiteSpace: "nowrap" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════
          TAB 1 — OVERVIEW
      ════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Row: Grade Level Distribution + Change Activity */}
          <div className="gr-dist-grid" style={{ display: "grid", gap: 16 }}>

            {/* Level Distribution bar chart */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
              <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>Employees per Grade Level</p>
              <p style={{ margin: "0 0 20px", fontSize: 12, color: "#9ca3af" }}>Distribution across L1–L10</p>
              {levelChartData.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 0", color: "#d1d5db" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
                  <p style={{ fontSize: 13, margin: 0 }}>No grade assignments yet</p>
                </div>
              ) : (
                <BarChart data={levelChartData} maxVal={maxLevelCount} />
              )}
            </div>

            {/* BGR Donut + breakdown */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
              <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>BGR Stage Breakdown</p>
              <p style={{ margin: "0 0 20px", fontSize: 12, color: "#9ca3af" }}>Build · Grow · Retain distribution</p>

              <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
                <DonutChart segments={[
                  { value: bgrCounts.Build,  color: BGR_META.Build.color  },
                  { value: bgrCounts.Grow,   color: BGR_META.Grow.color   },
                  { value: bgrCounts.Retain, color: BGR_META.Retain.color },
                ]} size={120} thickness={22} />

                <div style={{ flex: 1, minWidth: 120 }}>
                  {Object.entries(bgrCounts).map(([stage, count]) => {
                    const meta = BGR_META[stage];
                    const pct  = totalAssigned > 0 ? Math.round((count / totalAssigned) * 100) : 0;
                    return (
                      <div key={stage} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: meta.color, flexShrink: 0 }}/>
                        <span style={{ fontSize: 13, color: "#374151", fontWeight: 600, flex: 1 }}>{stage}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: meta.color }}>{count}</span>
                        <span style={{ fontSize: 11, color: "#9ca3af", width: 32, textAlign: "right" }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Grade Change Activity summary */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
            <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>Grade Change Activity</p>
            <p style={{ margin: "0 0 20px", fontSize: 12, color: "#9ca3af" }}>Total {allHistory.length} events recorded across all employees</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
              {Object.entries(CHANGE_TYPE_META).map(([type, meta]) => (
                <div key={type} style={{ background: meta.bg, borderRadius: 12, padding: "16px 18px", border: `1px solid ${meta.color}22` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 18 }}>{meta.icon}</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: meta.color }}>{changeCounts[type]}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: meta.color }}>{meta.label}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>grade events</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Movers */}
          {movers.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
              <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>Most Active — Grade Movements</p>
              <p style={{ margin: "0 0 16px", fontSize: 12, color: "#9ca3af" }}>Employees with the most grade changes</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {movers.slice(0, 5).map((m, i) => {
                  const meta = BGR_META[m.stage] || BGR_META.Build;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e5e7eb" }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1a1a2e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                        {(m.name || "?")[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 700, color: "#1a1a2e", fontSize: 13 }}>{m.name}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>{m.eid && `${m.eid} · `}{m.dept}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <span style={{ background: "#1a1a2e", color: "#fff", borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 800 }}>{m.level}</span>
                        <span style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>{m.stage}</span>
                        <span style={{ background: "#f0f4ff", color: "#2563eb", borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 700, border: "1px solid #c7d2fe" }}>{m.moves} moves</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════
          TAB 2 — DISTRIBUTION
      ════════════════════════════════════ */}
      {activeTab === "distribution" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Per-Level detail table */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #f3f4f6" }}>
              <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>Grade Level Distribution</p>
              <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>Headcount and percentage per grade</p>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e5e7eb" }}>
                  {["Level", "Designation", "BGR Stage", "Headcount", "% of Total", "Bar"].map(h => (
                    <th key={h} style={{ padding: "11px 18px", textAlign: "left", fontWeight: 700, color: "#374151", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grades
                  .sort((a,b) => parseInt(a.level.replace("L","")) - parseInt(b.level.replace("L","")))
                  .map((g, i) => {
                    const count = levelCounts[g.level] || 0;
                    const pct   = totalAssigned > 0 ? ((count / totalAssigned) * 100).toFixed(1) : "0.0";
                    const meta  = BGR_META[g.bgr_stage] || BGR_META.Build;
                    return (
                      <tr key={g._id}
                        style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f0f4ff"}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafafa"}>
                        <td style={{ padding: "13px 18px" }}>
                          <span style={{ background: "#1a1a2e", color: "#fff", borderRadius: 6, padding: "3px 9px", fontSize: 12, fontWeight: 800 }}>{g.level}</span>
                        </td>
                        <td style={{ padding: "13px 18px", color: "#374151", fontWeight: 600 }}>{g.designation}</td>
                        <td style={{ padding: "13px 18px" }}>
                          <span style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{g.bgr_stage}</span>
                        </td>
                        <td style={{ padding: "13px 18px" }}>
                          <span style={{ fontSize: 16, fontWeight: 800, color: count > 0 ? "#1a1a2e" : "#d1d5db" }}>{count}</span>
                        </td>
                        <td style={{ padding: "13px 18px", color: "#6b7280", fontSize: 13 }}>{pct}%</td>
                        <td style={{ padding: "13px 18px", minWidth: 120 }}>
                          <div style={{ background: "#f3f4f6", borderRadius: 99, height: 8, overflow: "hidden", width: "100%" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: meta.color, borderRadius: 99, transition: "width 0.8s" }}/>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              {/* Footer */}
              <tfoot>
                <tr style={{ background: "#f8fafc", borderTop: "2px solid #e5e7eb" }}>
                  <td colSpan={3} style={{ padding: "12px 18px", fontWeight: 700, color: "#374151", fontSize: 13 }}>Total</td>
                  <td style={{ padding: "12px 18px", fontWeight: 800, color: "#1a1a2e", fontSize: 16 }}>{totalAssigned}</td>
                  <td style={{ padding: "12px 18px", fontWeight: 700, color: "#374151" }}>100%</td>
                  <td/>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* BGR Stage cards with employee lists */}
          {["Build","Grow","Retain"].map(stage => {
            const meta  = BGR_META[stage];
            const emps  = assignments.filter(a => a.grade_id?.bgr_stage === stage)
              .sort((a,b) => parseInt((a.grade_id?.level||"L0").replace("L","")) - parseInt((b.grade_id?.level||"L0").replace("L","")));
            return (
              <div key={stage} style={{ background: "#fff", borderRadius: 14, border: `1.5px solid ${meta.border}`, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
                <div style={{ background: meta.bg, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ margin: "0 0 2px", fontWeight: 800, color: meta.color, fontSize: 15 }}>{stage} Stage</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
                      {stage === "Build" ? "L1–L3 · Entry level talent" : stage === "Grow" ? "L4–L7 · Leadership development" : "L8–L10 · Senior retention"}
                    </p>
                  </div>
                  <span style={{ background: "#fff", color: meta.color, border: `1px solid ${meta.border}`, borderRadius: 20, padding: "4px 14px", fontSize: 13, fontWeight: 800 }}>
                    {emps.length} employees
                  </span>
                </div>
                {emps.length === 0 ? (
                  <div style={{ padding: "24px", textAlign: "center", color: "#d1d5db", fontSize: 13 }}>No employees in this stage</div>
                ) : (
                  <div style={{ padding: "14px 20px", display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {emps.map(a => (
                      <div key={a._id} style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, padding: "7px 12px" }}>
                        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#1a1a2e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 11, flexShrink: 0 }}>
                          {(a.employee_id?.name || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 12, color: "#1a1a2e" }}>{a.employee_id?.name || "—"}</p>
                          <p style={{ margin: 0, fontSize: 10, color: "#9ca3af" }}>{a.grade_id?.level} · {a.employee_id?.department || "—"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════════
          TAB 3 — CHANGE HISTORY
      ════════════════════════════════════ */}
      {activeTab === "history" && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>Complete Grade Change Timeline</p>
              <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>{allHistory.length} total events · Latest first</p>
            </div>
            {/* Change type legend */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.entries(CHANGE_TYPE_META).map(([type, meta]) => (
                <span key={type} style={{ background: meta.bg, color: meta.color, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}>
                  {meta.icon} {meta.label} ({changeCounts[type]})
                </span>
              ))}
            </div>
          </div>

          {allHistory.length === 0 ? (
            <div style={{ textAlign: "center", padding: "50px 0", color: "#9ca3af" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <p>No grade changes recorded yet.</p>
              <p style={{ fontSize: 13 }}>When employees are assigned or re-graded, history will appear here.</p>
            </div>
          ) : (
            <div style={{ position: "relative", paddingLeft: 28 }}>
              <div style={{ position: "absolute", left: 8, top: 0, bottom: 0, width: 2, background: "#e5e7eb", borderRadius: 99 }}/>
              {allHistory.map((h, i) => {
                const meta    = CHANGE_TYPE_META[h.change_type] || CHANGE_TYPE_META.initial;
                const bgrMeta = BGR_META[h.bgr_stage || h.grade_id?.bgr_stage] || BGR_META.Build;
                return (
                  <div key={h._id || i} style={{ position: "relative", marginBottom: i < allHistory.length - 1 ? 14 : 0 }}>
                    <div style={{ position: "absolute", left: -24, top: 10, width: 12, height: 12, borderRadius: "50%", background: meta.color, border: "2px solid #fff", boxShadow: `0 0 0 2px ${meta.color}40` }}/>
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
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                          <span style={{ background: bgrMeta.bg, color: bgrMeta.color, border: `1px solid ${bgrMeta.border}`, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                            {h.bgr_stage || h.grade_id?.bgr_stage || "—"}
                          </span>
                          <span style={{ fontSize: 11, color: "#9ca3af" }}>{formatDate(h.changed_at)}</span>
                        </div>
                      </div>
                      {h.reason && (
                        <p style={{ margin: 0, fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>"{h.reason}"</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════
          TAB 4 — EMPLOYEE REPORT
      ════════════════════════════════════ */}
      {activeTab === "employees" && (
        <>
          {/* Filters */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            {/* Search */}
            <div style={{ position: "relative", flex: "1 1 200px", minWidth: 160 }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}>🔍</span>
              <input value={searchText} onChange={e => setSearchText(e.target.value)}
                placeholder="Search name, ID, dept..."
                style={{ width: "100%", padding: "8px 10px 8px 30px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, color: "#374151", background: "#fff", boxSizing: "border-box", outline: "none" }}/>
            </div>

            {/* BGR filter */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["All","Build","Grow","Retain"].map(f => (
                <button key={f} onClick={() => setFilterBGR(f)}
                  style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    background: filterBGR === f ? (f==="All"?"#1a1a2e":BGR_META[f]?.color||"#2563eb") : "#fff",
                    color:      filterBGR === f ? "#fff" : "#6b7280",
                    borderColor: filterBGR === f ? (f==="All"?"#1a1a2e":BGR_META[f]?.color||"#2563eb") : "#e5e7eb" }}>
                  {f}
                </button>
              ))}
            </div>

            {/* Level filter */}
            <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, color: "#374151", background: "#fff", outline: "none", cursor: "pointer" }}>
              <option value="All">All Levels</option>
              {usedLevels.map(l => <option key={l} value={l}>{l}</option>)}
            </select>

            <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: "auto" }}>{filteredEmps.length} of {totalAssigned} employees</span>
          </div>

          {/* Desktop Table */}
          <div className="gr-table-wrap" style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e5e7eb" }}>
                  {["#","Employee","Emp ID","Department","Grade","Designation","BGR Stage","Effective Date","Changes"].map(h => (
                    <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontWeight: 700, color: "#374151", whiteSpace: "nowrap", fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEmps.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>No employees match your filter.</td>
                  </tr>
                ) : filteredEmps.map((a, i) => {
                  const meta = BGR_META[a.grade_id?.bgr_stage] || BGR_META.Build;
                  const hCount = (a.grade_history || []).length;
                  return (
                    <tr key={a._id}
                      style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f0f4ff"}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafafa"}>
                      <td style={{ padding: "12px 14px", color: "#9ca3af", fontSize: 12 }}>{i+1}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#1a1a2e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                            {(a.employee_id?.name || "?")[0].toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600, color: "#1a1a2e" }}>{a.employee_id?.name || "—"}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px", color: "#6b7280" }}>{a.employee_id?.employee_id || "—"}</td>
                      <td style={{ padding: "12px 14px", color: "#6b7280" }}>{a.employee_id?.department || "—"}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ background: "#1a1a2e", color: "#fff", borderRadius: 6, padding: "3px 9px", fontSize: 11, fontWeight: 800 }}>{a.grade_id?.level || "—"}</span>
                      </td>
                      <td style={{ padding: "12px 14px", color: "#374151" }}>{a.grade_id?.designation || "—"}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                          {a.grade_id?.bgr_stage || "—"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", color: "#6b7280", whiteSpace: "nowrap" }}>{formatDate(a.effective_date)}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ background: hCount > 1 ? "#eff6ff" : "#f3f4f6", color: hCount > 1 ? "#2563eb" : "#9ca3af", borderRadius: 20, padding: "3px 9px", fontSize: 11, fontWeight: 700 }}>
                          {hCount}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="gr-cards-wrap">
            {filteredEmps.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 12, padding: "40px 0", textAlign: "center", border: "1px solid #e5e7eb" }}>
                <p style={{ color: "#6b7280" }}>No employees match your filter.</p>
              </div>
            ) : filteredEmps.map(a => {
              const meta   = BGR_META[a.grade_id?.bgr_stage] || BGR_META.Build;
              const hCount = (a.grade_history || []).length;
              return (
                <div key={a._id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
                  <div style={{ background: "#1a1a2e", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>
                        {(a.employee_id?.name || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={{ margin: 0, color: "#fff", fontWeight: 700, fontSize: 13 }}>{a.employee_id?.name || "—"}</p>
                        <p style={{ margin: 0, color: "#9ca3af", fontSize: 11 }}>{a.employee_id?.employee_id || ""} · {a.employee_id?.department || "—"}</p>
                      </div>
                    </div>
                    <span style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>{a.grade_id?.bgr_stage || "—"}</span>
                  </div>
                  <div style={{ padding: "12px 16px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ background: "#1a1a2e", color: "#fff", borderRadius: 6, padding: "3px 9px", fontSize: 12, fontWeight: 800 }}>{a.grade_id?.level || "—"}</span>
                    <span style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>{a.grade_id?.designation || "—"}</span>
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "#9ca3af" }}>{formatDate(a.effective_date)}</span>
                    <span style={{ background: hCount > 1 ? "#eff6ff" : "#f3f4f6", color: hCount > 1 ? "#2563eb" : "#9ca3af", borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
                      {hCount} change{hCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}