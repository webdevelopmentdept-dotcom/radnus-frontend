import { useState, useEffect } from "react";
import axios from "axios";
import { FileText, Download, Building2, Tag, Layers, BookOpen, XCircle } from "lucide-react";
import EmployeeLayout from "./EmployeeLayout";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function EmployeeSOPView() {
  const [sops,    setSops]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const employeeId = localStorage.getItem("employeeId");

  useEffect(() => {
    const fetchSOPs = async () => {
      setLoading(true);
      try {
        const empRes = await axios.get(`${API_BASE}/api/employee/me/${employeeId}`);
        const emp = empRes.data;

        if (!emp?.department) {
          setError("Department not assigned to your profile.");
          setLoading(false);
          return;
        }

        const sopRes = await axios.get(`${API_BASE}/api/sops/my`, {
          params: {
            department:  emp.department,
            designation: emp.designation || "",
          },
        });
        setSops(sopRes.data.data || []);
      } catch {
        setError("Failed to load SOPs. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (employeeId) fetchSOPs();
    else setError("Not logged in.");
  }, [employeeId]);

  const deptSOPs = sops.filter(s => !s.designation);
  const roleSOPs = sops.filter(s => !!s.designation);

  const employeeName = localStorage.getItem("employeeName") || "";

  return (
    <EmployeeLayout>
      <div style={{ background: "#f4f6fb", minHeight: "100vh" }}>

        {/* ── Header ── */}
        <header style={{
          background: "#fff",
          padding: "14px 28px",
          borderBottom: "1px solid #e5e7eb",
          position: "sticky",
          top: 0,
          zIndex: 50,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
        }}>
          <div className="d-flex align-items-center gap-3">
            <span className="fw-bold text-primary d-none d-sm-inline">My SOPs</span>
            <div
              className="ms-auto bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: 40, height: 40, fontSize: 16, fontWeight: 700 }}
            >
              {employeeName?.charAt(0) || "E"}
            </div>
          </div>
        </header>

        {/* ── Body ── */}
        <div className="container-fluid" style={{ padding: 28 }}>

          {/* Page title */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 11,
              background: "#eff6ff", border: "1px solid #bfdbfe",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <BookOpen size={20} color="#2563eb" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
                My SOPs
              </h2>
              <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>
                Standard Operating Procedures assigned to your role
              </p>
            </div>
          </div>

          {/* ── Loading ── */}
          {loading && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{
                  width: 32, height: 32,
                  border: "3px solid #e5e7eb",
                  borderTopColor: "#2563eb",
                  borderRadius: "50%",
                  animation: "spin .8s linear infinite",
                  margin: "0 auto 10px"
                }} />
                <p style={{ color: "#9ca3af", fontSize: 13 }}>Loading your SOPs…</p>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {!loading && error && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
              <div style={{ textAlign: "center" }}>
                <XCircle size={36} color="#ef4444" style={{ marginBottom: 8 }} />
                <p style={{ color: "#ef4444", fontWeight: 700 }}>{error}</p>
              </div>
            </div>
          )}

          {/* ── Empty ── */}
          {!loading && !error && sops.length === 0 && (
            <div style={{
              textAlign: "center", padding: "60px 0",
              background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb"
            }}>
              <FileText size={40} color="#e5e7eb" style={{ marginBottom: 10 }} />
              <p style={{ color: "#6b7280", fontWeight: 700, fontSize: 14, margin: "0 0 4px" }}>
                No SOPs assigned yet
              </p>
              <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>
                Your HR team will add SOPs for your department soon.
              </p>
            </div>
          )}

          {/* ── SOP Sections ── */}
          {!loading && !error && sops.length > 0 && (
            <>
              <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

              {deptSOPs.length > 0 && (
                <Section
                  icon={<Building2 size={14} color="#7c3aed" />}
                  title="Department SOPs"
                  subtitle="Applies to all roles in your department"
                  color="#7c3aed"
                  bg="#faf5ff"
                  border="#ddd6fe"
                  sops={deptSOPs}
                />
              )}

              {roleSOPs.length > 0 && (
                <Section
                  icon={<Tag size={14} color="#2563eb" />}
                  title="Your Role SOPs"
                  subtitle="Specific to your designation"
                  color="#2563eb"
                  bg="#eff6ff"
                  border="#bfdbfe"
                  sops={roleSOPs}
                />
              )}
            </>
          )}

        </div>
      </div>
    </EmployeeLayout>
  );
}

// ─── Section Component ────────────────────────────────────────────────────────
function Section({ icon, title, subtitle, color, bg, border, sops }) {
  return (
    <div style={{ marginBottom: 24, animation: "fadeUp .25s ease both" }}>

      {/* Section Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: bg, border: `1px solid ${border}`,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          {icon}
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: "#0f172a" }}>{title}</p>
          <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>{subtitle}</p>
        </div>
        <span style={{
          marginLeft: "auto", background: bg, color,
          border: `1px solid ${border}`, borderRadius: 20,
          padding: "2px 10px", fontSize: 11, fontWeight: 700
        }}>
          {sops.length} SOP{sops.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* SOP Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sops.map((sop, i) => (
          <div
            key={sop._id}
            style={{
              background: "#fff", border: "1px solid #e5e7eb",
              borderRadius: 11, padding: "14px 18px",
              display: "flex", alignItems: "center", gap: 14,
              animation: "fadeUp .22s ease both",
              animationDelay: `${i * 0.05}s`,
              transition: "border-color .15s, box-shadow .15s"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = color;
              e.currentTarget.style.boxShadow = `0 2px 12px ${color}18`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "#e5e7eb";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* Icon */}
            <div style={{
              width: 38, height: 38, borderRadius: 9,
              background: bg, border: `1px solid ${border}`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
              <FileText size={16} color={color} />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{sop.title}</p>
              <p style={{
                margin: "2px 0 0", fontSize: 12, color: "#9ca3af",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
              }}>
                {sop.fileName}
              </p>
            </div>

            {/* Scope badge */}
            {sop.designation ? (
              <span style={{
                background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe",
                borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700,
                whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 4
              }}>
                <Tag size={9} />{sop.designation}
              </span>
            ) : (
              <span style={{
                background: "#f0fdf4", color: "#059669", border: "1px solid #bbf7d0",
                borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700,
                whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 4
              }}>
                <Layers size={9} />All Roles
              </span>
            )}

            {/* Download */}
            <a
              href={`${API_BASE}/api/sops/download/${sop.fileUrl}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 16px", background: "#2563eb",
                border: "none", borderRadius: 8, color: "#fff",
                fontWeight: 700, fontSize: 12, textDecoration: "none",
                flexShrink: 0, transition: "background .15s"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#1d4ed8"}
              onMouseLeave={e => e.currentTarget.style.background = "#2563eb"}
            >
              <Download size={12} /> Download
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}