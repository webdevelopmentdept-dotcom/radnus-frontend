import { useState, useEffect } from "react";
import axios from "axios";
import { CheckCircle } from "lucide-react";
import EmployeeLayout from "./EmployeeLayout";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const COMPETENCIES = [
  {
    key: "communication",
    label: "Communication & Collaboration",
    desc: "Clarity in communication, active listening, cross-team collaboration",
  },
  {
    key: "leadership",
    label: "Leadership & Initiative",
    desc: "Takes ownership, drives initiatives, mentors others",
  },
  {
    key: "technicalSkills",
    label: "Technical Skills / Job Knowledge",
    desc: "Expertise in domain, problem solving ability",
  },
  {
    key: "goalAchievement",
    label: "Goal Achievement & Results",
    desc: "Delivers on commitments, meets targets on time",
  },
  {
    key: "innovation",
    label: "Innovation & Problem Solving",
    desc: "Brings new ideas, improves processes, creative thinking",
  },
  {
    key: "teamwork",
    label: "Teamwork & Cross-functional Impact",
    desc: "Collaborates effectively, stakeholder management",
  },
];

const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: "#374151",
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontSize: 13,
  color: "#1a1a2e",
  background: "#fff",
  boxSizing: "border-box",
  outline: "none",
};

function CompetencySlider({ competency, value, onChange }) {
  const color =
    value >= 80
      ? "#16a34a"
      : value >= 60
      ? "#2563eb"
      : value >= 40
      ? "#d97706"
      : "#dc2626";

  return (
    <div
      style={{
        background: "#f8fafc",
        borderRadius: 12,
        padding: 14,
        border: "1px solid #e5e7eb",
        marginBottom: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 8,
          gap: 8,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1a1a2e", lineHeight: 1.3 }}>
            {competency.label}
          </p>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: "#9ca3af", lineHeight: 1.3 }}>
            {competency.desc}
          </p>
        </div>
        <span style={{ fontSize: 22, fontWeight: 900, color, marginLeft: 8, flexShrink: 0 }}>
          {value}
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: color, height: 20, cursor: "pointer" }}
      />
      <div
        style={{
          background: "#e5e7eb",
          borderRadius: 99,
          height: 5,
          overflow: "hidden",
          marginTop: 6,
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            background: color,
            borderRadius: 99,
            transition: "width .3s",
          }}
        />
      </div>
    </div>
  );
}

