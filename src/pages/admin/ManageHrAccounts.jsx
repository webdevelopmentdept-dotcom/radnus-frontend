import React, { useEffect, useState, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const generatePassword = () =>
  "Hr@" + Math.random().toString(36).slice(2, 8) + Math.floor(10 + Math.random() * 90);

export default function ManageHrAccounts() {
  const token = localStorage.getItem("adminToken");

  const [list, setList] = useState([]);
  const [eligible, setEligible] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [created, setCreated] = useState(null); // { loginId, password, name }
  const [form, setForm] = useState({ staffRole: "hr", employeeId: "", password: "" });
  const [mdName, setMdName] = useState("");
  const [testPwd, setTestPwd] = useState("");

  const call = useCallback(
    async (path = "", method = "GET", body) => {
      const res = await fetch(`${API_BASE}/api/admin/hr-staff${path}`, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) throw new Error("SESSION");
      if (!res.ok || data.success === false) throw new Error(data.msg || data.message || "Request failed");
      return data;
    },
    [token]
  );

  const showError = (e) =>
    setMsg({
      type: "danger",
      text:
        e.message === "SESSION"
          ? "Admin session missing or expired. Please log out and log in again as Admin."
          : e.message,
    });

  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      const staff = await call();
      setList(staff.data || []);
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }, [call]);

  // HR role only: employees from the HR department who don't have a login yet
  const loadEligible = useCallback(async () => {
    try {
      const elig = await call("/eligible-employees?role=hr");
      setEligible(elig.data || []);
    } catch (e) {
      showError(e);
    }
  }, [call]);

  useEffect(() => { loadStaff(); }, [loadStaff]);
  useEffect(() => { loadEligible(); }, [loadEligible]);

  const isMd = form.staffRole === "md";
  const selected = eligible.find((e) => e._id === form.employeeId);

  /* ---------- create HR (from employee) or MD (standalone) ---------- */
  const create = async (e) => {
    e.preventDefault();
    setMsg(null);
    setCreated(null);

    // MD: standalone account, name typed by admin, no employee link
    if (isMd) {
      if (!mdName.trim()) return setMsg({ type: "danger", text: "Please enter the MD name." });
      setSaving(true);
      try {
        const data = await call("/special-account", "POST", {
          staffRole: "md",
          name: mdName.trim(),
          password: form.password,
        });
        setCreated({ loginId: data.loginId, password: form.password, name: mdName.trim() });
        setMdName("");
        setForm({ staffRole: "md", employeeId: "", password: "" });
        loadStaff();
      } catch (err) {
        showError(err);
      } finally {
        setSaving(false);
      }
      return;
    }

    // HR: pick from HR department employees
    if (!form.employeeId) return setMsg({ type: "danger", text: "Please select an employee." });
    setSaving(true);
    try {
      const data = await call("/from-employee", "POST", form);
      setCreated({ loginId: data.loginId, password: form.password, name: selected?.name });
      setForm({ staffRole: "hr", employeeId: "", password: "" });
      loadStaff();
      loadEligible();
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  /* ---------- create test / dev-team HR id ---------- */
  const createTest = async () => {
    if (testPwd.length < 6)
      return setMsg({ type: "danger", text: "Password must be at least 6 characters." });
    setMsg(null);
    setCreated(null);
    try {
      const data = await call("/special-account", "POST", { password: testPwd });
      setCreated({ loginId: data.loginId, password: testPwd, name: "Test HR (Dev Team)" });
      setTestPwd("");
      loadStaff();
    } catch (err) {
      showError(err);
    }
  };

  const update = async (id, body, okText) => {
    setMsg(null);
    try {
      await call(`/${id}`, "PATCH", body);
      setMsg({ type: "success", text: okText });
      loadStaff();
    } catch (err) {
      showError(err);
    }
  };

  const resetPassword = async (s) => {
    const pwd = window.prompt(`New password for ${s.name} (min 6 characters):`);
    if (!pwd) return;
    setMsg(null);
    try {
      await call(`/${s._id}/password`, "PATCH", { password: pwd });
      setMsg({ type: "success", text: `Password updated for ${s.name}` });
    } catch (err) {
      showError(err);
    }
  };

  const copyCreds = () => {
    const t = `Login ID: ${created.loginId}\nPassword: ${created.password}`;
    navigator.clipboard?.writeText(t);
    setMsg({ type: "success", text: "Credentials copied" });
  };

  const fmt = (d) => (d ? new Date(d).toLocaleString() : "-");

  return (
    <div className="container-fluid text-dark">
      <h3 className="fw-bold mb-1 text-dark">Manage HR Accounts</h3>
      <p className="text-secondary">
        Choose a role first. HR: pick an employee from the HR department. MD: enter the name
        (standalone login). Accounts can be deactivated but never deleted.
      </p>

      {msg && <div className={`alert alert-${msg.type} py-2`}>{msg.text}</div>}

      {created && (
        <div className="alert alert-success">
          <div className="fw-bold mb-1">Login created for {created.name}</div>
          <div>Login ID: <code>{created.loginId}</code></div>
          <div>Password: <code>{created.password}</code></div>
          <div className="small text-muted my-1">
            Password is shown only now. Share it securely.
          </div>
          <button className="btn btn-sm btn-success" onClick={copyCreds}>Copy credentials</button>
          <button className="btn btn-sm btn-outline-secondary ms-2" onClick={() => setCreated(null)}>
            Close
          </button>
        </div>
      )}

      {/* ADD HR (from employees) / MD (standalone) */}
      <div className="card shadow-sm mb-4 bg-white text-dark">
        <div className="card-body">
          <h5 className="fw-bold mb-3">
            {isMd ? "Add MD (standalone login)" : "Add HR from Employees"}
          </h5>
          <form onSubmit={create} className="row g-2 align-items-end">
            <div className="col-md-2">
              <label className="form-label small mb-1">1. Role</label>
              <select
                className="form-select"
                value={form.staffRole}
                onChange={(e) => setForm({ ...form, staffRole: e.target.value, employeeId: "" })}
              >
                <option value="hr">HR</option>
                <option value="md">MD</option>
              </select>
            </div>

            <div className="col-md-4">
              {isMd ? (
                <>
                  <label className="form-label small mb-1">2. MD name</label>
                  <input
                    className="form-control"
                    placeholder="Enter MD full name"
                    value={mdName}
                    onChange={(e) => setMdName(e.target.value)}
                    required
                  />
                </>
              ) : (
                <>
                  <label className="form-label small mb-1">2. HR department employee</label>
                  <select
                    className="form-select"
                    value={form.employeeId}
                    onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                    required
                  >
                    <option value="">
                      {eligible.length ? "Select employee..." : "No eligible employees"}
                    </option>
                    {eligible.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.employeeId} · {emp.name} · {emp.department}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>

            <div className="col-md-2">
              <label className="form-label small mb-1">Login ID</label>
              <input
                className="form-control"
                disabled
                value={isMd ? "Auto (mdradnusNN)" : "Auto (hrradnusNN)"}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label small mb-1">3. Password</label>
              <div className="input-group">
                <input
                  className="form-control"
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setForm({ ...form, password: generatePassword() })}
                >
                  Generate
                </button>
              </div>
            </div>

            <div className="col-md-1">
              <button className="btn btn-danger w-100" disabled={saving}>
                {saving ? "..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* TEST ACCOUNT */}
      <div className="card shadow-sm mb-4 bg-white text-dark">
        <div className="card-body">
          <h5 className="fw-bold mb-1">Testing / Dev Team HR ID</h5>
          <p className="small text-secondary mb-3">
            Creates a separate test login (hrtestNN@radnus.in) for the development team. Its actions
            are tagged as "Test HR (Dev Team)" so they never get mixed with real HR work.
          </p>
          <div className="row g-2">
            <div className="col-md-4">
              <input
                className="form-control"
                placeholder="Password (min 6)"
                value={testPwd}
                onChange={(e) => setTestPwd(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <button type="button" className="btn btn-warning" onClick={createTest}>
                Create Test HR ID
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* LIST */}
      <div className="card shadow-sm bg-white text-dark">
        <div className="card-body">
          <h5 className="fw-bold mb-3">HR Accounts ({list.length})</h5>
          {loading ? (
            <p>Loading...</p>
          ) : list.length === 0 ? (
            <p className="text-secondary mb-0">
              No HR accounts yet. The existing .env HR login continues to work.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Emp ID</th><th>Name</th><th>Login ID</th><th>Role</th>
                    <th>Status</th><th>Last Login</th><th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((s) => (
                    <tr key={s._id}>
                      <td>{s.empCode || "-"}</td>
                      <td className="fw-semibold">
                        {s.name}
                        {s.department && <div className="small text-muted">{s.department}</div>}
                      </td>
                      <td>{s.email}</td>
                      <td>
                        {s.staffRole === "tester" ? (
                          <span className="badge bg-warning text-dark">TEST</span>
                        ) : (
                          <select
                            className="form-select form-select-sm"
                            style={{ width: 90 }}
                            value={s.staffRole}
                            onChange={(e) =>
                              update(s._id, { staffRole: e.target.value }, `Role updated for ${s.name}`)
                            }
                          >
                            <option value="hr">HR</option>
                            <option value="md">MD</option>
                          </select>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${s.status === "active" ? "bg-success" : "bg-secondary"}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="small">{fmt(s.lastLoginAt)}</td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => resetPassword(s)}
                        >
                          Reset Password
                        </button>
                        {s.status === "active" ? (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => update(s._id, { status: "inactive" }, `${s.name} deactivated`)}
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => update(s._id, { status: "active" }, `${s.name} activated`)}
                          >
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}