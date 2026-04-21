import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}}>
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

export default function HrActiveEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [toast, setToast]         = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting]   = useState(false);

  useEffect(() => { fetchActive(); }, []);

  const fetchActive = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/hr/employees`)
      .then(res => res.json())
      .then(data => {
        const active = Array.isArray(data) ? data.filter(emp => emp.status === "active") : [];
        setEmployees(active);
      })
      .catch(err => console.log(err))
      .finally(() => setLoading(false));
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/api/employee/employees/${confirmId}`, { method: "DELETE" });
      if (res.ok) {
        setEmployees(prev => prev.filter(emp => emp._id !== confirmId));
        showToast("Employee removed successfully");
      } else {
        showToast("Failed to delete", "error");
      }
    } catch (err) {
      console.log(err);
      showToast("Something went wrong", "error");
    } finally {
      setDeleting(false);
      setConfirmId(null);
    }
  };

  const departments = ["All", ...Array.from(new Set(employees.map(e => e.department).filter(Boolean)))];

  const filtered = employees.filter(emp => {
    const matchSearch = !search ||
      emp.name?.toLowerCase().includes(search.toLowerCase()) ||
      emp.email?.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeId?.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "All" || emp.department === deptFilter;
    return matchSearch && matchDept;
  });

  return (
    <div style={{ fontFamily:"'Segoe UI', sans-serif", padding:"20px 16px", background:"#f4f6fb", minHeight:"100vh", boxSizing:"border-box" }}>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 640px) {
          .page-padding { padding: 28px 32px !important; }
          .header-row { flex-wrap: nowrap !important; }
          .search-row { flex-wrap: nowrap !important; }
          .emp-table { display: table !important; }
          .emp-cards { display: none !important; }
          .stats-row { flex-wrap: nowrap !important; }
        }
        @media (max-width: 639px) {
          .emp-table { display: none !important; }
          .emp-cards { display: flex !important; flex-direction: column; gap: 10px; }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position:"fixed", top:16, right:16, left:16, zIndex:9999,
          background: toast.type === "error" ? "#dc2626" : "#16a34a",
          color:"#fff", padding:"12px 16px", borderRadius:10,
          fontWeight:600, fontSize:13, textAlign:"center",
          boxShadow:"0 4px 16px rgba(0,0,0,0.15)"
        }}>{toast.msg}</div>
      )}

      {/* Confirm Modal */}
      {confirmId && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 16px" }}>
          <div style={{ background:"#fff", borderRadius:14, padding:"24px 20px", maxWidth:360, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}><AlertIcon /></div>
            <h4 style={{ textAlign:"center", fontWeight:800, color:"#1a1a2e", margin:"0 0 8px", fontSize:16 }}>Remove Employee?</h4>
            <p style={{ textAlign:"center", color:"#6b7280", fontSize:13, margin:"0 0 20px" }}>
              This will permanently delete the employee record.
            </p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setConfirmId(null)} style={{ flex:1, padding:"10px 0", border:"1px solid #e5e7eb", borderRadius:8, background:"#fff", color:"#374151", fontWeight:600, fontSize:13, cursor:"pointer" }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex:1, padding:"10px 0", border:"none", borderRadius:8, background: deleting ? "#fca5a5" : "#dc2626", color:"#fff", fontWeight:700, fontSize:13, cursor: deleting ? "not-allowed" : "pointer" }}>
                {deleting ? "Removing..." : "Yes, Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="header-row" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:"#1a1a2e" }}>Active Employees</h2>
          <p style={{ margin:"4px 0 0", color:"#6b7280", fontSize:13 }}>
            {loading ? "Loading..." : `${filtered.length} of ${employees.length} active employee${employees.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {!loading && (
          <div className="stats-row" style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {[
              { label:"Total Active", value: employees.length, color:"#16a34a", bg:"#f0fdf4" },
              { label:"Departments",  value: departments.length - 1, color:"#2563eb", bg:"#eff6ff" },
            ].map((s, i) => (
              <div key={i} style={{ background:s.bg, borderRadius:10, padding:"8px 14px", textAlign:"center", minWidth:80 }}>
                <p style={{ margin:0, fontSize:18, fontWeight:800, color:s.color }}>{s.value}</p>
                <p style={{ margin:0, fontSize:11, color:s.color, fontWeight:600 }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search + Filter */}
      <div className="search-row" style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:200, position:"relative" }}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Search by name, email or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width:"100%", padding:"10px 12px 10px 32px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, outline:"none", background:"#fff", boxSizing:"border-box" }}
          />
        </div>
        <select
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          style={{ padding:"10px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, outline:"none", background:"#fff", cursor:"pointer", minWidth:130 }}
        >
          {departments.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", textAlign:"center", padding:"48px 0" }}>
          <div style={{ width:34, height:34, border:"4px solid #e5e7eb", borderTopColor:"#2563eb", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }}/>
          <p style={{ color:"#6b7280", fontSize:13 }}>Loading employees...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", textAlign:"center", padding:"48px 0" }}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}><UsersIcon /></div>
          <p style={{ color:"#6b7280", fontSize:14 }}>
            {search || deptFilter !== "All" ? "No employees match your filter" : "No active employees yet"}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="emp-table" style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", overflow:"hidden", width:"100%" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ background:"#f8fafc" }}>
                  {["#", "Emp ID", "Name", "Email", "Department", "Action"].map(h => (
                    <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontWeight:700, color:"#374151", borderBottom:"2px solid #e5e7eb", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp, i) => (
                  <tr key={emp._id} style={{ borderBottom:"1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding:"12px 16px", color:"#9ca3af", fontSize:12, fontWeight:700 }}>
                      {String(i + 1).padStart(2, "0")}
                    </td>
                    <td style={{ padding:"12px 16px" }}>
                      <span style={{ background:"#eff6ff", color:"#2563eb", padding:"3px 8px", borderRadius:6, fontSize:11, fontWeight:700, fontFamily:"monospace" }}>
                        {emp.employeeId || "—"}
                      </span>
                    </td>
                    <td style={{ padding:"12px 16px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:34, height:34, borderRadius:"50%", background:"#f0fdf4", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:"#16a34a", fontSize:13, flexShrink:0 }}>
                          {emp.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <p style={{ margin:0, fontWeight:600, color:"#1a1a2e", fontSize:13 }}>{emp.name}</p>
                      </div>
                    </td>
                    <td style={{ padding:"12px 16px", color:"#6b7280", fontSize:12 }}>{emp.email}</td>
                    <td style={{ padding:"12px 16px" }}>
                      {emp.department ? (
                        <span style={{ background:"#f3f4f6", color:"#374151", padding:"4px 8px", borderRadius:6, fontSize:11, fontWeight:600 }}>
                          {emp.department}
                        </span>
                      ) : "—"}
                    </td>
                    <td style={{ padding:"12px 16px" }}>
                      <button
                        onClick={() => setConfirmId(emp._id)}
                        style={{ display:"flex", alignItems:"center", gap:6, background:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca", borderRadius:7, padding:"7px 12px", fontSize:12, fontWeight:600, cursor:"pointer" }}
                      >
                        <TrashIcon /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="emp-cards">
            {filtered.map((emp, i) => (
              <div key={emp._id} style={{ background:"#fff", borderRadius:12, border:"1px solid #e5e7eb", padding:"14px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:38, height:38, borderRadius:"50%", background:"#f0fdf4", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:"#16a34a", fontSize:15, flexShrink:0 }}>
                      {emp.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p style={{ margin:0, fontWeight:700, color:"#1a1a2e", fontSize:14 }}>{emp.name}</p>
                      <p style={{ margin:0, fontSize:11, color:"#9ca3af" }}>{emp.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setConfirmId(emp._id)}
                    style={{ display:"flex", alignItems:"center", justifyContent:"center", background:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca", borderRadius:7, padding:"8px", cursor:"pointer" }}
                    title="Remove"
                  >
                    <TrashIcon />
                  </button>
                </div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <span style={{ background:"#eff6ff", color:"#2563eb", padding:"3px 8px", borderRadius:6, fontSize:11, fontWeight:700, fontFamily:"monospace" }}>
                    {emp.employeeId || "—"}
                  </span>
                  {emp.department && (
                    <span style={{ background:"#f3f4f6", color:"#374151", padding:"3px 8px", borderRadius:6, fontSize:11, fontWeight:600 }}>
                      {emp.department}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}