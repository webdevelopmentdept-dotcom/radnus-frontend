import { useState, useEffect } from "react";
import axios from "axios";
import { FileText, Eye, X, BookOpen } from "lucide-react";
import EmployeeLayout from "./EmployeeLayout";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const API = `${API_BASE}/api/hr-induction`;
// toolbar=0 hides the PDF viewer's download/print toolbar (view only)
const viewUrl = (f) => `${API}/view/${f}#toolbar=0&navpanes=0`;

export default function EmployeeHrInduction() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/my`);
        setItems(res.data.data || []);
      } catch {
        setError("Failed to load HR Induction. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // lock background scroll while viewer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <EmployeeLayout>
      <div style={{ background: "#f4f6fb", minHeight: "100vh", padding: "24px 28px", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div style={{ background: "#eff6ff", borderRadius: 10, padding: 9 }}><BookOpen size={20} color="#2563eb" /></div>
          <h2 style={{ margin: 0, fontSize: 22, color: "#1a1a2e" }}>HR Induction</h2>
        </div>
        <p style={{ margin: "0 0 22px", fontSize: 13, color: "#6b7280" }}>
          Read through these induction documents to get familiar with the company.
        </p>

        {loading ? (
          <p style={{ color: "#6b7280" }}>Loading...</p>
        ) : error ? (
          <p style={{ color: "#dc2626" }}>{error}</p>
        ) : items.length === 0 ? (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "56px 20px", textAlign: "center" }}>
            <FileText size={48} color="#d1d5db" />
            <h3 style={{ color: "#1f2937", margin: "12px 0 6px" }}>No induction documents yet</h3>
            <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>HR has not published any induction material.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {items.map((it) => (
              <div key={it._id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 18, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ background: "#fee2e2", borderRadius: 10, padding: 10, flexShrink: 0 }}><FileText size={22} color="#dc2626" /></div>
                  <h4 style={{ margin: 0, fontSize: 15, color: "#1a1a2e", wordBreak: "break-word", lineHeight: 1.4 }}>{it.title}</h4>
                </div>
                {it.description && <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.55, margin: "12px 0 0", flex: 1 }}>{it.description}</p>}
                <button onClick={() => setOpen(it)}
                  style={{ marginTop: 16, background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Eye size={15} /> View
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "min(1000px, 100%)", height: "92vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 18px", borderBottom: "1px solid #e5e7eb" }}>
              <div style={{ minWidth: 0 }}>
                <strong style={{ fontSize: 15, color: "#1a1a2e", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{open.title}</strong>
              </div>
              <button onClick={() => setOpen(null)} aria-label="Close"
                style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", display: "flex" }}>
                <X size={16} color="#374151" />
              </button>
            </div>
            <iframe title={open.title} src={viewUrl(open.fileUrl)} style={{ flex: 1, border: "none", width: "100%" }} />
          </div>
        </div>
      )}
    </EmployeeLayout>
  );
}