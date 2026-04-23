import React, { useEffect, useState } from "react";

const STATUS_OPTIONS = ["New", "Shortlisted", "Interview", "Hired", "Rejected"];

const STATUS_CONFIG = {
  New:         { bg: "#eff6ff", color: "#1d4ed8", dot: "#3b82f6" },
  Shortlisted: { bg: "#fefce8", color: "#a16207", dot: "#eab308" },
  Interview:   { bg: "#f5f3ff", color: "#7c3aed", dot: "#8b5cf6" },
  Hired:       { bg: "#f0fdf4", color: "#15803d", dot: "#22c55e" },
  Rejected:    { bg: "#fff1f2", color: "#b91c1c", dot: "#ef4444" },
};

const REJECTION_REASONS = [
  "Not enough experience",
  "Skills mismatch",
  "Salary expectation too high",
  "Position already filled",
  "Failed technical assessment",
  "Poor communication skills",
  "Location / relocation issue",
  "Other",
];

const statusStyle = (status) => {
  const c = STATUS_CONFIG[status];
  if (!c) return { background: "#f3f4f6", color: "#374151" };
  return { background: c.bg, color: c.color };
};

const toPreviewUrl = (url) => {
  if (!url) return url;
  return url.replace("/fl_attachment/", "/").replace("fl_attachment,", "").replace(",fl_attachment", "");
};

const isImage = (url) => /\.(jpg|jpeg|png|webp|gif|bmp|tiff|heic)(\?|$)/i.test(url);

