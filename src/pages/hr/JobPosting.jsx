import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const DEPARTMENTS = [
  "Business Development & Sales",
  "Sales & Marketing",
  "IT & Infrastructure",
  "Accounts & Finance",
  "Inventory & Store Operations",
];

const EXPERIENCE = ["Fresher", "0-1 Years", "6 Months – 1 Year", "1-3 Years", "3–5 Years"];
const DURATIONS = ["Full-time", "Part-time", "Internship", "Contract"];

const empty = {
  title: "", type: "", duration: "", experience: "",
  salary: "", description: "", responsibilities: "",
  requirements: "", schedule: "Day shift",
  workLocation: "In-person", contactDetails: "", status: "active",
};

export default function JobPostings() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/jobs`);
      setJobs(res.data.jobs || []);
    } catch {
      setMsg("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditJob(null);
    setForm(empty);
    setShowForm(true);
  };

  const openEdit = (job) => {
    setEditJob(job);
    setForm({
      ...job,
      responsibilities: job.responsibilities?.join("\n") || "",
      requirements: job.requirements?.join("\n") || "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditJob(null);
    setForm(empty);
    setMsg("");
  };

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.type || !form.duration || !form.experience || !form.description) {
      setMsg("Please fill all required fields.");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      responsibilities: form.responsibilities.split("\n").filter(Boolean),
      requirements: form.requirements.split("\n").filter(Boolean),
    };
    try {
      if (editJob) {
        await axios.put(`${API_BASE}/api/jobs/${editJob._id}`, payload);
        setMsg("Job updated successfully!");
      } else {
        await axios.post(`${API_BASE}/api/jobs`, payload);
        setMsg("Job created successfully!");
      }
      fetchJobs();
      setTimeout(closeForm, 1200);
    } catch {
      setMsg("Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (job, status) => {
    try {
      await axios.put(`${API_BASE}/api/jobs/${job._id}`, { ...job, status });
      fetchJobs();
    } catch {
      alert("Status update failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this job?")) return;
    try {
      await axios.delete(`${API_BASE}/api/jobs/${id}`);
      fetchJobs();
    } catch {
      alert("Delete failed");
    }
  };

  const statusColor = (s) => {
    if (s === "active") return { background: "#dcfce7", color: "#15803d" };
    if (s === "closed") return { background: "#fee2e2", color: "#b91c1c" };
    return { background: "#fef9c3", color: "#a16207" };
  };

  return (
    <div style={{ padding: "28px 24px", maxWidth: 960, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#111827" }}>
            Job Postings
            <span style={{
              marginLeft: 10, background: "#111827", color: "#fff",
              borderRadius: 20, padding: "2px 12px", fontSize: 13, fontWeight: 600
            }}>{jobs.length}</span>
          </h2>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
            Manage all job openings for the careers page
          </p>
        </div>
        <button onClick={openCreate} style={{
          background: "#1d4ed8", color: "#fff", border: "none",
          borderRadius: 8, padding: "10px 20px", fontWeight: 600,
          fontSize: 14, cursor: "pointer"
        }}>
          + Post New Job
        </button>
      </div>

      {/* Job List */}
      {loading ? (
        <p style={{ color: "#6b7280", textAlign: "center", padding: 40 }}>Loading...</p>
      ) : jobs.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 0",
          color: "#9ca3af", border: "2px dashed #e5e7eb", borderRadius: 12
        }}>
          <p style={{ fontSize: 16, margin: 0 }}>No job postings yet</p>
          <p style={{ fontSize: 13, margin: "6px 0 0" }}>Click "Post New Job" to create one</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {jobs.map((job) => (
            <div key={job._id} style={{
              background: "#fff", border: "1px solid #e5e7eb",
              borderRadius: 12, padding: "18px 20px",
              display: "flex", justifyContent: "space-between",
              alignItems: "center", flexWrap: "wrap", gap: 12
            }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>
                    {job.title}
                  </h4>
                  <span style={{
                    ...statusColor(job.status),
                    borderRadius: 20, padding: "2px 10px",
                    fontSize: 11, fontWeight: 600, textTransform: "capitalize"
                  }}>{job.status}</span>
                </div>
                <div style={{ display: "flex", gap: 16, color: "#6b7280", fontSize: 12, flexWrap: "wrap" }}>
                  <span>📁 {job.type}</span>
                  <span>⏱ {job.duration}</span>
                  <span>👤 {job.experience}</span>
                  <span>💰 {job.salary || "N/A"}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {/* Status toggle */}
                {job.status === "active" ? (
                  <button onClick={() => handleStatus(job, "closed")} style={{
                    background: "#fee2e2", color: "#b91c1c", border: "none",
                    borderRadius: 7, padding: "7px 14px", fontSize: 12,
                    fontWeight: 600, cursor: "pointer"
                  }}>Close</button>
                ) : (
                  <button onClick={() => handleStatus(job, "active")} style={{
                    background: "#dcfce7", color: "#15803d", border: "none",
                    borderRadius: 7, padding: "7px 14px", fontSize: 12,
                    fontWeight: 600, cursor: "pointer"
                  }}>Activate</button>
                )}

                <button onClick={() => openEdit(job)} style={{
                  background: "#eff6ff", color: "#1d4ed8", border: "none",
                  borderRadius: 7, padding: "7px 14px", fontSize: 12,
                  fontWeight: 600, cursor: "pointer"
                }}>Edit</button>

                <button onClick={() => handleDelete(job._id)} style={{
                  background: "#f9fafb", color: "#ef4444", border: "1px solid #fca5a5",
                  borderRadius: 7, padding: "7px 14px", fontSize: 12,
                  fontWeight: 600, cursor: "pointer"
                }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL FORM ── */}
      {showForm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16
        }}>
          <div style={{
            background: "#fff", borderRadius: 14, width: "100%",
            maxWidth: 620, maxHeight: "90vh", overflowY: "auto", padding: 28
          }}>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>
                {editJob ? "Edit Job" : "Post New Job"}
              </h3>
              <button onClick={closeForm} style={{
                background: "none", border: "none", fontSize: 20,
                cursor: "pointer", color: "#6b7280"
              }}>✕</button>
            </div>

            {msg && (
              <div style={{
                padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13,
                background: msg.includes("success") ? "#dcfce7" : "#fee2e2",
                color: msg.includes("success") ? "#15803d" : "#b91c1c"
              }}>{msg}</div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Title */}
              <div>
                <label style={labelStyle}>Job Title *</label>
                <input name="title" value={form.title} onChange={handleChange}
                  placeholder="e.g. Accounts Executive" style={inputStyle} />
              </div>

              {/* Department + Duration */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Department *</label>
                  <select name="type" value={form.type} onChange={handleChange} style={inputStyle}>
                    <option value="">Select</option>
                    {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Job Type *</label>
                  <select name="duration" value={form.duration} onChange={handleChange} style={inputStyle}>
                    <option value="">Select</option>
                    {DURATIONS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Experience + Salary */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Experience *</label>
                  <select name="experience" value={form.experience} onChange={handleChange} style={inputStyle}>
                    <option value="">Select</option>
                    {EXPERIENCE.map((e) => <option key={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Salary</label>
                  <input name="salary" value={form.salary} onChange={handleChange}
                    placeholder="e.g. ₹15,000 – ₹20,000" style={inputStyle} />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Job Description *</label>
                <textarea name="description" value={form.description} onChange={handleChange}
                  rows={3} placeholder="Describe the role..." style={{ ...inputStyle, resize: "vertical" }} />
              </div>

              {/* Responsibilities */}
              <div>
                <label style={labelStyle}>Responsibilities <span style={{ color: "#9ca3af", fontWeight: 400 }}>(one per line)</span></label>
                <textarea name="responsibilities" value={form.responsibilities} onChange={handleChange}
                  rows={4} placeholder={"Maintain daily records\nHandle invoices\nCoordinate with teams"} style={{ ...inputStyle, resize: "vertical" }} />
              </div>

              {/* Requirements */}
              <div>
                <label style={labelStyle}>Requirements <span style={{ color: "#9ca3af", fontWeight: 400 }}>(one per line)</span></label>
                <textarea name="requirements" value={form.requirements} onChange={handleChange}
                  rows={3} placeholder={"6 months experience\nKnowledge of Tally"} style={{ ...inputStyle, resize: "vertical" }} />
              </div>

              {/* Contact + Status */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Contact Number</label>
                  <input name="contactDetails" value={form.contactDetails} onChange={handleChange}
                    placeholder="e.g. 6379905602" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select name="status" value={form.status} onChange={handleChange} style={inputStyle}>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                <button onClick={closeForm} style={{
                  background: "#f3f4f6", color: "#374151", border: "none",
                  borderRadius: 8, padding: "10px 20px", fontWeight: 600,
                  fontSize: 14, cursor: "pointer"
                }}>Cancel</button>
                <button onClick={handleSubmit} disabled={saving} style={{
                  background: saving ? "#93c5fd" : "#1d4ed8", color: "#fff",
                  border: "none", borderRadius: 8, padding: "10px 24px",
                  fontWeight: 600, fontSize: 14, cursor: saving ? "not-allowed" : "pointer"
                }}>
                  {saving ? "Saving..." : editJob ? "Update Job" : "Post Job"}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: "1px solid #d1d5db", fontSize: 14, color: "#111827",
  background: "#fff", boxSizing: "border-box", fontFamily: "inherit",
  outline: "none",
};

const labelStyle = {
  display: "block", marginBottom: 5,
  fontSize: 13, fontWeight: 600, color: "#374151"
};