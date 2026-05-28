import React from "react";
import {
  FiMapPin, FiAward, FiDollarSign, FiBriefcase,
  FiStar, FiCalendar,
} from "react-icons/fi";

const STATUS_STYLE = {
  "Available": { bg: "#e8f5e9", color: "#2e7d32" },
  "Interview":  { bg: "#fff3e0", color: "#e65100" },
  "Hired":      { bg: "#e3f2fd", color: "#1565c0" },
  "Archived":   { bg: "#f5f5f5", color: "#757575" },
  "New":        { bg: "#fafafa", color: "#9e9e9e" },
};

const AVATAR_COLORS = [
  "#d61f26", "#e65100", "#1565c0", "#2e7d32", "#6a1b9a",
];

export default function TechnicianCard({ tech }) {
  const s = STATUS_STYLE[tech.availabilityStatus] || STATUS_STYLE["Available"];

  // Deterministic color from name
  const colorIdx =
    tech.fullName
      ? tech.fullName.charCodeAt(0) % AVATAR_COLORS.length
      : 0;
  const avatarColor = AVATAR_COLORS[colorIdx];
  const initials = tech.fullName
    ? tech.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "T";

  const joinedDate = tech.publishedAt
    ? new Date(tech.publishedAt).toLocaleDateString("en-IN", {
        month: "short", year: "numeric",
      })
    : null;

  return (
    <div
      className="card border-0 rounded-4 h-100"
      style={{
        boxShadow: tech.featured
          ? "0 4px 24px rgba(214,31,38,0.18)"
          : "0 2px 16px rgba(0,0,0,0.08)",
        border: tech.featured ? "1.5px solid #f5c0c2" : "1.5px solid #f5f5f5",
        transition: "transform 0.25s, box-shadow 0.25s",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-5px)";
        e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.14)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = tech.featured
          ? "0 4px 24px rgba(214,31,38,0.18)"
          : "0 2px 16px rgba(0,0,0,0.08)";
      }}
    >
      {tech.featured && (
        <div style={{ height: 4, background: "linear-gradient(90deg, #d61f26, #ff6b6b)" }} />
      )}

      <div className="card-body p-4">
        {/* ── Header ── */}
        <div className="d-flex align-items-center gap-3 mb-3">
          {/* Avatar */}
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              background: avatarColor,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {tech.featured && (
              <span
                style={{
                  background: "#fff3cd",
                  color: "#856404",
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "2px 7px",
                  borderRadius: 999,
                  display: "inline-block",
                  marginBottom: 3,
                }}
              >
                <FiStar size={9} className="me-1" />FEATURED
              </span>
            )}
            <h6 className="fw-bold mb-0 text-truncate" style={{ fontSize: 15 }}>
              {tech.fullName || "Technician"}
            </h6>
            <span
              className="badge rounded-pill"
              style={{
                background: s.bg,
                color: s.color,
                fontSize: 11,
                fontWeight: 600,
                padding: "3px 9px",
              }}
            >
              {tech.availabilityStatus || "Available"}
            </span>
          </div>
        </div>

        {/* ── Details ── */}
        <div className="row row-cols-2 g-2 mb-3">
          <Detail icon={<FiMapPin size={13} />}
            text={[tech.district, tech.taluk].filter(Boolean).join(", ") || "—"} />
          <Detail icon={<FiAward size={13} />}
            text={tech.experience ? `${tech.experience} exp` : "—"} />
          <Detail
            icon={<FiDollarSign size={13} />}
            text={
              tech.expectedSalary
                ? `₹${Number(tech.expectedSalary).toLocaleString("en-IN")}/mo`
                : "Negotiable"
            }
            bold
          />
          <Detail icon={<FiBriefcase size={13} />}
            text={tech.jobType || "Full-time"} />
        </div>

        {/* ── Skills ── */}
        {tech.skills?.length > 0 && (
          <div className="d-flex flex-wrap gap-1 mb-3">
            {tech.skills.slice(0, 5).map((sk, i) => (
              <span
                key={i}
                style={{
                  background: "#ffeaea",
                  color: "#d61f26",
                  fontSize: 11,
                  padding: "3px 9px",
                  borderRadius: 999,
                  fontWeight: 500,
                }}
              >
                {sk}
              </span>
            ))}
          </div>
        )}

        {/* ── Brands ── */}
        {tech.brands?.length > 0 && (
          <p className="text-muted mb-3" style={{ fontSize: 11 }}>
            Brands: {tech.brands.slice(0, 4).join(" · ")}
          </p>
        )}

        {/* ── Footer ── */}
        <div
          className="d-flex align-items-center justify-content-between pt-2"
          style={{ borderTop: "1px solid #f5f5f5" }}
        >
          {joinedDate ? (
            <span className="text-muted d-flex align-items-center gap-1" style={{ fontSize: 11 }}>
              <FiCalendar size={11} /> Since {joinedDate}
            </span>
          ) : (
            <span />
          )}
          <button
            className="btn btn-outline-danger btn-sm rounded-3"
            style={{ fontSize: 12, padding: "5px 14px" }}
          >
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
}

function Detail({ icon, text, bold }) {
  return (
    <div className="col d-flex align-items-center gap-1" style={{ fontSize: 12 }}>
      <span className="text-danger flex-shrink-0">{icon}</span>
      <span
        className={`text-truncate ${bold ? "fw-semibold" : "text-muted"}`}
        title={text}
      >
        {text}
      </span>
    </div>
  );
}