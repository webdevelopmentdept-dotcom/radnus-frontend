import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const getToken = () =>
  localStorage.getItem("employeeToken") || sessionStorage.getItem("employeeToken");

const avatar = (p) =>
  p.profileImage ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || "U")}&background=e8f0fe&color=4f8ef7&size=64`;

/* ─── Hook: is this employee a Team Lead? who is their Team Lead? ─── */
export function useTeamRole() {
  const [role, setRole] = useState({
    loading: true,
    isLeader: false,
    teamSize: 0,
    members: [],
    permissions: {},
    pendingLeaveCount: 0,
    hasLeader: false,
    leader: null,
    leaveApproval: false,
  });

  useEffect(() => {
    const token = getToken();
    if (!token) { setRole(r => ({ ...r, loading: false })); return; }
    const cfg = { headers: { Authorization: `Bearer ${token}` } };
    let cancelled = false;

    (async () => {
      const [t, l] = await Promise.allSettled([
        axios.get(`${API_BASE}/api/kpi-leader/my-team`, cfg),
        axios.get(`${API_BASE}/api/kpi-leader/my-leader`, cfg),
      ]);
      if (cancelled) return;
      const team = t.status === "fulfilled" ? t.value.data : {};
      const lead = l.status === "fulfilled" ? l.value.data : {};
      setRole({
        loading: false,
        isLeader: !!team.isLeader,
        teamSize: team.teamSize || 0,
        members: team.members || [],
        permissions: team.permissions || {},
        pendingLeaveCount: team.pendingLeaveCount || 0,
        hasLeader: !!lead.hasLeader,
        leader: lead.leader || null,
        leaveApproval: !!lead.leaveApproval,
      });
    })();

    return () => { cancelled = true; };
  }, []);

  return role;
}

/* ─── Team Lead badge (for topbar / hero) ─── */
export function TeamLeadBadge({ role, dark = false, block = false }) {
  if (!role?.isLeader) return null;
  return (
    <span
      style={{
        display: block ? "block" : "inline-block", width: block ? "fit-content" : "auto",
        marginLeft: block ? 0 : 8, marginTop: block ? 5 : 0, padding: "2px 9px", borderRadius: 99,
        fontSize: 10, fontWeight: 700, letterSpacing: 0.3, whiteSpace: "nowrap",
        background: dark ? "rgba(255,255,255,.14)" : "#eef2ff",
        color: dark ? "#fff" : "#3730a3",
        border: dark ? "1px solid rgba(255,255,255,.25)" : "1px solid #c7d2fe",
      }}
    >
      Team Lead · {role.teamSize} member{role.teamSize === 1 ? "" : "s"}
    </span>
  );
}

/* ─── Cards ─── */
export default function TeamLeadCard({ role }) {
  if (!role || role.loading) return null;
  if (!role.isLeader && !role.hasLeader) return null;

  const go = (path) => { window.location.href = path; };
  const btn = {
    padding: "7px 14px", borderRadius: 8, border: "1px solid #d1d5db",
    background: "#fff", color: "#111827", fontWeight: 600, fontSize: 12,
    cursor: "pointer", fontFamily: "inherit", position: "relative",
  };

  return (
    <>
      {/* Leader view: My Team */}
      {role.isLeader && (
        <div className="ed-card" style={{ padding: 14, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            <p className="ed-card-title" style={{ padding: 0, margin: 0 }}>
              My Team <span style={{ fontWeight: 500, color: "#6b7280" }}>· {role.teamSize} member{role.teamSize === 1 ? "" : "s"}</span>
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {role.permissions.kpi_view && (
                <button style={btn} onClick={() => go("/employee/my-team-kpi")}>View Team KPI</button>
              )}
              {role.permissions.leave_approval && (
                <button style={btn} onClick={() => go("/employee/team-leave")}>
                  Team Leave Requests
                  {role.pendingLeaveCount > 0 && (
                    <span style={{
                      marginLeft: 6, background: "#ef4444", color: "#fff", borderRadius: 99,
                      fontSize: 10, fontWeight: 700, padding: "1px 7px",
                    }}>{role.pendingLeaveCount}</span>
                  )}
                </button>
              )}
            </div>
          </div>

          {role.members.length === 0 ? (
            <div style={{ fontSize: 12, color: "#9ca3af" }}>No active members in your team.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 10 }}>
              {role.members.map(m => (
                <div key={m._id} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                  border: "1px solid #eef0f4", borderRadius: 10, background: "#fafbfc",
                }}>
                  <img src={avatar(m)} alt={m.name} style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {m.designation || "—"}{m.department ? ` · ${m.department}` : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Member view: Your Team Lead */}
      {role.hasLeader && role.leader && (
        <div className="ed-card" style={{ padding: 14, marginBottom: 14 }}>
          <p className="ed-card-title" style={{ padding: 0, marginBottom: 10 }}>Your Team Lead</p>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src={avatar(role.leader)} alt={role.leader.name} style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover" }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{role.leader.name}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {role.leader.designation || "Team Lead"}{role.leader.department ? ` · ${role.leader.department}` : ""}
              </div>
              {role.leaveApproval && (
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>
                  Your leave requests go to your Team Lead first, then HR.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}