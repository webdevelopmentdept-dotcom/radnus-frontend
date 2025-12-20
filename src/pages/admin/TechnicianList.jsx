import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import tnDistrictData from "../../components/radnusconnect/TnDistrictData";

/* 🔹 UI helpers */
const Info = ({ label, value }) => (
  <div className="mb-2">
    <div className="text-muted small">{label}</div>
    <div className="fw-semibold">{value || "-"}</div>
  </div>
);

const Badges = ({ items }) => (
  <div className="d-flex flex-wrap gap-1">
    {items?.length
      ? items.map((v, i) => (
          <span key={i} className="badge bg-secondary">
            {v}
          </span>
        ))
      : "-"}
  </div>
);

export default function TechnicianList() {
  const [list, setList] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const [district, setDistrict] = useState("");
  const [search, setSearch] = useState("");

  const API = import.meta.env.VITE_API_BASE_URL;

  /* 📥 FETCH */
  useEffect(() => {
    fetch(`${API}/api/technician`)
      .then((res) => res.json())
      .then((data) => {
        setList(data);
        setFiltered(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  /* 🔍 FILTER */
  useEffect(() => {
    let data = [...list];

    if (district) {
      data = data.filter(
        (d) => d.district?.toLowerCase() === district.toLowerCase()
      );
    }

    if (search) {
      data = data.filter((d) =>
        d.fullName?.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFiltered(data);
  }, [district, search, list]);

  /* 📊 EXPORT EXCEL */
  const exportExcel = () => {
    const formatted = list.map((i) => ({
      FullName: i.fullName,
      Mobile: i.mobile,
      District: i.district,
      Taluk: i.taluk,
      Address: i.address,

      Experience: i.experience,
      JobType: i.jobType,
      PaymentType: i.paymentType,
      WorkLocation: i.workLocation,
      JoinReady: i.joinReady,

      Skills: i.skills?.join(", "),
      Brands: i.brands?.join(", "),
      Tools: i.tools?.join(", "),

      RadnusAgree: i.radnusAgree,
      Remarks: i.remarks,
      Status: i.status,

      CreatedAt: new Date(i.createdAt).toLocaleString(),
    }));

    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Technicians");

    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "technician_requests.xlsx");
  };

  /* 🗑 DELETE */
 const deleteTechnician = async (id) => {
  if (!window.confirm("Delete this technician?")) return;

  try {
    const res = await fetch(`${API}/api/technician/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Delete failed");

    setList((prev) => prev.filter((i) => i._id !== id));
    setFiltered((prev) => prev.filter((i) => i._id !== id));
  } catch (err) {
    alert("Delete failed");
    console.error(err);
  }
};


  if (loading) return <div className="p-4">Loading…</div>;

  return (
    <div className="container-fluid p-4">
      {/* HEADER */}
    {/* PAGE HEADER */}
<div className="container-fluid mt-4 pb-3">
  <div className="d-flex align-items-center mb-4">
   <img
  src="https://img.icons8.com/color/48/maintenance.png"
  alt="Technician"
  style={{ width: "38px", marginRight: "12px" }}
/>

    <h2 className="fw-bold text-primary m-0">
      Technician Management
    </h2>
  </div>

  {/* SEARCH + FILTER BAR */}
  <div className="row g-3 align-items-center mb-4">
    {/* DISTRICT FILTER */}
    <div className="col-md-3">
      <select
        className="form-select shadow-sm"
        value={district}
        onChange={(e) => setDistrict(e.target.value)}
        style={{ height: "45px", borderRadius: "10px" }}
      >
        <option value="">All Districts</option>
        {Object.keys(tnDistrictData).map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
    </div>

    {/* TECHNICIAN SEARCH */}
    <div className="col-md-4">
      <input
        type="text"
        className="form-control shadow-sm"
        placeholder="🔍 Search by technician name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ height: "45px", borderRadius: "10px" }}
      />
    </div>

    {/* EXPORT BUTTON */}
    <div className="col-md-5 text-end">
      <button
        className="btn btn-success px-4"
        onClick={exportExcel}
        style={{ height: "45px", borderRadius: "10px" }}
      >
        ⬇ Export Excel
      </button>
    </div>
  </div>
</div>

     

      {/* TABLE */}
      <div className="table-responsive shadow rounded bg-white">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-dark">
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Mobile</th>
              <th>District</th>
              <th>Experience</th>
              <th>Job Type</th>
              <th>Location</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center text-muted py-4">
                  No records found
                </td>
              </tr>
            ) : (
              filtered.map((i, idx) => (
                <tr key={i._id}>
                  <td>{idx + 1}</td>
                  <td>{i.fullName}</td>
                  <td>{i.mobile}</td>
                  <td>{i.district}</td>
                  <td>{i.experience}</td>
                  <td>{i.jobType}</td>
                  <td>{i.workLocation}</td>
                  <td className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setSelected(i)}
                    >
                      View
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => deleteTechnician(i._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* VIEW MODAL */}
      {selected && (
        <div
          className="modal fade show d-block"
          style={{ background: "rgba(0,0,0,0.55)" }}
        >
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header bg-light">
                <h5 className="fw-bold">
                  {selected.fullName} – Full Details
                </h5>
                <button className="btn-close" onClick={() => setSelected(null)} />
              </div>

              <div className="modal-body bg-light">
                <div className="bg-white rounded p-3 mb-3 shadow-sm">
                  <h6 className="fw-bold text-danger mb-3">Basic Info</h6>
                  <div className="row">
                    <div className="col-md-4"><Info label="Name" value={selected.fullName} /></div>
                    <div className="col-md-4"><Info label="Mobile" value={selected.mobile} /></div>
                    <div className="col-md-4"><Info label="Experience" value={selected.experience} /></div>
                  </div>
                </div>

                <div className="bg-white rounded p-3 mb-3 shadow-sm">
                  <h6 className="fw-bold text-danger mb-3">Location</h6>
                  <div className="row">
                    <div className="col-md-4"><Info label="District" value={selected.district} /></div>
                    <div className="col-md-4"><Info label="Taluk" value={selected.taluk} /></div>
                    <div className="col-md-12"><Info label="Address" value={selected.address} /></div>
                  </div>
                </div>

                <div className="bg-white rounded p-3 mb-3 shadow-sm">
                  <h6 className="fw-bold text-danger mb-3">Work Details</h6>
                  <div className="row">
                    <div className="col-md-4"><Info label="Job Type" value={selected.jobType} /></div>
                    <div className="col-md-4"><Info label="Payment Type" value={selected.paymentType} /></div>
                    <div className="col-md-4"><Info label="Work Location" value={selected.workLocation} /></div>
                    <div className="col-md-4"><Info label="Join Ready" value={selected.joinReady} /></div>
                  </div>
                </div>

                <div className="bg-white rounded p-3 mb-3 shadow-sm">
                  <h6 className="fw-bold text-danger mb-3">Skills & Tools</h6>
                  <div className="row">
                    <div className="col-md-12">
                      <div className="text-muted small">Skills</div>
                      <Badges items={selected.skills} />
                    </div>
                    <div className="col-md-12 mt-2">
                      <div className="text-muted small">Brands</div>
                      <Badges items={selected.brands} />
                    </div>
                    <div className="col-md-12 mt-2">
                      <div className="text-muted small">Tools</div>
                      <Badges items={selected.tools} />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded p-3 shadow-sm">
                  <h6 className="fw-bold text-danger mb-3">Other</h6>
                  <div className="row">
                    <div className="col-md-4"><Info label="Radnus Agree" value={selected.radnusAgree} /></div>
                    <div className="col-md-12"><Info label="Remarks" value={selected.remarks} /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
