import React, { useEffect, useState } from "react";
import axios from "axios";
import { ClipboardList, Clock, CheckCircle2, XCircle, Users, RefreshCw, LogOut } from "lucide-react";
import EmployeeLayout from "./EmployeeLayout";


const API_BASE = import.meta.env.VITE_API_BASE_URL;

const STATUS_MAP = {
  applied:      { label: "Applied",       bg: "#eff6ff", fg: "#1d4ed8", border: "#bfdbfe", icon: ClipboardList },
  under_review: { label: "Under Review",  bg: "#fef9c3", fg: "#a16207", border: "#fde68a", icon: Clock },
  interview:    { label: "Interview",     bg: "#f5f3ff", fg: "#7c3aed", border: "#ddd6fe", icon: Users },
  selected:     { label: "Selected",      bg: "#dcfce7", fg: "#15803d", border: "#86efac", icon: CheckCircle2 },
  rejected:     { label: "Not Selected",  bg: "#fee2e2", fg: "#b91c1c", border: "#fca5a5", icon: XCircle },
};

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const employeeId = localStorage.getItem("employeeId");

  const fetchApplications = async () => {
    if (!employeeId) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/jobs/my-applications/${employeeId}`);
      setApplications(res.data.applications || []);
      setError("");
    } catch (err) {
      setError("Failed to load your applications.");
    } finally {
      setLoading(false);
    }
  };

  const [withdrawingId, setWithdrawingId] = useState(null);

  const handleWithdraw = async (jobId, title) => {
    if (!window.confirm(`Withdraw your application for "${title}"?`)) return;
    setWithdrawingId(jobId);
    try {
      await axios.delete(`${API_BASE}/api/jobs/${jobId}/withdraw/${employeeId}`);
      setApplications(prev => prev.filter(a => a.jobId !== jobId));
    } catch (err) {
      alert(err?.response?.data?.msg || "Withdraw failed");
    } finally {
      setWithdrawingId(null);
    }
  };

  useEffect(() => { fetchApplications(); }, []);

  return (
    <EmployeeLayout>
      <div style={{ padding: "24px 20px", maxWidth: 780, margin: "0 auto", fontFamily: "'Manrope', sans-serif" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1a1d2e" }}>
              My Applications
            </h2>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
              Track the status of internal roles you've applied for
            </p>
          </div>
          <button
            onClick={fetchApplications}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#f3f4f6", border: "1px solid #e5e7eb",
              borderRadius: 8, padding: "8px 14px", fontSize: 12,
              fontWeight: 600, color: "#374151", cursor: "pointer"
            }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "#9ca3af", padding: 40 }}>Loading...</p>
        ) : error ? (
          <p style={{ textAlign: "center", color: "#dc2626", padding: 40 }}>{error}</p>
        ) : applications.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            color: "#9ca3af", border: "2px dashed #e5e7eb", borderRadius: 12
          }}>
            <ClipboardList size={28} style={{ marginBottom: 8, opacity: 0.5 }} />
            <p style={{ fontSize: 15, margin: 0, fontWeight: 600, color: "#6b7280" }}>
              No applications yet
            </p>
            <p style={{ fontSize: 13, margin: "6px 0 0" }}>
              Apply to an internal opportunity from your dashboard to see it here
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {applications.map((app) => {
              const s = STATUS_MAP[app.applicationStatus] || STATUS_MAP.applied;
              const Icon = s.icon;
              return (
                <div key={app.jobId} style={{
                  background: "#fff", border: "1px solid #e5e7eb",
                  borderRadius: 12, padding: "16px 18px",
                  display: "flex", justifyContent: "space-between",
                  alignItems: "flex-start", gap: 12, flexWrap: "wrap"
                }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <h4 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#1a1d2e" }}>
                      {app.title}
                    </h4>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, color: "#6b7280", marginBottom: app.applicationStatus === "rejected" && app.rejectionReason ? 8 : 0 }}>
                      <span>📁 {app.department}</span>
                      <span>👤 {app.experience}</span>
                      <span>📅 Applied {fmtDate(app.appliedAt)}</span>
                    </div>
                    {app.applicationStatus === "rejected" && app.rejectionReason && (
                      <p style={{ margin: "6px 0 0", fontSize: 12, color: "#b91c1c", background: "#fef2f2", padding: "6px 10px", borderRadius: 6, display: "inline-block" }}>
                        Reason: {app.rejectionReason}
                      </p>
                    )}
                    {app.jobStatus === "closed" && (
                      <p style={{ margin: "6px 0 0", fontSize: 11, color: "#9ca3af" }}>
                        This position has since been closed
                      </p>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      background: s.bg, color: s.fg, border: `1px solid ${s.border}`,
                      borderRadius: 20, padding: "5px 12px",
                      fontSize: 12, fontWeight: 700, whiteSpace: "nowrap"
                    }}>
                      <Icon size={13} /> {s.label}
                    </span>
                    {app.applicationStatus === "applied" && (
                      <button
                        onClick={() => handleWithdraw(app.jobId, app.title)}
                        disabled={withdrawingId === app.jobId}
                        style={{
                          display: "flex", alignItems: "center", gap: 4,
                          background: "transparent", border: "1px solid #fca5a5",
                          color: "#dc2626", borderRadius: 8, padding: "4px 10px",
                          fontSize: 11, fontWeight: 700, cursor: "pointer"
                        }}
                      >
                        <LogOut size={11} /> {withdrawingId === app.jobId ? "..." : "Withdraw"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}