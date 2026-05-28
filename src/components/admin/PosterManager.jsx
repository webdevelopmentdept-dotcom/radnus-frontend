import React, { useState, useEffect } from "react";
import axios from "axios";

export default function PosterManager() {
  const [posters, setPosters] = useState([]);
  const [form, setForm] = useState({ title: "", edition: "", image: null });
  const [uploading, setUploading] = useState(false);
const fetchPosters = async () => {
  const { data } = await axios.get("/api/posters");
  const list = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
  setPosters(list);
};
  useEffect(() => { fetchPosters(); }, []);

  const handleUpload = async () => {
    if (!form.title || !form.image) return alert("Title and image required");
    setUploading(true);
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("edition", form.edition);
    fd.append("image", form.image);
    await axios.post("/api/posters", fd);
    setForm({ title: "", edition: "", image: null });
    fetchPosters();
    setUploading(false);
  };

  const toggleActive = async (id, current) => {
    await axios.put(`/api/posters/${id}`, { isActive: !current });
    fetchPosters();
  };

  const deletePoster = async (id) => {
    if (!window.confirm("Delete this poster?")) return;
    await axios.delete(`/api/posters/${id}`);
    fetchPosters();
  };

  return (
    <div>
      <h5 className="fw-bold mb-4">Poster Management</h5>

      {/* Upload Form */}
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-4">
          <h6 className="fw-bold mb-3">Upload New Poster</h6>
          <div className="row g-3">
            <div className="col-md-4">
              <input className="form-control" placeholder="Poster title (e.g. May 4th Edition)"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="col-md-3">
              <input className="form-control" placeholder="Edition tag (optional)"
                value={form.edition} onChange={e => setForm(f => ({ ...f, edition: e.target.value }))} />
            </div>
            <div className="col-md-3">
              <input type="file" className="form-control" accept="image/*"
                onChange={e => setForm(f => ({ ...f, image: e.target.files[0] }))} />
            </div>
            <div className="col-md-2">
              <button className="btn btn-danger w-100" onClick={handleUpload} disabled={uploading}>
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Poster Grid */}
      <div className="row row-cols-2 row-cols-md-4 g-3">
        {posters.map(p => (
          <div key={p._id} className="col">
            <div className={`card border-0 shadow-sm rounded-3 overflow-hidden ${!p.isActive ? "opacity-50" : ""}`}>
              <img src={p.imageUrl} alt={p.title}
                style={{ width: "100%", height: 160, objectFit: "cover" }} />
              <div className="card-body p-2">
                <small className="fw-bold d-block mb-1 text-truncate">{p.title}</small>
                {p.edition && <small className="text-muted">{p.edition}</small>}
                <div className="d-flex gap-1 mt-2">
                  <button className={`btn btn-xs btn-sm flex-grow-1 ${p.isActive ? "btn-success" : "btn-outline-secondary"}`}
                    style={{ fontSize: 11 }}
                    onClick={() => toggleActive(p._id, p.isActive)}>
                    {p.isActive ? "Active" : "Hidden"}
                  </button>
                  <button className="btn btn-sm btn-outline-danger" style={{ fontSize: 11 }}
                    onClick={() => deletePoster(p._id)}>
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}