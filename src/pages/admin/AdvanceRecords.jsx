import React, { useEffect, useState } from "react";

export default function AdvanceRecords() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  /* =========================
     LOAD ADVANCE RECORDS
  ========================= */
  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/lead/advance-records`
      );
      const data = await res.json();

      if (data.success) {
        setRecords(data.records);
      }
    } catch (err) {
      console.error("Error loading advance records", err);
    }
  };

  /* =========================
     DELETE RECORD
  ========================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this advance record?")) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/lead/${id}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (data.success) {
        setRecords((prev) =>
          prev.filter((r) => r._id !== id)
        );
      } else {
        alert("Delete failed");
      }
    } catch (err) {
      console.error("Delete error", err);
      alert("Server error");
    }
  };

  /* =========================
     SEARCH FILTER
  ========================= */
  const filtered = records.filter((r) => {
    const s = search.toLowerCase();
    return (
      r.partnerName?.toLowerCase().includes(s) ||
      r.name?.toLowerCase().includes(s) ||
      r.course?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="container mt-4 pb-5">

      {/* HEADER */}
      <div className="d-flex align-items-center mb-4">
        <img
          src="https://img.icons8.com/color/48/money-bag.png"
          alt="icon"
          style={{ width: "38px", marginRight: "12px" }}
        />
        <h2 className="fw-bold text-primary m-0">
          Advance Amount Records
        </h2>
      </div>

      {/* SEARCH */}
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Search partner / student / course..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* TABLE */}
      <div className="card shadow-sm rounded-4">
        <div className="card-body table-responsive">

          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Partner</th>
                <th>Student</th>
                <th>Course</th>
                <th className="text-end">Advance Amount (₹)</th>
                <th className="text-center" style={{ width: "140px" }}>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center py-4 text-muted"
                  >
                    No records found
                  </td>
                </tr>
              )}

              {filtered.map((rec, idx) => (
                <tr key={rec._id}>
                  <td>{idx + 1}</td>

                  <td>
                    {rec.date
                      ? new Date(rec.date).toLocaleDateString()
                      : "-"}
                  </td>

                  <td>{rec.partnerName || "-"}</td>
                  <td>{rec.name || "-"}</td>
                  <td>{rec.course || "-"}</td>

                  <td className="text-end fw-semibold">
                    ₹{rec.advance ?? 0}
                  </td>

                  <td className="text-center text-nowrap">
                    <button
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => alert("Edit coming soon")}
                    >
                      Edit
                    </button>

                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(rec._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>

        </div>
      </div>
    </div>
  );
}
