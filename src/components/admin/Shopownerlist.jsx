import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  FiRefreshCw, FiDownload, FiStar, FiTrash2, FiEye,
  FiX, FiPhone, FiMapPin, FiClock, FiBriefcase, FiTool, FiPackage,
  FiMoreVertical, FiArchive,
} from "react-icons/fi";

const API = import.meta.env.VITE_API_BASE_URL;

const JOB_STATUSES = ["Pending", "Open", "In Process", "Completed", "Archived"];

const STATUS_COLORS = {
  "Pending":    { bg: "#f5f5f5",  color: "#757575" },
  "Open":       { bg: "#e8f5e9",  color: "#2e7d32" },
  "In Process": { bg: "#fff3e0",  color: "#e65100" },
  "Completed":  { bg: "#e3f2fd",  color: "#1565c0" },
  "Archived":   { bg: "#fce4ec",  color: "#880e4f" },
};

// ─── Tag Pill ─────────────────────────────────────────────────────────────────
function Tag({ label, bg = "#ffeaea", color = "#d61f26" }) {
  return (
    <span style={{
      background: bg, color, fontSize: 11,
      padding: "3px 9px", borderRadius: 999,
      border: `1px solid ${color}22`, fontWeight: 500,
    }}>
      {label}
    </span>
  );
}

// ─── Detail Row ───────────────────────────────────────────────────────────────
function DetailRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      alignItems: "flex-start", padding: "7px 0",
      borderBottom: "1px solid #f3f3f3",
    }}>
      <span style={{ fontSize: 12, color: "#999", minWidth: 120 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#222", fontWeight: 500, textAlign: "right", maxWidth: "58%" }}>
        {value}
      </span>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHead({ icon: Icon, title }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      fontSize: 11, fontWeight: 700, letterSpacing: 1,
      color: "#aaa", textTransform: "uppercase",
      margin: "18px 0 8px",
    }}>
      {Icon && <Icon size={12} />}
      {title}
    </div>
  );
}