export default function FeedbackFill() {
  const [pendingItems, setPendingItems]   = useState([]);
  const [selectedItem, setSelectedItem]   = useState(null);
  const [scores, setScores]               = useState({});
  const [strengths, setStrengths]         = useState("");
  const [improvements, setImprovements]   = useState("");
  const [comments, setComments]           = useState("");
  const [saving, setSaving]               = useState(false);
  const [submitted, setSubmitted]         = useState([]);
  const [activeTab, setActiveTab]         = useState("pending");
  const [loading, setLoading]             = useState(true);
  const [toast, setToast]                 = useState(null);
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("employeeId") || "";
    setCurrentUserId(id);
    if (id) {
      fetchData(id);
    } else {
      setLoading(false);
    }
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = async (userId) => {
    try {
      const [pendingRes, submittedRes] = await Promise.all([
        axios.get(`${API_BASE}/api/feedback-submissions/my-pending/${userId}`),
        axios.get(`${API_BASE}/api/feedback-submissions/my-submitted/${userId}`),
      ]);
      if (pendingRes.data.success)   setPendingItems(pendingRes.data.data);
      if (submittedRes.data.success) setSubmitted(submittedRes.data.data);
    } catch {
      showToast("Failed to load feedback items", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (key, val) =>
    setScores((prev) => ({ ...prev, [key]: val }));

  const liveOverall = () => {
    const vals = Object.values(scores).filter((v) => typeof v === "number" && v > 0);
    if (!vals.length) return 0;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };

  const handleSubmit = async () => {
    const allFilled = COMPETENCIES.every((c) => scores[c.key] && scores[c.key] > 0);
    if (!allFilled)
      return showToast("Please rate all 6 competencies before submitting", "error");

    setSaving(true);
    try {
      const res = await axios.post(`${API_BASE}/api/feedback-submissions`, {
        cycleId:             selectedItem.cycleId,
        revieweeId:          selectedItem.revieweeId,
        reviewerId:          currentUserId,
        reviewerType:        selectedItem.reviewerType,
        competencies:        scores,
        strengths,
        areasForImprovement: improvements,
        additionalComments:  comments,
      });
      if (res.data.success) {
        showToast("Feedback submitted successfully! ✅");
        setSelectedItem(null);
        setScores({});
        setStrengths("");
        setImprovements("");
        setComments("");
        fetchData(currentUserId);
      }
    } catch (err) {
      showToast(err?.response?.data?.message || "Submission failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const overall = liveOverall();
  const overallColor =
    overall >= 75 ? "#16a34a" : overall >= 50 ? "#d97706" : "#dc2626";
  const overallBg =
    overall >= 75 ? "#f0fdf4" : overall >= 50 ? "#fffbeb" : "#fef2f2";
  const overallBorder =
    overall >= 75 ? "#bbf7d0" : overall >= 50 ? "#fde68a" : "#fecaca";

  return (
    <EmployeeLayout>
      <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", background: "#f4f6fb" }}>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }

          .ff-page-wrapper {
            padding: 28px 32px;
          }

          .ff-card { cursor: pointer; transition: all 0.15s; }
          .ff-card:hover { border-color: #2563eb !important; }

          .ff-pending-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 16px;
          }

          .ff-submitted-grid {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .ff-form-header {
            background: #1a1a2e;
            padding: 16px 22px;
          }

          .ff-form-header-inner {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .ff-form-body {
            padding: 22px;
          }

          .ff-submit-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
          }

          .ff-tab-bar {
            display: flex;
            gap: 4px;
            background: #fff;
            border-radius: 10px;
            padding: 4px;
            border: 1px solid #e5e7eb;
            margin-bottom: 24px;
            width: fit-content;
          }

          .ff-overall-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          /* ── MOBILE OVERRIDES ── */
          @media (max-width: 640px) {
            .ff-page-wrapper {
              padding: 16px 12px;
            }

            .ff-pending-grid {
              grid-template-columns: 1fr;
              gap: 12px;
            }

            .ff-submitted-grid {
              grid-template-columns: 1fr;
              gap: 12px;
            }

            .ff-tab-bar {
              width: 100%;
              box-sizing: border-box;
            }

            .ff-tab-btn {
              flex: 1;
              text-align: center;
              font-size: 12px !important;
              padding: 8px 10px !important;
            }

            .ff-form-header {
              padding: 14px 14px;
            }

            .ff-form-header-inner {
              align-items: flex-start;
              gap: 8px;
            }

            .ff-form-body {
              padding: 14px;
            }

            .ff-submit-actions {
              flex-direction: column-reverse;
              gap: 8px;
            }

            .ff-submit-actions button {
              width: 100%;
              justify-content: center;
            }

            .ff-overall-row {
              flex-direction: column;
              align-items: flex-start;
              gap: 6px;
            }

            .ff-overall-score-num {
              font-size: 26px !important;
            }

            .ff-header-title {
              font-size: 18px !important;
            }
          }
        `}</style>

        {/* Toast */}
        {toast && (
          <div
            style={{
              position: "fixed",
              top: 16,
              right: 12,
              left: 12,
              zIndex: 9999,
              background: toast.type === "error" ? "#ff4d4f" : "#52c41a",
              color: "#fff",
              padding: "12px 16px",
              borderRadius: 8,
              fontWeight: 500,
              fontSize: 14,
              textAlign: "center",
              boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
            }}
          >
            {toast.msg}
          </div>
        )}

        <div className="ff-page-wrapper">
          {/* Header */}
          <div style={{ marginBottom: 20 }}>
            <h2 className="ff-header-title" style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a2e" }}>
              360° Feedback
            </h2>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
              Provide honest, constructive feedback for your colleagues
            </p>
          </div>

          {/* Tabs */}
          <div className="ff-tab-bar">
            {[
              { id: "pending",   label: `📝 Pending (${pendingItems.length})`   },
              { id: "submitted", label: `✅ Submitted (${submitted.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                className="ff-tab-btn"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "8px 20px",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                  background: activeTab === tab.id ? "#1a1a2e" : "transparent",
                  color:      activeTab === tab.id ? "#fff"    : "#6b7280",
                  transition: "all 0.15s",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  border: "4px solid #e5e7eb",
                  borderTopColor: "#2563eb",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  margin: "0 auto 12px",
                }}
              />
              <p style={{ color: "#6b7280" }}>Loading...</p>
            </div>
          ) : (
            <>
              {/* ── PENDING TAB ── */}
              {activeTab === "pending" && (
                <>
                  {!selectedItem ? (
                    <>
                      {pendingItems.length === 0 ? (
                        <div
                          style={{
                            background: "#fff",
                            borderRadius: 14,
                            padding: "48px 24px",
                            textAlign: "center",
                            border: "1px solid #e5e7eb",
                          }}
                        >
                          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                          <h3 style={{ color: "#1a1a2e", marginBottom: 8 }}>All caught up!</h3>
                          <p style={{ color: "#6b7280", fontSize: 14 }}>
                            You have no pending feedback to submit.
                          </p>
                        </div>
                      ) : (
                        <div className="ff-pending-grid">
                          {pendingItems.map((item, i) => (
                            <div
                              key={i}
                              className="ff-card"
                              style={{
                                background: "#fff",
                                borderRadius: 14,
                                padding: 18,
                                border: "1px solid #e5e7eb",
                              }}
                              onClick={() => {
                                setSelectedItem(item);
                                setScores({});
                                setStrengths("");
                                setImprovements("");
                                setComments("");
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                                <div
                                  style={{
                                    width: 42,
                                    height: 42,
                                    flexShrink: 0,
                                    borderRadius: "50%",
                                    background: "#eff6ff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 800,
                                    color: "#2563eb",
                                    fontSize: 16,
                                  }}
                                >
                                  {item.revieweeName?.charAt(0) || "?"}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#1a1a2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {item.revieweeName}
                                  </p>
                                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {item.revieweeDept} · {item.revieweeDesignation}
                                  </p>
                                </div>
                              </div>
                              <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 14px", marginBottom: 10 }}>
                                <p style={{ margin: "0 0 3px", fontSize: 11, color: "#6b7280", fontWeight: 600 }}>CYCLE</p>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{item.cycleName}</p>
                                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>{item.period}</p>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                                <span
                                  style={{
                                    background: "#fffbeb",
                                    color: "#d97706",
                                    fontWeight: 700,
                                    padding: "4px 10px",
                                    borderRadius: 20,
                                    fontSize: 11,
                                    textTransform: "capitalize",
                                  }}
                                >
                                  You: {item.reviewerType}
                                </span>
                                <span style={{ color: "#2563eb", fontWeight: 600, fontSize: 13 }}>
                                  Fill Feedback →
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    /* ── Feedback Form ── */
                    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                      {/* Form Header */}
                      <div className="ff-form-header">
                        <div className="ff-form-header-inner">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, color: "#fff", fontWeight: 800, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              360° Feedback — {selectedItem.revieweeName}
                            </p>
                            <p style={{ margin: "3px 0 0", color: "#9ca3af", fontSize: 12 }}>
                              {selectedItem.cycleName} · {selectedItem.period}
                            </p>
                            <p style={{ margin: "3px 0 0", color: "#9ca3af", fontSize: 12 }}>
                              Reviewing as{" "}
                              <strong style={{ color: "#fff" }}>{selectedItem.reviewerType}</strong>
                            </p>
                          </div>
                          <button
                            onClick={() => setSelectedItem(null)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#9ca3af",
                              fontSize: 22,
                              cursor: "pointer",
                              padding: "4px 4px 4px 12px",
                              flexShrink: 0,
                              lineHeight: 1,
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      <div className="ff-form-body">
                        {/* Competency Sliders */}
                        <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>
                          Rate each competency (0–100)
                        </p>
                        {COMPETENCIES.map((c) => (
                          <CompetencySlider
                            key={c.key}
                            competency={c}
                            value={scores[c.key] || 0}
                            onChange={(val) => handleScoreChange(c.key, val)}
                          />
                        ))}

                        {/* Live Overall Score */}
                        <div
                          style={{
                            background: overallBg,
                            border: `1px solid ${overallBorder}`,
                            borderRadius: 12,
                            padding: "14px 18px",
                            marginBottom: 20,
                          }}
                        >
                          <div className="ff-overall-row">
                            <div>
                              <p style={{ margin: 0, fontSize: 12, color: "#6b7280", fontWeight: 600 }}>OVERALL SCORE</p>
                              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af" }}>Average of all competencies</p>
                            </div>
                            <p className="ff-overall-score-num" style={{ margin: 0, fontSize: 32, fontWeight: 900, color: overallColor }}>
                              {overall}%
                            </p>
                          </div>
                        </div>

                        {/* Text Feedback */}
                        <div style={{ marginBottom: 14 }}>
                          <label style={labelStyle}>💪 Strengths</label>
                          <textarea
                            value={strengths}
                            onChange={(e) => setStrengths(e.target.value)}
                            placeholder="What does this person do well? What are their key strengths?"
                            rows={3}
                            style={{ ...inputStyle, resize: "vertical" }}
                          />
                        </div>

                        <div style={{ marginBottom: 14 }}>
                          <label style={labelStyle}>📈 Areas for Improvement</label>
                          <textarea
                            value={improvements}
                            onChange={(e) => setImprovements(e.target.value)}
                            placeholder="What could this person improve? Be constructive and specific."
                            rows={3}
                            style={{ ...inputStyle, resize: "vertical" }}
                          />
                        </div>

                        <div style={{ marginBottom: 22 }}>
                          <label style={labelStyle}>💬 Additional Comments (Optional)</label>
                          <textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Any other feedback..."
                            rows={2}
                            style={{ ...inputStyle, resize: "vertical" }}
                          />
                        </div>

                        <div className="ff-submit-actions">
                          <button
                            onClick={() => setSelectedItem(null)}
                            style={{
                              padding: "10px 24px",
                              border: "1px solid #e5e7eb",
                              borderRadius: 8,
                              background: "#fff",
                              color: "#374151",
                              fontWeight: 600,
                              cursor: "pointer",
                              fontSize: 14,
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSubmit}
                            disabled={saving}
                            style={{
                              padding: "10px 28px",
                              border: "none",
                              borderRadius: 8,
                              background: saving ? "#93c5fd" : "#16a34a",
                              color: "#fff",
                              fontWeight: 700,
                              fontSize: 14,
                              cursor: saving ? "not-allowed" : "pointer",
                            }}
                          >
                            {saving ? "Submitting..." : "✅ Submit Feedback"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── SUBMITTED TAB ── */}
              {activeTab === "submitted" && (
                <>
                  {submitted.length === 0 ? (
                    <div
                      style={{
                        background: "#fff",
                        borderRadius: 14,
                        padding: "48px 24px",
                        textAlign: "center",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
                      <p style={{ color: "#6b7280" }}>You haven't submitted any feedback yet.</p>
                    </div>
                  ) : (
                    <div className="ff-submitted-grid">
                      {submitted.map((sub, i) => {
                        const score = sub.overallScore || 0;
                        const scoreColor = score >= 75 ? "#16a34a" : score >= 50 ? "#d97706" : "#dc2626";
                        const scoreBg   = score >= 75 ? "#f0fdf4" : score >= 50 ? "#fffbeb" : "#fef2f2";
                        return (
                          <div
                            key={i}
                            style={{
                              background: "#fff",
                              borderRadius: 12,
                              padding: "14px 18px",
                              border: "1px solid #e5e7eb",
                              display: "flex",
                              alignItems: "center",
                              gap: 14,
                            }}
                          >
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                flexShrink: 0,
                                borderRadius: "50%",
                                background: "#f0fdf4",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 800,
                                color: "#16a34a",
                                fontSize: 15,
                              }}
                            >
                              {sub.revieweeId?.name?.charAt(0) || "?"}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                                <CheckCircle size={14} color="#16a34a" style={{ flexShrink: 0 }} />
                                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#1a1a2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {sub.revieweeId?.name || "—"}
                                </p>
                              </div>
                              <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
                                {sub.revieweeId?.department || "—"}{sub.submittedAt ? ` · ${new Date(sub.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                              </p>
                            </div>
                            <div
                              style={{
                                background: scoreBg,
                                borderRadius: 8,
                                padding: "6px 14px",
                                flexShrink: 0,
                                textAlign: "center",
                                minWidth: 58,
                              }}
                            >
                              <p style={{ margin: 0, fontSize: 10, color: "#6b7280", fontWeight: 600 }}>SCORE</p>
                              <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: scoreColor }}>{score}%</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </EmployeeLayout>
  );
}