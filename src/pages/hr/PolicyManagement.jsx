import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Convert raw backend version number to display string
// 1 → "1", 2 → "1.1", 3 → "1.2", ..., 11 → "1.10", 12 → "2", 13 → "2.1", ...
function toDisplayVersion(rawVersion) {
  if (!rawVersion || rawVersion <= 1) return "1";
  const zeroBasedUpdates = rawVersion - 2;
  const major = Math.floor(zeroBasedUpdates / 10) + 1;
  const minor = (zeroBasedUpdates % 10) + 1;
  return `${major}.${minor}`;
}

export default function PolicyManagement() {
  const [policies, setPolicies] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editPolicy, setEditPolicy] = useState(null);
  const [form, setForm] = useState({
    title: "", category: "HR", description: "", change_note: ""
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedVersions, setExpandedVersions] = useState({});

  const categories = ["HR", "Finance", "IT", "General", "Operations"];

  useEffect(() => { fetchPolicies(); }, []);

  const fetchPolicies = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/policies`);
      const data = Array.isArray(res.data) ? res.data :
                   Array.isArray(res.data?.data) ? res.data.data : [];
      setPolicies(data);
    } catch (err) {
      console.log("FETCH ERROR:", err);
      setPolicies([]);
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.category)
      return alert("Title and Category required");
    if (!editPolicy && !file)
      return alert("Please upload a file");

    setLoading(true);
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("category", form.category);
    fd.append("description", form.description);
    fd.append("change_note", form.change_note);
    const hrId = localStorage.getItem("hrId");
    if (hrId) fd.append("uploaded_by", hrId);
    if (file) fd.append("file", file);

    try {
      if (editPolicy) {
        await axios.put(`${API_BASE}/api/policies/${editPolicy._id}`, fd);
        alert("Policy updated successfully!");
      } else {
        await axios.post(`${API_BASE}/api/policies`, fd);
        alert("Policy created successfully!");
      }
      setShowForm(false);
      setEditPolicy(null);
      setForm({ title: "", category: "HR", description: "", change_note: "" });
      setFile(null);
      fetchPolicies();
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong");
    }
    setLoading(false);
  };

  const handleEdit = (policy) => {
    setEditPolicy(policy);
    setForm({
      title: policy.title,
      category: policy.category,
      description: policy.description || "",
      change_note: ""
    });
    setFile(null);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this policy?")) return;
    try {
      await axios.delete(`${API_BASE}/api/policies/${id}`);
      fetchPolicies();
    } catch {
      alert("Delete failed");
    }
  };

  const toggleVersions = (policyId) => {
    setExpandedVersions((prev) => ({ ...prev, [policyId]: !prev[policyId] }));
  };

  const getVersions = (policy) => {
    if (Array.isArray(policy.version_history) && policy.version_history.length > 0) {
      return [...policy.version_history].sort((a, b) => a.version_number - b.version_number);
    }
    return [{
      version_number: policy.version,
      file_url: policy.file_url,
      change_note: "Initial upload",
      created_at: policy.createdAt,
    }];
  };

  const categoryColor = {
    HR:         { bg: "#ede9fe", color: "#6d28d9" },
    Finance:    { bg: "#fef9c3", color: "#854d0e" },
    IT:         { bg: "#dbeafe", color: "#1e40af" },
    General:    { bg: "#dcfce7", color: "#166534" },
    Operations: { bg: "#fee2e2", color: "#991b1b" },
  };

  return (
    <div style={{ padding: 24, fontFamily: "inherit" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Policy Management</h2>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            Upload and manage company policies — Word documents only (.doc, .docx)
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditPolicy(null);
            setForm({ title: "", category: "HR", description: "", change_note: "" });
            setFile(null);
          }}
          style={{
            background: "#4f46e5", color: "#fff", border: "none",
            borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 600
          }}
        >
          + Add Policy
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          background: "#f8fafc", border: "1px solid #e2e8f0",
          borderRadius: 12, padding: 24, marginBottom: 24
        }}>
          <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>
            {editPolicy
              ? `Update Policy — v${toDisplayVersion(editPolicy.version + 1)}`
              : "Add New Policy — v1"}
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Policy Title *</label>
              <input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Leave Policy 2026"
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Category *</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
              >
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Brief description..."
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, resize: "vertical", boxSizing: "border-box" }}
              />
            </div>

            {editPolicy && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Change Note</label>
                <input
                  value={form.change_note}
                  onChange={e => setForm({ ...form, change_note: e.target.value })}
                  placeholder="What changed in this version?"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                />
              </div>
            )}

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>
                Upload Document {editPolicy ? "(New upload = version update)" : "*"}
              </label>
              <div style={{ marginBottom: 10 }}>
                <span style={{ background: "#e0e7ff", color: "#3730a3", borderRadius: 6, padding: "3px 12px", fontSize: 11, fontWeight: 600 }}>
                  Word Document only (.doc / .docx)
                </span>
              </div>
              <input
                type="file"
                accept=".doc,.docx"
                onChange={e => setFile(e.target.files[0])}
                style={{ fontSize: 13 }}
              />
              {file && (
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, background: "#dcfce7", borderRadius: 8, padding: "8px 12px" }}>
                  <span style={{ fontSize: 13, color: "#166534", fontWeight: 600 }}>{file.name}</span>
                  <span style={{ fontSize: 11, color: "#16a34a", marginLeft: "auto" }}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              )}
            </div>

          </div>

          <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
            <button
              onClick={handleSubmit} disabled={loading}
              style={{
                background: loading ? "#94a3b8" : "#4f46e5",
                color: "#fff", border: "none", borderRadius: 8,
                padding: "10px 28px", cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 600, fontSize: 14
              }}
            >
              {loading ? "Uploading..." : editPolicy ? "Update Policy" : "Create Policy"}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditPolicy(null); }}
              style={{ background: "#e2e8f0", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {policies.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "#f8fafc", borderRadius: 12, border: "1px dashed #cbd5e1" }}>
          <p style={{ fontSize: 15, color: "#94a3b8" }}>No policies yet. Click "Add Policy" to get started.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                {["#", "Title", "Category", "Current Version", "All Versions", "Uploaded", "Action"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#475569", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {policies.map((p, i) => {
                const c = categoryColor[p.category] || { bg: "#f1f5f9", color: "#475569" };
                const versions = getVersions(p);
                const showVersions = expandedVersions[p._id];

                return (
                  <>
                    {/* Main Row */}
                    <tr
                      key={p._id}
                      style={{ borderBottom: showVersions ? "none" : "1px solid #e2e8f0" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "12px 16px", color: "#94a3b8", fontWeight: 600 }}>{i + 1}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 600 }}>{p.title}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ background: c.bg, color: c.color, borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>
                          {p.category}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ background: "#dcfce7", color: "#166534", borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>
                          v{toDisplayVersion(p.version)}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <button
                          onClick={() => toggleVersions(p._id)}
                          style={{
                            background: showVersions ? "#e0e7ff" : "#f1f5f9",
                            color: showVersions ? "#4338ca" : "#475569",
                            border: "none", borderRadius: 6,
                            padding: "4px 12px", cursor: "pointer",
                            fontSize: 12, fontWeight: 600,
                          }}
                        >
                          {showVersions ? "▲ Hide" : `▼ ${versions.length} version${versions.length > 1 ? "s" : ""}`}
                        </button>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#64748b", whiteSpace: "nowrap" }}>
                        {new Date(p.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => handleEdit(p)}
                            style={{ background: "#fef9c3", border: "none", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#854d0e" }}>
                            Edit
                          </button>
                          <button onClick={() => handleDelete(p._id)}
                            style={{ background: "#fee2e2", border: "none", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#dc2626" }}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Version History Expanded Row */}
                    {showVersions && (
                      <tr key={`${p._id}-versions`} style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <td colSpan={7} style={{ padding: "0 16px 14px 48px", background: "#f8fafc" }}>
                          <div style={{ paddingTop: 10 }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>
                              Version History
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {[...versions].reverse().map((v, idx) => (
                                <div key={v.version_number} style={{
                                  display: "flex", alignItems: "center", gap: 12,
                                  background: "#fff",
                                  border: `1px solid ${idx === 0 ? "#93c5fd" : "#e2e8f0"}`,
                                  borderRadius: 8, padding: "8px 14px",
                                  maxWidth: 700,
                                }}>
                                  <span style={{
                                    background: idx === 0 ? "#dbeafe" : "#f1f5f9",
                                    color: idx === 0 ? "#1e40af" : "#64748b",
                                    borderRadius: 6, padding: "2px 10px",
                                    fontSize: 12, fontWeight: 700, minWidth: 36, textAlign: "center",
                                  }}>
                                    v{toDisplayVersion(v.version_number)}
                                  </span>

                                  {idx === 0 && (
                                    <span style={{ background: "#dcfce7", color: "#16a34a", borderRadius: 4, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>
                                      Latest
                                    </span>
                                  )}

                                  <span style={{ fontSize: 12, color: "#94a3b8", minWidth: 90 }}>
                                    {v.created_at ? new Date(v.created_at).toLocaleDateString("en-IN") : "—"}
                                  </span>

                                  <span style={{ fontSize: 12, color: "#64748b", flex: 1 }}>
                                    {v.change_note || (v.version_number === 1 ? "Initial upload" : "—")}
                                  </span>

                                  <a
                                    href={v.file_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      background: "#e0e7ff", color: "#4338ca",
                                      borderRadius: 6, padding: "4px 14px",
                                      fontSize: 12, fontWeight: 600,
                                      textDecoration: "none", whiteSpace: "nowrap",
                                    }}
                                  >
                                    Open ↗
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}