import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("hrToken")}` },
});

const S = {
  page: { padding: 24, fontFamily: "inherit" },
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 20, marginBottom: 20 },
  btn: { padding: "8px 16px", borderRadius: 10, border: "none", background: "#3d5af1", color: "#fff", fontWeight: 600, cursor: "pointer" },
  btnGhost: { padding: "6px 12px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" },
  input: { padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", width: "100%" },
  th: { textAlign: "left", padding: "10px 12px", fontSize: 12, color: "#6b7280", textTransform: "uppercase" },
  td: { padding: "12px", borderTop: "1px solid #f1f5f9", fontSize: 14, verticalAlign: "top" },
  chip: { display: "inline-block", padding: "4px 10px", borderRadius: 999, background: "#eef2ff", color: "#3730a3", fontSize: 12, margin: 2 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { background: "#fff", borderRadius: 16, padding: 24, width: "min(720px, 94vw)", maxHeight: "90vh", overflowY: "auto" },
};

export default function KpiLeaderAccess() {
  const [employees, setEmployees] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(true);

  // modal state
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [leaderDept, setLeaderDept] = useState("");
  const [leaderId, setLeaderId] = useState("");
  const [memberDept, setMemberDept] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [e, m, s] = await Promise.all([
        axios.get(`${API_BASE}/api/hr/employees`),
        axios.get(`${API_BASE}/api/kpi-leader`, authHeader()),
        axios.get(`${API_BASE}/api/kpi-leader/suggested-leaders`, authHeader()),
      ]);
            const empList = Array.isArray(e.data) ? e.data : (e.data?.data || []);
      setEmployees(
        empList.filter(
          x => ["active", "approved"].includes(x.status) && !x.exitType && !x.accessDeactivated
        )
      );
      setMappings(m.data?.data || []);
      setSuggested(s.data?.data || []);
    } catch (err) {
      alert(err.response?.data?.message || "Load failed");
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const departments = useMemo(
    () => [...new Set(employees.map(e => e.department).filter(Boolean))].sort(),
    [employees]
  );

  // memberId -> leader name (for "Already under X")
  const memberOwner = useMemo(() => {
    const map = {};
    mappings.forEach(m => {
      if (m._id === editId) return;
      m.member_ids.forEach(mem => { map[mem._id] = m.leader_id?.name; });
    });
    return map;
  }, [mappings, editId]);

  const leaderOptions = employees.filter(e =>
    (!leaderDept || e.department === leaderDept) &&
    !mappings.some(m => m.leader_id?._id === e._id && m._id !== editId)
  );
  const isTL = e => /(team\s*lead|team\s*leader|\bTL\b)/i.test(e.designation || "");

  const memberList = employees.filter(e =>
    e._id !== leaderId &&
    (!memberDept || e.department === memberDept) &&
    (!search || `${e.name} ${e.email}`.toLowerCase().includes(search.toLowerCase()))
  );
  const selectable = memberList.filter(e => !memberOwner[e._id]);

  const openCreate = (preLeader) => {
    setEditId(null);
    setLeaderId(preLeader?._id || "");
    setLeaderDept(preLeader?.department || "");
    setMemberDept(""); setSearch(""); setSelected([]);
    setOpen(true);
  };
  const openEdit = (m) => {
    setEditId(m._id);
    setLeaderId(m.leader_id._id);
    setLeaderDept(m.leader_id.department || "");
    setMemberDept(""); setSearch("");
    setSelected(m.member_ids.map(x => x._id));
    setOpen(true);
  };

  const toggle = id => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const allSelected = selectable.length > 0 && selectable.every(e => selected.includes(e._id));
  const toggleAll = () => {
    const ids = selectable.map(e => e._id);
    setSelected(s => allSelected ? s.filter(x => !ids.includes(x)) : [...new Set([...s, ...ids])]);
  };

  const save = async () => {
    if (!leaderId) return alert("Select a leader");
    if (!selected.length) return alert("Select at least 1 team member");
    setSaving(true);
    try {
      if (editId) {
        await axios.put(`${API_BASE}/api/kpi-leader/${editId}`, { member_ids: selected }, authHeader());
      } else {
        await axios.post(`${API_BASE}/api/kpi-leader`, { leader_id: leaderId, member_ids: selected }, authHeader());
      }
      setOpen(false);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Save failed");
    }
    setSaving(false);
  };

  const remove = async (m) => {
    if (!window.confirm(`Remove ${m.leader_id?.name}'s team access?`)) return;
    try {
      await axios.delete(`${API_BASE}/api/kpi-leader/${m._id}`, authHeader());
      load();
    } catch (err) { alert(err.response?.data?.message || "Failed"); }
  };

  return (
    <div style={S.page}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>KPI Leader Access</h2>
          <p style={{ margin: "4px 0 0", color: "#6b7280" }}>
            Team leader-ku avanga team members-oda KPI paaka access kudukkalam (view only).
          </p>
        </div>
        <button style={S.btn} onClick={() => openCreate(null)}>+ Add Leader Team</button>
      </div>

      {suggested.length > 0 && (
        <div style={{ ...S.card, background: "#fffbeb", borderColor: "#fde68a" }}>
          <b>Team leaders without a team: {suggested.length}</b>
          <div style={{ marginTop: 8 }}>
            {suggested.map(s => (
              <button key={s._id} style={{ ...S.btnGhost, margin: 4 }} onClick={() => openCreate(s)}>
                {s.name} <span style={{ color: "#6b7280" }}>· {s.department}</span> →
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={S.card}>
        {loading ? "Loading..." : mappings.length === 0 ? (
          <div style={{ color: "#6b7280" }}>No leader teams yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={S.th}>Leader</th><th style={S.th}>Department</th>
                  <th style={S.th}>Team</th><th style={S.th}>Members</th><th style={S.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map(m => (
                  <tr key={m._id}>
                    <td style={S.td}><b>{m.leader_id?.name}</b><div style={{ color: "#6b7280", fontSize: 12 }}>{m.leader_id?.designation}</div></td>
                    <td style={S.td}>{m.leader_id?.department}</td>
                    <td style={S.td}>{m.member_ids.length}</td>
                    <td style={S.td}>{m.member_ids.map(x => <span key={x._id} style={S.chip}>{x.name}</span>)}</td>
                    <td style={S.td}>
                      <button style={S.btnGhost} onClick={() => openEdit(m)}>Edit</button>{" "}
                      <button style={{ ...S.btnGhost, color: "#dc2626" }} onClick={() => remove(m)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && (
        <div style={S.overlay} onClick={() => setOpen(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{editId ? "Edit Team" : "Add Leader Team"}</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label>1. Department</label>
                <select style={S.input} value={leaderDept} disabled={!!editId}
                  onChange={e => { setLeaderDept(e.target.value); setLeaderId(""); }}>
                  <option value="">All departments</option>
                  {departments.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label>2. Leader</label>
                <select style={S.input} value={leaderId} disabled={!!editId}
                  onChange={e => { setLeaderId(e.target.value); setSelected(s => s.filter(x => x !== e.target.value)); }}>
                  <option value="">Select leader</option>
                  {[...leaderOptions].sort((a, b) => isTL(b) - isTL(a)).map(e => (
                    <option key={e._id} value={e._id}>{isTL(e) ? "★ TL · " : ""}{e.name} ({e.department})</option>
                  ))}
                </select>
              </div>
            </div>

            <label>3. Team members (cross-department allowed)</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "6px 0 10px" }}>
              <select style={S.input} value={memberDept} onChange={e => setMemberDept(e.target.value)}>
                <option value="">All departments</option>
                {departments.map(d => <option key={d}>{d}</option>)}
              </select>
              <input style={S.input} placeholder="Search name / email" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <label style={{ display: "block", marginBottom: 6 }}>
              <input type="checkbox" checked={allSelected} onChange={toggleAll} /> Select all ({selectable.length})
            </label>

            <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, maxHeight: 280, overflowY: "auto" }}>
              {memberList.map(e => {
                const owner = memberOwner[e._id];
                return (
                  <label key={e._id} style={{
                    display: "flex", gap: 10, padding: "8px 12px", borderBottom: "1px solid #f1f5f9",
                    opacity: owner ? 0.45 : 1, cursor: owner ? "not-allowed" : "pointer",
                  }}>
                    <input type="checkbox" disabled={!!owner} checked={selected.includes(e._id)} onChange={() => toggle(e._id)} />
                    <span style={{ flex: 1 }}>{e.name} <span style={{ color: "#6b7280", fontSize: 12 }}>· {e.department} · {e.designation}</span></span>
                    {owner && <span style={{ fontSize: 12, color: "#b45309" }}>Already under {owner}</span>}
                  </label>
                );
              })}
              {memberList.length === 0 && <div style={{ padding: 16, color: "#6b7280" }}>No employees</div>}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
              <span style={{ color: "#6b7280" }}>{selected.length} selected</span>
              <div>
                <button style={S.btnGhost} onClick={() => setOpen(false)}>Cancel</button>{" "}
                <button style={S.btn} disabled={saving} onClick={save}>{saving ? "Saving..." : "Save"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}