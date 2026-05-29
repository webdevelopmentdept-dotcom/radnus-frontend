import React from "react";
import { FiSearch, FiX } from "react-icons/fi";

const DISTRICTS = [
  "Chennai", "Coimbatore", "Madurai", "Pondicherry / Puducherry", "Salem",
  "Tiruppur", "Tiruvallur", "Kanchipuram", "Vellore", "Tirunelveli",
  "Trichy", "Tiruvannamalai", "Cuddalore", "Thanjavur", "Erode",
  "Karur", "Namakkal", "Dharmapuri", "Krishnagiri", "Villupuram",
  "Cuddalore", "Nagapattinam", "Theni", "Ramanathapuram", "Tenkasi",
  "Tiruvarur", "Pudukkottai", "Sivaganga", "Virudhunagar", "Perambalur",
  "Ariyalur", "Kallakurichi", "Ranipet", "Chengalpattu", "Tirupattur",
];

const EXPERIENCE_OPTIONS = [
  "Any Experience", "1-2 Years", "3-5 Years", "5-10 Years", "More than 10 years",
];

const JOB_TYPES = ["Full-time", "Part-time", "Contract"];

const SKILLS = [
  "Hardware", "Software", "Unlocking", "iPhone Specialist",
  "Android", "All-round", "CPU Reballing", "Skin Machine",
];

export default function FilterPanel({ filters, onChange, type, total }) {
  const hasFilters =
    filters.search || filters.district || filters.experience || filters.jobType || filters.skill;

  const clearAll = () => {
    ["search", "district", "experience", "jobType", "skill"].forEach((k) =>
      onChange(k, "")
    );
  };

  return (
    <div
      className="rounded-4 mb-4 p-3"
      style={{
        background: "#fff",
        boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
        border: "1px solid #f0f0f0",
      }}
    >
      {/* Search bar */}
      <div className="position-relative mb-3">
        <FiSearch
          className="position-absolute text-muted"
          style={{ left: 14, top: "50%", transform: "translateY(-50%)" }}
        />
        <input
          type="text"
          className="form-control rounded-3 ps-5"
          placeholder={
            type === "jobs"
              ? "Search shop name, district, skill..."
              : "Search technician, district, skill..."
          }
          value={filters.search || ""}
          onChange={(e) => onChange("search", e.target.value)}
          style={{ border: "1.5px solid #e0e0e0", height: 44 }}
        />
        {filters.search && (
          <button
            className="btn btn-sm position-absolute"
            style={{ right: 8, top: "50%", transform: "translateY(-50%)", padding: 4 }}
            onClick={() => onChange("search", "")}
          >
            <FiX size={14} />
          </button>
        )}
      </div>

      {/* Filter row */}
      <div className="row g-2">
        {/* District */}
        <div className="col-6 col-md-3">
          <select
            className="form-select form-select-sm rounded-3"
            value={filters.district || ""}
            onChange={(e) => onChange("district", e.target.value)}
            style={{ border: "1.5px solid #e0e0e0", fontSize: 13 }}
          >
            <option value="">All Districts</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Experience */}
        <div className="col-6 col-md-3">
          <select
            className="form-select form-select-sm rounded-3"
            value={filters.experience || ""}
            onChange={(e) => onChange("experience", e.target.value)}
            style={{ border: "1.5px solid #e0e0e0", fontSize: 13 }}
          >
            <option value="">All Experience</option>
            {EXPERIENCE_OPTIONS.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        {/* Job Type (for jobs) or Skill (for technicians) */}
        {type === "jobs" ? (
          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm rounded-3"
              value={filters.jobType || ""}
              onChange={(e) => onChange("jobType", e.target.value)}
              style={{ border: "1.5px solid #e0e0e0", fontSize: 13 }}
            >
              <option value="">All Job Types</option>
              {JOB_TYPES.map((j) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm rounded-3"
              value={filters.skill || ""}
              onChange={(e) => onChange("skill", e.target.value)}
              style={{ border: "1.5px solid #e0e0e0", fontSize: 13 }}
            >
              <option value="">All Skills</option>
              {SKILLS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}

        {/* Clear + Count */}
        <div className="col-6 col-md-3 d-flex align-items-center gap-2">
          {hasFilters && (
            <button
              className="btn btn-sm btn-outline-danger rounded-3 flex-grow-1"
              onClick={clearAll}
              style={{ fontSize: 13 }}
            >
              <FiX size={13} className="me-1" /> Clear
            </button>
          )}
          {total !== undefined && (
            <span className="text-muted small ms-auto">
              {total} found
            </span>
          )}
        </div>
      </div>
    </div>
  );
}