import React, { useState, useEffect } from "react";
import axios from "axios";
import { RefreshCw, Eye, CheckCircle, XCircle } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const getToken = () => localStorage.getItem("hrToken") || localStorage.getItem("token") || sessionStorage.getItem("hrToken");
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });
const fmtD = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "—";

function LeaveModal({ leave, onAction, onClose }) {
  const [remark,  setRemark]  = useState("");
  const [loading, setLoading] = useState(null);

  const handle = async (action) => {
    setLoading(action);
    try {
      await axios.put(`${API_BASE}/api/leave-requests/${leave._id}/${action}`,
        { hr_remark: remark }, { headers: authHeader() });
      onAction("success", `✅ Leave ${action}d for ${leave.employee_name}`);
    } catch (err) {
      onAction("error", err.response?.data?.message || "Failed");
    } finally { setLoading(null); }
  };

  const days = Math.floor((new Date(leave.to_date) - new Date(leave.from_date)) / 86400000) + 1;
  const sc   = leave.status==="approved"?"#16a34a":leave.status==="rejected"?"#dc2626":"#d97706";
  const sb   = leave.status==="approved"?"#dcfce7":leave.status==="rejected"?"#fee2e2":"#fef9c3";

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:16, padding:28, width:"90%", maxWidth:460, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h5 style={{ margin:0, fontWeight:800 }}>Leave Request Details</h5>
          <button onClick={onClose} style={{ background:"#f1f5f9", border:"none", width:32, height:32, borderRadius:8, cursor:"pointer", fontSize:18, color:"#6b7280" }}>×</button>
        </div>
        <div style={{ background:"#f8fafc", borderRadius:10, padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:40, height:40, background:"#111827", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:16 }}>
            {(leave.employee_name||"?").charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight:800, color:"#111827" }}>{leave.employee_name}</div>
            <div style={{ fontSize:12, color:"#6b7280" }}>{leave.department}</div>
          </div>
          <span style={{ marginLeft:"auto", fontSize:11, fontWeight:800, padding:"4px 12px", borderRadius:20, background:sb, color:sc }}>
            {leave.status?.toUpperCase()||"PENDING"}
          </span>
        </div>
        {[["Leave Type",leave.leave_type],["From Date",fmtD(leave.from_date)],["To Date",fmtD(leave.to_date)],["Duration",`${days} day${days>1?"s":""}`],["Reason",leave.reason],["Applied On",fmtD(leave.createdAt)]].map(([label,value]) => (
          <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #f1f5f9" }}>
            <span style={{ fontSize:13, color:"#6b7280", fontWeight:600 }}>{label}</span>
            <span style={{ fontSize:13, fontWeight:700, maxWidth:250, textAlign:"right" }}>{value}</span>
          </div>
        ))}
        {leave.hr_remark && <div style={{ background:"#eff6ff", borderRadius:8, padding:"10px 14px", marginTop:12, fontSize:13, color:"#2563eb", fontWeight:600 }}>HR Note: {leave.hr_remark}</div>}
        {leave.status === "pending" && (
          <div style={{ marginTop:16 }}>
            <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:6 }}>HR Remark (optional)</label>
            <textarea rows={2} placeholder="Add a note..." value={remark} onChange={e => setRemark(e.target.value)}
              style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #e5e7eb", borderRadius:8, fontSize:13, outline:"none", fontFamily:"inherit", resize:"vertical", marginBottom:14 }} />
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => handle("reject")} disabled={!!loading}
                style={{ flex:1, padding:"11px 0", borderRadius:10, background:"#fee2e2", color:"#dc2626", border:"none", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                <XCircle size={14}/>{loading==="reject"?"Rejecting...":"Reject"}
              </button>
              <button onClick={() => handle("approve")} disabled={!!loading}
                style={{ flex:2, padding:"11px 0", borderRadius:10, background:"#16a34a", color:"#fff", border:"none", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                <CheckCircle size={14}/>{loading==="approve"?"Approving...":"Approve"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HRLeaveRequests() {
  const [leaves,  setLeaves]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter,  setFilter]  = useState("pending");
  const [modal,   setModal]   = useState(null);
  const [toast,   setToast]   = useState(null);

  useEffect(() => { fetchLeaves(); }, []);

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3500); };

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/leave-requests`, { headers: authHeader() });
      setLeaves(res.data?.data || []);
    } catch { showToast("error", "Failed to load"); }
    finally { setLoading(false); }
  };

  const quickAction = async (id, action, name) => {
    try {
      await axios.put(`${API_BASE}/api/leave-requests/${id}/${action}`, {}, { headers: authHeader() });
      showToast(action==="approve"?"success":"error", `${action==="approve"?"✅":"❌"} Leave ${action}d for ${name}`);
      fetchLeaves();
    } catch { showToast("error", `Failed to ${action}`); }
  };

  const counts = { pending: leaves.filter(l=>l.status==="pending").length, approved: leaves.filter(l=>l.status==="approved").length, rejected: leaves.filter(l=>l.status==="rejected").length, all: leaves.length };
  const FILTER_TABS = [
    { key:"pending",  label:"Pending",  color:"#d97706", bg:"#fef9c3" },
    { key:"approved", label:"Approved", color:"#16a34a", bg:"#dcfce7" },
    { key:"rejected", label:"Rejected", color:"#dc2626", bg:"#fee2e2" },
    { key:"all",      label:"All",      color:"#2563eb", bg:"#eff6ff" },
  ];

  const filtered = leaves.filter(l => filter==="all"||l.status===filter).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));

  return (
    <div style={{ padding:"20px 24px", background:"#f4f6fb", minHeight:"100vh" }}>

      {toast && <div style={{ position:"fixed", top:20, right:24, zIndex:9999, background:toast.type==="error"?"#ef4444":"#16a34a", color:"#fff", padding:"12px 20px", borderRadius:10, fontWeight:700, fontSize:14, boxShadow:"0 8px 24px rgba(0,0,0,0.2)" }}>{toast.msg}</div>}
      {modal && <LeaveModal leave={modal} onAction={(type,msg)=>{setModal(null);showToast(type,msg);fetchLeaves();}} onClose={()=>setModal(null)}/>}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div>
          <h4 style={{ fontWeight:800, color:"#111827", margin:0, fontSize:18 }}>📨 Leave Requests</h4>
          <p style={{ color:"#6b7280", fontSize:13, marginTop:3 }}>Review and manage employee leave applications</p>
        </div>
        <button onClick={fetchLeaves} style={{ background:"#111827", border:"none", borderRadius:10, padding:"9px 18px", cursor:"pointer", display:"flex", alignItems:"center", gap:6, fontWeight:700, fontSize:13, color:"#fff", fontFamily:"inherit" }}>
          <RefreshCw size={13}/>Refresh
        </button>
      </div>

      {/* Filter cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:12, marginBottom:20 }}>
        {FILTER_TABS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{ background:filter===f.key?f.bg:"#fff", border:`2px solid ${filter===f.key?f.color:"#e5e7eb"}`, borderRadius:12, padding:"14px 16px", textAlign:"center", cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}>
            <div style={{ fontSize:24, fontWeight:900, color:filter===f.key?f.color:"#374151" }}>{counts[f.key]}</div>
            <div style={{ fontSize:12, fontWeight:700, color:filter===f.key?f.color:"#6b7280", marginTop:2 }}>{f.label}</div>
          </button>
        ))}
      </div>

      {counts.pending > 0 && (
        <div style={{ background:"#fef9c3", border:"1.5px solid #fde68a", borderRadius:10, padding:"11px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:9 }}>
          <span style={{ fontSize:16 }}>⚠️</span>
          <span style={{ fontSize:13, fontWeight:700, color:"#92400e" }}>{counts.pending} leave request{counts.pending>1?"s":""} waiting for approval</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:"center", padding:"60px 0" }}><div className="spinner-border text-dark" role="status"/></div>
      ) : filtered.length === 0 ? (
        <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e5e7eb", padding:"56px 0", textAlign:"center", color:"#d1d5db" }}>
          <div style={{ fontSize:40, marginBottom:10 }}>🌴</div>
          <p style={{ margin:0, fontWeight:600 }}>No {filter!=="all"?filter:""} leave requests</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map((l, i) => {
            const sc=l.status==="approved"?"#16a34a":l.status==="rejected"?"#dc2626":"#d97706";
            const sb=l.status==="approved"?"#dcfce7":l.status==="rejected"?"#fee2e2":"#fef9c3";
            const days=Math.floor((new Date(l.to_date)-new Date(l.from_date))/86400000)+1;
            return (
              <div key={i} style={{ background:"#fff", borderRadius:12, border:"1px solid #e5e7eb", padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8, flexWrap:"wrap" }}>
                    <div style={{ width:36, height:36, background:"#111827", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:14, flexShrink:0 }}>{(l.employee_name||"?").charAt(0)}</div>
                    <div>
                      <div style={{ fontWeight:800, fontSize:14, color:"#111827" }}>{l.employee_name||"—"}</div>
                      <div style={{ fontSize:11, color:"#6b7280" }}>{l.department}</div>
                    </div>
                    <span style={{ fontSize:11, fontWeight:800, padding:"3px 10px", borderRadius:20, background:sb, color:sc }}>{l.status?.toUpperCase()||"PENDING"}</span>
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:12, fontSize:13, marginBottom:4 }}>
                    <span style={{ fontWeight:700, color:"#111827" }}>📋 {l.leave_type}</span>
                    <span style={{ color:"#374151" }}>📅 {fmtD(l.from_date)} → {fmtD(l.to_date)}</span>
                    <span style={{ color:"#374itle" }}>⏱️ {days} day{days>1?"s":""}</span>
                  </div>
                  <div style={{ fontSize:12, color:"#6b7280" }}>📝 {l.reason}</div>
                  {l.hr_remark && <div style={{ marginTop:5, fontSize:12, color:"#2563eb", fontWeight:600 }}>HR Note: {l.hr_remark}</div>}
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8 }}>
                  <small style={{ color:"#9ca3af", fontSize:11 }}>Applied: {fmtD(l.createdAt)}</small>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={()=>setModal(l)} style={{ background:"#f1f5f9", color:"#374151", border:"none", borderRadius:8, padding:"6px 11px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"inline-flex", alignItems:"center", gap:4 }}><Eye size={11}/>View</button>
                    {l.status==="pending" && <>
                      <button onClick={()=>quickAction(l._id,"approve",l.employee_name)} style={{ background:"#dcfce7", color:"#16a34a", border:"none", borderRadius:8, padding:"6px 11px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"inline-flex", alignItems:"center", gap:4 }}><CheckCircle size={11}/>Approve</button>
                      <button onClick={()=>quickAction(l._id,"reject",l.employee_name)} style={{ background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:8, padding:"6px 11px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"inline-flex", alignItems:"center", gap:4 }}><XCircle size={11}/>Reject</button>
                    </>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}