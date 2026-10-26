import { useEffect, useState } from "react";
import ActionedBy from "../../components/hr/ActionedBy";

export default function HrEmployees() {
  const [employees, setEmployees] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [exitForm, setExitForm] = useState(null);   // Relieve / Edit modal
  const [drawerEmp, setDrawerEmp] = useState(null); // right side drawer
  const emptyExit = { relievingDate: "", exitCategory: "", exitReason: "", noticePeriodServed: "", rehireEligible: "" };
  const [viewer, setViewer] = useState(null);
  const [drawerTab, setDrawerTab] = useState("exit");   // "exit" | "profile" | "work"
  const [workSummary, setWorkSummary] = useState(null); // null = not loaded
  const [workLoading, setWorkLoading] = useState(false);
  const [workError, setWorkError] = useState("");
  const [attData, setAttData] = useState(null);
  const [attLoading, setAttLoading] = useState(false);
  const [attError, setAttError] = useState("");
  const [clr, setClr] = useState(null);
  const [clrLoading, setClrLoading] = useState(false);
  const [clrError, setClrError] = useState("");
  const [clrSaving, setClrSaving] = useState(false);
  const [clrMsg, setClrMsg] = useState("");
  const [docs, setDocs] = useState(null);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState("");
  const [docBusy, setDocBusy] = useState(""); // docType being uploaded/deleted

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetch(`${API_BASE}/api/hr/employees`)
      .then((res) => res.json())
      .then((data) => setEmployees(data))
      .catch((err) => console.log(err));
  }, []);

  // ── Delete ────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/employee/employees/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert("Employee deleted successfully ✅");
        setEmployees((prev) => prev.filter((emp) => emp._id !== id));
      } else {
        alert("Failed to delete ❌");
      }
    } catch (err) {
      console.log(err);
      alert("Something went wrong ❌");
    }
  };

  // ── Relieve ───────────────────────────────────────────────────
  // Relieve button → form open
  const openExit = (emp, mode) =>
    setExitForm({
      mode, // "relieve" | "fire"
      emp,
      values: {
        ...emptyExit,
        relievingDate: new Date().toISOString().slice(0, 10),
        exitCategory: mode === "fire" ? "terminated" : "",
      },
    });

  // Drawer → Edit Exit Details
  const openEditExit = (emp) =>
    setExitForm({
      mode: "edit",
      emp,
      values: {
        relievingDate: emp.relievingDate ? emp.relievingDate.slice(0, 10) : "",
        exitCategory: emp.exitCategory || "",
        exitReason: emp.exitReason || "",
        noticePeriodServed: emp.noticePeriodServed === true ? "yes" : emp.noticePeriodServed === false ? "no" : "",
        rehireEligible: emp.rehireEligible === true ? "yes" : emp.rehireEligible === false ? "no" : "",
      },
    });

  const toBool = (v) => (v === "yes" ? true : v === "no" ? false : null);

  const submitExitForm = async () => {
    const { mode, emp, values } = exitForm;

    if (mode !== "edit") {
      if (!values.relievingDate) {
        alert("Please select the relieving date.");
        return;
      }
      if (!values.exitCategory) {
        alert("Please select the exit type.");
        return;
      }
    }

    const body = {
      relievingDate: values.relievingDate || null,
      exitCategory: values.exitCategory || null,
      exitReason: values.exitReason,
      noticePeriodServed: toBool(values.noticePeriodServed),
      rehireEligible: toBool(values.rehireEligible),
    };

    const endpoint = { relieve: "relieve", fire: "fire", edit: "exit-details" }[mode];

    try {
      const res = await fetch(`${API_BASE}/api/hr/employees/${emp._id}/${endpoint}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Failed to save.");
        return;
      }

      const exitPatch =
        mode === "relieve"
          ? { exitType: "relieved", status: "relieved" }
          : mode === "fire"
            ? { exitType: "fired", status: "fired" }
            : {};
      const patch = {
        ...body,
        ...exitPatch,
        ...(mode !== "edit" && { accessDeactivated: false, relievedAt: new Date().toISOString() }),
      };

      setEmployees((prev) => prev.map((e) => (e._id === emp._id ? { ...e, ...patch } : e)));
      setDrawerEmp((d) => (d && d._id === emp._id ? { ...d, ...patch } : d));
      setExitForm(null);
    } catch (err) {
      console.log(err);
      alert("Something went wrong.");
    }
  };

  const tenureText = (from, to) => {
    if (!from) return "Not recorded";
    const end = to ? new Date(to) : new Date();
    const m = Math.max(0, Math.floor((end - new Date(from)) / (1000 * 60 * 60 * 24 * 30.44)));
    const y = Math.floor(m / 12), r = m % 12;
    return `${y ? y + " yr " : ""}${r} mo`;
  };
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "Not recorded");
  const yesNo = (v) => (v === true ? "Yes" : v === false ? "No" : "Not recorded");
  // Joining date: Employment Details first, record-created date as fallback
  const getJoining = (emp) => {
    const doj = emp.joiningDate ? new Date(emp.joiningDate) : null;
    if (doj && !isNaN(doj)) return { date: doj, fromEmployment: true };
    return { date: emp.createdAt ? new Date(emp.createdAt) : null, fromEmployment: false };
  };

  const openDrawer = (emp) => {
    setDrawerEmp(emp);
    setDrawerTab("exit");
    setWorkSummary(null);
    setWorkError("");
    setAttData(null);
    setAttError("");
    setClr(null);
    setClrError("");
    setClrMsg("");
    setDocs(null);
    setDocsError("");
    setDocBusy("");
  };

  const loadWorkSummary = async (empId) => {
    setWorkLoading(true);
    setWorkError("");
    try {
      const res = await fetch(`${API_BASE}/api/hr/employees/${empId}/work-summary`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setWorkSummary(json.data);
    } catch {
      setWorkError("Unable to load work summary. Please try again.");
    } finally {
      setWorkLoading(false);
    }
  };

  const loadAttendance = async (empId) => {
    setAttLoading(true);
    setAttError("");
    try {
      const res = await fetch(`${API_BASE}/api/hr/employees/${empId}/attendance-monthly`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setAttData(json.data);
    } catch {
      setAttError("Unable to load attendance. Please try again.");
    } finally {
      setAttLoading(false);
    }
  };

  const EXIT_DOC_TYPES = {
    relieved: ["Resignation Letter", "Relieving Letter", "Experience Letter", "Full & Final Settlement Statement"],
    fired: ["Termination Letter", "Full & Final Settlement Statement"],
  };
  const JOINING_DOC_TYPES = [
    "Offer Letter", "Appointment Letter", "NDA Agreement", "Employment Contract",
    "Salary Structure Document", "HR Policy Document", "Salary Revision Letter", "Promotion Letter",
  ];

  const TEXT_DOC_TYPES = ["CGPA", "PF Number", "ESI Number", "PG CGPA", "Reference Number 1", "Reference Number 2"];
  const PERSONAL_DOC_CATEGORIES = {
    "Identity & Professional": ["Aadhaar", "PAN", "Passport Photo", "Resume"],
    "Identity Proof": ["Ration Card Front", "Ration Card Back", "Gas Book", "Reference Number 1", "Reference Number 2"],
    "Bank": ["Bank Passbook", "Cancelled Cheque", "Bank Statement"],
    "Education": ["10th Marksheet", "12th Marksheet", "UG Consolidated", "CGPA", "PG Consolidated", "PG CGPA"],
    "PF & ESI": ["PF Number", "ESI Number"],
    "References": ["Reference 1", "Reference 2"],
  };
  const REQUIRED_PERSONAL_DOCS = ["Aadhaar", "PAN", "Passport Photo", "Resume", "Bank Passbook", "10th Marksheet", "12th Marksheet"];

  const loadDocuments = async (empId, silent = false) => {
    if (!silent) setDocsLoading(true);
    setDocsError("");
    try {
      const res = await fetch(`${API_BASE}/api/hr/employees/${empId}/documents`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setDocs(json.data);
    } catch {
      setDocsError("Unable to load documents. Please try again.");
    } finally {
      setDocsLoading(false);
    }
  };

  const uploadExitDoc = async (docType, file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be under 10 MB.");
      return;
    }
    setDocBusy(docType);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("employeeId", drawerEmp._id);
      fd.append("docType", docType);
      fd.append("isHrUpload", "true");
      const res = await fetch(`${API_BASE}/api/hr/activation/upload-doc`, { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Upload failed.");
        return;
      }
      await loadDocuments(drawerEmp._id, true);
    } catch {
      alert("Upload failed. Please try again.");
    } finally {
      setDocBusy("");
    }
  };

  const docKind = (u = "") => {
  const clean = u.split("?")[0].toLowerCase();
  if (/\.(jpe?g|png|gif|webp)$/.test(clean)) return "image";
  if (/\.pdf$/.test(clean)) return "pdf";
  if (/\.(docx?|xlsx?|pptx?)$/.test(clean)) return "office";
  return "other";
};

const viewDoc = async (doc, label) => {
  setViewer({ loading: true, name: label || doc.docType });
  try {
    const res = await fetch(`${API_BASE}/api/employee/view-doc/${doc._id}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    setViewer({ url: data.url || doc.fileUrl, name: label || doc.docType, kind: docKind(doc.fileUrl) });
  } catch {
    setViewer(null);
    alert("Unable to open the document.");
  }
};

  const deleteExitDoc = async (docType) => {
    if (!window.confirm(`Delete "${docType}"? This cannot be undone.`)) return;
    setDocBusy(docType);
    try {
      const res = await fetch(`${API_BASE}/api/employee/delete-doc`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: drawerEmp._id, docType }),
      });
      if (!res.ok) throw new Error();
      await loadDocuments(drawerEmp._id, true);
    } catch {
      alert("Unable to delete the document.");
    } finally {
      setDocBusy("");
    }
  };

  const loadClearance = async (empId) => {
    setClrLoading(true);
    setClrError("");
    try {
      const res = await fetch(`${API_BASE}/api/hr/employees/${empId}/clearance`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setClr(json.data);
    } catch {
      setClrError("Unable to load clearance details. Please try again.");
    } finally {
      setClrLoading(false);
    }
  };

  const saveClearance = async () => {
    setClrSaving(true);
    setClrMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/hr/employees/${drawerEmp._id}/clearance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assets: clr.assets, settlement: clr.settlement }),
      });
      if (!res.ok) throw new Error();
      setClrMsg("Clearance details saved.");
    } catch {
      setClrMsg("Unable to save. Please try again.");
    } finally {
      setClrSaving(false);
    }
  };

  const updateAsset = (i, key, value) =>
    setClr((c) => ({ ...c, assets: c.assets.map((a, idx) => (idx === i ? { ...a, [key]: value } : a)) }));
  const addAsset = () =>
    setClr((c) => ({ ...c, assets: [...c.assets, { name: "", status: "", remarks: "" }] }));
  const removeAsset = (i) =>
    setClr((c) => ({ ...c, assets: c.assets.filter((_, idx) => idx !== i) }));
  const updateSettlement = (key, value) =>
    setClr((c) => ({ ...c, settlement: { ...c.settlement, [key]: value } }));
  const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  const monthLabel = (ym) =>
    new Date(+ym.slice(0, 4), +ym.slice(5, 7) - 1, 1).toLocaleString("en-IN", { month: "short", year: "numeric" });

  const changeTab = (tab) => {
    setDrawerTab(tab);
    if (tab === "work" && !workSummary && !workLoading) loadWorkSummary(drawerEmp._id);
    if (tab === "attendance" && !attData && !attLoading) loadAttendance(drawerEmp._id);
    if (tab === "clearance" && !clr && !clrLoading) loadClearance(drawerEmp._id);
    if (tab === "documents" && !docs && !docsLoading) loadDocuments(drawerEmp._id);
  };

  const CATEGORY = { resigned: "Resigned", terminated: "Terminated", contract_end: "Contract end", retired: "Retired", other: "Other" };

  // // ── Fire ──────────────────────────────────────────────────────
  // const handleFire = async (id) => {
  //   if (!window.confirm("Mark this employee as Fired/Terminated?")) return;
  //   try {
  //     const res = await fetch(`${API_BASE}/api/hr/employees/${id}/fire`, {
  //       method: "PATCH",
  //     });
  //     if (res.ok) {
  //       setEmployees((prev) =>
  //         prev.map((emp) =>
  //           emp._id === id
  //             ? { ...emp, exitType: "fired", accessDeactivated: false, status: "fired" }
  //             : emp
  //         )
  //       );
  //     } else {
  //       alert("Failed to update ❌");
  //     }
  //   } catch (err) {
  //     console.log(err);
  //   }
  // };

  // ── Deactivate Access ─────────────────────────────────────────
  const handleDeactivateAccess = async () => {
    if (!selectedEmp) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/hr/employees/${selectedEmp._id}/deactivate-access`,
        { method: "PATCH" }
      );
      if (res.ok) {
        setEmployees((prev) =>
          prev.map((emp) =>
            emp._id === selectedEmp._id
              ? { ...emp, accessDeactivated: true }
              : emp
          )
        );
        setShowDeactivateModal(false);
        setSelectedEmp(null);
        alert("Access deactivated successfully ✅");
      } else {
        alert("Failed to deactivate ❌");
      }
    } catch (err) {
      console.log(err);
    }
  };

  // ── Reactivate ────────────────────────────────────────────────
  const handleReactivate = async (id) => {
    if (!window.confirm("Reactivate this employee? They will regain full access.")) return;
    try {
      const res = await fetch(`${API_BASE}/api/hr/employees/${id}/reactivate`, {
        method: "PATCH",
      });
      if (res.ok) {
        setEmployees((prev) =>
          prev.map((emp) =>
            emp._id === id
              ? { ...emp, exitType: null, accessDeactivated: false, status: "active" }
              : emp
          )
        );
        alert("Employee reactivated successfully ✅");
      } else {
        alert("Failed to reactivate ❌");
      }
    } catch (err) {
      console.log(err);
    }
  };

  // ── Reactivate Rejected → move back to Pending ────────────────
  const handleReactivateRejected = async (id) => {
    if (!window.confirm("Reactivate this employee? They will be moved back to Pending for review.")) return;
    try {
      const res = await fetch(`${API_BASE}/api/hr/move-to-pending/${id}`, {
        method: "PUT",
      });
      if (res.ok) {
        setEmployees((prev) =>
          prev.map((emp) =>
            emp._id === id ? { ...emp, status: "pending", remarks: "" } : emp
          )
        );
        alert("Employee moved back to Pending ✅");
      } else {
        alert("Failed to reactivate ❌");
      }
    } catch (err) {
      console.log(err);
    }
  };

  // ── Resolve exit status (fallback to `status` field if exitType missing) ──
  const getExitType = (emp) => {
    if (emp.exitType === "relieved" || emp.exitType === "fired") return emp.exitType;
    if (emp.status === "relieved" || emp.status === "fired") return emp.status;
    return null;
  };

  // ── Status Badge ──────────────────────────────────────────────
  const getStatusBadge = (emp) => {
    if (emp.exitType === "relieved") {
      if (emp.accessDeactivated)
        return <span className="badge bg-secondary">🔒 Relieved · Access Off</span>;
      return <span className="badge bg-warning text-dark">📤 Relieved</span>;
    }
    if (emp.exitType === "fired") {
      if (emp.accessDeactivated)
        return <span className="badge bg-dark">🚫 Fired · Access Off</span>;
      return <span className="badge bg-danger">❌ Fired</span>;
    }
    if (emp.status === "active")
      return <span className="badge bg-success">✅ Active</span>;
    if (emp.status === "approved")
      return <span className="badge bg-info text-dark">👍 Approved</span>;
    if (emp.status === "rejected")
      return <span className="badge bg-danger">❌ Rejected</span>;
    if (emp.status === "pending") {
      if (emp.reuploaded)
        return <span className="badge bg-warning text-dark">🔁 Re-uploaded</span>;
      return <span className="badge bg-secondary">⏳ Pending</span>;
    }
    return <span className="badge bg-secondary">⏳ Pending</span>;
  };

  // ── Filter ────────────────────────────────────────────────────
  const filteredEmployees = employees
    .filter((emp) => {
      const exitStatus = getExitType(emp);
      if (filter === "all") return true;
      if (filter === "active") return emp.status === "active" && !exitStatus;
      if (filter === "rejected") return emp.status === "rejected" && !exitStatus;
      if (filter === "relieved") return exitStatus === "relieved";
      if (filter === "fired") return exitStatus === "fired";
      if (filter === "access-pending")
        return (exitStatus === "relieved" || exitStatus === "fired") &&
          !emp.accessDeactivated;
      return true;
    })
    .filter((emp) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        emp.name?.toLowerCase().includes(q) ||
        emp.employeeId?.toLowerCase().includes(q) ||
        emp.department?.toLowerCase().includes(q)
      );
    });

  const pendingAccessCount = employees.filter((e) => {
    const exitStatus = getExitType(e);
    return (exitStatus === "relieved" || exitStatus === "fired") && !e.accessDeactivated;
  }).length;

  return (
    <div className="container-fluid p-3">
      <h4 className="fw-bold mb-3">Employee List</h4>

      {/* Warning banner */}
      {pendingAccessCount > 0 && (
        <div
          className="alert alert-warning d-flex align-items-center gap-2 mb-3"
          role="alert"
        >
          <span>⚠️</span>
          <span>
            <strong>{pendingAccessCount} employee(s)</strong> have been relieved/fired
            but their account access is still active.{" "}
            <button
              className="btn btn-sm btn-warning ms-2"
              onClick={() => setFilter("access-pending")}
            >
              View now
            </button>
          </span>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="🔍 Search by Name, Emp ID or Department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: "400px" }}
        />
      </div>


      {/* Filter tabs */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        {[
          { key: "all", label: "All Employees" },
          { key: "active", label: "Active" },
          { key: "rejected", label: "Rejected" },
          { key: "relieved", label: "Relieved" },
          { key: "fired", label: "Fired / Terminated" },
          { key: "access-pending", label: `⚠️ Access Pending (${pendingAccessCount})` },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`btn btn-sm ${filter === tab.key ? "btn-dark" : "btn-outline-secondary"}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card shadow-sm">
        <div className="card-body table-responsive">
          <table
            className="table table-hover align-middle"
            style={{ tableLayout: "fixed", minWidth: 1100 }}
          >
            <colgroup>
              <col style={{ width: "100px" }} />{/* Emp ID */}
              <col style={{ width: "170px" }} />{/* Name */}
              <col style={{ width: "210px" }} />{/* Email */}
              <col style={{ width: "190px" }} />{/* Department */}
              <col style={{ width: "180px" }} />{/* Status */}
              <col style={{ width: "280px" }} />{/* Action */}
            </colgroup>
            <thead>
              <tr>
                <th className="text-nowrap">Emp ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted">
                    No employees found
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp._id}>
                    <td className="text-nowrap">{emp.employeeId}</td>
                    <td className="text-truncate" title={emp.name}>
                      {getExitType(emp) ? (
                        <span style={{ cursor: "pointer", color: "#0d6efd" }} onClick={() => openDrawer(emp)}>
                          {emp.name}
                        </span>
                      ) : emp.name}
                    </td>
                    <td className="text-truncate" title={emp.email}>{emp.email}</td>
                    <td className="text-truncate" title={emp.department}>{emp.department}</td>
                    <td>
                      <div className="text-nowrap">{getStatusBadge(emp)}</div>
                      {(() => {
                        const ex = getExitType(emp);
                        if (!ex) return null;
                        const wrap = { whiteSpace: "normal", lineHeight: 1.35 };
                        return (
                          <>
                            <ActionedBy id={emp._id} match={ex === "fired" ? "FIRE" : "RELIEVE"} version={ex} style={wrap} />
                            {emp.accessDeactivated && (
                              <ActionedBy id={emp._id} match="DEACTIVATE_ACCESS" version={String(emp.accessDeactivated)} style={wrap} />
                            )}
                          </>
                        );
                      })()}
                    </td>
                    <td>
                      {(() => {
                        const exitStatus = getExitType(emp);
                        return (
                          <div className="d-flex gap-1 align-items-center flex-nowrap text-nowrap">

                            {/* Active employees — Relieve / Fire */}
                            {emp.status === "active" && !exitStatus && (
                              <>
                                <button className="btn btn-sm btn-outline-warning" onClick={() => openExit(emp, "relieve")}>
                                  Relieve
                                </button>
                                <button className="btn btn-sm btn-outline-danger" onClick={() => openExit(emp, "fire")}>
                                  Fire
                                </button>
                              </>
                            )}

                            {/* Rejected employees — Reactivate (back to Pending) */}
                            {emp.status === "rejected" && !exitStatus && (
                              <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() => handleReactivateRejected(emp._id)}
                              >
                                ♻️ Reactivate
                              </button>
                            )}

                            {(exitStatus === "relieved" || exitStatus === "fired") &&
                              !emp.accessDeactivated && (
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => { setSelectedEmp(emp); setShowDeactivateModal(true); }}
                                >
                                  🔒 Deactivate Access
                                </button>
                              )}

                            {emp.accessDeactivated && (
                              <span className="text-muted small text-nowrap">✔ Access removed</span>
                            )}

                            {exitStatus && (
                              <button className="btn btn-sm btn-outline-success" onClick={() => handleReactivate(emp._id)}>
                                ♻️ Reactivate
                              </button>
                            )}

                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(emp._id)}>
                              Delete
                            </button>
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deactivate Access Confirmation Modal */}
      {showDeactivateModal && selectedEmp && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">🔒 Deactivate Account Access</h5>
                <button
                  className="btn-close"
                  onClick={() => {
                    setShowDeactivateModal(false);
                    setSelectedEmp(null);
                  }}
                />
              </div>
              <div className="modal-body">
                <p>You are about to deactivate all system access for:</p>
                <ul>
                  <li>
                    <strong>{selectedEmp.name}</strong> ({selectedEmp.employeeId})
                  </li>
                  <li>Department: {selectedEmp.department}</li>
                  <li>
                    Exit type:{" "}
                    <span className="badge bg-warning text-dark">
                      {getExitType(selectedEmp)}
                    </span>
                  </li>
                </ul>
                <p className="text-danger mt-2">
                  ⚠️ This will prevent the employee from logging into any company system.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeactivateModal(false);
                    setSelectedEmp(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleDeactivateAccess}
                >
                  Yes, Deactivate Access
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exit form modal */}
      {exitForm && (() => {
        const { mode, emp, values: v } = exitForm;
        const isNew = mode !== "edit";
        const set = (k) => (e) =>
          setExitForm((f) => ({ ...f, values: { ...f.values, [k]: e.target.value } }));
        const titles = { relieve: "Relieve Employee", fire: "Terminate Employee", edit: "Edit Exit Details" };

        return (
          <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{titles[mode]} – {emp.name}</h5>
                  <button className="btn-close" onClick={() => setExitForm(null)} />
                </div>
                <div className="modal-body">
                  <label className="form-label">
                    {mode === "fire" ? "Termination date (last working day)" : "Relieving date (last working day)"}
                    {isNew && " *"}
                  </label>
                  <input type="date" className="form-control mb-2" value={v.relievingDate} onChange={set("relievingDate")} />

                  <label className="form-label">Exit type{isNew && " *"}</label>
                  <select className="form-select mb-2" value={v.exitCategory} onChange={set("exitCategory")}>
                    <option value="">Select</option>
                    {Object.entries(CATEGORY).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>

                  <label className="form-label">Reason</label>
                  <textarea className="form-control mb-2" rows={3} value={v.exitReason} onChange={set("exitReason")} />

                  <div className="row">
                    <div className="col">
                      <label className="form-label">Notice period served</label>
                      <select className="form-select" value={v.noticePeriodServed} onChange={set("noticePeriodServed")}>
                        <option value="">Not recorded</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    <div className="col">
                      <label className="form-label">Rehire eligible</label>
                      <select className="form-select" value={v.rehireEligible} onChange={set("rehireEligible")}>
                        <option value="">Not recorded</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setExitForm(null)}>Cancel</button>
                  <button
                    className={`btn ${mode === "fire" ? "btn-danger" : "btn-warning"}`}
                    onClick={submitExitForm}
                  >
                    {mode === "relieve" ? "Confirm Relieve" : mode === "fire" ? "Confirm Termination" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {viewer && (
  <div onClick={() => setViewer(null)} onContextMenu={(e) => e.preventDefault()}
    style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
    <div onClick={(e) => e.stopPropagation()}
      style={{ width: "100%", maxWidth: 900, height: "90vh", background: "#fff", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
        <strong className="small">{viewer.name}</strong>
        <button className="btn-close" onClick={() => setViewer(null)} />
      </div>
      <div style={{ flex: 1, minHeight: 0, background: "#f3f4f6" }}>
        {viewer.loading && <div className="p-4 text-muted">Loading…</div>}
        {viewer.kind === "image" && (
          <img src={viewer.url} alt={viewer.name} draggable={false} onContextMenu={(e) => e.preventDefault()}
            style={{ width: "100%", height: "100%", objectFit: "contain", userSelect: "none" }} />
        )}
        {viewer.kind === "pdf" && (
          <iframe title={viewer.name} src={`${viewer.url}#toolbar=0&navpanes=0&scrollbar=1`} style={{ width: "100%", height: "100%", border: "none" }} />
        )}
        {viewer.kind === "office" && (
          <iframe title={viewer.name} src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(viewer.url)}`} style={{ width: "100%", height: "100%", border: "none" }} />
        )}
        {viewer.kind === "other" && <div className="p-4 text-muted">Preview is not available for this file type.</div>}
      </div>
    </div>
  </div>
)}

      {/* Right side details drawer */}
      {drawerEmp && (
        <>
          <div
            onClick={() => setDrawerEmp(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 1040 }}
          />
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              height: "100%",
              width: drawerTab === "attendance" ? 780 : 680,
              maxWidth: "100%",
              background: "#fff",
              zIndex: 1050,
              overflowY: "auto",
              padding: 20,
              boxShadow: "-4px 0 16px rgba(0,0,0,0.15)",
            }}
          >
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h5 className="mb-0">{drawerEmp.name}</h5>
                <small className="text-muted">{drawerEmp.employeeId}</small>
              </div>
              <button className="btn-close" onClick={() => setDrawerEmp(null)} />
            </div>

            {/* Tabs */}
            <ul className="nav nav-tabs mb-3">
              {[
                ["exit", "Exit Info"],
                ["profile", "Profile"],
                ["work", "Work Summary"],
                ["attendance", "Attendance"],
                ["clearance", "Clearance"],
                ["documents", "Documents"],
              ].map(([k, l]) => (
                <li className="nav-item" key={k}>
                  <button
                    className={`nav-link ${drawerTab === k ? "active" : ""}`}
                    onClick={() => changeTab(k)}
                  >
                    {l}
                  </button>
                </li>
              ))}
            </ul>

            {/* ───────── EXIT INFO ───────── */}
            {drawerTab === "exit" && (
              <>
                <table className="table table-sm">
                  <tbody>
                    <tr><td>Status</td><td>{getStatusBadge(drawerEmp)}</td></tr>
                    <tr><td>Exit type</td><td>{CATEGORY[drawerEmp.exitCategory] || "Not recorded"}</td></tr>
                    <tr><td>Relieving date</td><td>{fmtDate(drawerEmp.relievingDate)}</td></tr>
                    <tr><td>Reason</td><td>{drawerEmp.exitReason || "Not recorded"}</td></tr>
                    <tr><td>Notice period served</td><td>{yesNo(drawerEmp.noticePeriodServed)}</td></tr>
                    <tr><td>Rehire eligible</td><td>{yesNo(drawerEmp.rehireEligible)}</td></tr>
                    <tr><td>{getExitType(drawerEmp) === "fired" ? "Terminated by" : "Relieved by"}</td>
                      <td>
                        <ActionedBy
                          id={drawerEmp._id}
                          match={getExitType(drawerEmp) === "fired" ? "FIRE" : "RELIEVE"}
                          version={getExitType(drawerEmp)}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
                <button className="btn btn-sm btn-outline-primary" onClick={() => openEditExit(drawerEmp)}>
                  ✏️ Edit Exit Details
                </button>
              </>
            )}

            {/* ───────── PROFILE ───────── */}
            {drawerTab === "profile" && (
              <table className="table table-sm">
                <tbody>
                  <tr><td>Email</td><td>{drawerEmp.email}</td></tr>
                  <tr><td>Phone</td><td>{drawerEmp.mobile || "Not recorded"}</td></tr>
                  <tr><td>Department</td><td>{drawerEmp.department}</td></tr>
                  <tr><td>Designation</td><td>{drawerEmp.designation || "Not recorded"}</td></tr>
                  {(() => {
                    const j = getJoining(drawerEmp);
                    return (
                      <>
                        <tr>
                          <td>Date of joining</td>
                          <td>
                            {j.date ? fmtDate(j.date) : "Not recorded"}
                            {j.date && !j.fromEmployment && (
                              <span className="badge bg-light text-dark border ms-2" title="Date of Joining is not set in Employment Details">
                                Created at
                              </span>
                            )}
                          </td>
                        </tr>
                        <tr><td>Tenure</td><td>{tenureText(j.date, drawerEmp.relievingDate)}</td></tr>
                      </>
                    );
                  })()}
                </tbody>
              </table>
            )}

            {/* ───────── WORK SUMMARY ───────── */}
            {drawerTab === "work" && (
              <>
                {workLoading && <div className="text-muted">Loading…</div>}
                {workError && (
                  <div className="text-danger">
                    {workError}{" "}
                    <button className="btn btn-sm btn-link" onClick={() => loadWorkSummary(drawerEmp._id)}>
                      Retry
                    </button>
                  </div>
                )}
                {workSummary && (
                  <>
                    <h6 className="fw-bold">Performance</h6>
                    {workSummary.performance.reviewCount === 0 ? (
                      <p className="text-muted small">No finalized reviews</p>
                    ) : (
                      <table className="table table-sm">
                        <tbody>
                          <tr>
                            <td>Last review</td>
                            <td>
                              {workSummary.performance.last.period} – {workSummary.performance.last.score ?? "—"}
                              {workSummary.performance.last.rating ? ` (${workSummary.performance.last.rating})` : ""}
                            </td>
                          </tr>
                          <tr><td>Average score</td><td>{workSummary.performance.avgScore ?? "—"}</td></tr>
                          <tr><td>Reviews</td><td>{workSummary.performance.reviewCount}</td></tr>
                        </tbody>
                      </table>
                    )}

                    <h6 className="fw-bold mt-3">Training</h6>
                    <table className="table table-sm">
                      <tbody>
                        <tr><td>Completed</td><td>{workSummary.training.completed} / {workSummary.training.total}</td></tr>
                        <tr><td>Pending</td><td>{workSummary.training.pending}</td></tr>
                        <tr><td>Overdue</td><td>{workSummary.training.overdue}</td></tr>
                      </tbody>
                    </table>

                    <h6 className="fw-bold mt-3">Incentives paid</h6>
                    <table className="table table-sm">
                      <tbody>
                        <tr><td>Payouts</td><td>{workSummary.incentives.count}</td></tr>
                        <tr>
                          <td>Total paid</td>
                          <td>₹{workSummary.incentives.totalPaid.toLocaleString("en-IN")}</td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                )}
              </>
            )}

            {/* ───────── ATTENDANCE (month-wise) ───────── */}
            {drawerTab === "attendance" && (
              <>
                {attLoading && <div className="text-muted">Loading attendance…</div>}
                {attError && (
                  <div className="text-danger">
                    {attError}{" "}
                    <button className="btn btn-sm btn-link" onClick={() => loadAttendance(drawerEmp._id)}>
                      Retry
                    </button>
                  </div>
                )}
                {attData && attData.months.length === 0 && (
                  <p className="text-muted">No attendance records found.</p>
                )}
                {attData && attData.months.length > 0 && (() => {
                  const rows = attData.months;
                  const lastRow = rows[rows.length - 1];
                  return (
                    <>
                      {/* Final month summary */}
                      <div className="alert alert-warning py-2 mb-3">
                        <div className="fw-semibold mb-1">
                          Final month: {monthLabel(lastRow.month)}
                          {lastRow.countedUpto && (
                            <span className="fw-normal"> (counted up to {fmtDate(lastRow.countedUpto)})</span>
                          )}
                        </div>
                        <div className="d-flex flex-wrap gap-4">
                          <span>Payable days: <strong>{lastRow.payable ?? "—"}</strong></span>
                          <span>LOP days: <strong>{lastRow.lop ?? "—"}</strong></span>
                          <span>
                            Payslip:{" "}
                            <strong className="text-capitalize">
                              {lastRow.payslip ? lastRow.payslip.status : "Not generated"}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {attData.machineStaff && (
                        <p className="small text-muted">
                          Machine staff: punch counts only. Payroll rules (LOP and payable days) do not apply.
                        </p>
                      )}

                      <div className="table-responsive">
                        <table className="table table-sm table-bordered text-center small align-middle">
                          <thead className="table-light">
                            <tr>
                              <th className="text-start">Month</th>
                              <th>Days</th>
                              <th>Present</th>
                              <th>Late</th>
                              <th>Half Day</th>
                              <th>Leave</th>
                              <th>Absent</th>
                              <th>Off</th>
                              <th>LOP</th>
                              <th>Payable Days</th>
                              <th>Payslip</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((r, i) => (
                              <tr key={r.month} className={i === rows.length - 1 ? "table-warning" : ""}>
                                <td className="text-start text-nowrap">
                                  {monthLabel(r.month)}
                                  {(r.countedFrom || r.countedUpto) && (
                                    <span
                                      className="badge bg-light text-dark border ms-2"
                                      title="Partial month: counted only within the employment period"
                                    >
                                      Partial
                                    </span>
                                  )}
                                </td>
                                <td>{r.totalDays ?? "—"}</td>
                                <td>{r.present}</td>
                                <td>{r.late}</td>
                                <td>{r.halfDay}</td>
                                <td>{r.leave}</td>
                                <td>{r.absent}</td>
                                <td>{(r.holiday || 0) + (r.weekend || 0)}</td>
                                <td className={r.lop > 0 ? "text-danger fw-bold" : ""}>{r.lop ?? "—"}</td>
                                <td className="fw-bold">{r.payable ?? "—"}</td>
                                <td className="text-nowrap text-capitalize">
                                  {r.payslip ? r.payslip.status : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Legend */}
                      <div className="small text-muted mt-3">
                        <div className="fw-semibold mb-1">Notes</div>
                        <ul className="mb-0 ps-3">
                          <li><strong>Present:</strong> days attended, including late arrivals</li>
                          <li><strong>Late:</strong> late arrivals (already included in Present)</li>
                          <li><strong>Half Day:</strong> counted as 0.5 payable day</li>
                          <li><strong>Off:</strong> holidays and weekends</li>
                          <li><strong>LOP:</strong> Absent + Leave</li>
                          <li><strong>Payable Days:</strong> Present + (Half Day × 0.5) + Off</li>
                          <li><strong>Partial:</strong> counted from the first attendance record, or up to the relieving date</li>
                        </ul>
                      </div>
                    </>
                  );
                })()}
              </>
            )}

            {/* ───────── CLEARANCE ───────── */}
            {drawerTab === "clearance" && (
              <>
                {clrLoading && <div className="text-muted">Loading clearance…</div>}
                {clrError && (
                  <div className="text-danger">
                    {clrError}{" "}
                    <button className="btn btn-sm btn-link" onClick={() => loadClearance(drawerEmp._id)}>Retry</button>
                  </div>
                )}
                {clr && (() => {
                  const pendingItems = [];
                  if (clr.advances.count > 0)
                    pendingItems.push(`${clr.advances.count} approved advance(s) not yet recovered (${inr(clr.advances.totalAmount)})`);
                  if (clr.advances.awaitingApproval > 0)
                    pendingItems.push(`${clr.advances.awaitingApproval} advance request(s) awaiting approval`);
                  if (clr.incentives.approvedUnpaidCount > 0)
                    pendingItems.push(`${clr.incentives.approvedUnpaidCount} approved incentive(s) not yet paid (${inr(clr.incentives.approvedUnpaidAmount)})`);
                  if (clr.incentives.awaitingApproval > 0)
                    pendingItems.push(`${clr.incentives.awaitingApproval} incentive(s) awaiting approval`);
                  const assetsOpen = clr.assets.filter((a) => a.status !== "returned" && a.status !== "na").length;
                  if (assetsOpen > 0)
                    pendingItems.push(`${assetsOpen} asset item(s) not confirmed as returned`);
                  if (clr.settlement.status !== "paid")
                    pendingItems.push("Full & final settlement not marked as paid");

                  return (
                    <>
                      {/* Overall status */}
                      {pendingItems.length === 0 ? (
                        <div className="alert alert-success py-2">
                          <strong>Clearance complete.</strong> All items are cleared.
                        </div>
                      ) : (
                        <div className="alert alert-warning py-2">
                          <strong>Clearance pending ({pendingItems.length})</strong>
                          <ul className="mb-0 ps-3 small">
                            {pendingItems.map((p) => <li key={p}>{p}</li>)}
                          </ul>
                        </div>
                      )}

                      {/* Advances */}
                      <h6 className="fw-bold mt-3">Advances / Loans</h6>
                      {clr.advances.count === 0 ? (
                        <p className="text-muted small">No unrecovered advances.</p>
                      ) : (
                        <table className="table table-sm small">
                          <thead className="table-light">
                            <tr><th>Amount</th><th>Reason</th><th>Recovery month</th></tr>
                          </thead>
                          <tbody>
                            {clr.advances.items.map((a, i) => (
                              <tr key={i}>
                                <td>{inr(a.amount)}</td>
                                <td>{a.reason}</td>
                                <td>{a.recoveryMonth && a.recoveryYear ? `${a.recoveryMonth}/${a.recoveryYear}` : "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {/* Incentives */}
                      <h6 className="fw-bold mt-3">Incentives</h6>
                      <table className="table table-sm small">
                        <tbody>
                          <tr>
                            <td>Approved, not yet paid</td>
                            <td>{clr.incentives.approvedUnpaidCount} ({inr(clr.incentives.approvedUnpaidAmount)})</td>
                          </tr>
                          <tr>
                            <td>Awaiting approval</td>
                            <td>{clr.incentives.awaitingApproval}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Assets */}
                      <h6 className="fw-bold mt-3">Company Assets</h6>
                      <table className="table table-sm small align-middle">
                        <thead className="table-light">
                          <tr><th>Item</th><th style={{ width: 150 }}>Status</th><th>Remarks</th><th style={{ width: 36 }} /></tr>
                        </thead>
                        <tbody>
                          {clr.assets.map((a, i) => (
                            <tr key={i}>
                              <td>
                                <input className="form-control form-control-sm" value={a.name}
                                  onChange={(e) => updateAsset(i, "name", e.target.value)} />
                              </td>
                              <td>
                                <select className="form-select form-select-sm" value={a.status}
                                  onChange={(e) => updateAsset(i, "status", e.target.value)}>
                                  <option value="">Not recorded</option>
                                  <option value="returned">Returned</option>
                                  <option value="pending">Not returned</option>
                                  <option value="na">Not applicable</option>
                                </select>
                              </td>
                              <td>
                                <input className="form-control form-control-sm" value={a.remarks}
                                  onChange={(e) => updateAsset(i, "remarks", e.target.value)} />
                              </td>
                              <td>
                                <button className="btn btn-sm btn-outline-danger" title="Remove" onClick={() => removeAsset(i)}>×</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button className="btn btn-sm btn-outline-secondary" onClick={addAsset}>+ Add item</button>

                      {/* Settlement */}
                      <h6 className="fw-bold mt-4">Full &amp; Final Settlement</h6>
                      <div className="row g-2">
                        <div className="col-6">
                          <label className="form-label small mb-1">Status</label>
                          <select className="form-select form-select-sm" value={clr.settlement.status}
                            onChange={(e) => updateSettlement("status", e.target.value)}>
                            <option value="">Not recorded</option>
                            <option value="pending">Pending</option>
                            <option value="processed">Processed</option>
                            <option value="paid">Paid</option>
                          </select>
                        </div>
                        <div className="col-6">
                          <label className="form-label small mb-1">Amount (₹)</label>
                          <input type="number" min="0" className="form-control form-control-sm" value={clr.settlement.amount}
                            onChange={(e) => updateSettlement("amount", e.target.value)} />
                        </div>
                        <div className="col-6">
                          <label className="form-label small mb-1">Settlement date</label>
                          <input type="date" className="form-control form-control-sm" value={clr.settlement.date}
                            onChange={(e) => updateSettlement("date", e.target.value)} />
                        </div>
                        <div className="col-6">
                          <label className="form-label small mb-1">Remarks</label>
                          <input className="form-control form-control-sm" value={clr.settlement.remarks}
                            onChange={(e) => updateSettlement("remarks", e.target.value)} />
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-3 mt-4">
                        <button className="btn btn-warning" onClick={saveClearance} disabled={clrSaving}>
                          {clrSaving ? "Saving…" : "Save Clearance"}
                        </button>
                        {clrMsg && <span className="small text-muted">{clrMsg}</span>}
                      </div>
                    </>
                  );
                })()}
              </>
            )}

            {/* ───────── DOCUMENTS ───────── */}
            {drawerTab === "documents" && (
              <>
                {docsLoading && <div className="text-muted">Loading documents…</div>}
                {docsError && (
                  <div className="text-danger">
                    {docsError}{" "}
                    <button className="btn btn-sm btn-link" onClick={() => loadDocuments(drawerEmp._id)}>Retry</button>
                  </div>
                )}
                {docs && (() => {
                  const exitKind = getExitType(drawerEmp) === "fired" ? "fired" : "relieved";
                  const findDoc = (t) => docs.find((d) => d.docType === t);

                  // Classification
                  const exitTypesAll = [...EXIT_DOC_TYPES.relieved, ...EXIT_DOC_TYPES.fired];
                  const personalTypesAll = Object.values(PERSONAL_DOC_CATEGORIES).flat();
                  const knownTypes = new Set([...exitTypesAll, ...JOINING_DOC_TYPES, ...personalTypesAll]);

                  const joiningDocs = JOINING_DOC_TYPES.map(findDoc).filter(Boolean);
                  const prevWorkDocs = docs.filter(
                    (d) => d.docType?.startsWith("offer_") || d.docType?.startsWith("experience_")
                  );
                  const otherDocs = docs.filter(
                    (d) => !knownTypes.has(d.docType) && !prevWorkDocs.includes(d)
                  );
                  const missingRequired = REQUIRED_PERSONAL_DOCS.filter((t) => !findDoc(t));

                  const prevLabel = (t) => {
                    const base = t.startsWith("offer_") ? "Offer Letter (previous employer)" : "Experience Letter (previous employer)";
                    const suffix = t.replace(/^(offer|experience)_/, "");
                    return suffix ? `${base} – ${suffix}` : base;
                  };

                  const docRow = (doc, label) => (
                    <tr key={doc._id}>
                      <td>{label || doc.docType}</td>
                      <td className="text-muted">{fmtDate(doc.updatedAt)}</td>
                      <td className="text-end">
                        {TEXT_DOC_TYPES.includes(doc.docType) ? (
                          <span className="fw-semibold">{doc.fileUrl}</span>
                        ) : (
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => viewDoc(doc)}>View</button>
                        )}
                      </td>
                    </tr>
                  );

                  return (
                    <>
                      {/* ── Exit documents ── */}
                      <h6 className="fw-bold">Exit Documents</h6>
                      <table className="table table-sm align-middle small">
                        <thead className="table-light">
                          <tr><th>Document</th><th>Status</th><th className="text-end">Actions</th></tr>
                        </thead>
                        <tbody>
                          {EXIT_DOC_TYPES[exitKind].map((type) => {
                            const doc = findDoc(type);
                            const busy = docBusy === type;
                            return (
                              <tr key={type}>
                                <td>{type}</td>
                                <td>
                                  {doc ? (
                                    <>
                                      <span className="badge bg-success">Uploaded</span>
                                      <div className="text-muted">
                                        {fmtDate(doc.updatedAt)}
                                        {doc.uploadedByName ? ` · ${doc.uploadedByName}` : ""}
                                      </div>
                                    </>
                                  ) : (
                                    <span className="badge bg-secondary">Not uploaded</span>
                                  )}
                                </td>
                                <td className="text-end text-nowrap">
                                  {doc && (
                                    <button className="btn btn-sm btn-outline-secondary me-1" disabled={busy} onClick={() =>viewDoc(doc, label)}>
                                      View
                                    </button>
                                  )}
                                  <label className={`btn btn-sm btn-outline-primary mb-0 me-1 ${busy ? "disabled" : ""}`}>
                                    {busy ? "Working…" : doc ? "Replace" : "Upload"}
                                    <input
                                      type="file"
                                      hidden
                                      disabled={busy}
                                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                      onChange={(e) => {
                                        uploadExitDoc(type, e.target.files[0]);
                                        e.target.value = "";
                                      }}
                                    />
                                  </label>
                                  {doc && (
                                    <button className="btn btn-sm btn-outline-danger" disabled={busy} onClick={() => deleteExitDoc(type)}>
                                      Delete
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <p className="small text-muted">
                        Accepted formats: PDF, JPG, PNG, DOC, DOCX (max 10 MB). Employee portal access is closed after
                        exit, so share issued letters with the employee directly (email or print).
                      </p>

                      {/* ── Joining & HR documents ── */}
                      <h6 className="fw-bold mt-4">Joining &amp; HR Documents</h6>
                      {joiningDocs.length === 0 ? (
                        <p className="text-muted small">No joining or HR documents on record.</p>
                      ) : (
                        <table className="table table-sm align-middle small">
                          <tbody>{joiningDocs.map((d) => docRow(d))}</tbody>
                        </table>
                      )}

                      {/* ── Personal documents ── */}
                      <h6 className="fw-bold mt-4">Personal Documents</h6>
                      {missingRequired.length > 0 && (
                        <div className="alert alert-warning py-2 small">
                          <strong>Missing required documents:</strong> {missingRequired.join(", ")}
                        </div>
                      )}
                      {Object.entries(PERSONAL_DOC_CATEGORIES).map(([category, types]) => {
                        const rows = types.map(findDoc).filter(Boolean);
                        if (rows.length === 0) return null;
                        return (
                          <div key={category} className="mb-3">
                            <div className="small text-uppercase text-muted fw-semibold mb-1">{category}</div>
                            <table className="table table-sm align-middle small mb-0">
                              <tbody>{rows.map((d) => docRow(d))}</tbody>
                            </table>
                          </div>
                        );
                      })}
                      {Object.values(PERSONAL_DOC_CATEGORIES).flat().every((t) => !findDoc(t)) && (
                        <p className="text-muted small">No personal documents on record.</p>
                      )}

                      {/* ── Previous employment ── */}
                      {prevWorkDocs.length > 0 && (
                        <>
                          <h6 className="fw-bold mt-4">Previous Employment Documents</h6>
                          <table className="table table-sm align-middle small">
                            <tbody>{prevWorkDocs.map((d) => docRow(d, prevLabel(d.docType)))}</tbody>
                          </table>
                        </>
                      )}

                      {/* ── Other ── */}
                      {otherDocs.length > 0 && (
                        <>
                          <h6 className="fw-bold mt-4">Other Documents</h6>
                          <table className="table table-sm align-middle small">
                            <tbody>{otherDocs.map((d) => docRow(d))}</tbody>
                          </table>
                        </>
                      )}
                    </>
                  );
                })()}
              </>
            )}

          </div>
        </>
      )}
    </div>
  );
}