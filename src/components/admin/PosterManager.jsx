import React, { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL;

export default function PosterManager() {
  const [posters, setPosters]   = useState([]);
  const [tab, setTab]           = useState("jobs");
  const [form, setForm]         = useState({ title: "", edition: "", image: null, type: "jobs" });
  const [uploading, setUploading] = useState(false);

  const fetchPosters = async () => {
    try {
      const { data } = await axios.get(`${API}/api/posters`);
      const list = Array.isArray(data) ? data : [];
      setPosters(list);
    } catch { setPosters([]); }
  };

  useEffect(() => { fetchPosters(); }, []);

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxW = 1200;
          const scale = Math.min(1, maxW / img.width);
          canvas.width  = img.width  * scale;
          canvas.height = img.height * scale;
          canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => resolve(new File([blob], file.name, { type: "image/jpeg" })),
            "image/jpeg", 0.85
          );
        };
      };
    });
  };

  const handleUpload = async () => {
    if (!form.title || !form.image) return alert("Title and image required");
    setUploading(true);
    try {
      const compressed = await compressImage(form.image);
      const fd = new FormData();
      fd.append("title",   form.title);
      fd.append("edition", form.edition);
      fd.append("type",    form.type);
      fd.append("image",   compressed);
      await axios.post(`${API}/api/posters`, fd);
      setForm({ title: "", edition: "", image: null, type: form.type });
      document.getElementById("poster-file-input").value = "";
      fetchPosters();
    } catch (err) {
      alert("Upload failed: " + (err.response?.data?.message || err.message));
    }
    setUploading(false);
  };

  const toggleActive = async (id, current) => {
    await axios.put(`${API}/api/posters/${id}`, { isActive: !current });
    fetchPosters();
  };

  const deletePoster = async (id) => {
    if (!window.confirm("Delete this poster?")) return;
    await axios.delete(`${API}/api/posters/${id}`);
    fetchPosters();
  };

  const filtered = posters.filter(p => p.type === tab);

  return (
    <div>
      <h5 className="fw-bold mb-4">Poster Management</h5>

      {/* Upload Form */}
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-4">
          <h6 className="fw-bold mb-3">Upload New Poster</h6>
          <div className="row g-3">
            <div className="col-md-3">
              <input
                className="form-control"
                placeholder="Poster title"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="col-md-2">
              <input
                className="form-control"
                placeholder="Edition (optional)"
                value={form.edition}
                onChange={e => setForm(f => ({ ...f, edition: e.target.value }))}
              />
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              >
                <option value="jobs">Jobs Poster</option>
                <option value="technicians">Technicians Poster</option>
              </select>
            </div>
            <div className="col-md-3">
              <input
                id="poster-file-input"
                type="file"
                className="form-control"
                accept="image/*"
                onChange={e => setForm(f => ({ ...f, image: e.target.files[0] }))}
              />
            </div>
            <div className="col-md-2">
              <button
                className="btn btn-danger w-100"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="d-flex gap-2 mb-3">
        <button
          className={`btn btn-sm rounded-pill ${tab === "jobs" ? "btn-danger" : "btn-outline-secondary"}`}
          onClick={() => setTab("jobs")}
        >
          Jobs Posters ({posters.filter(p => p.type === "jobs").length})
        </button>
        <button
          className={`btn btn-sm rounded-pill ${tab === "technicians" ? "btn-danger" : "btn-outline-secondary"}`}
          onClick={() => setTab("technicians")}
        >
          Technician Posters ({posters.filter(p => p.type === "technicians").length})
        </button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <div style={{ fontSize: 48 }}>🖼️</div>
          <p>No posters uploaded yet for this type</p>
        </div>
      ) : (
        <div className="row row-cols-2 row-cols-md-4 g-3">
          {filtered.map(p => (
            <div key={p._id} className="col">
              <div className={`card border-0 shadow-sm rounded-3 overflow-hidden ${!p.isActive ? "opacity-50" : ""}`}>
                <img
                  src={p.imageUrl}
                  alt={p.title}
                  style={{ width: "100%", height: 160, objectFit: "cover" }}
                />
                <div className="card-body p-2">
                  <small className="fw-bold d-block mb-1 text-truncate">{p.title}</small>
                  {p.edition && <small className="text-muted d-block">{p.edition}</small>}
                  <span
                    className="badge mb-2"
                    style={{
                      background: p.type === "jobs" ? "#ffeaea" : "#e8f5e9",
                      color: p.type === "jobs" ? "#d61f26" : "#2e7d32",
                      fontSize: 10,
                    }}
                  >
                    {p.type === "jobs" ? "Jobs" : "Technicians"}
                  </span>
                  <div className="d-flex gap-1">
                    <button
                      className={`btn btn-sm flex-grow-1 ${p.isActive ? "btn-success" : "btn-outline-secondary"}`}
                      style={{ fontSize: 11 }}
                      onClick={() => toggleActive(p._id, p.isActive)}
                    >
                      {p.isActive ? "Active" : "Hidden"}
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      style={{ fontSize: 11 }}
                      onClick={() => deletePoster(p._id)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}