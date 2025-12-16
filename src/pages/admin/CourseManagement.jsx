import React, { useState, useEffect } from "react";

export default function CourseManagement() {
  /* ------------------------ STYLES ------------------------ */
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
    zIndex: 3000
  };

  const popupStyle = {
    width: "520px",
    background: "white",
    borderRadius: "15px",
    padding: "25px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.25)"
  };

  /* ------------------------ STATES ------------------------ */
  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    title: "",
    fee: "",
    duration: "",
    mode: "",
    curriculum: "",
    eligibility: "",
    benefits: ""
  });

  /* ------------------------ LOAD COURSES ------------------------ */
  useEffect(() => {
    loadCourses();
  }, []);
 const API = import.meta.env.VITE_API_BASE_URL;
  const loadCourses = async () => {
    try {
      const res = await fetch(`${API}/api/courses`);
      const data = await res.json();
      if (data.success) setCourses(data.courses);
    } catch (err) {
      console.error("LOAD ERROR", err);
    }
  };

  /* ------------------------ HANDLE INPUT ------------------------ */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ------------------------ SAVE / UPDATE ------------------------ */
  const saveCourse = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      curriculum: form.curriculum.split("\n").filter(Boolean),
      eligibility: form.eligibility.split("\n").filter(Boolean),
      benefits: form.benefits.split("\n").filter(Boolean)
    };

    const url = editingId
      ? `${API}/api/courses/${editingId}`
      : `${API}/api/courses`;

    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        setShowForm(false);
        setEditingId(null);
        loadCourses();
      }
    } catch (err) {
      console.error("SAVE ERROR", err);
    }
  };

  /* ------------------------ DELETE COURSE ------------------------ */
  const deleteCourse = async (id) => {
    if (!window.confirm("Delete this course?")) return;

    try {
      const res = await fetch(`${API}/api/courses/${id}`, {
        method: "DELETE"
      });

      const data = await res.json();
      if (data.success) loadCourses();
    } catch (err) {
      console.error("DELETE ERROR", err);
    }
  };

  /* ------------------------ EDIT ------------------------ */
  const editCourse = (c) => {
    setEditingId(c._id);

    setForm({
      title: c.title,
      fee: c.fee,
      duration: c.duration,
      mode: c.mode,
      curriculum: (c.curriculum || []).join("\n"),
      eligibility: (c.eligibility || []).join("\n"),
      benefits: Array.isArray(c.benefits) ? c.benefits.join("\n") : c.benefits
    });

    setShowForm(true);
  };

  /* ------------------------ SEARCH ------------------------ */
  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  /* ------------------------ UI ------------------------ */
  return (
    <div className="container mt-4 pb-5">

      {/* HEADER */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center">
          <img
            src="https://img.icons8.com/color/48/training.png"
            alt="icon"
            style={{ width: "38px", marginRight: "12px" }}
          />
          <h2 className="fw-bold text-primary m-0">Course Management</h2>
        </div>

        <button
          className="btn btn-primary shadow-sm px-4"
          onClick={() => {
            setEditingId(null);
            setForm({
              title: "",
              fee: "",
              duration: "",
              mode: "",
              curriculum: "",
              eligibility: "",
              benefits: ""
            });
            setShowForm(true);
          }}
        >
          + Add Course
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="input-group mb-4 shadow-sm" style={{ maxWidth: "380px" }}>
        <span className="input-group-text bg-white">
          <i className="bi bi-search"></i>
        </span>
        <input
          type="text"
          className="form-control"
          placeholder="Search course..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="card shadow-sm rounded-4">
        <div className="card-body table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Fee</th>
                <th>Duration</th>
                <th>Mode</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredCourses.map((c, i) => (
                <tr key={c._id}>
                  <td>{i + 1}</td>
                  <td>{c.title}</td>
                  <td>{c.fee}</td>
                  <td>{c.duration}</td>
                  <td>{c.mode}</td>

                  <td>
                    <div className="d-flex gap-2">

                      <button
                        className="btn btn-sm btn-outline-info"
                        onClick={() => setViewData(c)}
                      >
                        View
                      </button>

                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => editCourse(c)}
                      >
                        Edit
                      </button>

                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => deleteCourse(c._id)}
                      >
                        Delete
                      </button>

                    </div>
                  </td>
                </tr>
              ))}

              {filteredCourses.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    No courses found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

       {viewData && (
  <div style={overlayStyle}>
    <div
      className="course-view-popup"
      style={{
        ...popupStyle,
        width: "600px",
        maxHeight: "85vh",
        overflowY: "auto",
        color: "#000"   // 👈 FIX: MAKE TEXT BLACK
      }}
    >
      <h3 className="fw-bold text-primary mb-3">Course Details</h3>

      <h5 className="fw-semibold">Title</h5>
      <p>{viewData.title}</p>

      <h5 className="fw-semibold">Fee</h5>
      <p>{viewData.fee}</p>

      <h5 className="fw-semibold">Duration</h5>
      <p>{viewData.duration}</p>

      <h5 className="fw-semibold">Mode</h5>
      <p>{viewData.mode}</p>

      <h5 className="fw-semibold mt-3">Course Curriculum</h5>
      <ul>
        {viewData.curriculum?.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>

      <h5 className="fw-semibold mt-3">Eligibility Criteria</h5>
      <ul>
        {viewData.eligibility?.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>

      <h5 className="fw-semibold mt-3">Program Benefits</h5>
      <ul>
        {Array.isArray(viewData.benefits)
          ? viewData.benefits.map((b, i) => <li key={i}>{b}</li>)
          : <p>{viewData.benefits}</p>
        }
      </ul>

      <div className="d-flex justify-content-end mt-4">
        <button className="btn btn-secondary" onClick={() => setViewData(null)}>
          Close
        </button>
      </div>
    </div>
  </div>
)}


      {/* ------------------------ ADD / EDIT POPUP ------------------------ */}
      {showForm && (
        <div style={overlayStyle}>
          <div style={popupStyle}>

            <h4 className="fw-bold text-primary mb-3">
              {editingId ? "Edit Course" : "Add New Course"}
            </h4>

            <form onSubmit={saveCourse}>
              <input
                name="title"
                className="form-control mb-2"
                placeholder="Course Title"
                value={form.title}
                onChange={handleChange}
                required
              />

              <input
                name="fee"
                className="form-control mb-2"
                placeholder="Fee"
                value={form.fee}
                onChange={handleChange}
                required
              />

              <input
                name="duration"
                className="form-control mb-2"
                placeholder="Duration"
                value={form.duration}
                onChange={handleChange}
                required
              />

              <input
                name="mode"
                className="form-control mb-2"
                placeholder="Mode"
                value={form.mode}
                onChange={handleChange}
                required
              />

              <label className="fw-semibold mt-2">Course Curriculum</label>
              <textarea
                name="curriculum"
                className="form-control mb-2"
                rows="3"
                placeholder="Course Curriculum"
                value={form.curriculum}
                onChange={handleChange}
              ></textarea>

              <label className="fw-semibold mt-2">Eligibility</label>
              <textarea
                name="eligibility"
                className="form-control mb-2"
                rows="3"
                placeholder="Eligibility"
                value={form.eligibility}
                onChange={handleChange}
              ></textarea>

              <label className="fw-semibold mt-2">Benefits</label>
              <textarea
                name="benefits"
                className="form-control mb-3"
                rows="3"
                placeholder="Benefits"
                value={form.benefits}
                onChange={handleChange}
              ></textarea>

              <div className="d-flex justify-content-end">
                <button
                  type="button"
                  className="btn btn-outline-secondary me-2"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button className="btn btn-success px-4" type="submit">
                  {editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
