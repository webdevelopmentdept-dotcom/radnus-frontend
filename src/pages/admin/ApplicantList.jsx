import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function ApplicantList() {
  const [applicants, setApplicants] = useState([]);
  const [search, setSearch] = useState("");

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchApplicants();
  }, []);

  const fetchApplicants = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/applicants`);
      const data = await res.json();
      setApplicants(data.applicants || []);
    } catch (err) {
      console.log("Error loading applicants");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this applicant?"))
      return;

    try {
      const res = await fetch(`${API_BASE}/api/applicants/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        alert("Applicant deleted!");
        setApplicants(applicants.filter((a) => a._id !== id));
      } else {
        alert(data.msg || "Failed to delete");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  const filtered = applicants.filter((a) =>
    (a.name + a.email + a.phone)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

 return (
  <div className="container mt-4 pb-5">

    {/* PAGE HEADER — SAME STYLE AS ALL OTHER ADMIN PAGES */}
    <div className="d-flex align-items-center justify-content-between mb-4">
      <div className="d-flex align-items-center">
        <img
          src="https://img.icons8.com/color/48/conference-call.png"
          alt="icon"
          style={{ width: "38px", marginRight: "12px" }}
        />
        <h2 className="fw-bold text-primary m-0">Training Applicants</h2>
      </div>

      <button
        className="btn btn-success btn-sm shadow-sm"
        onClick={() => downloadExcel(filtered)}
      >
        <i className="bi bi-file-earmark-excel me-2"></i>
        Export Excel
      </button>
    </div>

    {/* Search Box */}
    <div className="input-group mb-3 shadow-sm" style={{ maxWidth: "350px" }}>
      <span className="input-group-text bg-white">
        <i className="bi bi-search"></i>
      </span>
      <input
        className="form-control"
        placeholder="Search name, email, phone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>

    {/* Table */}
      {/* Table */}
<div className="table-responsive shadow-sm rounded">
  <table className="table table-hover table-bordered align-middle">
    <thead className="table-dark text-center">
      <tr>
        <th style={{ width: "60px" }}>No</th>
        <th>Name</th>
        <th>Email</th>
        <th>Phone</th>
        <th style={{ minWidth: "140px" }}>Address</th>
        <th>Course</th>

        {/* ⭐ NEW DATE & TIME COLUMN */}
        <th style={{ width: "160px" }}>Applied On</th>

        <th style={{ width: "120px" }}>Action</th>
      </tr>
    </thead>

    <tbody>
      {filtered.length === 0 ? (
        <tr>
          <td colSpan="8" className="text-center py-4 text-muted">
            <i className="bi bi-inbox fs-3"></i>
            <p className="m-0">No applicants found</p>
          </td>
        </tr>
      ) : (
        filtered.map((a, i) => (
          <tr key={a._id} className="text-center">
            <td>{i + 1}</td>

            <td className="fw-semibold text-start">{a.name}</td>
            <td>{a.email}</td>
            <td>{a.phone}</td>
            <td>{a.address || "—"}</td>

            <td>
              <span className="badge bg-primary">{a.course}</span>
            </td>

            {/* ⭐ FORMATTED DATE & TIME */}
            <td>
              {new Date(a.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
              <br />
              <small className="text-muted">
                {new Date(a.createdAt).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </small>
            </td>

            <td>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(a._id)}
              >
                <i className="bi bi-trash me-1"></i>
                Delete
              </button>
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>


  </div>
);

}

function downloadExcel(data) {
  const sheet = XLSX.utils.json_to_sheet(data);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Applicants");

  const excelBuffer = XLSX.write(book, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, "training_applicants.xlsx");
}
