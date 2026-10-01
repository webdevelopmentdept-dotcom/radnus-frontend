import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  FileText, Plus, Pencil, Trash2, X, Eye, Upload,
  ToggleLeft, ToggleRight, RefreshCw, Search,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const API = `${API_BASE}/api/hr-induction`;
const viewUrl = (f) => `${API}/view/${f}#toolbar=0&navpanes=0`;

const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 };
const inputStyle = {
  width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid #d1d5db",
  borderRadius: 8, fontSize: 14, outline: "none", fontFamily: "inherit", background: "#fff",
};
const btn = (bg, color = "#fff") => ({
  background: bg, color, border: "none", borderRadius: 8, padding: "9px 14px",
  fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
});

// ─── PDF preview modal ────────────────────────────────────────────────────────
function PreviewModal({ item, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 14, width: "min(960px, 100%)", height: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderBottom: "1px solid #e5e7eb" }}>
          <strong style={{ fontSize: 15, color: "#1a1a2e" }}>{item.title}</strong>
          <button onClick={onClose} style={{ ...btn("#f3f4f6", "#374151"), padding: 8 }}><X size={16} /></button>
        </div>
        <iframe title={item.title} src={viewUrl(item.fileUrl)} style={{ flex: 1, border: "none", width: "100%" }} />
      </div>
    </div>
  );
}

