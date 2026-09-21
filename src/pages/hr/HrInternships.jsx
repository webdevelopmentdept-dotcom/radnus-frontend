import React, { useEffect, useMemo, useState } from "react";

const STATUS_OPTIONS = ["New", "Shortlisted", "Rejected", "Selected"];

const STATUS_CONFIG = {
  New:         { bg: "#eff6ff", color: "#1d4ed8", dot: "#3b82f6" },
  Shortlisted: { bg: "#fefce8", color: "#a16207", dot: "#eab308" },
  Selected:    { bg: "#f0fdf4", color: "#15803d", dot: "#22c55e" },
  Rejected:    { bg: "#fff1f2", color: "#b91c1c", dot: "#ef4444" },
};

const statusStyle = (status) => {
  const c = STATUS_CONFIG[status];
  if (!c) return { background: "#f3f4f6", color: "#374151", dot: "#9ca3af" };
  return c;
};

const toPreviewUrl = (url) => {
  if (!url) return url;
  return url.replace("/fl_attachment/", "/").replace("fl_attachment,", "").replace(",fl_attachment", "");
};

const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";

const AVATAR_COLORS = ["#b30000", "#1d4ed8", "#15803d", "#a16207", "#7c3aed", "#0e7490"];
const avatarColor = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export default function HrInternships() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All"); // "All" | "New" | "Shortlisted" | "Rejected" | "Selected"
  const [selected, setSelected] = useState(null); // record open in the drawer
  const [remarksDraft, setRemarksDraft] = useState("");
  const [ratingsDraft, setRatingsDraft] = useState({
    communication: "", academicProfile: "", coreSkillRelevance: "", projectPotential: "",
  });
  const [saving, setSaving] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => { loadApplications(); }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/internship/applications`);
      const data = await res.json();
      setApplications(data.applications || []);
    } catch (err) {
      console.error("Failed to load internship applications:", err);
    } finally {
      setLoading(false);
    }
  };

  const openDrawer = (app) => {
    setSelected(app);
    setRemarksDraft(app.hrRemarks || "");
    setRatingsDraft({
      communication: app.ratings?.communication ?? "",
      academicProfile: app.ratings?.academicProfile ?? "",
      coreSkillRelevance: app.ratings?.coreSkillRelevance ?? "",
      projectPotential: app.ratings?.projectPotential ?? "",
    });
  };

  const closeDrawer = () => setSelected(null);

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE}/api/internship/applications/${id}/screen`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setApplications((prev) => prev.map((a) => (a._id === id ? data.application : a)));
        if (selected?._id === id) setSelected(data.application);
      }
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  const saveScreening = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const ratings = {
        communication: ratingsDraft.communication === "" ? null : Number(ratingsDraft.communication),
        academicProfile: ratingsDraft.academicProfile === "" ? null : Number(ratingsDraft.academicProfile),
        coreSkillRelevance: ratingsDraft.coreSkillRelevance === "" ? null : Number(ratingsDraft.coreSkillRelevance),
        projectPotential: ratingsDraft.projectPotential === "" ? null : Number(ratingsDraft.projectPotential),
      };
      const res = await fetch(`${API_BASE}/api/internship/applications/${selected._id}/screen`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hrRemarks: remarksDraft, ratings }),
      });
      const data = await res.json();
      if (data.success) {
        setApplications((prev) => prev.map((a) => (a._id === selected._id ? data.application : a)));
        setSelected(data.application);
      }
    } catch (err) {
      console.error("Save screening failed:", err);
    } finally {
      setSaving(false);
    }
  };

  // ── Counts per tab (computed off the search-filtered set, so tab counts
  // update live as the person types in the search box) ──────────────────
  const searchFiltered = useMemo(() => {
    if (!search) return applications;
    const q = search.toLowerCase();
    return applications.filter(
      (a) =>
        a.name?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        a.coreArea?.toLowerCase().includes(q)
    );
  }, [applications, search]);

  const tabCounts = useMemo(() => {
    const counts = { All: searchFiltered.length };
    STATUS_OPTIONS.forEach((s) => {
      counts[s] = searchFiltered.filter((a) => a.status === s).length;
    });
    return counts;
  }, [searchFiltered]);

  const filtered = useMemo(() => {
    if (activeTab === "All") return searchFiltered;
    return searchFiltered.filter((a) => a.status === activeTab);
  }, [searchFiltered, activeTab]);

  const TABS = ["All", ...STATUS_OPTIONS];

  return (
    <div style={{ padding: 24, background: "#f8fafc", minHeight: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: 24, color: "#111827" }}>Internship Applications</h3>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
            Review, screen, and track candidates by status.
          </p>
        </div>
        <input
          type="text"
          placeholder="Search name, email, core area..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            minWidth: 280,
            fontSize: 14,
            outline: "none",
            background: "#fff",
          }}
        />
      </div>

      {/* Status tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 20,
          background: "#fff",
          padding: 6,
          borderRadius: 12,
          boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
          width: "fit-content",
          flexWrap: "wrap",
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          const c = tab === "All" ? { color: "#111827", dot: "#111827" } : statusStyle(tab);
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                background: isActive ? "#b30000" : "transparent",
                color: isActive ? "#fff" : "#374151",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {tab !== "All" && (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: isActive ? "#fff" : c.dot,
                    display: "inline-block",
                  }}
                />
              )}
              {tab}
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "1px 7px",
                  borderRadius: 999,
                  background: isActive ? "rgba(255,255,255,0.25)" : "#f3f4f6",
                  color: isActive ? "#fff" : "#6b7280",
                }}
              >
                {tabCounts[tab] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>Loading applications…</div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            color: "#6b7280",
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          No applications {activeTab !== "All" ? `in "${activeTab}"` : "found"}.
        </div>
      ) : (
        <div style={{ overflowX: "auto", background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                <th style={th}>Name</th>
                <th style={th}>Contact</th>
                <th style={th}>College / Year</th>
                <th style={th}>CGPA</th>
                <th style={th}>Core Area</th>
                <th style={th}>Duration</th>
                <th style={th}>Resume</th>
                <th style={th}>Status</th>
                <th style={th}>Applied</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a._id}
                  style={{ borderTop: "1px solid #f1f5f9" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 34, height: 34, borderRadius: "50%",
                          background: avatarColor(a.name), color: "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 700, flexShrink: 0,
                        }}
                      >
                        {initials(a.name)}
                      </div>
                      <span style={{ fontWeight: 600, color: "#111827" }}>{a.name}</span>
                    </div>
                  </td>
                  <td style={td}>
                    <div>{a.mobile}</div>
                    <div style={{ color: "#6b7280", fontSize: 12 }}>{a.email}</div>
                  </td>
                  <td style={td}>{a.collegeAndYear}</td>
                  <td style={td}>{a.cgpa || "—"}</td>
                  <td style={td}>{a.coreArea}</td>
                  <td style={td}>{a.duration}</td>
                  <td style={td}>
                    {a.resumeUrl ? (
                      <a
                        href={toPreviewUrl(a.resumeUrl)}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#b30000", fontWeight: 600, textDecoration: "none" }}
                      >
                        View
                      </a>
                    ) : "—"}
                  </td>
                  <td style={td}>
                    <select
                      value={a.status}
                      onChange={(e) => updateStatus(a._id, e.target.value)}
                      style={{
                        ...(() => {
                          const c = statusStyle(a.status);
                          return { background: c.bg, color: c.color };
                        })(),
                        border: "none",
                        borderRadius: 999,
                        padding: "5px 12px",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={td}>{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td style={td}>
                    <button
                      onClick={() => openDrawer(a)}
                      style={{
                        padding: "7px 14px", borderRadius: 8, border: "1px solid #e5e7eb",
                        background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13,
                        color: "#374151",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                    >
                      Screen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Screening Drawer */}
      {selected && (
        <>
          <div
            onClick={closeDrawer}
            style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.35)", zIndex: 999 }}
          />
          <div
            style={{
              position: "fixed", top: 0, right: 0, height: "100vh", width: 420, maxWidth: "100vw",
              background: "#fff", boxShadow: "-8px 0 24px rgba(0,0,0,0.15)", padding: 24,
              overflowY: "auto", zIndex: 1000,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: avatarColor(selected.name), color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 15, fontWeight: 700, flexShrink: 0,
                  }}
                >
                  {initials(selected.name)}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 17 }}>{selected.name}</h4>
                  <span
                    style={{
                      ...(() => {
                        const c = statusStyle(selected.status);
                        return { background: c.bg, color: c.color };
                      })(),
                      fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 999,
                      display: "inline-block", marginTop: 2,
                    }}
                  >
                    {selected.status}
                  </span>
                </div>
              </div>
              <button
                onClick={closeDrawer}
                style={{ border: "none", background: "none", fontSize: 22, cursor: "pointer", color: "#6b7280", lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <hr style={{ margin: "16px 0", border: "none", borderTop: "1px solid #f1f5f9" }} />

            <p style={{ fontSize: 14, lineHeight: 1.6 }}>
              <strong>Process/Problem answer:</strong><br />{selected.processImprovement}
            </p>
            <p style={{ fontSize: 14 }}><strong>Mode:</strong> {selected.mode || "—"}</p>

            <hr style={{ margin: "16px 0", border: "none", borderTop: "1px solid #f1f5f9" }} />

            <h5 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>HR Remarks</h5>
            <textarea
              rows={3}
              value={remarksDraft}
              onChange={(e) => setRemarksDraft(e.target.value)}
              style={{ width: "100%", borderRadius: 8, border: "1px solid #e5e7eb", padding: 10, fontSize: 14, fontFamily: "inherit", resize: "vertical" }}
            />

            <h5 style={{ marginTop: 20, fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Ratings (1–5)</h5>
            {["communication", "academicProfile", "coreSkillRelevance", "projectPotential"].map((key) => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <label style={{ textTransform: "capitalize", fontSize: 13, color: "#374151" }}>{key.replace(/([A-Z])/g, " $1")}</label>
                <input
                  type="number" min={1} max={5}
                  value={ratingsDraft[key]}
                  onChange={(e) => setRatingsDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                  style={{ width: 60, padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e7eb", textAlign: "center" }}
                />
              </div>
            ))}

            <button
              onClick={saveScreening}
              disabled={saving}
              style={{
                marginTop: 20, width: "100%", padding: "12px 0", borderRadius: 10, border: "none",
                background: saving ? "#d1a3a3" : "#b30000", color: "#fff", fontWeight: 600, fontSize: 14,
                cursor: saving ? "default" : "pointer",
              }}
            >
              {saving ? "Saving..." : "Save Screening"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const th = { padding: "12px 14px", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4 };
const td = { padding: "12px 14px", fontSize: 13, verticalAlign: "middle", color: "#374151" };