// ─── 3-dot Action Menu ───────────────────────────────────────────────────────
function ActionMenu({ onView, onHistory, onArchive, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const items = [
    { label: "View Details", icon: <FiEye size={14} />,     action: onView,    color: "#1565c0" },
    { label: "History",      icon: <FiClock size={14} />,   action: onHistory, color: "#555"    },
    { label: "Archive",      icon: <FiArchive size={14} />, action: onArchive, color: "#e65100" },
    { label: "Delete",       icon: <FiTrash2 size={14} />,  action: onDelete,  color: "#c62828" },
  ];

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: open ? "#f0f0f0" : "transparent",
          border: "1px solid #ddd",
          borderRadius: 6, padding: "4px 8px",
          cursor: "pointer", display: "flex", alignItems: "center",
        }}
      >
        <FiMoreVertical size={15} color="#555" />
      </button>

      {open && (
        <div style={{
          position: "absolute", right: 0, top: "110%",
          background: "#fff", borderRadius: 10,
          boxShadow: "0 4px 20px rgba(0,0,0,0.13)",
          border: "1px solid #eee",
          minWidth: 160, zIndex: 999,
          overflow: "hidden",
        }}>
          {items.map(({ label, icon, action, color }) => (
            <button
              key={label}
              onClick={() => { setOpen(false); action(); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "9px 14px", background: "none", border: "none",
                cursor: "pointer", fontSize: 13, color,
                textAlign: "left",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#f8f8f8"}
              onMouseLeave={(e) => e.currentTarget.style.background = "none"}
            >
              <span style={{ fontSize: 15 }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Shop Owner Drawer ────────────────────────────────────────────────────────
function ShopOwnerDrawer({ shop, onClose }) {
  if (!shop) return null;

  const status  = shop.jobStatus || shop.status || "Pending";
  const sColor  = STATUS_COLORS[status] || STATUS_COLORS["Pending"];
  const location = [shop.taluk, shop.district].filter(Boolean).join(", ");

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.35)",
          zIndex: 10000,
          animation: "fadeIn .2s ease",
        }}
      />

      {/* Drawer Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0,
        width: "100%", maxWidth: 420, height: "100%",
        background: "#fff", zIndex: 10001,
        display: "flex", flexDirection: "column",
        boxShadow: "-4px 0 32px rgba(0,0,0,0.15)",
        animation: "slideIn .25s ease",
      }}>

        {/* ── Gradient Header ── */}
        <div style={{
          background: "linear-gradient(135deg, #1565c0 0%, #1976d2 100%)",
          padding: "20px 20px 16px", color: "#fff", flexShrink: 0,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <span style={{
                  background: sColor.bg, color: sColor.color,
                  fontSize: 11, fontWeight: 600,
                  padding: "2px 10px", borderRadius: 999,
                }}>
                  {status}
                </span>
                {shop.featured && (
                  <span style={{
                    background: "#fbbf24", color: "#78350f",
                    fontSize: 11, fontWeight: 700,
                    padding: "2px 10px", borderRadius: 999,
                  }}>
                    ⭐ Featured
                  </span>
                )}
              </div>

              <h5 style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>
                {shop.shopName || "—"}
              </h5>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 2 }}>
                {shop.ownerName || ""}
              </div>

              {location && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                  <FiMapPin size={11} /> {location}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none", color: "#fff",
                borderRadius: "50%", width: 32, height: 32,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0, marginLeft: 8,
              }}
            >
              <FiX size={16} />
            </button>
          </div>

          {/* Quick stat chips */}
          <div style={{ display: "flex", gap: 14, marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.2)", flexWrap: "wrap" }}>
            {shop.mobile && (
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", gap: 4 }}>
                <FiPhone size={11} /> {shop.mobile}
              </div>
            )}
            {shop.experience && (
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", gap: 4 }}>
                <FiClock size={11} /> {shop.experience}
              </div>
            )}
            {shop.salaryRange && (
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", gap: 4 }}>
                <FiBriefcase size={11} /> {shop.salaryRange}
              </div>
            )}
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 20px 16px" }}>

          {/* Shop Info */}
          <SectionHead icon={FiMapPin} title="Shop Info" />
          <DetailRow label="Shop Name"   value={shop.shopName} />
          <DetailRow label="Owner Name"  value={shop.ownerName} />
          <DetailRow label="Mobile"      value={shop.mobile} />
          <DetailRow label="District"    value={shop.district} />
          <DetailRow label="Taluk"       value={shop.taluk} />

          {/* Job Info */}
          <SectionHead icon={FiBriefcase} title="Job Info" />
          <DetailRow label="Job Type"      value={shop.jobType} />
          <DetailRow label="Experience"    value={shop.experience} />
          <DetailRow label="Salary Range"  value={shop.salaryRange} />
          <DetailRow label="Job Status"    value={shop.jobStatus || shop.status} />
          <DetailRow
            label="Posted At"
            value={shop.postedAt ? new Date(shop.postedAt).toLocaleDateString("en-IN") : null}
          />

          {/* Technician Types */}
          {(shop.technicianTypes || []).length > 0 && (
            <>
              <SectionHead icon={FiTool} title="Technician Types Required" />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {shop.technicianTypes.map((t, i) => <Tag key={i} label={t} />)}
              </div>
            </>
          )}

          {/* Other */}
          <SectionHead icon={FiClock} title="Other Details" />
          <DetailRow
            label="Registered"
            value={shop.createdAt ? new Date(shop.createdAt).toLocaleDateString("en-IN") : null}
          />
          {shop.description && (
            <>
              <SectionHead icon={null} title="Description" />
              <div style={{
                background: "#fafafa", borderRadius: 8,
                padding: "10px 12px", fontSize: 13, color: "#444",
                lineHeight: 1.6, border: "1px solid #eee",
              }}>
                {shop.description}
              </div>
            </>
          )}
        </div>

        {/* ── Footer Call Button ── */}
        {shop.mobile && (
          <div style={{ flexShrink: 0, padding: "12px 20px", borderTop: "1px solid #f0f0f0", background: "#fff" }}>
            <a
              href={`tel:${shop.mobile}`}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 8, background: "linear-gradient(135deg, #1565c0, #1976d2)",
                color: "#fff", borderRadius: 10, padding: "11px 0",
                fontSize: 14, fontWeight: 600, textDecoration: "none",
                width: "100%",
              }}
            >
              <FiPhone size={15} />
              Call {shop.ownerName?.split(" ")[0]}
            </a>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeIn  { from { opacity: 0; }                 to { opacity: 1; } }
      `}</style>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ShopOwnerList() {
  const [data,     setData]     = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [filters,  setFilters]  = useState({ status: "", district: "", search: "" });
  const [selected, setSelected] = useState(null);
  const [history,  setHistory]  = useState([]);

  // Drawer state
  const [drawerShop, setDrawerShop] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, page, limit: 20 };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const { data: res } = await axios.get(`${API}/api/shop-owner`, { params });
      const list = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
      setData(list);
      setTotal(res.total || list.length || 0);
      setPages(res.pages || 1);
    } catch { setData([]); }
    setLoading(false);
  }, [filters, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (id, status, note = "") => {
    try {
      await axios.put(`${API}/api/shop-owner/status/${id}`, { status, note });
      fetchData();
    } catch { alert("Failed to update status"); }
  };

  const toggleFeatured = async (id) => {
    await axios.patch(`${API}/api/shop-owner/featured/${id}`);
    fetchData();
  };

  const archiveRecord = async (id) => {
    if (!window.confirm("Archive this record? It will be hidden from public.")) return;
    await updateStatus(id, "Archived", "Archived by admin");
  };

  const deleteRecord = async (id) => {
    if (!window.confirm("⚠️ PERMANENTLY delete this record? This cannot be undone.")) return;
    await axios.delete(`${API}/api/shop-owner/${id}`);
    fetchData();
  };

  const viewHistory = async (record) => {
    setSelected(record);
    const { data: h } = await axios.get(`${API}/api/shop-owner/history/${record._id}`);
    setHistory(h);
  };

const exportExcel = async () => {
  try {
    const params = { ...filters, page: 1, limit: 10000 };
    Object.keys(params).forEach((k) => !params[k] && delete params[k]);
    
    const { data: res } = await axios.get(`${API}/api/shop-owner`, { params });
    const allData = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
    
    import("xlsx").then(XLSX => {
      const rows = allData.map((d, index) => ({
        "SL.No": index + 1,  // ← ADD THIS
        "Shop Name": d.shopName || "",
        "Owner": d.ownerName || "",
        "Mobile": d.mobile || "",
        "District": d.district || "",
        "Taluk": d.taluk || "",
        "Experience": d.experience || "",
        "Salary Range": d.salaryRange || "",
        "Job Type": d.jobType || "",
        "Technician Types": (d.technicianTypes || []).join(", "),
        "Status": d.jobStatus || d.status || "",
        "Posted At": d.postedAt ? new Date(d.postedAt).toLocaleDateString("en-IN") : "",
        "Registered At": new Date(d.createdAt).toLocaleDateString("en-IN"),
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      
      ws["!cols"] = [
        { wch: 8 },   // SL.No  ← ADD THIS
        { wch: 22 },  // Shop Name
        { wch: 18 },  // Owner
        { wch: 14 },  // Mobile
        { wch: 14 },  // District
        { wch: 14 },  // Taluk
        { wch: 14 },  // Experience
        { wch: 14 },  // Salary Range
        { wch: 12 },  // Job Type
        { wch: 20 },  // Technician Types
        { wch: 12 },  // Status
        { wch: 12 },  // Posted At
        { wch: 14 },  // Registered At
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Shop Owners");
      
      const fileName = `shop_owners_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    });
  } catch (err) {
    console.error("Export failed:", err);
    alert("Failed to export. Please try again.");
  }
};

  return (
    <div>
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
  <FiDownload size={14} className="me-1" /> Export Excel
</button>
        </div>
      </div>

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

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-danger" />
        </div>
      ) : (
        <div className="table-responsive rounded-4" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}>
          <table className="table table-hover mb-0 align-middle" style={{ fontSize: 13 }}>
            <thead style={{ background: "#f8f9fa" }}>
              <tr>
                <th className="ps-3">#</th>
                <th>Shop Name</th>
                <th>Owner / Mobile</th>
                <th>District</th>
                <th>Exp / Salary</th>
                <th>Type</th>
                <th>Registered</th>
                <th>Job Status</th>
                {/* <th>Featured</th> */}
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-4 text-muted">
                    No records found
                  </td>
                </tr>
              ) : (Array.isArray(data) ? data : []).map((row, idx) => {
                const curStatus = row.jobStatus || row.status || "Pending";
                const s = STATUS_COLORS[curStatus] || {};
                return (
                  <tr key={row._id}>
                    <td className="ps-3 text-muted" style={{ minWidth: 40 }}>{(page - 1) * 20 + idx + 1}</td>
                    <td className="fw-semibold">{row.shopName}</td>
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
                    {/* <td className="text-center">
                      <button
                        className="btn btn-sm p-1"
                        onClick={() => toggleFeatured(row._id)}
                        style={{ fontSize: 18 }}
                      >
                        <FiStar style={{
                          fill: row.featured ? "#f59e0b" : "none",
                          color: row.featured ? "#f59e0b" : "#ccc",
                        }} />
                      </button>
                    </td> */}
                    <td className="text-center">
                      <ActionMenu
                        onView={() => setDrawerShop(row)}
                        onHistory={() => viewHistory(row)}
                        onArchive={() => archiveRecord(row._id)}
                        onDelete={() => deleteRecord(row._id)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="d-flex justify-content-center gap-2 mt-3">
          <button className="btn btn-sm btn-outline-secondary" disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}>← Prev</button>
          {Array.from({ length: pages }, (_, i) => i + 1)
            .filter((p) => Math.abs(p - page) < 3)
            .map((p) => (
              <button key={p}
                className={`btn btn-sm rounded-3 ${p === page ? "btn-danger" : "btn-outline-secondary"}`}
                onClick={() => setPage(p)}>{p}</button>
            ))}
          <button className="btn btn-sm btn-outline-secondary" disabled={page === pages}
            onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      )}

      {/* ── History Modal (unchanged) ── */}
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
                  <div key={i} className="rounded-3 p-2 px-3"
                    style={{ background: "#f8f9fa", fontSize: 13 }}>
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

      {/* ── Shop Owner Full Details Drawer ── */}
      <ShopOwnerDrawer
        shop={drawerShop}
        onClose={() => setDrawerShop(null)}
      />
    </div>
  );
}