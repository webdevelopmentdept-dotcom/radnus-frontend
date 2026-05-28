import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FiRefreshCw, FiDownload, FiStar, FiTrash2, FiEye } from "react-icons/fi";

const AVAIL_STATUSES = ["New", "Available", "Interview", "Hired", "Archived"];

const STATUS_COLORS = {
  "New":       { bg: "#f5f5f5",  color: "#757575" },
  "Available": { bg: "#e8f5e9",  color: "#2e7d32" },
  "Interview": { bg: "#fff3e0",  color: "#e65100" },
  "Hired":     { bg: "#e3f2fd",  color: "#1565c0" },
  "Archived":  { bg: "#fce4ec",  color: "#880e4f" },
};

export default function TechnicianList() {
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", district: "", search: "" });
  const [selected, setSelected] = useState(null);
  const [history,  setHistory]  = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, page, limit: 20 };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const { data: res } = await axios.get("/api/technician", { params });
      setData(res.data || res);
      setTotal(res.total || res.length || 0);
      setPages(res.pages || 1);
    } catch { setData([]); }
    setLoading(false);
  }, [filters, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (id, status) => {
    await axios.put(`/api/technician/status/${id}`, { status });
    fetchData();
  };

  const toggleFeatured = async (id) => {
    await axios.patch(`/api/technician/featured/${id}`);
    fetchData();
  };

  const deleteRecord = async (id) => {
    if (!window.confirm("⚠️ Permanently delete this technician?")) return;
    await axios.delete(`/api/technician/${id}`);
    fetchData();
  };

  const viewHistory = async (record) => {
    setSelected(record);
    const { data: h } = await axios.get(`/api/technician/history/${record._id}`);
    setHistory(h);
  };

  const exportExcel = () => {
    const rows = data.map((d) => [
      d.fullName, d.mobile, d.district, d.taluk,
      d.experience, d.expectedSalary || "",
      (d.skills || []).join(", "),
      (d.brands || []).join(", "),
      d.jobType || "",
      d.availabilityStatus || d.status,
      new Date(d.createdAt).toLocaleDateString("en-IN"),
    ]);
    const header = [
      "Full Name","Mobile","District","Taluk",
      "Experience","Expected Salary","Skills","Brands",
      "Job Type","Status","Registered At",
    ];
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${c || ""}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `technicians_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div>
      {/* ── Header ── */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h5 className="fw-bold mb-0">Technician Registrations</h5>
          <small className="text-muted">{total} total records</small>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-secondary rounded-3" onClick={fetchData}>
            <FiRefreshCw size={14} className="me-1" /> Refresh
          </button>
          <button className="btn btn-sm btn-outline-success rounded-3" onClick={exportExcel}>
            <FiDownload size={14} className="me-1" /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Status tabs ── */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <button
          className={`btn btn-sm rounded-pill ${!filters.status ? "btn-dark" : "btn-outline-secondary"}`}
          onClick={() => { setFilters((f) => ({ ...f, status: "" })); setPage(1); }}
        >
          All ({total})
        </button>
        {AVAIL_STATUSES.map((s) => {
          const style = STATUS_COLORS[s] || {};
          const active = filters.status === s;
          return (
            <button
              key={s}
              className="btn btn-sm rounded-pill"
              style={active
                ? { background: style.color, color: "#fff", border: "none" }
                : { background: style.bg, color: style.color, border: `1px solid ${style.color}` }
              }
              onClick={() => { setFilters((f) => ({ ...f, status: s })); setPage(1); }}
            >
              {s}
            </button>
          );
        })}
      </div>

      {/* ── Search ── */}
      <div className="row g-2 mb-3">
        <div className="col-md-5">
          <input
            className="form-control form-control-sm rounded-3"
            placeholder="Search name, mobile, district..."
            value={filters.search}
            onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1); }}
          />
        </div>
        <div className="col-md-3">
          <input
            className="form-control form-control-sm rounded-3"
            placeholder="Filter by district..."
            value={filters.district}
            onChange={(e) => { setFilters((f) => ({ ...f, district: e.target.value })); setPage(1); }}
          />
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-danger" />
        </div>
      ) : (
        <div className="table-responsive rounded-4" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}>
          <table className="table table-hover mb-0 align-middle" style={{ fontSize: 13 }}>
            <thead style={{ background: "#f8f9fa" }}>
              <tr>
                <th className="ps-3">Name</th>
                <th>Mobile / District</th>
                <th>Experience</th>
                <th>Skills</th>
                <th>Salary</th>
                <th>Registered</th>
                <th>Status</th>
                <th>Featured</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-4 text-muted">No records found</td>
                </tr>
              ) : data.map((row) => {
                const curStatus = row.availabilityStatus || row.status || "New";
                const s = STATUS_COLORS[curStatus] || {};
                return (
                  <tr key={row._id}>
                    <td className="ps-3 fw-semibold">{row.fullName || "—"}</td>
                    <td>
                      <div>{row.mobile}</div>
                      <small className="text-muted">{row.district}{row.taluk ? `, ${row.taluk}` : ""}</small>
                    </td>
                    <td>{row.experience || "—"}</td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {(row.skills || []).slice(0, 3).map((sk, i) => (
                          <span key={i}
                            style={{
                              background: "#ffeaea", color: "#d61f26",
                              fontSize: 10, padding: "2px 7px", borderRadius: 999,
                            }}>
                            {sk}
                          </span>
                        ))}
                        {(row.skills || []).length > 3 && (
                          <span style={{ fontSize: 10, color: "#999" }}>
                            +{row.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {row.expectedSalary
                        ? `₹${Number(row.expectedSalary).toLocaleString("en-IN")}`
                        : "—"}
                    </td>
                    <td className="text-muted">
                      {new Date(row.createdAt).toLocaleDateString("en-IN")}
                    </td>

                    {/* Status dropdown */}
                    <td>
                      <select
                        className="form-select form-select-sm rounded-3"
                        value={curStatus}
                        onChange={(e) => updateStatus(row._id, e.target.value)}
                        style={{
                          background: s.bg,
                          color: s.color,
                          border: `1px solid ${s.color}`,
                          fontWeight: 600,
                          fontSize: 12,
                          minWidth: 120,
                        }}
                      >
                        {AVAIL_STATUSES.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </td>

                    {/* Featured */}
                    <td className="text-center">
                      <button
                        className="btn btn-sm p-1"
                        onClick={() => toggleFeatured(row._id)}
                        style={{ fontSize: 18 }}
                        title={row.featured ? "Remove featured" : "Mark featured"}
                      >
                        <FiStar style={{ fill: row.featured ? "#f59e0b" : "none", color: row.featured ? "#f59e0b" : "#ccc" }} />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="text-center">
                      <div className="d-flex gap-1 justify-content-center">
                        <button
                          className="btn btn-sm btn-outline-secondary rounded-2 p-1"
                          onClick={() => viewHistory(row)}
                          title="View History"
                        >
                          <FiEye size={13} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-warning rounded-2 p-1"
                          onClick={() => updateStatus(row._id, "Archived")}
                          title="Archive"
                        >
                          📦
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger rounded-2 p-1"
                          onClick={() => deleteRecord(row._id)}
                          title="Delete permanently"
                        >
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="d-flex justify-content-center gap-2 mt-3">
          <button className="btn btn-sm btn-outline-secondary" disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}>← Prev</button>
          {Array.from({ length: pages }, (_, i) => i + 1).filter((p) => Math.abs(p - page) < 3).map((p) => (
            <button key={p}
              className={`btn btn-sm rounded-3 ${p === page ? "btn-danger" : "btn-outline-secondary"}`}
              onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="btn btn-sm btn-outline-secondary" disabled={page === pages}
            onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      )}

      {/* ── History Modal ── */}
      {selected && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: "rgba(0,0,0,0.5)", zIndex: 9999 }}
          onClick={() => setSelected(null)}
        >
          <div
            className="rounded-4 bg-white p-4"
            style={{ minWidth: 360, maxWidth: 500, maxHeight: "80vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">Status History — {selected.fullName}</h6>
              <button className="btn-close" onClick={() => setSelected(null)} />
            </div>
            {history.length === 0 ? (
              <p className="text-muted text-center">No history yet</p>
            ) : (
              <div className="d-flex flex-column gap-2">
                {history.map((h, i) => (
                  <div key={i} className="rounded-3 p-2 px-3" style={{ background: "#f8f9fa", fontSize: 13 }}>
                    <div className="d-flex justify-content-between">
                      <span>
                        <span className="text-muted">{h.fromStatus || "—"}</span>
                        {" → "}
                        <span className="fw-semibold text-danger">{h.toStatus}</span>
                      </span>
                      <small className="text-muted">
                        {new Date(h.changedAt).toLocaleDateString("en-IN")}
                      </small>
                    </div>
                    {h.note && <small className="text-muted">{h.note}</small>}
                    <small className="text-muted d-block">by {h.changedBy}</small>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}