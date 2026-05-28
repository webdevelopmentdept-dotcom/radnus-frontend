import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FiRefreshCw, FiDownload, FiStar, FiTrash2, FiEye } from "react-icons/fi";

const JOB_STATUSES = ["Pending", "Open", "In Process", "Completed", "Archived"];

const STATUS_COLORS = {
  "Pending":    { bg: "#f5f5f5",  color: "#757575" },
  "Open":       { bg: "#e8f5e9",  color: "#2e7d32" },
  "In Process": { bg: "#fff3e0",  color: "#e65100" },
  "Completed":  { bg: "#e3f2fd",  color: "#1565c0" },
  "Archived":   { bg: "#fce4ec",  color: "#880e4f" },
};

export default function ShopOwnerList() {
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", district: "", search: "" });
  const [selected, setSelected] = useState(null); // for detail modal
  const [history,  setHistory]  = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, page, limit: 20 };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const { data: res } = await axios.get("/api/shop-owner", { params });
      setData(res.data || res);
      setTotal(res.total || res.length || 0);
      setPages(res.pages || 1);
    } catch { setData([]); }
    setLoading(false);
  }, [filters, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Status update ── */
  const updateStatus = async (id, status, note = "") => {
    try {
      await axios.put(`/api/shop-owner/status/${id}`, { status, note });
      fetchData();
    } catch { alert("Failed to update status"); }
  };

  /* ── Toggle featured ── */
  const toggleFeatured = async (id) => {
    await axios.patch(`/api/shop-owner/featured/${id}`);
    fetchData();
  };

  /* ── Soft delete (archive) ── */
  const archiveRecord = async (id) => {
    if (!window.confirm("Archive this record? It will be hidden from public.")) return;
    await updateStatus(id, "Archived", "Archived by admin");
  };

  /* ── Permanent delete ── */
  const deleteRecord = async (id) => {
    if (!window.confirm("⚠️ PERMANENTLY delete this record? This cannot be undone.")) return;
    await axios.delete(`/api/shop-owner/${id}`);
    fetchData();
  };

  /* ── View history ── */
  const viewHistory = async (record) => {
    setSelected(record);
    const { data: h } = await axios.get(`/api/shop-owner/history/${record._id}`);
    setHistory(h);
  };

  /* ── Excel export ── */
  const exportExcel = () => {
    const rows = data.map((d) => [
      d.shopName, d.ownerName, d.mobile, d.district, d.taluk,
      d.experience, d.salaryRange, d.jobType,
      (d.technicianTypes || []).join(", "),
      d.jobStatus || d.status,
      d.postedAt ? new Date(d.postedAt).toLocaleDateString("en-IN") : "",
      new Date(d.createdAt).toLocaleDateString("en-IN"),
    ]);
    const header = [
      "Shop Name","Owner","Mobile","District","Taluk",
      "Experience","Salary","Job Type","Technician Types",
      "Status","Posted At","Registered At",
    ];
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${c || ""}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `shop_owners_${Date.now()}.csv`;
    a.click();
  };

  /* ── Counts per status ── */
  const counts = JOB_STATUSES.reduce((acc, s) => {
    acc[s] = data.filter((d) => (d.jobStatus || d.status) === s).length;
    return acc;
  }, {});

  return (
    <div>
      {/* ── Header ── */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h5 className="fw-bold mb-0">Shop Owner Requirements</h5>
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

      {/* ── Status filter tabs ── */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <button
          className={`btn btn-sm rounded-pill ${!filters.status ? "btn-dark" : "btn-outline-secondary"}`}
          onClick={() => { setFilters((f) => ({ ...f, status: "" })); setPage(1); }}
        >
          All ({total})
        </button>
        {JOB_STATUSES.map((s) => {
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

      {/* ── Search & District filter ── */}
      <div className="row g-2 mb-3">
        <div className="col-md-5">
          <input
            className="form-control form-control-sm rounded-3"
            placeholder="Search shop, owner, mobile..."
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
                <th className="ps-3">Shop Name</th>
                <th>Owner / Mobile</th>
                <th>District</th>
                <th>Exp / Salary</th>
                <th>Type</th>
                <th>Registered</th>
                <th>Job Status</th>
                <th>Featured</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-4 text-muted">
                    No records found
                  </td>
                </tr>
              ) : data.map((row) => {
                const curStatus = row.jobStatus || row.status || "Pending";
                const s = STATUS_COLORS[curStatus] || {};
                return (
                  <tr key={row._id}>
                    <td className="ps-3 fw-semibold">{row.shopName}</td>
                    <td>
                      <div>{row.ownerName}</div>
                      <small className="text-muted">{row.mobile}</small>
                    </td>
                    <td>
                      <div>{row.district}</div>
                      <small className="text-muted">{row.taluk}</small>
                    </td>
                    <td>
                      <div>{row.experience}</div>
                      <small className="text-muted">{row.salaryRange || "—"}</small>
                    </td>
                    <td>
                      <div>{row.jobType}</div>
                      <small className="text-muted">
                        {(row.technicianTypes || []).slice(0, 2).join(", ")}
                      </small>
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
                          minWidth: 130,
                        }}
                      >
                        {JOB_STATUSES.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </td>

                    {/* Featured toggle */}
                    <td className="text-center">
                      <button
                        className="btn btn-sm p-1"
                        onClick={() => toggleFeatured(row._id)}
                        title={row.featured ? "Remove featured" : "Mark as featured"}
                        style={{ fontSize: 18 }}
                      >
                        <FiStar
                          style={{
                            fill: row.featured ? "#f59e0b" : "none",
                            color: row.featured ? "#f59e0b" : "#ccc",
                          }}
                        />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="text-center">
                      <div className="d-flex gap-1 justify-content-center">
                        <button
                          className="btn btn-sm btn-outline-secondary rounded-2 p-1"
                          title="View History"
                          onClick={() => viewHistory(row)}
                        >
                          <FiEye size={13} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-warning rounded-2 p-1"
                          title="Archive"
                          onClick={() => archiveRecord(row._id)}
                        >
                          📦
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger rounded-2 p-1"
                          title="Delete permanently"
                          onClick={() => deleteRecord(row._id)}
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
            style={{ minWidth: 360, maxWidth: 520, maxHeight: "80vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">Status History — {selected.shopName}</h6>
              <button className="btn-close" onClick={() => setSelected(null)} />
            </div>
            {history.length === 0 ? (
              <p className="text-muted text-center">No history yet</p>
            ) : (
              <div className="d-flex flex-column gap-2">
                {history.map((h, i) => (
                  <div
                    key={i}
                    className="rounded-3 p-2 px-3"
                    style={{ background: "#f8f9fa", fontSize: 13 }}
                  >
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