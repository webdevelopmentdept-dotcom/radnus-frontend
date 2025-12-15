import React, { useState, useEffect } from "react";

export default function LeadList() {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState("");

  const [showRemarkPopup, setShowRemarkPopup] = useState(false);
  const [remark, setRemark] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/lead/all");
      const data = await res.json();

      if (data.success && Array.isArray(data.leads)) {
        setLeads(data.leads);
      } else {
        setLeads([]);
      }
    } catch (err) {
      console.error("Error loading leads", err);
    }
  };

  // -------------------------------
  // INSTANT APPROVE
  // -------------------------------
  const approveLead = async (lead) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/lead/update-status/${lead._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
          status: "APPROVED",
          remark: "Approved",
}),

        }
      );

      const data = await res.json();
      if (data.success) {
        alert("Lead Approved!");
        loadLeads();
      } else {
        alert("Failed to approve");
      }
    } catch (err) {
      console.error(err);
      alert("Server Error!");
    }
  };

  // -------------------------------
  // REJECT — POPUP SUBMIT
  // -------------------------------
  const submitRemark = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/lead/update-status/${selectedLead._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
         status: "REJECTED",
         remark: remark,
}),

        }
      );

      const data = await res.json();

      if (data.success) {
        alert("Lead Rejected!");
        loadLeads();
      } else {
        alert("Failed to reject");
      }
    } catch (err) {
      console.error(err);
      alert("Server Error!");
    }

    setShowRemarkPopup(false);
    setRemark("");
  };

  const openRemarkPopup = (lead) => {
    setSelectedLead(lead);
    setShowRemarkPopup(true);
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });



  const deleteLead = async (lead) => {
  if (!window.confirm(`Delete ${lead.name}?`)) return;

  try {
    const res = await fetch(
      `http://localhost:5000/api/lead/delete/${lead._id}`,
      { method: "DELETE" }
    );

    const data = await res.json();

    if (data.success) {
      alert("Lead deleted successfully!");
      loadLeads(); // 🔄 refresh list
    } else {
      alert(data.message || "Failed to delete lead");
    }
  } catch (err) {
    console.error("Delete error:", err);
    alert("Server Error while deleting lead");
  }
};



  return (
    <div className="container mt-4 pb-5">
      <div className="d-flex align-items-center mb-4">
        <img
          src="https://img.icons8.com/color/48/combo-chart--v1.png"
          alt="icon"
          style={{ width: "38px", marginRight: "12px" }}
        />
        <h2 className="fw-bold text-primary m-0">Lead Management</h2>
      </div>

      {/* SEARCH BAR */}
      <div style={{ maxWidth: "380px" }} className="mb-4">
        <input
          type="text"
          className="form-control shadow-sm"
          placeholder="🔍 Search student / phone / partner..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ borderRadius: "10px", height: "45px" }}
        />
      </div>

      <div className="card shadow-sm border-0 rounded-4">
        <div className="card-body table-responsive p-0">
          <table className="table table-hover align-middle">
            <thead className="bg-light">
              <tr>
                <th className="px-3">#</th>
                <th>Date</th>
                <th>Student</th>
                <th>Partner</th>
                <th>Course</th>
                <th>Phone</th>
                <th>Advance</th>
                <th>Proof</th>
                <th>Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {leads.length === 0 && (
                <tr>
                  <td colSpan="10" className="text-center py-4 text-muted">
                    No leads found
                  </td>
                </tr>
              )}

              {leads
                .filter((l) =>
                  (l.name + l.phone + l.partnerName)
                    .toLowerCase()
                    .includes(search.toLowerCase())
                )
                .map((l, i) => (
                  <tr key={l._id}>
                    <td className="px-3">{i + 1}</td>
                    <td>{formatDate(l.createdAt)}</td>

                    <td className="fw-semibold">{l.name}</td>
                    <td>{l.partnerName}</td>
                    <td style={{ maxWidth: "200px" }}>{l.course}</td>
                    <td>{l.phone}</td>
                    <td className="fw-bold text-success">₹{l.advance}</td>

                    {/* FIXED PROOF SECTION */}
                    <td>
                   {l.proof && l.proof !== "" ? (

                        <>
                          {/* VIEW FILE */}
                          <a
                            href={`http://localhost:5000${l.proof}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-light border me-2 rounded-circle p-2"
                            style={{
                              width: "40px",
                              height: "40px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <i className="bi bi-eye text-primary"></i>
                          </a>

                          {/* DOWNLOAD FILE */}
                          <a
                            href={`http://localhost:5000/api/lead/download/${l.proof
                              .replace("/uploads/", "")}`}
                            className="btn btn-light border rounded-circle p-2"
                            style={{
                              width: "40px",
                              height: "40px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <i className="bi bi-download text-success"></i>
                          </a>
                        </>
                      ) : (
                        <span className="text-muted">No File</span>
                      )}
                    </td>

                    <td>
                   {l.status === "PENDING" && <span className="badge bg-warning">Pending</span>}
{l.status === "APPROVED" && <span className="badge bg-success">Approved</span>}
{l.status === "REJECTED" && <span className="badge bg-danger">Rejected</span>}

                      
                    </td>

                                     <td className="text-center">
  <div className="dropdown">
    <button className="btn btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
      Actions
    </button>

    <ul className="dropdown-menu">
      <li>
        <button className="dropdown-item text-success" onClick={() => approveLead(l)}>
          ✅ Approve
        </button>
      </li>

      <li>
        <button className="dropdown-item text-warning" onClick={() => openRemarkPopup(l)}>
          ⚠️ Reject
        </button>
      </li>

      <li>
        <button className="dropdown-item text-danger fw-bold" onClick={() => deleteLead(l)}>
          🗑️ Delete
        </button>
      </li>
    </ul>
  </div>
</td>


                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REJECT POPUP */}
      {showRemarkPopup && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex justify-content-center align-items-center"
          style={{ zIndex: 2000 }}
        >
          <div
            className="card shadow-lg p-4"
            style={{ width: "420px", borderRadius: "12px" }}
          >
            <h5 className="fw-bold mb-3">
              Reject Lead – {selectedLead?.name}
            </h5>

            <textarea
              className="form-control mb-3"
              rows="3"
              placeholder="Write remark..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              style={{ borderRadius: "10px" }}
            ></textarea>

            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-secondary px-4"
                style={{ borderRadius: "8px" }}
                onClick={() => setShowRemarkPopup(false)}
              >
                Cancel
              </button>

              <button
                className="btn btn-primary px-4"
                style={{ borderRadius: "8px" }}
                onClick={submitRemark}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
