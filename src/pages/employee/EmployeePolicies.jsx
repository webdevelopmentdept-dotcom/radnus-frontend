import { useState, useEffect } from "react";
import axios from "axios";
import EmployeeLayout from "./EmployeeLayout";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const getFileType = (url) => {
    if (!url) return "unknown";
    const lower = url.toLowerCase();
    if (lower.includes(".pdf") || lower.includes("/pdf")) return "pdf";
    if (lower.includes(".docx") || lower.includes(".doc") || lower.includes("wordprocessingml")) return "docx";
    if (lower.match(/\.(png|jpg|jpeg|gif|webp)/)) return "image";
    return "pdf";
};

const getViewerUrl = (fileUrl, fileType) => {
    if (fileType === "image") return fileUrl;
    return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
};

export default function EmployeePolicies() {
    const [policies, setPolicies] = useState([]);
    const [selectedPDF, setSelectedPDF] = useState(null);
    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const [selectedVersionLabel, setSelectedVersionLabel] = useState("");
    const [acknowledgedIds, setAcknowledgedIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [iframeLoading, setIframeLoading] = useState(false);
    const [expandedVersions, setExpandedVersions] = useState({});
    const [employee, setEmployee] = useState(null);

    const employeeId = localStorage.getItem("employeeId");

    useEffect(() => {
        if (!employeeId) { window.location.href = "/login"; return; }
        fetchEmployee();
        fetchPolicies();
    }, []);

    const fetchEmployee = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/employee/me/${employeeId}`);
            setEmployee(res.data);
        } catch (err) {
            console.log(err);
        }
    };

    const fetchPolicies = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/api/policies`);
            const data = Array.isArray(res.data)
                ? res.data
                : Array.isArray(res.data?.data)
                    ? res.data.data
                    : [];
            setPolicies(data);
        } catch (err) {
            console.log("FETCH ERROR:", err);
            setPolicies([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAcknowledge = async (policy_id) => {
        try {
            await axios.post(`${API_BASE}/api/policies/acknowledge`, {
                policy_id,
                employee_id: employeeId,
            });
            setAcknowledgedIds((prev) => [...prev, policy_id]);
            alert("✓ Policy acknowledged!");
        } catch (err) {
            alert(err.response?.data?.message || "Error");
        }
    };

    const isAcknowledged = (policyId) => acknowledgedIds.includes(policyId);

    const toggleVersions = (policyId) => {
        setExpandedVersions((prev) => ({ ...prev, [policyId]: !prev[policyId] }));
    };

    const getVersions = (policy) => {
        if (Array.isArray(policy.version_history) && policy.version_history.length > 0) {
            const sorted = [...policy.version_history].sort((a, b) => a.version_number - b.version_number);
            const allSame = sorted.every(v => v.version_number === sorted[0].version_number);
            if (allSame) {
                return sorted.map((v, i) => ({ ...v, display_version: i + 1 }));
            }
            return sorted.map(v => ({ ...v, display_version: v.version_number }));
        }
        return [{
            version_number: policy.version,
            display_version: policy.version,
            file_url: policy.file_url,
            change_note: "Initial upload",
            created_at: policy.createdAt,
        }];
    };

    const openViewer = (policy, fileUrl, versionLabel) => {
        setSelectedPolicy(policy);
        setSelectedPDF(fileUrl);
        setSelectedVersionLabel(versionLabel);
        setIframeLoading(true);
    };

    const closePolicy = () => {
        setSelectedPDF(null);
        setSelectedPolicy(null);
        setSelectedVersionLabel("");
        setIframeLoading(false);
    };

    const categoryColor = {
        HR:         { bg: "#ede9fe", color: "#6d28d9", border: "#a78bfa" },
        Finance:    { bg: "#fef9c3", color: "#854d0e", border: "#fcd34d" },
        IT:         { bg: "#dbeafe", color: "#1e40af", border: "#93c5fd" },
        General:    { bg: "#dcfce7", color: "#166534", border: "#86efac" },
        Operations: { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" },
    };

    const categories = ["HR", "Finance", "IT", "General", "Operations"];
    const fileType = selectedPDF ? getFileType(selectedPDF) : null;
    const viewerUrl = selectedPDF ? getViewerUrl(selectedPDF, fileType) : null;

    return (
        <EmployeeLayout>
            <div style={{ background: "#f4f6fb", minHeight: "100vh" }}>

                {/* ── Header (same as MyDocuments) ── */}
                <header style={{
                    background: "#fff",
                    padding: "14px 28px",
                    borderBottom: "1px solid #e5e7eb",
                    position: "sticky",
                    top: 0,
                    zIndex: 50,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}>
                    <div className="d-flex align-items-center gap-3">
                        <span className="fw-bold text-primary d-none d-sm-inline">Company Policies</span>
                        <div
                            className="ms-auto bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: 40, height: 40, fontSize: 16, fontWeight: 700 }}
                        >
                            {employee?.name?.charAt(0)}
                        </div>
                    </div>
                </header>

                <div className="container-fluid" style={{ padding: 28 }}>

                    {/* ── Stats ── */}
                    <div className="row g-3 mb-4">
                        {[
                            {
                                label: "Total Policies",
                                value: policies.length,
                                bg: "linear-gradient(135deg,#2563eb,#1e40af)",
                            },
                            {
                                label: "Acknowledged",
                                value: acknowledgedIds.length,
                                bg: "linear-gradient(135deg,#059669,#065f46)",
                            },
                            {
                                label: "Pending",
                                value: policies.length - acknowledgedIds.length,
                                bg: "linear-gradient(135deg,#d97706,#92400e)",
                            },
                        ].map((s, i) => (
                            <div key={i} className="col-md-4">
                                <div className="card border-0 text-white" style={{ background: s.bg }}>
                                    <div className="card-body d-flex align-items-center justify-content-between py-3">
                                        <div>
                                            <p className="mb-0 small opacity-75 fw-bold text-uppercase">{s.label}</p>
                                            <h3 className="mb-0 fw-bold">{s.value}</h3>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── Document Viewer Modal ── */}
                    {selectedPDF && (
                        <div style={{
                            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                            background: "rgba(0,0,0,0.75)", zIndex: 9999,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            padding: 20,
                        }}>
                            <div style={{
                                background: "#fff", borderRadius: 14,
                                width: "100%", maxWidth: 900, height: "90vh",
                                display: "flex", flexDirection: "column",
                                boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
                            }}>
                                {/* Modal Header */}
                                <div style={{
                                    padding: "16px 20px",
                                    borderBottom: "1px solid #e2e8f0",
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    flexShrink: 0,
                                }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                                            {selectedPolicy?.title}
                                        </h3>
                                        <span style={{ fontSize: 12, color: "#64748b" }}>
                                            {selectedVersionLabel} • {selectedPolicy?.category}
                                        </span>
                                    </div>
                                    <button onClick={closePolicy} style={{
                                        background: "#fee2e2", border: "none", borderRadius: 8,
                                        padding: "7px 16px", cursor: "pointer",
                                        color: "#dc2626", fontWeight: 600, fontSize: 13,
                                    }}>
                                        ✕ Close
                                    </button>
                                </div>

                                {/* Viewer */}
                                <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
                                    {iframeLoading && (
                                        <div style={{
                                            position: "absolute", inset: 0,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            background: "#f8fafc", zIndex: 10, flexDirection: "column", gap: 12,
                                        }}>
                                            <div style={{
                                                width: 36, height: 36,
                                                border: "3px solid #e2e8f0",
                                                borderTop: "3px solid #4f46e5",
                                                borderRadius: "50%",
                                                animation: "spin 0.8s linear infinite",
                                            }} />
                                            <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>Loading document...</p>
                                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                                        </div>
                                    )}
                                    {fileType === "image" && (
                                        <div style={{
                                            height: "100%", overflow: "auto",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            padding: 20, background: "#f8fafc",
                                        }}>
                                            <img src={selectedPDF} alt="Policy"
                                                onLoad={() => setIframeLoading(false)}
                                                style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8, objectFit: "contain" }}
                                            />
                                        </div>
                                    )}
                                    {(fileType === "pdf" || fileType === "docx") && (
                                        <iframe
                                            key={viewerUrl}
                                            src={viewerUrl}
                                            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                                            title="Policy Document"
                                            onLoad={() => setIframeLoading(false)}
                                        />
                                    )}
                                </div>

                                {/* Acknowledge Footer */}
                                <div style={{
                                    padding: "14px 20px",
                                    borderTop: "1px solid #e2e8f0",
                                    textAlign: "center",
                                    background: "#f8fafc",
                                    borderRadius: "0 0 14px 14px",
                                    flexShrink: 0,
                                }}>
                                    {isAcknowledged(selectedPolicy?._id) ? (
                                        <div style={{
                                            display: "inline-flex", alignItems: "center", gap: 8,
                                            background: "#dcfce7", color: "#166534",
                                            borderRadius: 8, padding: "10px 24px",
                                            fontWeight: 600, fontSize: 14,
                                        }}>
                                            ✓ You have acknowledged this policy
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleAcknowledge(selectedPolicy._id)}
                                            style={{
                                                background: "#1d4ed8", color: "#fff", border: "none",
                                                borderRadius: 8, padding: "11px 32px",
                                                cursor: "pointer", fontWeight: 600, fontSize: 14,
                                            }}
                                        >
                                            ✓ I have read and understood this policy
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Main Card ── */}
                    <div className="card">
                        <div className="card-body">

                            <div style={{ marginBottom: 20 }}>
                                <h5 style={{ fontWeight: 700, margin: 0 }}>Company Policies</h5>
                                <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
                                    Read and acknowledge all company policies
                                </p>
                            </div>

                            {loading && (
                                <div style={{ textAlign: "center", padding: 60 }}>
                                    <div className="spinner-border text-primary" role="status" />
                                </div>
                            )}

                            {!loading && policies.length === 0 && (
                                <div style={{
                                    textAlign: "center", padding: "60px 20px",
                                    background: "#f8fafc", borderRadius: 12,
                                    border: "1px dashed #cbd5e1",
                                }}>
                                    <p style={{ fontSize: 15, color: "#94a3b8" }}>No policies available yet.</p>
                                </div>
                            )}

                            {/* Policy Cards grouped by Category */}
                            {!loading && categories.map((cat) => {
                                const catPolicies = policies.filter((p) => p.category === cat);
                                if (catPolicies.length === 0) return null;
                                const c = categoryColor[cat] || { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" };

                                return (
                                    <div key={cat} style={{ marginBottom: 32 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                                            <span style={{
                                                background: c.bg, color: c.color,
                                                border: `1px solid ${c.border}`,
                                                borderRadius: 8, padding: "4px 14px",
                                                fontSize: 13, fontWeight: 700,
                                            }}>
                                                {cat}
                                            </span>
                                            <span style={{ fontSize: 12, color: "#94a3b8" }}>
                                                {catPolicies.length} {catPolicies.length === 1 ? "policy" : "policies"}
                                            </span>
                                        </div>

                                        <div style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                                            gap: 16,
                                        }}>
                                            {catPolicies.map((p) => {
                                                const acked = isAcknowledged(p._id);
                                                const versions = getVersions(p);
                                                const latestVersion = versions[versions.length - 1];
                                                const showVersions = expandedVersions[p._id];

                                                return (
                                                    <div key={p._id} style={{
                                                        background: "#fff",
                                                        border: `1px solid ${acked ? "#86efac" : "#fcd34d"}`,
                                                        borderLeft: `4px solid ${acked ? "#22c55e" : "#f59e0b"}`,
                                                        borderRadius: 12,
                                                        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                                                        overflow: "hidden",
                                                    }}>
                                                        {/* Card Top */}
                                                        <div style={{ padding: 18 }}>
                                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                                                <span style={{
                                                                    background: c.bg, color: c.color,
                                                                    borderRadius: 6, padding: "2px 10px",
                                                                    fontSize: 11, fontWeight: 700,
                                                                }}>
                                                                    {p.category}
                                                                </span>
                                                                <span style={{
                                                                    background: "#f1f5f9", color: "#475569",
                                                                    borderRadius: 6, padding: "2px 10px",
                                                                    fontSize: 11, fontWeight: 600,
                                                                }}>
                                                                    Latest: v{p.version}
                                                                </span>
                                                            </div>

                                                            <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px", color: "#1e293b" }}>
                                                                {p.title}
                                                            </h3>
                                                            <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 14px", lineHeight: 1.5 }}>
                                                                {p.description || "No description provided"}
                                                            </p>

                                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                                <span style={{ fontSize: 11, fontWeight: 700, color: acked ? "#16a34a" : "#d97706" }}>
                                                                    {acked ? "✓ Acknowledged" : "⚠ Pending"}
                                                                </span>
                                                                <div style={{ display: "flex", gap: 8 }}>
                                                                    <button
                                                                        onClick={() => openViewer(p, latestVersion.file_url, `Version v${latestVersion.display_version} (Latest)`)}
                                                                        style={{
                                                                            background: "#1d4ed8", color: "#fff",
                                                                            border: "none", borderRadius: 8,
                                                                            padding: "6px 14px", cursor: "pointer",
                                                                            fontSize: 12, fontWeight: 600,
                                                                        }}
                                                                    >
                                                                        View Latest
                                                                    </button>
                                                                    {versions.length > 1 && (
                                                                        <button
                                                                            onClick={() => toggleVersions(p._id)}
                                                                            style={{
                                                                                background: showVersions ? "#e0e7ff" : "#f1f5f9",
                                                                                color: showVersions ? "#4338ca" : "#475569",
                                                                                border: "none", borderRadius: 8,
                                                                                padding: "6px 12px", cursor: "pointer",
                                                                                fontSize: 12, fontWeight: 600,
                                                                            }}
                                                                        >
                                                                            {showVersions ? "▲ Hide" : `▼ ${versions.length} Versions`}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Version History Panel */}
                                                        {showVersions && versions.length > 1 && (
                                                            <div style={{
                                                                borderTop: "1px solid #e2e8f0",
                                                                background: "#f8fafc",
                                                                padding: "12px 18px",
                                                            }}>
                                                                <p style={{
                                                                    fontSize: 11, fontWeight: 700, color: "#64748b",
                                                                    margin: "0 0 10px", textTransform: "uppercase", letterSpacing: 0.5,
                                                                }}>
                                                                    Version History
                                                                </p>
                                                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                                                    {[...versions].reverse().map((v, idx) => (
                                                                        <div key={`${v.version_number}-${idx}`} style={{
                                                                            display: "flex", alignItems: "center",
                                                                            justifyContent: "space-between",
                                                                            background: "#fff",
                                                                            border: `1px solid ${idx === 0 ? "#93c5fd" : "#e2e8f0"}`,
                                                                            borderRadius: 8,
                                                                            padding: "8px 12px",
                                                                        }}>
                                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                                <span style={{
                                                                                    background: idx === 0 ? "#dbeafe" : "#f1f5f9",
                                                                                    color: idx === 0 ? "#1e40af" : "#64748b",
                                                                                    borderRadius: 6, padding: "2px 8px",
                                                                                    fontSize: 11, fontWeight: 700,
                                                                                }}>
                                                                                    v{v.display_version}
                                                                                </span>
                                                                                {idx === 0 && (
                                                                                    <span style={{
                                                                                        background: "#dcfce7", color: "#16a34a",
                                                                                        borderRadius: 4, padding: "1px 6px",
                                                                                        fontSize: 10, fontWeight: 700,
                                                                                    }}>
                                                                                        Latest
                                                                                    </span>
                                                                                )}
                                                                                <span style={{ fontSize: 11, color: "#94a3b8" }}>
                                                                                    {v.created_at ? new Date(v.created_at).toLocaleDateString("en-IN") : ""}
                                                                                </span>
                                                                            </div>
                                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                                {v.change_note && (
                                                                                    <span style={{
                                                                                        fontSize: 11, color: "#64748b",
                                                                                        maxWidth: 110, overflow: "hidden",
                                                                                        textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                                                    }} title={v.change_note}>
                                                                                        {v.change_note}
                                                                                    </span>
                                                                                )}
                                                                                <button
                                                                                    onClick={() => openViewer(
                                                                                        p,
                                                                                        v.file_url,
                                                                                        `Version v${v.display_version}${idx === 0 ? " (Latest)" : ""}`
                                                                                    )}
                                                                                    style={{
                                                                                        background: "#e0e7ff", color: "#4338ca",
                                                                                        border: "none", borderRadius: 6,
                                                                                        padding: "4px 12px", cursor: "pointer",
                                                                                        fontSize: 11, fontWeight: 600,
                                                                                        whiteSpace: "nowrap",
                                                                                    }}
                                                                                >
                                                                                    View
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Summary Footer */}
                            {!loading && policies.length > 0 && (
                                <div style={{
                                    marginTop: 8, padding: "12px 16px",
                                    background: "#f8fafc", borderRadius: 10,
                                    border: "1px solid #e2e8f0",
                                    display: "flex", gap: 20, flexWrap: "wrap",
                                    fontSize: 13,
                                }}>
                                    <span style={{ color: "#475569", fontWeight: 600 }}>Total: {policies.length}</span>
                                    <span style={{ color: "#16a34a", fontWeight: 600 }}>✓ Acknowledged: {acknowledgedIds.length}</span>
                                    <span style={{ color: "#d97706", fontWeight: 600 }}>
                                        ⚠ Pending: {policies.length - acknowledgedIds.length}
                                    </span>
                                </div>
                            )}

                        </div>
                    </div>

                </div>
            </div>
        </EmployeeLayout>
    );
}