import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const STEPS = ["Basic Info", "Select Employees", "Review & Launch"];

export default function FeedbackCycleSetup() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    cycleName: "",
    period: "",
    startDate: "",
    endDate: "",
    reviewerConfig: { manager: true, peers: true, subordinates: true, self: true },
    peerCount: 2,
    subCount: 1,
  });

  const [employees, setEmployees]                 = useState([]);
  const [departments, setDepartments]             = useState(["All"]);
  const [loadingEmps, setLoadingEmps]             = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [deptFilter, setDeptFilter]               = useState("All");
  const [launched, setLaunched]                   = useState(false);
  const [launching, setLaunching]                 = useState(false);
  const [errors, setErrors]                       = useState({});

  // ── Fetch only ACTIVE employees ──
  useEffect(() => {
    setLoadingEmps(true);
    fetch(`${API_BASE}/api/hr/employees`)
      .then((res) => res.json())
      .then((data) => {
        const active = Array.isArray(data)
          ? data.filter((emp) => emp.status === "active") // ✅ Only active
          : [];
        setEmployees(active);
        const depts = ["All", ...new Set(active.map((e) => e.department).filter(Boolean))];
        setDepartments(depts);
      })
      .catch(console.error)
      .finally(() => setLoadingEmps(false));
  }, []);

  const filteredEmployees =
    deptFilter === "All" ? employees : employees.filter((e) => e.department === deptFilter);

  const toggleEmployee = (id) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map((e) => e._id));
    }
  };

  const validateStep0 = () => {
    const e = {};
    if (!form.cycleName.trim()) e.cycleName = "Cycle name required";
    if (!form.period)           e.period    = "Period required";
    if (!form.startDate)        e.startDate = "Start date required";
    if (!form.endDate)          e.endDate   = "End date required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep1 = () => {
    if (selectedEmployees.length === 0) {
      setErrors({ employees: "Select at least one employee" });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (step === 0 && !validateStep0()) return;
    if (step === 1 && !validateStep1()) return;
    setStep((s) => s + 1);
  };

  const handleLaunch = async () => {
    setLaunching(true);
    try {
      const payload = {
        cycleName:         form.cycleName,
        period:            form.period,
        startDate:         form.startDate,
        endDate:           form.endDate,
        reviewerConfig:    form.reviewerConfig,
        weightage:         { manager: 40, peers: 25, subordinates: 20, self: 15 },
        peerCount:         form.peerCount,
        subCount:          form.subCount,
        selectedEmployees: selectedEmployees,
      };

      const res  = await fetch(`${API_BASE}/api/feedback-cycles`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setLaunched(true);
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Server error. Try again.");
    } finally {
      setLaunching(false);
    }
  };

  const weightage = {
    Manager:      form.reviewerConfig.manager      ? 40 : 0,
    Peers:        form.reviewerConfig.peers        ? 25 : 0,
    Subordinates: form.reviewerConfig.subordinates ? 20 : 0,
    Self:         form.reviewerConfig.self         ? 15 : 0,
  };
  const totalWeight = Object.values(weightage).reduce((a, b) => a + b, 0);

  const resetForm = () => {
    setLaunched(false); setStep(0);
    setForm({ cycleName: "", period: "", startDate: "", endDate: "", reviewerConfig: { manager: true, peers: true, subordinates: true, self: true }, peerCount: 2, subCount: 1 });
    setSelectedEmployees([]);
  };

  if (launched) {
    return (
      <div style={styles.page}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.successTitle}>Cycle Launched Successfully!</h2>
          <p style={styles.successSub}><strong>{form.cycleName}</strong> created for <strong>{selectedEmployees.length} employees</strong>.</p>
          <p style={styles.successSub}>Feedback collection starts on <strong>{form.startDate}</strong>.</p>
          <div style={styles.successMeta}>
            <span style={styles.metaBadge}>Period: {form.period}</span>
            <span style={styles.metaBadge}>Weight: {totalWeight}%</span>
            <span style={styles.metaBadge}>{selectedEmployees.length} employees</span>
          </div>
          <button style={styles.btnGreen} onClick={resetForm}>Create Another Cycle</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>360° Feedback Cycle Setup</h1>
          <p style={styles.pageSubtitle}>Configure and launch a new feedback cycle for your team</p>
        </div>
        <div style={styles.stepBadge}>Step {step + 1} of {STEPS.length}</div>
      </div>

      <div style={styles.stepper}>
        {STEPS.map((s, i) => (
          <div key={i} style={styles.stepItem}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ ...styles.stepCircle, background: i <= step ? "#16a34a" : "#e5e7eb", color: i <= step ? "#fff" : "#6b7280", border: i === step ? "2px solid #16a34a" : "2px solid transparent" }}>
                {i < step ? "✓" : i + 1}
              </div>
              <span style={{ ...styles.stepLabel, color: i === step ? "#111827" : "#6b7280", fontWeight: i === step ? 600 : 400 }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div style={{ ...styles.stepLine, background: i < step ? "#16a34a" : "#e5e7eb" }} />}
          </div>
        ))}
      </div>

      <div style={styles.card}>
        {step === 0 && (
          <div>
            <h2 style={styles.sectionTitle}>Basic Information</h2>
            <p style={styles.sectionSubtitle}>Define the cycle name, period and timeline</p>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Cycle Name *</label>
                <input style={{ ...styles.input, ...(errors.cycleName ? styles.inputError : {}) }} placeholder="e.g. Q1 2026 360° Review" value={form.cycleName} onChange={(e) => setForm({ ...form, cycleName: e.target.value })} />
                {errors.cycleName && <span style={styles.errorText}>{errors.cycleName}</span>}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Review Period *</label>
                <select style={{ ...styles.input, ...(errors.period ? styles.inputError : {}) }} value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}>
                  <option value="">Select period</option>
                  <option>Q1 2026 (Jan–Mar)</option>
                  <option>Q2 2026 (Apr–Jun)</option>
                  <option>Q3 2026 (Jul–Sep)</option>
                  <option>Q4 2026 (Oct–Dec)</option>
                  <option>Annual 2026</option>
                </select>
                {errors.period && <span style={styles.errorText}>{errors.period}</span>}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Start Date *</label>
                <input type="date" style={{ ...styles.input, ...(errors.startDate ? styles.inputError : {}) }} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                {errors.startDate && <span style={styles.errorText}>{errors.startDate}</span>}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>End Date *</label>
                <input type="date" style={{ ...styles.input, ...(errors.endDate ? styles.inputError : {}) }} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                {errors.endDate && <span style={styles.errorText}>{errors.endDate}</span>}
              </div>
            </div>

            <div style={styles.reviewerSection}>
              <h3 style={styles.subSectionTitle}>Reviewer Configuration</h3>
              <p style={styles.sectionSubtitle}>Select who will provide feedback</p>
              <div style={styles.reviewerGrid}>
                {[
                  { key: "manager", label: "Manager", weight: 40, color: "#7c3aed" },
                  { key: "peers", label: "Peers", weight: 25, color: "#2563eb" },
                  { key: "subordinates", label: "Subordinates", weight: 20, color: "#0891b2" },
                  { key: "self", label: "Self", weight: 15, color: "#059669" },
                ].map(({ key, label, weight, color }) => (
                  <div key={key} style={{ ...styles.reviewerCard, border: form.reviewerConfig[key] ? `2px solid ${color}` : "2px solid #e5e7eb", background: form.reviewerConfig[key] ? `${color}08` : "#fff", cursor: "pointer" }}
                    onClick={() => setForm({ ...form, reviewerConfig: { ...form.reviewerConfig, [key]: !form.reviewerConfig[key] } })}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ ...styles.reviewerLabel, color: form.reviewerConfig[key] ? color : "#6b7280" }}>{label}</span>
                      <div style={{ width: 18, height: 18, borderRadius: 4, background: form.reviewerConfig[key] ? color : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>
                        {form.reviewerConfig[key] ? "✓" : ""}
                      </div>
                    </div>
                    <div style={{ ...styles.weightBadge, background: `${color}15`, color }}>{weight}% weight</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 24, marginTop: 16 }}>
                {form.reviewerConfig.peers && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Peer Reviewers Count</label>
                    <select style={styles.inputSm} value={form.peerCount} onChange={(e) => setForm({ ...form, peerCount: +e.target.value })}>
                      {[1,2,3,4].map(n => <option key={n}>{n}</option>)}
                    </select>
                  </div>
                )}
                {form.reviewerConfig.subordinates && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Subordinate Reviewers Count</label>
                    <select style={styles.inputSm} value={form.subCount} onChange={(e) => setForm({ ...form, subCount: +e.target.value })}>
                      {[1,2,3].map(n => <option key={n}>{n}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div style={styles.weightSummary}>
                <span style={styles.weightSummaryLabel}>Total configured weight:</span>
                <span style={{ ...styles.weightSummaryValue, color: totalWeight === 100 ? "#16a34a" : "#dc2626" }}>
                  {totalWeight}% {totalWeight !== 100 && "(should be 100%)"}
                </span>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 style={styles.sectionTitle}>Select Employees</h2>
            <p style={styles.sectionSubtitle}>Choose who will be evaluated in this cycle</p>
            <div style={styles.filterRow}>
              {departments.map((d) => (
                <button key={d} style={{ ...styles.filterBtn, ...(deptFilter === d ? styles.filterBtnActive : {}) }} onClick={() => setDeptFilter(d)}>{d}</button>
              ))}
              <button style={styles.selectAllBtn} onClick={toggleAll}>
                {selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0 ? "Deselect All" : "Select All"}
              </button>
            </div>
            {errors.employees && <p style={styles.errorText}>{errors.employees}</p>}
            {loadingEmps ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#6b7280" }}>
                <div style={{ width: 32, height: 32, border: "4px solid #e5e7eb", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                <p style={{ margin: 0, fontSize: 14 }}>Loading employees...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : (
              <div style={styles.employeeGrid}>
                {filteredEmployees.map((emp) => {
                  const selected = selectedEmployees.includes(emp._id);
                  return (
                    <div key={emp._id} style={{ ...styles.employeeCard, border: selected ? "2px solid #16a34a" : "2px solid #e5e7eb", background: selected ? "#f0fdf4" : "#fff", cursor: "pointer" }}
                      onClick={() => toggleEmployee(emp._id)}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ ...styles.avatar, background: selected ? "#16a34a" : "#6b7280" }}>
                          {emp.name?.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p style={styles.empName}>{emp.name}</p>
                          <p style={styles.empRole}>{emp.designation || "Employee"} · {emp.department}</p>
                        </div>
                      </div>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", border: selected ? "none" : "2px solid #d1d5db", background: selected ? "#16a34a" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11 }}>
                        {selected ? "✓" : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={styles.selectedCount}>
              <span style={{ color: "#16a34a", fontWeight: 600 }}>{selectedEmployees.length}</span> employees selected
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={styles.sectionTitle}>Review & Launch</h2>
            <p style={styles.sectionSubtitle}>Confirm all details before launching</p>
            <div style={styles.reviewGrid}>
              <div style={styles.reviewBlock}>
                <h3 style={styles.reviewBlockTitle}>📋 Cycle Details</h3>
                <div style={styles.reviewRow}><span style={styles.reviewKey}>Cycle Name</span><span style={styles.reviewVal}>{form.cycleName}</span></div>
                <div style={styles.reviewRow}><span style={styles.reviewKey}>Period</span><span style={styles.reviewVal}>{form.period}</span></div>
                <div style={styles.reviewRow}><span style={styles.reviewKey}>Start Date</span><span style={styles.reviewVal}>{form.startDate}</span></div>
                <div style={styles.reviewRow}><span style={styles.reviewKey}>End Date</span><span style={styles.reviewVal}>{form.endDate}</span></div>
              </div>
              <div style={styles.reviewBlock}>
                <h3 style={styles.reviewBlockTitle}>⚖️ Weightage</h3>
                {Object.entries(weightage).map(([key, val]) => val > 0 ? (
                  <div key={key} style={styles.reviewRow}>
                    <span style={styles.reviewKey}>{key}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 80, height: 6, background: "#e5e7eb", borderRadius: 3 }}>
                        <div style={{ width: `${val}%`, height: "100%", background: "#16a34a", borderRadius: 3 }} />
                      </div>
                      <span style={styles.reviewVal}>{val}%</span>
                    </div>
                  </div>
                ) : null)}
                <div style={{ ...styles.reviewRow, borderTop: "1px solid #e5e7eb", paddingTop: 8, marginTop: 4 }}>
                  <span style={{ ...styles.reviewKey, fontWeight: 600 }}>Total</span>
                  <span style={{ ...styles.reviewVal, color: totalWeight === 100 ? "#16a34a" : "#dc2626", fontWeight: 700 }}>{totalWeight}%</span>
                </div>
              </div>
              <div style={{ ...styles.reviewBlock, gridColumn: "1 / -1" }}>
                <h3 style={styles.reviewBlockTitle}>👥 Selected Employees ({selectedEmployees.length})</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  {selectedEmployees.map((id) => {
                    const emp = employees.find((e) => e._id === id);
                    return emp ? (
                      <div key={id} style={styles.empChip}>
                        <div style={styles.chipAvatar}>{emp.name?.substring(0, 2).toUpperCase()}</div>
                        <span>{emp.name}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
            <div style={styles.timelineBox}>
              <h3 style={styles.reviewBlockTitle}>📅 Process Timeline</h3>
              <div style={styles.timeline}>
                {[
                  { label: "Cycle launched", sub: form.startDate, color: "#16a34a" },
                  { label: "Reviewer nomination", sub: "Week 1", color: "#2563eb" },
                  { label: "Feedback collection", sub: "Within 2 weeks", color: "#7c3aed" },
                  { label: "Reports generated", sub: "Week 3", color: "#0891b2" },
                  { label: "1-on-1 discussion", sub: "Week 4", color: "#d97706" },
                  { label: "Cycle closes", sub: form.endDate, color: "#dc2626" },
                ].map((item, i) => (
                  <div key={i} style={styles.timelineItem}>
                    <div style={{ ...styles.timelineDot, background: item.color }} />
                    {i < 5 && <div style={styles.timelineConnector} />}
                    <div style={styles.timelineText}>
                      <span style={styles.timelineLabel}>{item.label}</span>
                      <span style={styles.timelineSub}>{item.sub}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={styles.navButtons}>
          {step > 0 && <button style={styles.btnOutline} onClick={() => setStep((s) => s - 1)}>← Back</button>}
          <div style={{ flex: 1 }} />
          {step < STEPS.length - 1 ? (
            <button style={styles.btnGreen} onClick={handleNext}>Next →</button>
          ) : (
            <button
              style={{ ...styles.btnGreen, background: totalWeight !== 100 || launching ? "#9ca3af" : "#16a34a", cursor: totalWeight !== 100 || launching ? "not-allowed" : "pointer" }}
              onClick={handleLaunch} disabled={totalWeight !== 100 || launching}>
              {launching ? "Launching..." : "🚀 Launch Cycle"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: "24px", background: "#f9fafb", minHeight: "100vh", fontFamily: "sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  pageTitle: { fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 },
  pageSubtitle: { fontSize: 14, color: "#6b7280", marginTop: 4 },
  stepBadge: { background: "#dcfce7", color: "#16a34a", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600 },
  stepper: { display: "flex", alignItems: "center", marginBottom: 24, background: "#fff", padding: "16px 24px", borderRadius: 12, border: "1px solid #e5e7eb" },
  stepItem: { display: "flex", alignItems: "center", flex: 1 },
  stepCircle: { width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 },
  stepLabel: { fontSize: 13 },
  stepLine: { flex: 1, height: 2, margin: "0 8px" },
  card: { background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 28 },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 4px 0" },
  sectionSubtitle: { fontSize: 13, color: "#6b7280", marginBottom: 20 },
  subSectionTitle: { fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 8 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 },
  formGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },
  input: { padding: "10px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, color: "#111827", outline: "none", background: "#fff" },
  inputSm: { padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13, color: "#111827", width: 120 },
  inputError: { borderColor: "#dc2626" },
  errorText: { fontSize: 12, color: "#dc2626" },
  reviewerSection: { borderTop: "1px solid #f3f4f6", paddingTop: 20 },
  reviewerGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 },
  reviewerCard: { padding: 14, borderRadius: 10, userSelect: "none", transition: "all 0.15s" },
  reviewerLabel: { fontSize: 14, fontWeight: 600 },
  weightBadge: { fontSize: 12, padding: "3px 8px", borderRadius: 6, marginTop: 6, display: "inline-block", fontWeight: 500 },
  weightSummary: { display: "flex", alignItems: "center", gap: 8, marginTop: 16, padding: "10px 14px", background: "#f9fafb", borderRadius: 8 },
  weightSummaryLabel: { fontSize: 13, color: "#6b7280" },
  weightSummaryValue: { fontSize: 14, fontWeight: 700 },
  filterRow: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" },
  filterBtn: { padding: "6px 14px", borderRadius: 20, border: "1.5px solid #e5e7eb", background: "#fff", fontSize: 13, color: "#374151", cursor: "pointer" },
  filterBtnActive: { background: "#16a34a", color: "#fff", border: "1.5px solid #16a34a" },
  selectAllBtn: { marginLeft: "auto", padding: "6px 14px", borderRadius: 20, border: "1.5px solid #16a34a", background: "#f0fdf4", color: "#16a34a", fontSize: 13, cursor: "pointer", fontWeight: 600 },
  employeeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  employeeCard: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 10, transition: "all 0.15s", userSelect: "none" },
  avatar: { width: 38, height: 38, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 },
  empName: { fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 },
  empRole: { fontSize: 12, color: "#6b7280", margin: 0 },
  selectedCount: { textAlign: "right", marginTop: 12, fontSize: 13, color: "#6b7280" },
  reviewGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 },
  reviewBlock: { background: "#f9fafb", borderRadius: 10, padding: 16, border: "1px solid #e5e7eb" },
  reviewBlockTitle: { fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 12 },
  reviewRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f3f4f6" },
  reviewKey: { fontSize: 13, color: "#6b7280" },
  reviewVal: { fontSize: 13, fontWeight: 600, color: "#111827" },
  empChip: { display: "flex", alignItems: "center", gap: 6, background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500 },
  chipAvatar: { width: 20, height: 20, borderRadius: "50%", background: "#16a34a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700 },
  timelineBox: { background: "#f9fafb", borderRadius: 10, padding: 16, border: "1px solid #e5e7eb" },
  timeline: { display: "flex", alignItems: "flex-start", gap: 0, marginTop: 8, overflowX: "auto" },
  timelineItem: { display: "flex", flexDirection: "column", alignItems: "center", flex: 1, position: "relative" },
  timelineDot: { width: 12, height: 12, borderRadius: "50%", flexShrink: 0, zIndex: 1 },
  timelineConnector: { position: "absolute", top: 5, left: "50%", width: "100%", height: 2, background: "#e5e7eb" },
  timelineText: { display: "flex", flexDirection: "column", alignItems: "center", marginTop: 8 },
  timelineLabel: { fontSize: 11, fontWeight: 600, color: "#374151", textAlign: "center" },
  timelineSub: { fontSize: 10, color: "#9ca3af", textAlign: "center" },
  navButtons: { display: "flex", alignItems: "center", marginTop: 28, paddingTop: 20, borderTop: "1px solid #f3f4f6" },
  btnGreen: { padding: "10px 24px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  btnOutline: { padding: "10px 20px", background: "#fff", color: "#374151", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer" },
  successCard: { background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 48, textAlign: "center", maxWidth: 480, margin: "60px auto" },
  successIcon: { width: 60, height: 60, background: "#dcfce7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "#16a34a", margin: "0 auto 20px" },
  successTitle: { fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 8 },
  successSub: { fontSize: 14, color: "#6b7280", marginBottom: 8 },
  successMeta: { display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", margin: "16px 0 24px" },
  metaBadge: { background: "#f0fdf4", color: "#16a34a", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
};