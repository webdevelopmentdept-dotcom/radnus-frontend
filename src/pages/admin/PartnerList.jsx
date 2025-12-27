import React, { useState, useEffect } from "react";

export default function PartnerList() {
  // ===================== POPUP CENTER CSS =====================
  const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backdropFilter: "blur(2px)",
    zIndex: 3000,
  };

  const popupStyle = {
    width: "450px",
    background: "white",
    borderRadius: "15px",
    padding: "25px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
    animation: "popupShow 0.2s ease-in-out",
  };

  // ===================== STATES =====================
  const [partners, setPartners] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    document: null,
  });

  const [search, setSearch] = useState("");
 const API = import.meta.env.VITE_API_BASE_URL;
  const [successPopup, setSuccessPopup] = useState({
    show: false,
    email: "",
    password: "",
  });

  const [copied, setCopied] = useState(false);

  const [errorPopup, setErrorPopup] = useState({
    show: false,
    message: "",
  });

  // ===================== LOAD PARTNERS =====================
  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      const res = await fetch(`${API}/api/partners/all`);
      const data = await res.json();
      setPartners(data);
    } catch (err) {
      console.log("Error loading partners", err);
    }
  };

  // ===================== FORM INPUT =====================
  const handleFormChange = (e) => {
    const { name, value, files } = e.target;
    setForm({ ...form, [name]: files ? files[0] : value });
  };

  // ===================== ADD / UPDATE SUBMIT =====================
  const submitPartner = async (e) => {
    e.preventDefault();

    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("email", form.email);
    fd.append("phone", form.phone);
    fd.append("address", form.address);

    if (!editingId) fd.append("password", form.password);
    if (form.document) fd.append("document", form.document);

    const url = editingId
      ? `${API}/api/partners/update/${editingId}`
      : `${API}/api/partners/add`;

    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, { method, body: fd });
    const data = await res.json();

    if (!data.success) {
      setErrorPopup({ show: true, message: data.message });
      return;
    }

    if (!editingId) {
      setSuccessPopup({
        show: true,
        email: form.email,
        password: form.password,
      });
    }

    setShowForm(false);
    setEditingId(null);
    loadPartners();
  };

  // ===================== DELETE =====================
  const deletePartner = async (id) => {
    if (!window.confirm("Delete this partner?")) return;

    const res = await fetch(`${API}/api/partners/delete/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();
    if (data.success) loadPartners();
  };

  // ===================== ENABLE / DISABLE =====================
  const togglePartnerStatus = async (id) => {
    const res = await fetch(
      `${API}/api/partners/toggle/${id}`,
      { method: "PUT" }
    );

    const data = await res.json();
    if (data.success) loadPartners();
  };

  // ===================== EDIT =====================
  const editPartner = (partner) => {
    setForm({
      name: partner.name,
      email: partner.email,
      phone: partner.phone,
      address: partner.address,
      password: "",
      document: null,
    });

    setEditingId(partner._id);
    setShowForm(true);
  };

  // ===================== SEARCH FILTER =====================
  const filteredPartners = partners.filter((p) => {
    const combined = `${p.name} ${p.email} ${p.phone} ${p.address}`.toLowerCase();
    return combined.includes(search.toLowerCase());
  });

  // ===================== COPY CREDS =====================
  const copyCredentials = () => {
    navigator.clipboard.writeText(
      `Login ID: ${successPopup.email}\nPassword: ${successPopup.password}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ===================== UI =====================
  return (
    <div className="container mt-4 pb-5">

      {/* HEADER */}
        {/* PAGE HEADER — ADMIN STANDARD STYLE */}
<div className="d-flex align-items-center justify-content-between mb-4">
  <div className="d-flex align-items-center">
    <img
      src="https://img.icons8.com/color/48/handshake.png"

      alt="icon"
      style={{ width: "38px", marginRight: "12px" }}
    />
    <h2 className="fw-bold text-primary m-0">Partner Management</h2>
  </div>

  <button
    className="btn btn-primary shadow-sm px-4"
    style={{ borderRadius: "10px" }}
    onClick={() => {
      setEditingId(null);
      setForm({
        name: "",
        email: "",
        phone: "",
        address: "",
        password: "",
        document: null,
      });
      setShowForm(true);
    }}
  >
    + Add Partner
  </button>
</div>


      {/* SEARCH */}
      <div className="input-group mb-4 shadow-sm" style={{ maxWidth: "380px" }}>
        <span className="input-group-text bg-white">
          <i className="bi bi-search"></i>
        </span>
        <input
          type="text"
          className="form-control"
          placeholder="Search partners..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE CARD */}
      <div className="card shadow-sm border-0 rounded-4">
        <div className="card-body table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Created</th>   
                <th>Document</th>
                <th>Leads</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredPartners.map((p, i) => (
                <tr key={p._id}>
                  <td>{i + 1}</td>
                  <td className="fw-semibold">{p.name}</td>
                  <td>{p.email}</td>
                  <td>{p.phone}</td>
                  <td>{p.address}</td>

                   {/* ✔ AUTO DATE ADDED */}
  <td>{new Date(p.createdAt).toLocaleDateString()}</td>
  
                  {/* DOCUMENT BUTTONS */}
                  <td>
                    {p.document ? (
                      <div className="d-flex gap-2">
                        <a
                          href={`${API}/uploads/${encodeURIComponent(
                            p.document
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-primary"
                        >
                          View
                        </a>

                        <a
                          href={`${API}/api/partners/download/${encodeURIComponent(
                            p.document
                          )}`}
                          download
                          className="btn btn-sm btn-outline-success"
                        >
                          Download
                        </a>
                      </div>
                    ) : (
                      <span className="text-muted">No File</span>
                    )}
                  </td>

                  <td>{p.leadsCount || 0}</td>

                  <td>
                    {p.disabled ? (
                      <span className="badge bg-danger">Disabled</span>
                    ) : (
                      <span className="badge bg-success">Active</span>
                    )}
                  </td>

                  <td>
                    <div className="dropdown">
                      <button
                        className="btn btn-light btn-sm shadow-sm"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        style={{
                          borderRadius: "50%",
                          width: "34px",
                          height: "34px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <i className="bi bi-three-dots-vertical fs-5"></i>
                      </button>

                      <ul className="dropdown-menu shadow-sm rounded-3">
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => editPartner(p)}
                          >
                            ✏ Edit
                          </button>
                        </li>

                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => togglePartnerStatus(p._id)}
                          >
                            {p.disabled ? "🔓 Enable" : "🔒 Disable"}
                          </button>
                        </li>

                        <li>
                          <button
                            className="dropdown-item text-danger"
                            onClick={() => deletePartner(p._id)}
                          >
                            🗑 Delete
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

      {/* ===================== ADD / EDIT POPUP ===================== */}
      {showForm && (
        <div style={overlayStyle}>
          <div style={popupStyle}>
            <h4 className="fw-bold text-primary mb-3">
              {editingId ? "Edit Partner" : "Add New Partner"}
            </h4>

            <form onSubmit={submitPartner}>
              <input
                name="name"
                className="form-control mb-2"
                placeholder="Name"
                value={form.name}
                onChange={handleFormChange}
                required
              />

              <input
                name="email"
                type="email"
                className="form-control mb-2"
                placeholder="Email"
                value={form.email}
                onChange={handleFormChange}
                required
              />

              <input
                name="phone"
                className="form-control mb-2"
                placeholder="Phone"
                value={form.phone}
                onChange={handleFormChange}
                required
              />

              <textarea
                name="address"
                rows="2"
                className="form-control mb-2"
                placeholder="Address"
                value={form.address}
                onChange={handleFormChange}
                required
              />

              {!editingId && (
                <input
                  name="password"
                  className="form-control mb-2"
                  placeholder="Password"
                  onChange={handleFormChange}
                  required
                />
              )}

              <input
                name="document"
                type="file"
                className="form-control mb-3"
                onChange={handleFormChange}
              />

              <div className="d-flex justify-content-end">
                <button
                  type="button"
                  className="btn btn-outline-secondary me-2"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                >
                  Cancel
                </button>

                <button className="btn btn-success px-3" type="submit">
                  {editingId ? "Update Partner" : "Create Partner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== ERROR POPUP ===================== */}
      {errorPopup.show && (
        <div style={overlayStyle}>
          <div style={{ ...popupStyle, border: "2px solid red" }}>
            <h4 className="text-danger fw-bold">Error</h4>
            <p>{errorPopup.message}</p>

            <button
              className="btn btn-danger w-100 mt-3"
              onClick={() => setErrorPopup({ show: false, message: "" })}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ===================== SUCCESS POPUP ===================== */}
      {successPopup.show && (
        <div style={overlayStyle}>
          <div style={{ ...popupStyle, position: "relative" }}>
            <button
              onClick={copyCredentials}
              className="btn btn-light btn-sm position-absolute shadow-sm"
              style={{ top: 10, right: 10, borderRadius: "50%" }}
            >
              📋
            </button>

            {copied && (
              <p
                className="text-success small position-absolute"
                style={{ top: 45, right: 15 }}
              >
                Copied!
              </p>
            )}

            <h4 className="text-success fw-bold mb-3 mt-4">
              🎉 Partner Created Successfully!
            </h4>

            <p className="fw-semibold mb-1">Login ID</p>
            <input
              className="form-control mb-3"
              value={successPopup.email}
              readOnly
            />

            <p className="fw-semibold mb-1">Password</p>
            <input
              className="form-control mb-3"
              value={successPopup.password}
              readOnly
            />

            <button
              className="btn btn-success w-100"
              onClick={() =>
                setSuccessPopup({ show: false, email: "", password: "" })
              }
            >
              Done
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes popupShow {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
