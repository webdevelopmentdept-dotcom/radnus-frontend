import React, { useEffect, useState } from "react";

const STATUS_OPTIONS = ["New", "Shortlisted", "Interview", "Hired", "Rejected"];

const STATUS_CONFIG = {
  New:         { bg: "#eff6ff", color: "#1d4ed8", dot: "#3b82f6" },
  Shortlisted: { bg: "#fefce8", color: "#a16207", dot: "#eab308" },
  Interview:   { bg: "#f5f3ff", color: "#7c3aed", dot: "#8b5cf6" },
  Hired:       { bg: "#f0fdf4", color: "#15803d", dot: "#22c55e" },
  Rejected:    { bg: "#fff1f2", color: "#b91c1c", dot: "#ef4444" },
};

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

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`${API_BASE}/api/hr/applications/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setApplicants((prev) =>
          prev.map((a) => a._id === id ? { ...a, status: newStatus } : a)
        );
      }
    } catch (err) { console.error(err); }
    finally { setUpdatingId(null); }
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

  return (
    <>
      <style>{`
        .ha-wrap {
          background: #f4f5f7;
          min-height: 100vh;
          padding: 32px 28px 60px;
        }
        .ha-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .ha-heading {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 2px;
          letter-spacing: -0.3px;
        }
        .ha-subheading {
          font-size: 13px;
          color: #94a3b8;
          margin: 0;
        }
        .ha-total-badge {
          background: #0f172a;
          color: #fff;
          border-radius: 7px;
          padding: 5px 13px;
          font-size: 13px;
          font-weight: 700;
        }
        .ha-summary {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .ha-stat-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px 16px;
          cursor: pointer;
          transition: border-color 0.15s, box-shadow 0.15s;
          min-width: 100px;
        }
        .ha-stat-chip:hover { border-color: #cbd5e1; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .ha-stat-chip.active { border-color: #0f172a; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .ha-stat-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .ha-stat-label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .ha-stat-count { font-size: 15px; font-weight: 800; color: #0f172a; margin-left: auto; padding-left: 8px; }
        .ha-toolbar { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
        .ha-search-wrap { position: relative; flex: 1; min-width: 220px; }
        .ha-search-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 14px; pointer-events: none; }
        .ha-search {
          width: 100%; padding: 10px 14px 10px 38px;
          border: 1.5px solid #e2e8f0; border-radius: 9px;
          font-size: 13.5px; color: #0f172a; background: #fff;
          outline: none; transition: border-color 0.15s, box-shadow 0.15s;
        }
        .ha-search::placeholder { color: #cbd5e1; }
        .ha-search:focus { border-color: #0f172a; box-shadow: 0 0 0 3px rgba(15,23,42,0.06); }
        .ha-filter-select {
          padding: 10px 14px; border: 1.5px solid #e2e8f0;
          border-radius: 9px; font-size: 13.5px; color: #0f172a;
          background: #fff; outline: none; min-width: 150px;
          cursor: pointer; transition: border-color 0.15s;
        }
        .ha-filter-select:focus { border-color: #0f172a; }
        .ha-table-card { background: #fff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; }
        .ha-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .ha-table thead tr { border-bottom: 1px solid #f1f5f9; }
        .ha-table thead th {
          padding: 13px 16px; font-size: 11px; font-weight: 700;
          color: #94a3b8; text-transform: uppercase; letter-spacing: 0.7px;
          background: #fafbfc; white-space: nowrap; text-align: left;
        }
        .ha-table thead th.center { text-align: center; }
        .ha-table tbody tr { border-bottom: 1px solid #f8fafc; transition: background 0.12s; }
        .ha-table tbody tr:last-child { border-bottom: none; }
        .ha-table tbody tr:hover { background: #fafbfc; }
        .ha-table td { padding: 14px 16px; color: #334155; vertical-align: middle; }
        .ha-table td.center { text-align: center; }
        .ha-num { font-size: 12px; color: #94a3b8; font-weight: 600; }
        .ha-candidate-name { font-weight: 700; color: #0f172a; font-size: 13.5px; }
        .ha-candidate-phone { font-size: 12px; color: #94a3b8; margin-top: 2px; }
        .ha-email { color: #64748b; font-size: 13px; }
        .ha-job-chip { display: inline-block; background: #f1f5f9; color: #334155; border-radius: 6px; padding: 4px 10px; font-size: 12px; font-weight: 600; }
        .ha-date { color: #94a3b8; font-size: 12.5px; white-space: nowrap; }
        .ha-status-select { border: none; border-radius: 7px; padding: 5px 10px; font-size: 12px; font-weight: 700; cursor: pointer; outline: none; appearance: auto; }
        .ha-preview-btn {
          display: inline-flex; align-items: center; gap: 5px;
          background: #f1f5f9; color: #334155; border: none;
          border-radius: 7px; padding: 6px 12px; font-size: 12px;
          font-weight: 600; cursor: pointer; transition: background 0.15s, color 0.15s;
        }
        .ha-preview-btn:hover { background: #e2e8f0; color: #0f172a; }
        .ha-delete-btn {
          display: inline-flex; align-items: center; gap: 5px;
          background: transparent; color: #ef4444;
          border: 1.5px solid #fecaca; border-radius: 7px;
          padding: 5px 12px; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: background 0.15s, border-color 0.15s;
        }
        .ha-delete-btn:hover { background: #fff1f2; border-color: #ef4444; }
        .ha-no-file { font-size: 12px; color: #cbd5e1; font-weight: 500; }

        /* ✅ AI Score Badge */
        .ha-ai-badge {
          display: inline-flex; align-items: center; gap: 5px;
          border-radius: 7px; padding: 4px 10px;
          font-size: 12px; font-weight: 700; white-space: nowrap;
          cursor: default;
        }
        .ha-ai-pending {
          background: #f1f5f9; color: #94a3b8;
          font-size: 11px; border-radius: 7px;
          padding: 4px 10px; font-weight: 600;
        }

        .ha-empty { text-align: center; padding: 56px 20px; }
        .ha-empty-icon { font-size: 36px; margin-bottom: 12px; }
        .ha-empty-text { font-size: 14px; font-weight: 600; color: #94a3b8; }
        .ha-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(2,6,23,0.7);
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 24px; animation: haFadeIn 0.18s ease;
        }
        @keyframes haFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .ha-modal {
          background: #fff; border-radius: 16px; overflow: hidden;
          width: 100%; max-width: 880px; max-height: 90vh;
          display: flex; flex-direction: column;
          box-shadow: 0 32px 80px rgba(0,0,0,0.35);
          animation: haSlideUp 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes haSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .ha-modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 22px; border-bottom: 1px solid #f1f5f9; background: #fafbfc;
        }
        .ha-modal-title { font-size: 15px; font-weight: 800; color: #0f172a; }
        .ha-modal-actions { display: flex; gap: 8px; }
        .ha-download-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: #f1f5f9; border: none; border-radius: 8px;
          padding: 7px 14px; font-size: 13px; font-weight: 600;
          color: #334155; text-decoration: none; cursor: pointer;
          transition: background 0.15s;
        }
        .ha-download-btn:hover { background: #e2e8f0; }
        .ha-close-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: #fff1f2; border: none; border-radius: 8px;
          padding: 7px 14px; font-size: 13px; font-weight: 600;
          color: #ef4444; cursor: pointer; transition: background 0.15s;
        }
        .ha-close-btn:hover { background: #fee2e2; }
        .ha-modal-body { flex: 1; overflow: auto; background: #f8fafc; }

        @media (max-width: 768px) {
          .ha-wrap { padding: 20px 14px 48px; }
          .ha-table thead { display: none; }
          .ha-table td { display: block; padding: 6px 14px; }
          .ha-table tr { display: block; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
        }
      `}</style>

      <div className="ha-wrap">

        {/* Preview Modal */}
        {previewUrl && (
          <div className="ha-overlay" onClick={() => setPreviewUrl(null)}>
            <div className="ha-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ha-modal-header">
                <span className="ha-modal-title">📄 Resume Preview</span>
                <div className="ha-modal-actions">
                  <a href={previewUrl} download className="ha-download-btn">⬇ Download</a>
                  <button onClick={() => setPreviewUrl(null)} className="ha-close-btn">✕ Close</button>
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
            <span className="ha-search-icon">🔍</span>
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
                    <td colSpan="9">
                      <div className="ha-empty">
                        <div className="ha-empty-icon">🗂️</div>
                        <div className="ha-empty-text">No applicants found</div>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((a, i) => (
                  <tr key={a._id}>
                    <td><span className="ha-num">{i + 1}</span></td>

                    <td>
                      <div className="ha-candidate-name">{a.name}</div>
                      {a.phone && <div className="ha-candidate-phone">{a.phone}</div>}
                    </td>

                    <td><span className="ha-email">{a.email}</span></td>

                    <td><span className="ha-job-chip">{a.jobTitle}</span></td>

                    <td>
                      <span className="ha-date">
                        {a.createdAt
                          ? new Date(a.createdAt).toLocaleDateString("en-GB", {
                              day: "2-digit", month: "short", year: "numeric",
                            })
                          : "—"}
                      </span>
                    </td>

                    {/* ✅ AI Score */}
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
                          {a.aiGrade === "A" ? "🟢" : a.aiGrade === "B" ? "🟡" : "🔴"}
                          {a.aiScore}/100 · {a.aiGrade}
                        </span>
                      ) : (
                        <span className="ha-ai-pending">⏳ Screening...</span>
                      )}
                    </td>

                    <td>
                      <select
                        className="ha-status-select"
                        value={a.status || "New"}
                        onChange={(e) => handleStatusChange(a._id, e.target.value)}
                        disabled={updatingId === a._id}
                        style={statusStyle(a.status || "New")}
                      >
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>

                    <td className="center">
                      {a.resumeUrl ? (
                        <button
                          className="ha-preview-btn"
                          onClick={() => setPreviewUrl(toPreviewUrl(a.resumeUrl))}
                        >
                          👁 Preview
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}