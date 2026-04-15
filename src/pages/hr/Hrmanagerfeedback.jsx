import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const HR_ID = localStorage.getItem("employeeId") || localStorage.getItem("hrId") || "";

const COMPETENCIES = [
  { key: "communication",   label: "Communication & Collaboration",      desc: "Clarity, active listening, cross-team collaboration" },
  { key: "leadership",      label: "Leadership & Initiative",            desc: "Takes ownership, drives initiatives, mentors others" },
  { key: "technicalSkills", label: "Technical Skills / Job Knowledge",   desc: "Expertise in domain, problem solving ability" },
  { key: "goalAchievement", label: "Goal Achievement & Results",         desc: "Delivers on commitments, meets targets on time" },
  { key: "innovation",      label: "Innovation & Problem Solving",       desc: "Brings new ideas, improves processes" },
  { key: "teamwork",        label: "Teamwork & Cross-functional Impact", desc: "Collaborates effectively, stakeholder management" },
];

function ScoreSlider({ competency, value, onChange }) {
  const color = value >= 80 ? "#16a34a" : value >= 60 ? "#2563eb" : value >= 40 ? "#d97706" : "#dc2626";
  return (
    <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, border: "1px solid #e5e7eb", marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>{competency.label}</p>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "#9ca3af" }}>{competency.desc}</p>
        </div>
        <span style={{ fontSize: 24, fontWeight: 900, color, marginLeft: 12 }}>{value}</span>
      </div>
      <input type="range" min="0" max="100" value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: color }} />
      <div style={{ background: "#e5e7eb", borderRadius: 99, height: 5, overflow: "hidden", marginTop: 6 }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 99, transition: "width .3s" }} />
      </div>
    </div>
  );
}

