import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function FeedbackNominations() {
  const [cycles, setCycles]               = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [employees, setEmployees]         = useState([]);
  const [allEmployees, setAllEmployees]   = useState([]);
  const [nominations, setNominations]     = useState({});
  const [submitting, setSubmitting]       = useState(false);
  const [submitted, setSubmitted]         = useState(false);
  const [toast, setToast]                 = useState(null);

  const [nominatedCycleIds, setNominatedCycleIds] = useState(new Set());
  const [activeTab, setActiveTab]                 = useState("pending");
  const [confirmDelete, setConfirmDelete]         = useState(null);

  useEffect(() => {
    fetchCyclesAndNominations();
  }, []);

  const fetchCyclesAndNominations = async () => {
    try {
      const cycleRes = await fetch(`${API_BASE}/api/feedback-cycles`);
      const cycleData = await cycleRes.json();
      const active = (cycleData.data || []).filter((c) => c.status === "active");
      setCycles(active);

      // ✅ Fetch nominations per cycle instead of GET all
      const nominatedIds = new Set();
      await Promise.all(
        active.map(async (cycle) => {
          try {
            const nomRes  = await fetch(`${API_BASE}/api/feedback-nominations/${cycle._id}`);
            const nomData = await nomRes.json();
            if (nomData.success && nomData.data?.length > 0) {
              nominatedIds.add(String(cycle._id));
            }
          } catch (_) {}
        })
      );
      setNominatedCycleIds(nominatedIds);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetch(`${API_BASE}/api/hr/employees`)
      .then((r) => r.json())
      .then((data) => {
        const active = Array.isArray(data)
          ? data.filter((e) => e.status === "active")
          : [];
        setAllEmployees(active);
      })
      .catch(console.error);
  }, []);

  // ✅ getEmpNames function — defined here
  const getEmpNames = (selectedEmployeeIds = []) => {
    if (!selectedEmployeeIds.length) return "No employees";
    if (selectedEmployeeIds.length === 1) {
      const id  = typeof selectedEmployeeIds[0] === "object"
        ? String(selectedEmployeeIds[0]._id || selectedEmployeeIds[0])
        : String(selectedEmployeeIds[0]);
      const emp = allEmployees.find((e) => String(e._id) === id);
      return emp?.name || "1 employee";
    }
    return `${selectedEmployeeIds.length} employees`;
  };

  const handleSelectCycle = async (cycle) => {
    setSelectedCycle(cycle);
    setSubmitted(false);

    try {
      const res       = await fetch(`${API_BASE}/api/hr/employees`);
      const data      = await res.json();
      const activeAll = Array.isArray(data)
        ? data.filter((e) => e.status === "active")
        : [];

      setAllEmployees(activeAll);

      const selectedIds = (cycle.selectedEmployees || []).map((id) =>
        typeof id === "object" ? String(id._id || id) : String(id)
      );

      const cycleEmps = activeAll.filter((e) =>
        selectedIds.includes(String(e._id))
      );

      setEmployees(cycleEmps);

      let existingMap = {};
      try {
        const nomRes  = await fetch(`${API_BASE}/api/feedback-nominations/${cycle._id}`);
        const nomData = await nomRes.json();
        if (nomData.success && nomData.data?.length) {
          nomData.data.forEach((n) => {
            existingMap[String(n.employeeId?._id || n.employeeId)] = {
              peers:        (n.peerIds        || []).map((p) => String(p._id || p)),
              subordinates: (n.subordinateIds || []).map((s) => String(s._id || s)),
            };
          });
        }
      } catch (_) {}

      const init = {};
      cycleEmps.forEach((e) => {
        init[e._id] = existingMap[String(e._id)] || { peers: [], subordinates: [] };
      });
      setNominations(init);

    } catch (err) {
      console.error(err);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handlePeerToggle = (empId, peerId) => {
    const maxPeers = selectedCycle?.peerCount || 2;
    setNominations((prev) => {
      const current = prev[empId].peers;
      if (current.includes(peerId)) {
        return { ...prev, [empId]: { ...prev[empId], peers: current.filter((p) => p !== peerId) } };
      }
      if (current.length >= maxPeers) {
        showToast(`Maximum ${maxPeers} peers allowed`, "error");
        return prev;
      }
      return { ...prev, [empId]: { ...prev[empId], peers: [...current, peerId] } };
    });
  };

  const handleSubToggle = (empId, subId) => {
    const maxSubs = selectedCycle?.subCount || 1;
    setNominations((prev) => {
      const current = prev[empId].subordinates || [];
      if (current.includes(subId)) {
        return { ...prev, [empId]: { ...prev[empId], subordinates: current.filter((s) => s !== subId) } };
      }
      if (current.length >= maxSubs) {
        showToast(`Maximum ${maxSubs} subordinates allowed`, "error");
        return prev;
      }
      return { ...prev, [empId]: { ...prev[empId], subordinates: [...current, subId] } };
    });
  };

  const handleDeleteCycle = async () => {
    const { cycleId, cycleName, isPending } = confirmDelete;
    setConfirmDelete(null);
    try {
      if (isPending) {
        const res  = await fetch(`${API_BASE}/api/feedback-cycles/${cycleId}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          showToast(`"${cycleName}" cycle deleted ✅`);
          fetchCyclesAndNominations();
        } else {
          showToast(data.message || "Delete failed", "error");
        }
      } else {
        const res  = await fetch(`${API_BASE}/api/feedback-nominations/${cycleId}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          showToast(`"${cycleName}" nominations deleted ✅`);
          fetchCyclesAndNominations();
        } else {
          showToast(data.message || "Delete failed", "error");
        }
      }
    } catch {
      showToast("Server error", "error");
    }
  };

  const handleClearEmployee = () => {
    const { empId } = confirmDelete;
    setNominations((prev) => ({ ...prev, [empId]: { peers: [], subordinates: [] } }));
    setConfirmDelete(null);
    showToast("Selections cleared");
  };

  const isValid = () => {
    if (employees.length === 0) return false;
    return employees.every((emp) => {
      const n         = nominations[emp._id];
      const needPeers = selectedCycle?.reviewerConfig?.peers !== false;
      if (needPeers && !n?.peers?.length) return false;
      return true;
    });
  };

  const handleSubmit = async () => {
    if (!isValid()) {
      showToast("Please assign at least 1 peer for all employees", "error");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        cycleId: selectedCycle._id,
        nominations: Object.entries(nominations).map(([empId, val]) => ({
          employeeId:     empId,
          managerId:      null,
          peerIds:        val.peers,
          subordinateIds: val.subordinates || [],
        })),
      };

      const res  = await fetch(`${API_BASE}/api/feedback-nominations`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setSubmitted(true);
        showToast("Nominations saved! ✅");
        fetchCyclesAndNominations();
      } else {
        showToast(data.message || "Error saving nominations", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Server error. Try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const completedCount = employees.filter((emp) => {
    const n         = nominations[emp._id];
    const needPeers = selectedCycle?.reviewerConfig?.peers !== false;
    if (needPeers && !n?.peers?.length) return false;
    return true;
  }).length;

  const pendingCycles   = cycles.filter((c) => !nominatedCycleIds.has(String(c._id)));
  const nominatedCycles = cycles.filter((c) =>  nominatedCycleIds.has(String(c._id)));

  return (
    <div style={s.page}>

      {/* ── Confirm Modal ── */}
      {confirmDelete && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={{ fontSize: 36, textAlign: "center", marginBottom: 10 }}>
              {confirmDelete.type === "cycle" ? "🗑️" : "🔄"}
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: "#111827", textAlign: "center" }}>
              {confirmDelete.type === "cycle"
                ? confirmDelete.isPending
                  ? `Delete cycle "${confirmDelete.cycleName}"?`
                  : `Delete nominations for "${confirmDelete.cycleName}"?`
                : `Clear selections for ${confirmDelete.empName}?`}
            </h3>
            <p style={{ margin: "0 0 22px", fontSize: 13, color: "#6b7280", textAlign: "center" }}>
              {confirmDelete.type === "cycle"
                ? confirmDelete.isPending
                  ? "This will permanently delete this feedback cycle and cannot be undone."
                  : "This will permanently remove all peer/subordinate assignments for this cycle."
                : "All peer and subordinate selections for this employee will be reset."}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setConfirmDelete(null)} style={s.btnModalCancel}>Cancel</button>
              <button
                onClick={confirmDelete.type === "cycle" ? handleDeleteCycle : handleClearEmployee}
                style={{
                  ...s.btnModalConfirm,
                  background: confirmDelete.type === "cycle" ? "#ef4444" : "#f59e0b",
                }}
              >
                {confirmDelete.type === "cycle"
                  ? confirmDelete.isPending ? "Yes, Delete Cycle" : "Yes, Delete"
                  : "Yes, Clear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ ...s.toast, background: toast.type === "error" ? "#ef4444" : "#16a34a" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.pageTitle}>Reviewer Nominations</h1>
          <p style={s.pageSubtitle}>Assign peer and subordinate reviewers for each employee</p>
        </div>
        <div style={s.managerNote}>
          <span>👔</span>
          <span>Manager will be assigned by HR separately</span>
        </div>
      </div>

      {/* ── STEP 1: Cycle Selection ── */}
      {!selectedCycle ? (
        <div>
          {/* Tabs */}
          <div style={s.tabRow}>
            {[
              { id: "pending",   label: `📝 Pending (${pendingCycles.length})`    },
              { id: "nominated", label: `✅ Nominated (${nominatedCycles.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...s.tabBtn,
                  background: activeTab === tab.id ? "#1a1a2e" : "transparent",
                  color:      activeTab === tab.id ? "#fff"    : "#6b7280",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── PENDING TAB ── */}
          {activeTab === "pending" && (
            <>
              {pendingCycles.length === 0 ? (
                <div style={s.emptyBox}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
                  <p style={{ color: "#6b7280", margin: 0 }}>All cycles have been nominated!</p>
                </div>
              ) : (
                <div style={s.cycleGrid}>
                  {pendingCycles.map((cycle) => (
                    <div key={cycle._id} style={s.cycleCard}>
                      <div style={s.cycleCardTop}>
                        <span style={s.cycleName}>{cycle.cycleName}</span>
                        <span style={s.activeBadge}>● Active</span>
                      </div>
                      <div style={s.cycleMeta}>
                        <span>📅 {cycle.period}</span>
                        {/* ✅ Employee name instead of count */}
                        <span>👤 {getEmpNames(cycle.selectedEmployees)}</span>
                      </div>
                      <div style={s.cycleDates}>
                        {cycle.startDate?.slice(0, 10)} → {cycle.endDate?.slice(0, 10)}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          style={{ ...s.btnSelect, flex: 1 }}
                          onClick={() => handleSelectCycle(cycle)}
                        >
                          Select &amp; Nominate →
                        </button>
                        <button
                          style={s.btnDeleteCycle}
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDelete({
                              type: "cycle", cycleId: cycle._id,
                              cycleName: cycle.cycleName, isPending: true,
                            });
                          }}
                          title="Delete this cycle"
                        >🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── NOMINATED TAB ── */}
          {activeTab === "nominated" && (
            <>
              {nominatedCycles.length === 0 ? (
                <div style={s.emptyBox}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>📋</div>
                  <p style={{ color: "#6b7280", margin: 0 }}>No nominations submitted yet.</p>
                </div>
              ) : (
                <div style={s.cycleGrid}>
                  {nominatedCycles.map((cycle) => (
                    <div key={cycle._id} style={{ ...s.cycleCard, borderColor: "#16a34a" }}>
                      <div style={s.cycleCardTop}>
                        <span style={s.cycleName}>{cycle.cycleName}</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <span style={{ ...s.activeBadge, background: "#dcfce7", color: "#16a34a" }}>✓ Nominated</span>
                          <span style={s.activeBadge}>● Active</span>
                        </div>
                      </div>
                      <div style={s.cycleMeta}>
                        <span>📅 {cycle.period}</span>
                        {/* ✅ Employee name instead of count */}
                        <span>👤 {getEmpNames(cycle.selectedEmployees)}</span>
                      </div>
                      <div style={s.cycleDates}>
                        {cycle.startDate?.slice(0, 10)} → {cycle.endDate?.slice(0, 10)}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          style={{ ...s.btnSelect, flex: 1 }}
                          onClick={() => handleSelectCycle(cycle)}
                        >✏️ Edit Nominations</button>
                        <button
                          style={s.btnDeleteCycle}
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDelete({
                              type: "cycle", cycleId: cycle._id,
                              cycleName: cycle.cycleName, isPending: false,
                            });
                          }}
                          title="Delete nominations"
                        >🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

      ) : submitted ? (
        <div style={s.successCard}>
          <div style={s.successIcon}>✓</div>
          <h2 style={s.successTitle}>Nominations Submitted!</h2>
          <p style={s.successSub}>
            Peer reviewers for <strong>{selectedCycle.cycleName}</strong> assigned for{" "}
            <strong>{employees.length}</strong> employees.
          </p>
          <p style={s.successSub}>Manager assignment will be handled by HR. 🎉</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20 }}>
            <button style={s.btnOutline} onClick={() => { setSelectedCycle(null); setSubmitted(false); }}>
              ← Back to Cycles
            </button>
          </div>
        </div>

      ) : (
        <div>
          <div style={s.infoBar}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={s.cycleIcon}>🔄</div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#111827" }}>{selectedCycle.cycleName}</p>
                <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
                  {selectedCycle.period} · {selectedCycle.startDate?.slice(0, 10)} → {selectedCycle.endDate?.slice(0, 10)}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={s.progressPill}>
                <span style={{ color: completedCount === employees.length && employees.length > 0 ? "#16a34a" : "#f59e0b", fontWeight: 700 }}>
                  {completedCount}/{employees.length}
                </span>
                <span style={{ color: "#6b7280", fontSize: 12 }}> completed</span>
              </div>
              <button style={s.btnBack} onClick={() => setSelectedCycle(null)}>← Change Cycle</button>
            </div>
          </div>

          <div style={s.progressBarWrap}>
            <div style={{
              ...s.progressBarFill,
              width: `${employees.length ? (completedCount / employees.length) * 100 : 0}%`,
            }} />
          </div>

          {employees.length === 0 && (
            <div style={s.warningBox}>
              ⚠️ No employees found for this cycle.
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 20 }}>
            {employees.map((emp) => {
              const nom             = nominations[emp._id] || { peers: [], subordinates: [] };
              const isComplete      = nom.peers.length > 0;
              const others          = allEmployees.filter((e) => e._id !== emp._id);
              const showSubs        = selectedCycle?.reviewerConfig?.subordinates !== false;
              const hasAnySelection = nom.peers.length > 0 || (nom.subordinates || []).length > 0;

              return (
                <div key={emp._id} style={{ ...s.empCard, borderColor: isComplete ? "#16a34a" : "#e5e7eb" }}>
                  <div style={s.empCardHeader}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ ...s.avatar, background: isComplete ? "#16a34a" : "#6b7280" }}>
                        {emp.name?.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p style={s.empName}>{emp.name}</p>
                        <p style={s.empRole}>{emp.designation || "Employee"} · {emp.department || "—"}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={s.managerBadge}>👔 Manager: HR will assign</span>
                      <span style={{
                        ...s.statusBadge,
                        background: isComplete ? "#dcfce7" : "#fef3c7",
                        color:      isComplete ? "#16a34a" : "#d97706",
                      }}>
                        {isComplete ? "✓ Ready" : "⏳ Pending"}
                      </span>
                      {hasAnySelection && (
                        <button
                          style={s.btnClearEmp}
                          onClick={() => setConfirmDelete({ type: "emp", empId: emp._id, empName: emp.name })}
                        >🗑️ Clear</button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: showSubs ? "1fr 1fr" : "1fr", gap: 20 }}>
                    <div style={s.fieldGroup}>
                      <label style={s.fieldLabel}>
                        👥 Peers
                        <span style={{ color: "#6b7280", fontWeight: 400, marginLeft: 6, fontSize: 12 }}>
                          (select up to {selectedCycle.peerCount || 2})
                        </span>
                        <span style={{ color: "#ef4444" }}> *</span>
                      </label>
                      <div style={s.chipGrid}>
                        {others.map((peer) => {
                          const sel = nom.peers.includes(peer._id);
                          return (
                            <div key={peer._id}
                              style={{
                                ...s.chip,
                                background: sel ? "#dcfce7" : "#f9fafb",
                                border:     sel ? "1.5px solid #16a34a" : "1.5px solid #e5e7eb",
                                color:      sel ? "#166534" : "#374151",
                              }}
                              onClick={() => handlePeerToggle(emp._id, peer._id)}
                            >
                              <div style={{ ...s.chipAvatar, background: sel ? "#16a34a" : "#9ca3af" }}>
                                {peer.name?.substring(0, 2).toUpperCase()}
                              </div>
                              <span style={{ fontSize: 13, fontWeight: sel ? 600 : 400 }}>{peer.name}</span>
                              <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 4 }}>
                                {peer.department ? `· ${peer.department}` : ""}
                              </span>
                              {sel && <span style={{ marginLeft: "auto", color: "#16a34a", fontWeight: 700 }}>✓</span>}
                            </div>
                          );
                        })}
                      </div>
                      <p style={s.countText}>{nom.peers.length}/{selectedCycle.peerCount || 2} selected</p>
                    </div>

                    {showSubs && (
                      <div style={s.fieldGroup}>
                        <label style={s.fieldLabel}>
                          🔽 Subordinates
                          <span style={{ color: "#6b7280", fontWeight: 400, marginLeft: 6, fontSize: 12 }}>
                            (up to {selectedCycle.subCount || 1}, optional)
                          </span>
                        </label>
                        <div style={s.chipGrid}>
                          {others.map((sub) => {
                            const sel = (nom.subordinates || []).includes(sub._id);
                            return (
                              <div key={sub._id}
                                style={{
                                  ...s.chip,
                                  background: sel ? "#eff6ff" : "#f9fafb",
                                  border:     sel ? "1.5px solid #2563eb" : "1.5px solid #e5e7eb",
                                  color:      sel ? "#1d4ed8" : "#374151",
                                }}
                                onClick={() => handleSubToggle(emp._id, sub._id)}
                              >
                                <div style={{ ...s.chipAvatar, background: sel ? "#2563eb" : "#9ca3af" }}>
                                  {sub.name?.substring(0, 2).toUpperCase()}
                                </div>
                                <span style={{ fontSize: 13, fontWeight: sel ? 600 : 400 }}>{sub.name}</span>
                                <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 4 }}>
                                  {sub.department ? `· ${sub.department}` : ""}
                                </span>
                                {sel && <span style={{ marginLeft: "auto", color: "#2563eb", fontWeight: 700 }}>✓</span>}
                              </div>
                            );
                          })}
                        </div>
                        <p style={s.countText}>{(nom.subordinates || []).length}/{selectedCycle.subCount || 1} selected</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {employees.length > 0 && (
            <div style={s.submitBar}>
              <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>
                {isValid()
                  ? "✅ All peer nominations ready. Submit when done!"
                  : `⚠️ ${employees.length - completedCount} employee(s) still need peer assignment`}
              </p>
              <button
                style={{
                  ...s.btnGreen,
                  background: !isValid() || submitting ? "#9ca3af" : "#16a34a",
                  cursor:     !isValid() || submitting ? "not-allowed" : "pointer",
                }}
                onClick={handleSubmit}
                disabled={!isValid() || submitting}
              >
                {submitting ? "Submitting..." : "✅ Submit Nominations"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  page:            { padding: "24px", background: "#f9fafb", minHeight: "100vh", fontFamily: "sans-serif" },
  header:          { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 },
  pageTitle:       { fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 },
  pageSubtitle:    { fontSize: 14, color: "#6b7280", marginTop: 4 },
  managerNote:     { display: "flex", alignItems: "center", gap: 8, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 14px", fontSize: 13, color: "#92400e", fontWeight: 500 },
  toast:           { position: "fixed", top: 20, right: 24, zIndex: 9999, color: "#fff", padding: "12px 20px", borderRadius: 8, fontWeight: 500, fontSize: 14, boxShadow: "0 4px 16px rgba(0,0,0,0.15)" },
  emptyBox:        { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "48px 24px", textAlign: "center" },
  cycleGrid:       { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 },
  cycleCard:       { background: "#fff", border: "2px solid #e5e7eb", borderRadius: 12, padding: 20 },
  cycleCardTop:    { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  cycleName:       { fontSize: 15, fontWeight: 700, color: "#111827" },
  activeBadge:     { background: "#dcfce7", color: "#16a34a", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 },
  cycleMeta:       { display: "flex", gap: 16, fontSize: 13, color: "#6b7280", marginBottom: 6 },
  cycleDates:      { fontSize: 12, color: "#9ca3af", marginBottom: 14 },
  btnSelect:       { padding: "10px 0", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" },
  infoBar:         { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 20px", marginBottom: 8 },
  cycleIcon:       { width: 38, height: 38, background: "#eff6ff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 },
  progressPill:    { background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 20, padding: "4px 14px", fontSize: 14 },
  btnBack:         { padding: "7px 14px", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 13, cursor: "pointer", color: "#374151" },
  progressBarWrap: { height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden", marginBottom: 4 },
  progressBarFill: { height: "100%", background: "#16a34a", borderRadius: 3, transition: "width 0.3s" },
  warningBox:      { background: "#fff3cd", border: "1px solid #ffc107", borderRadius: 10, padding: "16px 20px", marginTop: 16, color: "#856404", fontSize: 14 },
  empCard:         { background: "#fff", borderRadius: 12, padding: 22, border: "2px solid #e5e7eb" },
  empCardHeader:   { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid #f3f4f6", flexWrap: "wrap", gap: 10 },
  avatar:          { width: 42, height: 42, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 700, flexShrink: 0 },
  empName:         { fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 },
  empRole:         { fontSize: 12, color: "#6b7280", margin: 0 },
  statusBadge:     { padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  managerBadge:    { background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500 },
  fieldGroup:      { display: "flex", flexDirection: "column", gap: 8 },
  fieldLabel:      { fontSize: 13, fontWeight: 700, color: "#374151" },
  chipGrid:        { display: "flex", flexDirection: "column", gap: 6, maxHeight: 220, overflowY: "auto" },
  chip:            { display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, cursor: "pointer", userSelect: "none" },
  chipAvatar:      { width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0 },
  countText:       { fontSize: 12, color: "#6b7280", margin: "4px 0 0" },
  submitBar:       { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 20px", marginTop: 20 },
  btnGreen:        { padding: "10px 24px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600 },
  btnOutline:      { padding: "10px 20px", background: "#fff", color: "#374151", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer" },
  successCard:     { background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 48, textAlign: "center", maxWidth: 480, margin: "60px auto" },
  successIcon:     { width: 60, height: 60, background: "#dcfce7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "#16a34a", margin: "0 auto 20px" },
  successTitle:    { fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 8 },
  successSub:      { fontSize: 14, color: "#6b7280", marginBottom: 8 },
  tabRow:          { display: "flex", gap: 4, background: "#fff", borderRadius: 10, padding: 4, border: "1px solid #e5e7eb", marginBottom: 20, width: "fit-content" },
  tabBtn:          { padding: "8px 20px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 },
  btnDeleteCycle:  { padding: "10px 14px", background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 8, color: "#ef4444", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  btnClearEmp:     { padding: "4px 12px", background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 20, color: "#ef4444", fontWeight: 600, cursor: "pointer", fontSize: 12 },
  overlay:         { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" },
  modal:           { background: "#fff", borderRadius: 16, padding: 32, maxWidth: 400, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
  btnModalCancel:  { padding: "9px 22px", border: "1.5px solid #e5e7eb", borderRadius: 8, background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer", fontSize: 14 },
  btnModalConfirm: { padding: "9px 22px", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14 },
};