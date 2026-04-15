import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function HrActiveEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [toast, setToast]         = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting]   = useState(false);

  useEffect(() => {
    fetchActive();
  }, []);

  const fetchActive = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/hr/employees`)
      .then(res => res.json())
      .then(data => {
        // ✅ Only active employees
        const active = Array.isArray(data)
          ? data.filter(emp => emp.status === "active")
          : [];
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
      const res = await fetch(`${API_BASE}/api/employee/employees/${confirmId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setEmployees(prev => prev.filter(emp => emp._id !== confirmId));
        showToast("Employee removed successfully ✅");
      } else {
        showToast("Failed to delete ❌", "error");
      }
    } catch (err) {
      console.log(err);
      showToast("Something went wrong ❌", "error");
    } finally {
      setDeleting(false);
      setConfirmId(null);
    }
  };

  // ── Unique departments for filter ──
  const departments = ["All", ...Array.from(new Set(employees.map(e => e.department).filter(Boolean)))];

  // ── Search + Dept filter ──
  const filtered = employees.filter(emp => {
    const matchSearch = !search ||
      emp.name?.toLowerCase().includes(search.toLowerCase()) ||
      emp.email?.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeId?.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "All" || emp.department === deptFilter;
    return matchSearch && matchDept;
  });

  return (
    <div style={{ fontFamily:"'Segoe UI', sans-serif", padding:"28px 32px", background:"#f4f6fb", minHeight:"100vh" }}>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position:"fixed", top:20, right:24, zIndex:9999,
          background: toast.type === "error" ? "#ff4d4f" : "#52c41a",
          color:"#fff", padding:"12px 20px", borderRadius:8,
          boxShadow:"0 4px 16px rgba(0,0,0,0.15)", fontWeight:500, fontSize:14
        }}>{toast.msg}</div>
      )}

      {/* ── Confirm Modal ── */}
      {confirmId && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:"#fff", borderRadius:14, padding:"28px 32px", maxWidth:380, width:"90%", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize:36, textAlign:"center", marginBottom:12 }}>🗑️</div>
            <h4 style={{ textAlign:"center", fontWeight:800, color:"#1a1a2e", margin:"0 0 8px" }}>Remove Employee?</h4>
            <p style={{ textAlign:"center", color:"#6b7280", fontSize:14, margin:"0 0 24px" }}>
              This will permanently delete the employee record.
            </p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setConfirmId(null)} style={{ flex:1, padding:"10px 0", border:"1px solid #e5e7eb", borderRadius:8, background:"#fff", color:"#374151", fontWeight:600, fontSize:14, cursor:"pointer" }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex:1, padding:"10px 0", border:"none", borderRadius:8, background: deleting ? "#fca5a5" : "#dc2626", color:"#fff", fontWeight:700, fontSize:14, cursor: deleting ? "not-allowed" : "pointer" }}>
                {deleting ? "Removing..." : "Yes, Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:"#1a1a2e" }}>Active Employees</h2>
          <p style={{ margin:"4px 0 0", color:"#6b7280", fontSize:14 }}>
            {loading ? "Loading..." : `${filtered.length} of ${employees.length} active employee${employees.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {/* Stats pill */}
        {!loading && (
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {[
              { label:"Total Active", value: employees.length, color:"#16a34a", bg:"#f0fdf4" },
              { label:"Departments",  value: departments.length - 1, color:"#2563eb", bg:"#eff6ff" },
            ].map((s,i) => (
              <div key={i} style={{ background:s.bg, borderRadius:10, padding:"8px 16px", textAlign:"center" }}>
                <p style={{ margin:0, fontSize:18, fontWeight:800, color:s.color }}>{s.value}</p>
                <p style={{ margin:0, fontSize:11, color:s.color, fontWeight:600 }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Search + Filter ── */}
      <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
        <input
          type="text"
          placeholder="🔍  Search by name, email or employee ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex:1, minWidth:220, padding:"10px 14px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, outline:"none", background:"#fff" }}
        />
        <select
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          style={{ padding:"10px 14px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, outline:"none", background:"#fff", cursor:"pointer" }}
        >
          {departments.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* ── Table ── */}
      <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", overflow:"hidden" }}>
        {loading ? (
          <div style={{ textAlign:"center", padding:"56px 0" }}>
            <div style={{ width:36, height:36, border:"4px solid #e5e7eb", borderTopColor:"#2563eb", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }}/>
            <p style={{ color:"#6b7280", fontSize:14 }}>Loading employees...</p>
            <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"56px 0" }}>
            <div style={{ fontSize:40, marginBottom:10 }}>👥</div>
            <p style={{ color:"#6b7280" }}>
              {search || deptFilter !== "All" ? "No employees match your filter" : "No active employees yet"}
            </p>
          </div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14 }}>
            <thead>
              <tr style={{ background:"#f8fafc" }}>
                {["#", "Emp ID", "Name", "Email", "Department", "Action"].map(h => (
                  <th key={h} style={{ padding:"12px 20px", textAlign:"left", fontWeight:700, color:"#374151", borderBottom:"2px solid #e5e7eb" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, i) => (
                <tr key={emp._id} style={{ borderBottom:"1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding:"14px 20px", color:"#9ca3af", fontSize:13, fontWeight:700 }}>
                    {String(i + 1).padStart(2, "0")}
                  </td>
                  <td style={{ padding:"14px 20px" }}>
                    <span style={{ background:"#eff6ff", color:"#2563eb", padding:"3px 10px", borderRadius:6, fontSize:12, fontWeight:700, fontFamily:"monospace" }}>
                      {emp.employeeId || "—"}
                    </span>
                  </td>
                  <td style={{ padding:"14px 20px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:36, height:36, borderRadius:"50%", background:"#f0fdf4", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:"#16a34a", fontSize:14, flexShrink:0 }}>
                        {emp.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p style={{ margin:0, fontWeight:600, color:"#1a1a2e", fontSize:14 }}>{emp.name}</p>
                        <p style={{ margin:0, fontSize:11, color:"#9ca3af" }}>{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"14px 20px", color:"#6b7280", fontSize:13 }}>{emp.email}</td>
                  <td style={{ padding:"14px 20px" }}>
                    {emp.department ? (
                      <span style={{ background:"#f3f4f6", color:"#374151", padding:"4px 10px", borderRadius:6, fontSize:12, fontWeight:600 }}>
                        {emp.department}
                      </span>
                    ) : "—"}
                  </td>
                  <td style={{ padding:"14px 20px" }}>
                    <button
                      onClick={() => setConfirmId(emp._id)}
                      style={{ background:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca", borderRadius:7, padding:"7px 14px", fontSize:13, fontWeight:600, cursor:"pointer" }}
                    >
                      🗑️ Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}