export default function HrManagerFeedback() {
  const [cycles, setCycles]               = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [pendingTasks, setPendingTasks]   = useState([]);
  const [selectedTask, setSelectedTask]   = useState(null);
  const [scores, setScores]               = useState({});
  const [strengths, setStrengths]         = useState("");
  const [improvements, setImprovements]   = useState("");
  const [comments, setComments]           = useState("");
  const [saving, setSaving]               = useState(false);
  const [loading, setLoading]             = useState(false);
  const [toast, setToast]                 = useState(null);
  const [activeTab, setActiveTab]         = useState("pending"); // ✅ NEW — Tab state

  useEffect(() => { fetchCycles(); }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCycles = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/feedback-cycles`);
      if (res.data.success) {
        const incompleteCycles = res.data.data.filter(
          c => c.status !== "completed" && c.status !== "closed" && c.status !== "inactive"
        );
        setCycles(incompleteCycles);
      }
    } catch { showToast("Failed to load cycles", "error"); }
  };

  const handleSelectCycle = async (cycle) => {
    setSelectedCycle(cycle);
    setSelectedTask(null);
    setActiveTab("pending"); // ✅ Cycle மாறும்போது tab reset
    setLoading(true);
    try {
      const [nomRes, subRes] = await Promise.all([
        axios.get(`${API_BASE}/api/feedback-nominations/${cycle._id}`),
        axios.get(`${API_BASE}/api/feedback-submissions/cycle/${cycle._id}`),
      ]);

      const nominations = nomRes.data?.data || [];
      const submissions = subRes.data?.data || [];

      const submittedManagerIds = submissions
        .filter(s => s.reviewerType === "manager")
        .map(s => String(s.revieweeId?._id || s.revieweeId));

      const tasks = nominations.map(nom => ({
        cycleId:          cycle._id,
        cycleName:        cycle.cycleName,
        period:           cycle.period,
        revieweeId:       nom.employeeId?._id || nom.employeeId,
        revieweeName:     nom.employeeId?.name || "—",
        revieweeDept:     nom.employeeId?.department || "—",
        reviewerType:     "manager",
        alreadySubmitted: submittedManagerIds.includes(String(nom.employeeId?._id || nom.employeeId)),
      }));

      setPendingTasks(tasks);
    } catch (err) {
      console.error(err);
      showToast("Failed to load nominations", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (task) => {
    setSelectedTask(task);
    setScores({});
    setStrengths("");
    setImprovements("");
    setComments("");
  };

  const liveOverall = () => {
    const vals = Object.values(scores).filter(v => typeof v === "number" && v > 0);
    if (!vals.length) return 0;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };

  const handleSubmit = async () => {
    const allFilled = COMPETENCIES.every(c => scores[c.key] && scores[c.key] > 0);
    if (!allFilled) return showToast("Please rate all 6 competencies", "error");
    if (!HR_ID) return showToast("HR session expired. Please login again.", "error");

    setSaving(true);
    try {
      await axios.post(`${API_BASE}/api/feedback-submissions`, {
        cycleId:             selectedTask.cycleId,
        revieweeId:          selectedTask.revieweeId,
        reviewerId:          HR_ID,
        reviewerType:        "manager",
        competencies:        scores,
        strengths,
        areasForImprovement: improvements,
        additionalComments:  comments,
      });

      showToast(`Manager feedback for ${selectedTask.revieweeName} submitted ✅`);

      setPendingTasks(prev =>
        prev.map(t =>
          String(t.revieweeId) === String(selectedTask.revieweeId)
            ? { ...t, alreadySubmitted: true }
            : t
        )
      );

      setSelectedTask(null);
      setActiveTab("nominated"); // ✅ Submit பண்ணிட்டா Nominated tab-க்கு auto switch
    } catch (err) {
      showToast(err?.response?.data?.message || "Submission failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const overall      = liveOverall();
  const overallColor = overall >= 75 ? "#16a34a" : overall >= 50 ? "#d97706" : "#dc2626";
  const overallBg    = overall >= 75 ? "#f0fdf4" : overall >= 50 ? "#fffbeb" : "#fef2f2";

  const pendingList   = pendingTasks.filter(t => !t.alreadySubmitted);
  const submittedList = pendingTasks.filter(t =>  t.alreadySubmitted);

  // ✅ Tab style helper
  const tabStyle = (tabName) => ({
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "9px 20px",
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    border: "none",
    background: activeTab === tabName ? "#1a1a2e" : "transparent",
    color: activeTab === tabName ? "#fff" : "#6b7280",
    transition: "all .2s",
  });

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", background: "#f4f6fb", padding: "28px 32px" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 16, zIndex: 9999, background: toast.type === "error" ? "#ff4d4f" : "#52c41a", color: "#fff", padding: "12px 20px", borderRadius: 8, fontWeight: 500, fontSize: 14 }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a2e" }}>Manager Feedback</h2>
        <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
          HR fills manager-level 360° feedback for employees in active cycles
        </p>
      </div>

      {/* Cycle Selector */}
      <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #e5e7eb", marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
          Select Active Feedback Cycle
        </label>
        <select
          value={selectedCycle?._id || ""}
          onChange={e => {
            const c = cycles.find(cy => cy._id === e.target.value);
            if (c) handleSelectCycle(c);
          }}
          style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, color: "#1a1a2e", background: "#fff", outline: "none" }}
        >
          <option value="">-- Select Cycle --</option>
          {cycles.map(c => (
            <option key={c._id} value={c._id}>{c.cycleName} — {c.period}</option>
          ))}
        </select>
      </div>

      {/* No cycle selected */}
      {!selectedCycle && (
        <div style={{ background: "#fff", borderRadius: 14, padding: 60, textAlign: "center", border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>👔</div>
          <p style={{ color: "#6b7280", fontWeight: 600 }}>Select a cycle to fill manager feedback</p>
        </div>
      )}

      {/* Loading */}
      {selectedCycle && loading && (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ width: 36, height: 36, border: "4px solid #e5e7eb", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ color: "#6b7280" }}>Loading...</p>
        </div>
      )}

      {/* Feedback Form */}
      {selectedTask && !loading && (
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: 24, boxShadow: "0 4px 24px rgba(0,0,0,.07)" }}>
          <div style={{ background: "#1a1a2e", padding: "16px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, color: "#fff", fontWeight: 800, fontSize: 15 }}>
                Manager Feedback — {selectedTask.revieweeName}
              </p>
              <p style={{ margin: "3px 0 0", color: "#9ca3af", fontSize: 12 }}>
                {selectedTask.cycleName} · {selectedTask.period} · Reviewing as <strong style={{ color: "#fff" }}>Manager</strong>
              </p>
            </div>
            <button onClick={() => setSelectedTask(null)}
              style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 22, cursor: "pointer" }}>✕</button>
          </div>

          <div style={{ padding: 22 }}>
            <p style={{ margin: "0 0 14px", fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>Rate each competency (0–100)</p>
            {COMPETENCIES.map(c => (
              <ScoreSlider key={c.key} competency={c} value={scores[c.key] || 0}
                onChange={(val) => setScores(prev => ({ ...prev, [c.key]: val }))} />
            ))}

            <div style={{ background: overallBg, borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#6b7280", fontWeight: 600 }}>OVERALL SCORE</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af" }}>Average of all competencies</p>
              </div>
              <p style={{ margin: 0, fontSize: 32, fontWeight: 900, color: overallColor }}>{overall}%</p>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>💪 Strengths</label>
              <textarea value={strengths} onChange={e => setStrengths(e.target.value)} rows={3}
                placeholder="What does this employee do well?"
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, resize: "vertical", boxSizing: "border-box", outline: "none" }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>📈 Areas for Improvement</label>
              <textarea value={improvements} onChange={e => setImprovements(e.target.value)} rows={3}
                placeholder="Where can this employee grow?"
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, resize: "vertical", boxSizing: "border-box", outline: "none" }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>💬 Additional Comments</label>
              <textarea value={comments} onChange={e => setComments(e.target.value)} rows={2}
                placeholder="Any other observations..."
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, resize: "vertical", boxSizing: "border-box", outline: "none" }} />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setSelectedTask(null)}
                style={{ padding: "10px 24px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={saving}
                style={{ padding: "10px 28px", border: "none", borderRadius: 8, background: saving ? "#93c5fd" : "#16a34a", color: "#fff", fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "Submitting..." : "✅ Submit Manager Feedback"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task List with Tabs */}
      {selectedCycle && !loading && !selectedTask && pendingTasks.length > 0 && (
        <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Total Employees", value: pendingTasks.length,  color: "#2563eb" },
              { label: "Pending Review",  value: pendingList.length,   color: "#d97706" },
              { label: "Completed",       value: submittedList.length, color: "#16a34a" },
            ].map((s, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", border: "1px solid #e5e7eb" }}>
                <p style={{ margin: "0 0 4px", fontSize: 11, color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>{s.label}</p>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* ✅ Tab Bar — image 2 மாதிரி */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
            <div style={{ display: "flex", gap: 6, padding: "10px 14px", borderBottom: "1px solid #f3f4f6", background: "#f9fafb" }}>
              <button style={tabStyle("pending")} onClick={() => setActiveTab("pending")}>
                🗒️ Pending ({pendingList.length})
              </button>
              <button style={tabStyle("nominated")} onClick={() => setActiveTab("nominated")}>
                ✅ Nominated ({submittedList.length})
              </button>
            </div>

            {/* ✅ Pending Tab Content */}
            {activeTab === "pending" && (
              pendingList.length === 0
                ? <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
                    🎉 All feedbacks completed!
                  </div>
                : pendingList.map((task, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #f9fafb" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#2563eb", fontSize: 14 }}>
                        {task.revieweeName?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, color: "#1a1a2e", fontSize: 14 }}>{task.revieweeName}</p>
                        <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{task.revieweeDept}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ background: "#fffbeb", color: "#d97706", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                        Manager Review Pending
                      </span>
                      <button onClick={() => handleOpenForm(task)}
                        style={{ padding: "8px 18px", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        Fill Feedback →
                      </button>
                    </div>
                  </div>
                ))
            )}

            {/* ✅ Nominated Tab Content */}
            {activeTab === "nominated" && (
              submittedList.length === 0
                ? <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
                    No submitted feedbacks yet.
                  </div>
                : submittedList.map((task, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #f9fafb" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#16a34a", fontSize: 14 }}>
                        {task.revieweeName?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, color: "#1a1a2e", fontSize: 14 }}>{task.revieweeName}</p>
                        <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{task.revieweeDept}</p>
                      </div>
                    </div>
                    <span style={{ background: "#dcfce7", color: "#16a34a", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                      ✓ Feedback Submitted
                    </span>
                  </div>
                ))
            )}
          </div>
        </>
      )}

      {/* No nominations */}
      {selectedCycle && !loading && !selectedTask && pendingTasks.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 14, padding: 60, textAlign: "center", border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
          <p style={{ color: "#6b7280", fontWeight: 600 }}>No nominations found for this cycle.</p>
          <p style={{ color: "#9ca3af", fontSize: 13 }}>Complete nominations first, then fill manager feedback.</p>
        </div>
      )}
    </div>
  );
}