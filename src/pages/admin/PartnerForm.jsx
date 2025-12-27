import React, { useState } from "react";

export default function PartnerForm({
  editingId,
  form,
  setForm,
  submitPartner,
  setShowForm,
}) {
  const [errorPopup, setErrorPopup] = useState({
    show: false,
    message: "",
  });

  const [successPopup, setSuccessPopup] = useState({
    show: false,
    email: "",
    password: "",
  });

  const [copied, setCopied] = useState(false);

  /* FORM INPUT HANDLER */
  const handleFormChange = (e) => {
    const { name, value, files } = e.target;
    setForm({ ...form, [name]: files ? files[0] : value });
  };

  /* COPY CREDENTIALS */
  const copyCredentials = () => {
    const text = `Login ID: ${successPopup.email}\nPassword: ${successPopup.password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* SUBMIT */
  const onSubmit = async (e) => {
    const result = await submitPartner(e);

    if (result.success) {
      if (!editingId) {
        setSuccessPopup({
          show: true,
          email: form.email,
          password: form.password,
        });
      }
      setShowForm(false);
    } else {
      setErrorPopup({
        show: true,
        message: result.message,
      });
    }
  };

  return (
    <div className="overlay">

      {/* MAIN ADD / EDIT FORM */}
      <div className="card p-4 shadow-lg popup" style={{ width: 450 }}>
        <h4 className="fw-bold text-primary mb-3">
          {editingId ? "Edit Partner" : "Add New Partner"}
        </h4>

        <form onSubmit={onSubmit}>
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

          {/* PASSWORD ONLY FOR ADD */}
          {!editingId && (
            <input
              name="password"
              className="form-control mb-2"
              placeholder="Password"
              value={form.password}
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
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>

            <button type="submit" className="btn btn-success px-3">
              {editingId ? "Update Partner" : "Create Partner"}
            </button>
          </div>
        </form>
      </div>

      {/* ERROR POPUP */}
      {errorPopup.show && (
        <div className="overlay">
          <div className="card p-4 border-danger shadow-lg" style={{ width: 350 }}>
            <h4 className="text-danger fw-bold">⚠ Error</h4>
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

      {/* SUCCESS POPUP */}
      {successPopup.show && (
        <div className="overlay">
          <div className="card p-4 shadow-lg position-relative" style={{ width: 450 }}>
            <button
              onClick={copyCredentials}
              className="btn btn-light btn-sm position-absolute"
              style={{ top: 10, right: 10 }}
            >
              📋
            </button>

            {copied && (
              <p className="text-success small position-absolute" style={{ top: 45, right: 15 }}>
                Copied!
              </p>
            )}

            <h4 className="text-success fw-bold mb-3 mt-4">
              🎉 Partner Created Successfully!
            </h4>

            <p className="fw-semibold mb-1">Login ID</p>
            <input className="form-control mb-3" value={successPopup.email} readOnly />

            <p className="fw-semibold mb-1">Password</p>
            <input className="form-control mb-3" value={successPopup.password} readOnly />

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
    </div>
  );
}