export default function HrApplicants() {
  const [applicants, setApplicants] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, text: "", x: 0, y: 0 });

  // Rejection modal state
  const [rejectModal, setRejectModal] = useState({ open: false, applicantId: null, applicantName: "" });
  const [rejectReason, setRejectReason] = useState("");
  const [rejectCustom, setRejectCustom] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => { loadApplicants(); }, []);

  const loadApplicants = async () => {
    const res = await fetch(`${API_BASE}/api/hr/applications`);
    const data = await res.json();
    setApplicants(data.applications || []);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this applicant?")) return;
    await fetch(`${API_BASE}/api/hr/applications/${id}`, { method: "DELETE" });
    setApplicants(applicants.filter((a) => a._id !== id));
  };

  const handleStatusChange = async (id, newStatus, applicantName) => {
    // If "Rejected" → open reason modal instead of saving directly
    if (newStatus === "Rejected") {
      setRejectReason("");
      setRejectCustom("");
      setRejectModal({ open: true, applicantId: id, applicantName });
      return;
    }
    await saveStatus(id, newStatus, null);
  };

  const saveStatus = async (id, newStatus, rejectionReason) => {
    setUpdatingId(id);
    try {
      const body = { status: newStatus };
      if (rejectionReason) body.rejectionReason = rejectionReason;

      const res = await fetch(`${API_BASE}/api/hr/applications/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setApplicants((prev) =>
          prev.map((a) =>
            a._id === id
              ? { ...a, status: newStatus, ...(rejectionReason ? { rejectionReason } : {}) }
              : a
          )
        );
      }
    } catch (err) { console.error(err); }
    finally { setUpdatingId(null); }
  };

  const handleRejectConfirm = async () => {
    const finalReason = rejectReason === "Other" ? rejectCustom.trim() : rejectReason;
    if (!finalReason) return;
    setRejectSubmitting(true);
    await saveStatus(rejectModal.applicantId, "Rejected", finalReason);
    setRejectSubmitting(false);
    setRejectModal({ open: false, applicantId: null, applicantName: "" });
  };

  const handleRejectCancel = () => {
    setRejectModal({ open: false, applicantId: null, applicantName: "" });
    setRejectReason("");
    setRejectCustom("");
  };

  // Duplicate group map
  const aadhaarGroupMap = applicants.reduce((acc, a) => {
    if (!a.aadhaarLast4) return acc;
    if (!acc[a.aadhaarLast4]) acc[a.aadhaarLast4] = [];
    acc[a.aadhaarLast4].push(a);
    return acc;
  }, {});

  const getDuplicateTooltip = (applicant) => {
    const group = aadhaarGroupMap[applicant.aadhaarLast4] || [];
    const others = group.filter((b) => b._id !== applicant._id);
    if (others.length === 0) return null;
    const names = others.map((b) => `${b.name} (•••• ${b.aadhaarLast4})`).join(", ");
    return `Matches: ${names}`;
  };

  const handleBadgeMouseEnter = (e, tooltipText) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ visible: true, text: tooltipText, x: rect.left + rect.width / 2, y: rect.top - 8 });
  };

  const handleBadgeMouseLeave = () => {
    setTooltip({ visible: false, text: "", x: 0, y: 0 });
  };

  const filtered = applicants.filter((a) => {
    const matchSearch = (a.name + a.email + a.jobTitle).toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = applicants.filter((a) => (a.status || "New") === s).length;
    return acc;
  }, {});

  const isRejectReasonValid = rejectReason && (rejectReason !== "Other" || rejectCustom.trim().length > 0);

  return (
    <>
      <style>{`
        .ha-wrap { background: #f4f5f7; min-height: 100vh; padding: 32px 28px 60px; }
        .ha-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .ha-heading { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 2px; letter-spacing: -0.3px; }
        .ha-subheading { font-size: 13px; color: #94a3b8; margin: 0; }
        .ha-total-badge { background: #0f172a; color: #fff; border-radius: 7px; padding: 5px 13px; font-size: 13px; font-weight: 700; }
        .ha-summary { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
        .ha-stat-chip { display: inline-flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 16px; cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s; min-width: 100px; }
        .ha-stat-chip:hover { border-color: #cbd5e1; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .ha-stat-chip.active { border-color: #0f172a; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .ha-stat-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .ha-stat-label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .ha-stat-count { font-size: 15px; font-weight: 800; color: #0f172a; margin-left: auto; padding-left: 8px; }
        .ha-toolbar { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
        .ha-search-wrap { flex: 1; min-width: 220px; }
        .ha-search { width: 100%; padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 9px; font-size: 13.5px; color: #0f172a; background: #fff; outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
        .ha-search::placeholder { color: #cbd5e1; }
        .ha-search:focus { border-color: #0f172a; box-shadow: 0 0 0 3px rgba(15,23,42,0.06); }
        .ha-filter-select { padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 9px; font-size: 13.5px; color: #0f172a; background: #fff; outline: none; min-width: 150px; cursor: pointer; }
        .ha-filter-select:focus { border-color: #0f172a; }
        .ha-table-card { background: #fff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; }
        .ha-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .ha-table thead tr { border-bottom: 1px solid #f1f5f9; }
        .ha-table thead th { padding: 13px 16px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.7px; background: #fafbfc; white-space: nowrap; text-align: left; }
        .ha-table thead th.center { text-align: center; }
        .ha-table tbody tr { border-bottom: 1px solid #f8fafc; transition: background 0.12s; }
        .ha-table tbody tr:last-child { border-bottom: none; }
        .ha-table tbody tr:hover { background: #fafbfc; }
        .ha-table td { padding: 14px 16px; color: #334155; vertical-align: middle; }
        .ha-table td.center { text-align: center; }
        .ha-num { font-size: 12px; color: #94a3b8; font-weight: 600; }
        .ha-candidate-name { font-weight: 700; color: #0f172a; font-size: 13.5px; }
        .ha-candidate-phone { font-size: 12px; color: #94a3b8; margin-top: 2px; }
        .ha-duplicate-badge { display: inline-flex; align-items: center; gap: 4px; background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; border-radius: 5px; padding: 2px 7px; font-size: 11px; font-weight: 700; margin-top: 4px; cursor: help; transition: background 0.15s, border-color 0.15s; }
        .ha-duplicate-badge:hover { background: #ffedd5; border-color: #fb923c; }
        .ha-tooltip { position: fixed; z-index: 99999; background: #1e293b; color: #f8fafc; font-size: 12px; font-weight: 600; padding: 7px 12px; border-radius: 8px; pointer-events: none; white-space: nowrap; box-shadow: 0 8px 24px rgba(0,0,0,0.25); transform: translate(-50%, -100%); animation: haTooltipIn 0.12s ease; max-width: 320px; white-space: normal; text-align: center; }
        .ha-tooltip::after { content: ""; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border: 5px solid transparent; border-top-color: #1e293b; }
        @keyframes haTooltipIn { from { opacity: 0; transform: translate(-50%, -90%); } to { opacity: 1; transform: translate(-50%, -100%); } }
        .ha-email { color: #64748b; font-size: 13px; }
        .ha-job-chip { display: inline-block; background: #f1f5f9; color: #334155; border-radius: 6px; padding: 4px 10px; font-size: 12px; font-weight: 600; }
        .ha-date { color: #94a3b8; font-size: 12.5px; white-space: nowrap; }
        .ha-location-text { font-size: 13px; color: #374151; }
        .ha-aadhaar-text { font-size: 13px; color: #374151; font-weight: 600; font-family: monospace; letter-spacing: 1px; }
        .ha-na { font-size: 12px; color: #cbd5e1; }
        .ha-ai-badge { display: inline-flex; align-items: center; gap: 6px; border-radius: 7px; padding: 4px 10px; font-size: 12px; font-weight: 700; white-space: nowrap; }
        .ha-ai-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .ha-ai-pending { background: #f1f5f9; color: #94a3b8; font-size: 11px; border-radius: 7px; padding: 4px 10px; font-weight: 600; }
        .ha-status-select { border: none; border-radius: 7px; padding: 5px 10px; font-size: 12px; font-weight: 700; cursor: pointer; outline: none; appearance: auto; }
        .ha-reject-reason-tag { display: inline-flex; align-items: center; gap: 5px; background: #fff1f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: 6px; padding: 3px 8px; font-size: 11px; font-weight: 600; margin-top: 5px; max-width: 180px; }
        .ha-reject-reason-tag span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ha-preview-btn { display: inline-flex; align-items: center; background: #f1f5f9; color: #334155; border: none; border-radius: 7px; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
        .ha-preview-btn:hover { background: #e2e8f0; color: #0f172a; }
        .ha-delete-btn { display: inline-flex; align-items: center; background: transparent; color: #ef4444; border: 1.5px solid #fecaca; border-radius: 7px; padding: 5px 12px; font-size: 12px; font-weight: 600; cursor: pointer; transition: background 0.15s, border-color 0.15s; }
        .ha-delete-btn:hover { background: #fff1f2; border-color: #ef4444; }
        .ha-no-file { font-size: 12px; color: #cbd5e1; }
        .ha-empty { text-align: center; padding: 56px 20px; }
        .ha-empty-text { font-size: 14px; font-weight: 600; color: #94a3b8; }

        /* Preview Modal */
        .ha-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(2,6,23,0.7); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 24px; animation: haFadeIn 0.18s ease; }
        @keyframes haFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .ha-modal { background: #fff; border-radius: 16px; overflow: hidden; width: 100%; max-width: 880px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 32px 80px rgba(0,0,0,0.35); animation: haSlideUp 0.2s cubic-bezier(0.34,1.56,0.64,1); }
        @keyframes haSlideUp { from { opacity: 0; transform: translateY(20px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .ha-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 22px; border-bottom: 1px solid #f1f5f9; background: #fafbfc; }
        .ha-modal-title { font-size: 15px; font-weight: 800; color: #0f172a; }
        .ha-modal-actions { display: flex; gap: 8px; }
        .ha-download-btn { display: inline-flex; align-items: center; background: #f1f5f9; border: none; border-radius: 8px; padding: 7px 14px; font-size: 13px; font-weight: 600; color: #334155; text-decoration: none; cursor: pointer; transition: background 0.15s; }
        .ha-download-btn:hover { background: #e2e8f0; }
        .ha-close-btn { display: inline-flex; align-items: center; background: #fff1f2; border: none; border-radius: 8px; padding: 7px 14px; font-size: 13px; font-weight: 600; color: #ef4444; cursor: pointer; transition: background 0.15s; }
        .ha-close-btn:hover { background: #fee2e2; }
        .ha-modal-body { flex: 1; overflow: auto; background: #f8fafc; }

        /* Rejection Reason Modal */
        .ha-reject-overlay { position: fixed; inset: 0; z-index: 10000; background: rgba(2,6,23,0.65); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 24px; animation: haFadeIn 0.15s ease; }
        .ha-reject-modal { background: #fff; border-radius: 18px; width: 100%; max-width: 460px; box-shadow: 0 32px 80px rgba(0,0,0,0.3); animation: haSlideUp 0.2s cubic-bezier(0.34,1.56,0.64,1); overflow: hidden; }
        .ha-reject-modal-top { padding: 22px 24px 18px; border-bottom: 1px solid #f1f5f9; }
        .ha-reject-icon { width: 42px; height: 42px; border-radius: 12px; background: #fff1f2; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 12px; }
        .ha-reject-title { font-size: 16px; font-weight: 800; color: #0f172a; margin: 0 0 4px; }
        .ha-reject-subtitle { font-size: 13px; color: #64748b; margin: 0; }
        .ha-reject-modal-body { padding: 18px 24px 20px; }
        .ha-reject-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 10px; display: block; }
        .ha-reason-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
        .ha-reason-btn { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 9px; padding: 9px 12px; font-size: 12.5px; font-weight: 600; color: #334155; cursor: pointer; text-align: left; transition: border-color 0.12s, background 0.12s; line-height: 1.35; }
        .ha-reason-btn:hover { border-color: #94a3b8; background: #f1f5f9; }
        .ha-reason-btn.selected { border-color: #ef4444; background: #fff1f2; color: #b91c1c; }
        .ha-custom-input { width: 100%; padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 9px; font-size: 13px; color: #0f172a; background: #fff; outline: none; margin-top: 8px; transition: border-color 0.15s, box-shadow 0.15s; resize: none; font-family: inherit; }
        .ha-custom-input::placeholder { color: #cbd5e1; }
        .ha-custom-input:focus { border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.08); }
        .ha-reject-modal-footer { display: flex; gap: 10px; padding: 0 24px 22px; }
        .ha-reject-cancel-btn { flex: 1; padding: 11px; border: 1.5px solid #e2e8f0; border-radius: 10px; background: #fff; font-size: 13.5px; font-weight: 700; color: #64748b; cursor: pointer; transition: background 0.12s; }
        .ha-reject-cancel-btn:hover { background: #f8fafc; }
        .ha-reject-confirm-btn { flex: 2; padding: 11px; border: none; border-radius: 10px; background: #ef4444; font-size: 13.5px; font-weight: 700; color: #fff; cursor: pointer; transition: background 0.12s, opacity 0.12s; }
        .ha-reject-confirm-btn:hover:not(:disabled) { background: #dc2626; }
        .ha-reject-confirm-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        @media (max-width: 768px) {
          .ha-wrap { padding: 20px 14px 48px; }
          .ha-table thead { display: none; }
          .ha-table td { display: block; padding: 6px 14px; }
          .ha-table tr { display: block; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
          .ha-reason-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Global Tooltip */}
      {tooltip.visible && (
        <div className="ha-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          {tooltip.text}
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectModal.open && (
        <div className="ha-reject-overlay" onClick={handleRejectCancel}>
          <div className="ha-reject-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ha-reject-modal-top">
              <div className="ha-reject-icon">✕</div>
              <h2 className="ha-reject-title">Rejection Reason</h2>
              <p className="ha-reject-subtitle">
                Why is <strong>{rejectModal.applicantName}</strong> being rejected?
              </p>
            </div>
            <div className="ha-reject-modal-body">
              <span className="ha-reject-label">Select a reason</span>
              <div className="ha-reason-grid">
                {REJECTION_REASONS.map((r) => (
                  <button
                    key={r}
                    className={`ha-reason-btn${rejectReason === r ? " selected" : ""}`}
                    onClick={() => setRejectReason(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {rejectReason === "Other" && (
                <textarea
                  className="ha-custom-input"
                  rows={3}
                  placeholder="Describe the reason..."
                  value={rejectCustom}
                  onChange={(e) => setRejectCustom(e.target.value)}
                  autoFocus
                />
              )}
            </div>
            <div className="ha-reject-modal-footer">
              <button className="ha-reject-cancel-btn" onClick={handleRejectCancel}>
                Cancel
              </button>
              <button
                className="ha-reject-confirm-btn"
                disabled={!isRejectReasonValid || rejectSubmitting}
                onClick={handleRejectConfirm}
              >
                {rejectSubmitting ? "Saving..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="ha-wrap">

        {/* Preview Modal */}
        {previewUrl && (
          <div className="ha-overlay" onClick={() => setPreviewUrl(null)}>
            <div className="ha-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ha-modal-header">
                <span className="ha-modal-title">Resume Preview</span>
                <div className="ha-modal-actions">
                  <a href={previewUrl} download className="ha-download-btn">Download</a>
                  <button onClick={() => setPreviewUrl(null)} className="ha-close-btn">Close</button>
                </div>
              </div>
              <div className="ha-modal-body">
                {isImage(previewUrl) ? (
                  <img src={previewUrl} alt="Resume" style={{ display: "block", maxWidth: "100%", margin: "0 auto" }} />
                ) : (
                  <iframe
                    src={`https://docs.google.com/gview?url=${encodeURIComponent(previewUrl)}&embedded=true`}
                    style={{ width: "100%", height: "76vh", border: "none" }}
                    title="Resume Preview"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="ha-header">
          <div>
            <h1 className="ha-heading">HR Applicants</h1>
            <p className="ha-subheading">Manage and track all job applications</p>
          </div>
          <span className="ha-total-badge">{filtered.length} of {applicants.length}</span>
        </div>

        {/* Status Summary */}
        <div className="ha-summary">
          {STATUS_OPTIONS.map((s) => {
            const cfg = STATUS_CONFIG[s];
            return (
              <div
                key={s}
                className={`ha-stat-chip${statusFilter === s ? " active" : ""}`}
                onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
              >
                <span className="ha-stat-dot" style={{ background: cfg.dot }} />
                <span className="ha-stat-label">{s}</span>
                <span className="ha-stat-count">{counts[s]}</span>
              </div>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="ha-toolbar">
          <div className="ha-search-wrap">
            <input
              className="ha-search"
              placeholder="Search by name, email or job title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="ha-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="ha-table-card">
          <div style={{ overflowX: "auto" }}>
            <table className="ha-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Candidate</th>
                  <th>Email</th>
                  <th>Job Role</th>
                  <th>Location</th>
                  <th>Aadhaar (Last 4)</th>
                  <th>Applied</th>
                  <th>AI Score</th>
                  <th>Status</th>
                  <th className="center">Resume</th>
                  <th className="center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="11">
                      <div className="ha-empty">
                        <div className="ha-empty-text">No applicants found</div>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((a, i) => {
                  const dupTooltip = getDuplicateTooltip(a);
                  return (
                    <tr key={a._id}>
                      <td><span className="ha-num">{i + 1}</span></td>

                      <td>
                        <div className="ha-candidate-name">{a.name}</div>
                        {a.phone && <div className="ha-candidate-phone">{a.phone}</div>}
                        {dupTooltip && (
                          <div
                            className="ha-duplicate-badge"
                            onMouseEnter={(e) => handleBadgeMouseEnter(e, dupTooltip)}
                            onMouseLeave={handleBadgeMouseLeave}
                          >
                            ⚠ Duplicate
                          </div>
                        )}
                      </td>

                      <td><span className="ha-email">{a.email}</span></td>
                      <td><span className="ha-job-chip">{a.jobTitle}</span></td>
                      <td>
                        {a.location
                          ? <span className="ha-location-text">{a.location}</span>
                          : <span className="ha-na">—</span>
                        }
                      </td>
                      <td>
                        {a.aadhaarLast4
                          ? <span className="ha-aadhaar-text">•••• {a.aadhaarLast4}</span>
                          : <span className="ha-na">—</span>
                        }
                      </td>
                      <td>
                        <span className="ha-date">
                          {a.createdAt
                            ? new Date(a.createdAt).toLocaleDateString("en-GB", {
                                day: "2-digit", month: "short", year: "numeric",
                              })
                            : "—"}
                        </span>
                      </td>
                      <td>
                        {a.aiScore != null ? (
                          <span
                            className="ha-ai-badge"
                            title={a.aiReason || ""}
                            style={{
                              background:
                                a.aiGrade === "A" ? "#f0fdf4" :
                                a.aiGrade === "B" ? "#fefce8" : "#fff1f2",
                              color:
                                a.aiGrade === "A" ? "#15803d" :
                                a.aiGrade === "B" ? "#a16207" : "#b91c1c",
                            }}
                          >
                            <span className="ha-ai-dot" style={{
                              background:
                                a.aiGrade === "A" ? "#22c55e" :
                                a.aiGrade === "B" ? "#eab308" : "#ef4444",
                            }} />
                            {a.aiScore}/100 · {a.aiGrade}
                          </span>
                        ) : (
                          <span className="ha-ai-pending">Screening...</span>
                        )}
                      </td>
                      <td>
                        <div>
                          <select
                            className="ha-status-select"
                            value={a.status || "New"}
                            onChange={(e) => handleStatusChange(a._id, e.target.value, a.name)}
                            disabled={updatingId === a._id}
                            style={statusStyle(a.status || "New")}
                          >
                            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          {/* Show rejection reason tag below the select */}
                          {(a.status === "Rejected" || a.status === "rejected") && a.rejectionReason && (
                            <div className="ha-reject-reason-tag" title={a.rejectionReason}>
                              <span>↳ {a.rejectionReason}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="center">
                        {a.resumeUrl ? (
                          <button
                            className="ha-preview-btn"
                            onClick={() => setPreviewUrl(toPreviewUrl(a.resumeUrl))}
                          >
                            Preview
                          </button>
                        ) : (
                          <span className="ha-no-file">No file</span>
                        )}
                      </td>
                      <td className="center">
                        <button className="ha-delete-btn" onClick={() => handleDelete(a._id)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}