// ─── Add / Edit modal ─────────────────────────────────────────────────────────
function FormModal({ item, onClose, onSaved }) {
  const isEdit = !!item?._id;
  const fileRef = useRef();
  const [form, setForm] = useState({ title: item?.title || "", description: item?.description || "" });
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") { setError("Only PDF files are allowed"); e.target.value = ""; return; }
    if (f.size > 10 * 1024 * 1024) { setError("PDF must be 10MB or smaller"); e.target.value = ""; return; }
    setError(""); setFile(f);
  };

  const submit = async () => {
    if (!form.title.trim()) return setError("Title is required");
    if (!isEdit && !file) return setError("Please choose a PDF file");

    const fd = new FormData();
    fd.append("title", form.title.trim());
    fd.append("description", form.description.trim());
    if (file) fd.append("file", file);

    setSaving(true); setError("");
    try {
      if (isEdit) await axios.put(`${API}/${item._id}`, fd);
      else        await axios.post(API, fd);
      onSaved(isEdit ? "Induction updated" : "Induction added");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 14, width: "min(520px, 100%)", maxHeight: "92vh", overflowY: "auto", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 17, color: "#1a1a2e" }}>{isEdit ? "Edit HR Induction" : "Add HR Induction"}</h3>
          <button onClick={onClose} style={{ ...btn("#f3f4f6", "#374151"), padding: 8 }}><X size={16} /></button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Title *</label>
          <input style={inputStyle} value={form.title} maxLength={120}
            onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Welcome to Radnus" />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Description</label>
          <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} value={form.description} maxLength={500}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Short note about what this induction covers" />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>PDF file {isEdit ? "(leave empty to keep current)" : "*"}</label>
          <input ref={fileRef} type="file" accept="application/pdf,.pdf" onChange={pickFile} style={{ display: "none" }} />
          <button type="button" onClick={() => fileRef.current.click()}
            style={{ ...btn("#eff6ff", "#2563eb"), width: "100%", justifyContent: "center", border: "1px dashed #93c5fd", padding: 14 }}>
            <Upload size={16} /> {file ? file.name : isEdit ? `Current: ${item.fileName}` : "Choose PDF (max 10MB)"}
          </button>
        </div>

        {error && <p style={{ color: "#dc2626", fontSize: 13, margin: "0 0 12px" }}>{error}</p>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={btn("#f3f4f6", "#374151")}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ ...btn("#2563eb"), opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving..." : isEdit ? "Update" : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HrInduction() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formItem, setFormItem] = useState(undefined); // undefined = closed, null = new, object = edit
  const [preview, setPreview] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2500); };

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API);
      setItems(res.data.data || []);
    } catch {
      showToast("Failed to load inductions", "error");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const toggleStatus = async (it) => {
    try {
      await axios.patch(`${API}/${it._id}/status`, { status: it.status === "active" ? "inactive" : "active" });
      load();
    } catch { showToast("Could not update status", "error"); }
  };

  const remove = async (it) => {
    if (!window.confirm(`Delete "${it.title}" permanently?`)) return;
    try { await axios.delete(`${API}/${it._id}`); showToast("Deleted"); load(); }
    catch { showToast("Delete failed", "error"); }
  };

  const filtered = items.filter((i) =>
    `${i.title} ${i.description}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "24px 28px", background: "#f4f6fb", minHeight: "100vh", boxSizing: "border-box" }}>
      {toast && (
        <div style={{ position: "fixed", top: 16, right: 16, zIndex: 2000, background: toast.type === "error" ? "#ef4444" : "#16a34a", color: "#fff", padding: "10px 16px", borderRadius: 8, fontSize: 14, fontWeight: 500 }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, color: "#1a1a2e" }}>HR Induction</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
            Upload induction PDFs. Active ones are shown to all activated employees (view only).
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load} style={btn("#fff", "#374151")}><RefreshCw size={14} /> Refresh</button>
          <button onClick={() => setFormItem(null)} style={btn("#2563eb")}><Plus size={14} /> Add Induction</button>
        </div>
      </div>

      <div style={{ position: "relative", maxWidth: 360, marginBottom: 18 }}>
        <Search size={15} color="#9ca3af" style={{ position: "absolute", left: 12, top: 12 }} />
        <input style={{ ...inputStyle, paddingLeft: 34 }} placeholder="Search title or description"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <p style={{ color: "#6b7280" }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "56px 20px", textAlign: "center" }}>
          <FileText size={48} color="#d1d5db" />
          <h3 style={{ color: "#1f2937", margin: "12px 0 6px" }}>No inductions yet</h3>
          <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>Click "Add Induction" to upload the first PDF.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {filtered.map((it) => (
            <div key={it._id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", opacity: it.status === "inactive" ? 0.65 : 1 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ background: "#fee2e2", borderRadius: 10, padding: 10, flexShrink: 0 }}><FileText size={22} color="#dc2626" /></div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: 15, color: "#1a1a2e", wordBreak: "break-word" }}>{it.title}</h4>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af", wordBreak: "break-all" }}>{it.fileName}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20, background: it.status === "active" ? "#dcfce7" : "#f3f4f6", color: it.status === "active" ? "#16a34a" : "#6b7280" }}>
                  {it.status}
                </span>
              </div>
              {it.description && <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.5, margin: "12px 0 0" }}>{it.description}</p>}

              <div style={{ display: "flex", gap: 6, marginTop: 16, paddingTop: 14, borderTop: "1px solid #f3f4f6", flexWrap: "wrap" }}>
                <button onClick={() => setPreview(it)} style={btn("#eff6ff", "#2563eb")}><Eye size={14} /> View</button>
                <button onClick={() => setFormItem(it)} style={btn("#f3f4f6", "#374151")}><Pencil size={14} /> Edit</button>
                <button onClick={() => toggleStatus(it)} style={btn("#f3f4f6", "#374151")}>
                  {it.status === "active" ? <ToggleRight size={15} color="#16a34a" /> : <ToggleLeft size={15} />}
                  {it.status === "active" ? "Hide" : "Show"}
                </button>
                <button onClick={() => remove(it)} style={{ ...btn("#fef2f2", "#dc2626"), marginLeft: "auto" }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formItem !== undefined && (
        <FormModal item={formItem} onClose={() => setFormItem(undefined)}
          onSaved={(msg) => { setFormItem(undefined); showToast(msg); load(); }} />
      )}
      {preview && <PreviewModal item={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}