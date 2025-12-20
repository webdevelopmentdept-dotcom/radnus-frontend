import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import tnDistrictData from "../../components/radnusconnect/TnDistrictData";


/* 🔹 Small UI helpers */
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

export default function ShopOwnerList() {
  const [list, setList] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const [district, setDistrict] = useState("");
  const [search, setSearch] = useState("");


  const API = import.meta.env.VITE_API_BASE_URL;

  /* 📥 FETCH */
  useEffect(() => {
    fetch(`${API}/api/shop-owner`)
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

  // District filter
  if (district) {
    data = data.filter(
      (d) => d.district?.toLowerCase() === district.toLowerCase()
    );
  }

  // Shop name search
  if (search) {
    data = data.filter((d) =>
      d.shopName?.toLowerCase().includes(search.toLowerCase())
    );
  }

  setFiltered(data);
}, [district, search, list]);


  /* 📊 EXPORT EXCEL – ALL FIELDS */
const exportExcel = () => {
  const formatted = list.map((i) => ({
    ShopName: i.shopName,
    Owner: i.ownerName,
    Mobile: i.mobile,
    District: i.district,
    Taluk: i.taluk,
    Address: i.address,

    BusinessYears: i.businessYears,
    NeedTechnician: i.needTech,

    TechnicianTypes: i.technicianTypes?.join(", "),
    JobType: i.jobType,
    Experience: i.experience,

    PaymentType: i.paymentType,
    Salary: i.salaryRange,
    WorkingHours: i.workingHours,
    FoodStay: i.foodAccommodation,

    ToolsSetup: i.toolsSetup,
    Machines: i.machines?.join(", "),

    Timeline: i.timeline,
    Skills: i.skills,
    RadnusHire: i.radnusHire,
    Remarks: i.remarks,

    CreatedAt: new Date(i.createdAt).toLocaleString(),
  }));

  const worksheet = XLSX.utils.json_to_sheet(formatted);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "ShopOwners");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  saveAs(
    new Blob([excelBuffer], { type: "application/octet-stream" }),
    "shop_owner_requests.xlsx"
  );
};
const deleteShopOwner = async (id) => {
  if (!window.confirm("Are you sure you want to delete this shop owner?"))
    return;

  try {
    const res = await fetch(`${API}/api/shop-owner/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Delete failed");

    // remove from UI immediately
    setList((prev) => prev.filter((i) => i._id !== id));
    setFiltered((prev) => prev.filter((i) => i._id !== id));
  } catch (err) {
    console.error(err);
    alert("Delete failed");
  }
};



  if (loading) return <div className="p-4">Loading…</div>;

  return (
    <div className="container-fluid p-4">
   {/* PAGE HEADER */}
<div className="container-fluid mt-4 pb-3">
  <div className="d-flex align-items-center mb-4">
    <img
      src="https://img.icons8.com/color/48/shop.png"
      alt="icon"
      style={{ width: "38px", marginRight: "12px" }}
    />
    <h2 className="fw-bold text-primary m-0">Shop Owner Management</h2>
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

    {/* SHOP SEARCH */}
    <div className="col-md-4">
      <input
        type="text"
        className="form-control shadow-sm"
        placeholder="🔍 Search by shop name..."
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
              <th>Shop</th>
              <th>Owner</th>
              <th>Mobile</th>
              <th>District</th>
              <th>Business Years</th>
              <th>NeedTech</th>
              <th>Job Type</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center text-muted py-4">
                  No records found
                </td>
              </tr>
            ) : (
              filtered.map((i, idx) => (
                <tr key={i._id}>
                  <td>{idx + 1}</td>
                  <td>{i.shopName}</td>
                  <td>{i.ownerName}</td>
                  <td>{i.mobile}</td>
                  <td>{i.district}</td>
                   <td>{i.businessYears}</td>
      <td>{i.needTech}</td>
      <td>{i.jobType}</td>

                 <td className="d-flex gap-2">
  <button
    className="btn btn-sm btn-outline-primary"
    onClick={() => setSelected(i)}
  >
    View
  </button>

  <button
    className="btn btn-sm btn-outline-danger"
    onClick={() => deleteShopOwner(i._id)}
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

      {/* 🔍 VIEW MODAL */}
      {selected && (
        <div
          className="modal fade show d-block"
          style={{ background: "rgba(0,0,0,0.55)" }}
        >
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header bg-light">
                <h5 className="fw-bold">
                  {selected.shopName} – Full Details
                </h5>
                <button className="btn-close" onClick={() => setSelected(null)} />
              </div>

              <div className="modal-body bg-light">
                {/* SHOP */}
                <div className="bg-white rounded p-3 mb-3 shadow-sm">
                  <h6 className="fw-bold text-danger mb-3">Shop Info</h6>
                  <div className="row">
                    <div className="col-md-4"><Info label="Shop Name" value={selected.shopName} /></div>
                    <div className="col-md-4"><Info label="Owner" value={selected.ownerName} /></div>
                    <div className="col-md-4"><Info label="Mobile" value={selected.mobile} /></div>
                    <div className="col-md-4"><Info label="Business Years" value={selected.businessYears} /></div>
                  </div>
                </div>

                {/* LOCATION */}
                <div className="bg-white rounded p-3 mb-3 shadow-sm">
                  <h6 className="fw-bold text-danger mb-3">Location</h6>
                  <div className="row">
                    <div className="col-md-4"><Info label="District" value={selected.district} /></div>
                    <div className="col-md-4"><Info label="Taluk" value={selected.taluk} /></div>
                    <div className="col-md-12"><Info label="Address" value={selected.address} /></div>
                  </div>
                </div>

                {/* JOB */}
                <div className="bg-white rounded p-3 mb-3 shadow-sm">
                  <h6 className="fw-bold text-danger mb-3">Job Requirement</h6>
                  <div className="row">
                    <div className="col-md-4"><Info label="Need Technician" value={selected.needTech} /></div>
                    <div className="col-md-4"><Info label="Job Type" value={selected.jobType} /></div>
                    <div className="col-md-4"><Info label="Experience" value={selected.experience} /></div>
                    <div className="col-md-12">
                      <div className="text-muted small">Technician Types</div>
                      <Badges items={selected.technicianTypes} />
                    </div>
                  </div>
                </div>

                {/* PAYMENT */}
                <div className="bg-white rounded p-3 mb-3 shadow-sm">
                  <h6 className="fw-bold text-danger mb-3">Payment</h6>
                  <div className="row">
                    <div className="col-md-4"><Info label="Payment Type" value={selected.paymentType} /></div>
                    <div className="col-md-4"><Info label="Salary" value={selected.salaryRange} /></div>
                    <div className="col-md-4"><Info label="Working Hours" value={selected.workingHours} /></div>
                    <div className="col-md-4"><Info label="Food / Stay" value={selected.foodAccommodation} /></div>
                  </div>
                </div>

                {/* TOOLS */}
                <div className="bg-white rounded p-3 mb-3 shadow-sm">
                  <h6 className="fw-bold text-danger mb-3">Tools & Machines</h6>
                  <div className="row">
                    <div className="col-md-4"><Info label="Tools Setup" value={selected.toolsSetup} /></div>
                    <div className="col-md-8">
                      <div className="text-muted small">Machines</div>
                      <Badges items={selected.machines} />
                    </div>
                  </div>
                </div>

                {/* OTHER */}
                <div className="bg-white rounded p-3 shadow-sm">
                  <h6 className="fw-bold text-danger mb-3">Other</h6>
                  <div className="row">
                    <div className="col-md-4"><Info label="Timeline" value={selected.timeline} /></div>
                    <div className="col-md-4"><Info label="Radnus Hire" value={selected.radnusHire} /></div>
                    <div className="col-md-12"><Info label="Skills" value={selected.skills} /></div>
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
