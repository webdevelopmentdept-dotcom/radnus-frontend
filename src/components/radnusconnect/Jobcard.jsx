import React from "react";
import {
  FiMapPin, FiClock, FiDollarSign, FiBriefcase,
  FiPhone, FiCalendar, FiStar, FiTool,
} from "react-icons/fi";

const STATUS_STYLE = {
  "Open":       { bg: "#e8f5e9", color: "#2e7d32" },
  "In Process": { bg: "#fff3e0", color: "#e65100" },
  "Completed":  { bg: "#e3f2fd", color: "#1565c0" },
  "Archived":   { bg: "#f5f5f5", color: "#757575" },
  "Pending":    { bg: "#fafafa", color: "#9e9e9e" },
};

export default function JobCard({ job }) {
  const s = STATUS_STYLE[job.jobStatus] || STATUS_STYLE["Open"];
  const postedDate = job.postedAt
    ? new Date(job.postedAt).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      })
    : "Recently";

  return (
    <div
      className="card border-0 rounded-4 h-100"
      style={{
        boxShadow: job.featured
          ? "0 4px 24px rgba(214,31,38,0.18)"
          : "0 2px 16px rgba(0,0,0,0.08)",
        transition: "transform 0.25s, box-shadow 0.25s",
        border: job.featured ? "1.5px solid #f5c0c2" : "1.5px solid #f5f5f5",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-5px)";
        e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.14)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = job.featured
          ? "0 4px 24px rgba(214,31,38,0.18)"
          : "0 2px 16px rgba(0,0,0,0.08)";
      }}
    >
      {/* Featured accent bar */}
      {job.featured && (
        <div
          style={{
            height: 4,
            background: "linear-gradient(90deg, #d61f26, #ff6b6b)",
          }}
        />
      )}

      <div className="card-body p-4">
        {/* ── Header ── */}
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div style={{ flex: 1, minWidth: 0 }}>
            {job.featured && (
              <span
                className="badge me-2"
                style={{
                  background: "#fff3cd",
                  color: "#856404",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                }}
              >
                <FiStar size={10} className="me-1" />
                FEATURED
              </span>
            )}
            <h6
              className="fw-bold mb-1 text-truncate"
              style={{ fontSize: 16, color: "#1a1a1a" }}
              title={job.shopName}
            >
              {job.shopName}
            </h6>
            <small className="text-muted">{job.ownerName}</small>
          </div>

          {/* Status badge */}
          <span
            className="badge rounded-pill flex-shrink-0 ms-2"
            style={{
              background: s.bg,
              color: s.color,
              fontSize: 11,
              fontWeight: 600,
              padding: "5px 10px",
            }}
          >
            {job.jobStatus || "Open"}
          </span>
        </div>

        {/* ── Detail grid ── */}
        <div className="row row-cols-2 g-2 mb-3">
          <Detail icon={<FiMapPin size={13} />} text={`${job.district}${job.taluk ? ", " + job.taluk : ""}`} />
          <Detail icon={<FiClock size={13} />}  text={`Exp: ${job.experience || "Any"}`} />
          <Detail
            icon={<FiDollarSign size={13} />}
            text={job.salaryRange || "Negotiable"}
            bold
          />
          <Detail icon={<FiBriefcase size={13} />} text={job.jobType || "Full-time"} />
          {job.workingHours && (
            <Detail icon={<FiClock size={13} />} text={`Hours: ${job.workingHours}`} />
          )}
          {job.foodAccommodation && job.foodAccommodation !== "No" && (
            <Detail icon={<FiStar size={13} />} text={job.foodAccommodation} />
          )}
        </div>

        {/* ── Technician types / skills ── */}
        {job.technicianTypes?.length > 0 && (
          <div className="d-flex flex-wrap gap-1 mb-3">
            {job.technicianTypes.slice(0, 5).map((t, i) => (
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
                {t}
              </span>
            ))}
          </div>
        )}

        {/* ── Machines ── */}
        {job.machines?.length > 0 && (
          <div className="d-flex align-items-center gap-1 mb-3 flex-wrap">
            <FiTool size={11} className="text-muted" />
            {job.machines.slice(0, 4).map((m, i) => (
              <span key={i} style={{ fontSize: 11, color: "#757575" }}>
                {m}{i < Math.min(job.machines.length, 4) - 1 ? " ·" : ""}
              </span>
            ))}
            {job.machines.length > 4 && (
              <span style={{ fontSize: 11, color: "#999" }}>
                +{job.machines.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        <div className="d-flex align-items-center justify-content-between mt-auto pt-2"
          style={{ borderTop: "1px solid #f5f5f5" }}>
          <span className="text-muted d-flex align-items-center gap-1" style={{ fontSize: 11 }}>
            <FiCalendar size={11} /> {postedDate}
          </span>

          {/* Show phone only if available */}
          {job.mobile ? (
            <a
              href={`tel:${job.mobile}`}
              className="btn btn-danger btn-sm rounded-3 d-flex align-items-center gap-1"
              style={{ fontSize: 12, padding: "5px 14px" }}
            >
              <FiPhone size={12} /> Contact
            </a>
          ) : (
            <span
              className="btn btn-outline-danger btn-sm rounded-3"
              style={{ fontSize: 12, padding: "5px 14px", cursor: "default" }}
            >
              View Details
            </span>
          )}
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