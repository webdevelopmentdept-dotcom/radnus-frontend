import React, { useState, useEffect } from "react";
import EmployeeLayout from "./EmployeeLayout";

const STATE_LABEL = { COMPLETED: "Completed", NOT_COMPLETED: "Not Completed" };

export default function LoanFollowup() {
  const API = import.meta.env.VITE_API_BASE_URL;
  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("employeeToken") || sessionStorage.getItem("employeeToken")}`,
  });

  const [tab, setTab] = useState("pending"); // "pending" | "completed"
  const [list, setList] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, completed: 0 });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [staffFilter, setStaffFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [reasonDraft, setReasonDraft] = useState({}); // { "id-dicOffice": text }
  const [savingKey, setSavingKey] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tab });
      if (search) params.append("search", search);
      const res = await fetch(`${API}/api/loan-followup/list?${params}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setList(data.data || []);
        setCounts(data.counts || { pending: 0, completed: 0 });
        setLoadError("");
      } else {
        setLoadError(data.message || `Error ${res.status}`);
      }
    } catch (err) {
      console.error("FOLLOWUP LOAD ERROR", err);
      setLoadError("Network error — couldn't load the list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, search]);

  // Tab maathumbodhu telecaller filter reset aagum
  useEffect(() => {
    setStaffFilter("");
  }, [tab]);

  const callApi = async (key, url, body) => {
    setSavingKey(key);
    try {
      const res = await fetch(`${API}${url}`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || "Couldn't save — please try again.");
        return;
      }
      await load(); // sanction = YES la customer Pending → Completed tab ku pogum
    } catch (err) {
      console.error("FOLLOWUP SAVE ERROR", err);
      alert("Network error — please try again.");
    } finally {
      setSavingKey("");
    }
  };

  // state: "COMPLETED" | "NOT_COMPLETED" | "" (clear)
  const saveStep = (c, step, state) => {
    const reason = (reasonDraft[`${c._id}-${step}`] ?? c.followup?.[step]?.reason ?? "").trim();
    if (state === "NOT_COMPLETED" && !reason) {
      alert("Please enter the reason before saving 'Not Completed'.");
      return;
    }
    callApi(`${c._id}-${step}`, `/api/loan-followup/${c._id}/step`, { step, state, reason });
  };

  // value: "YES" | "NO" | "" (clear)
  const saveSanction = (c, value) => {
    if (value === "YES" && !window.confirm(`Mark ${c.customerName}'s loan as SANCTIONED? It will move to the Completed tab.`)) return;
    callApi(`${c._id}-sanction`, `/api/loan-followup/${c._id}/sanction`, { value });
  };

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");

  const StepBox = ({ c, step, title }) => {
    const s = c.followup?.[step] || {};
    const key = `${c._id}-${step}`;
    const readOnly = tab === "completed";
    return (
      <div className="lf-step">
        <div className="lf-step-title">{title}</div>
        <div className="lf-btn-row">
          <button
            className={`lf-opt ${s.state === "COMPLETED" ? "on-yes" : ""}`}
            disabled={readOnly || savingKey === key}
            onClick={() => saveStep(c, step, "COMPLETED")}
          >
            Completed
          </button>
          <button
            className={`lf-opt ${s.state === "NOT_COMPLETED" ? "on-no" : ""}`}
            disabled={readOnly || savingKey === key}
            onClick={() => saveStep(c, step, "NOT_COMPLETED")}
          >
            Not Completed
          </button>
        </div>
        {!readOnly && s.state && (
          <button
            className="lf-clear"
            disabled={savingKey === key}
            onClick={() => {
              setReasonDraft((p) => ({ ...p, [key]: "" }));
              saveStep(c, step, "");
            }}
          >
            ✕ Clear
          </button>
        )}
        {!readOnly && (
          <input
            className="lf-reason"
            placeholder="Reason (required if Not Completed)"
            value={reasonDraft[key] ?? s.reason ?? ""}
            onChange={(e) => setReasonDraft((p) => ({ ...p, [key]: e.target.value }))}
          />
        )}
        {readOnly && s.state === "NOT_COMPLETED" && s.reason && (
          <div className="lf-note">📝 {s.reason}</div>
        )}
        {s.state && (
          <div className="lf-note">
            {STATE_LABEL[s.state]} · {fmtDate(s.updatedAt)} · {s.updatedByName}
          </div>
        )}
      </div>
    );
  };

  const staffOptions = [...new Set(list.map((c) => c.staffName).filter(Boolean))].sort();
  const visibleList = list.filter((c) => !staffFilter || c.staffName === staffFilter);

  return (
    <EmployeeLayout>
      <style>{`
        .lf-root { font-family: "Inter","Segoe UI",system-ui,sans-serif; color:#101828; }
        .lf-tabs { display:flex; gap:8px; margin-bottom:16px; }
        .lf-tab { padding:9px 18px; border-radius:10px; border:1px solid #E4E7EE; background:#fff; font-weight:600; cursor:pointer; }
        .lf-tab.active { background:#2A3EB1; color:#fff; border-color:#2A3EB1; }
        .lf-filters { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px; }
        .lf-search { padding:9px 14px; border:1px solid #E4E7EE; border-radius:8px; min-width:260px; background:#fff; }
        .lf-card { background:#fff; border:1px solid #E4E7EE; border-radius:14px; margin-bottom:12px; overflow:hidden; }
        .lf-head { display:flex; justify-content:space-between; align-items:center; padding:14px 18px; cursor:pointer; gap:12px; flex-wrap:wrap; }
        .lf-name { font-weight:700; font-size:15px; }
        .lf-sub { font-size:12px; color:#64748B; }
        .lf-staff { font-size:12px; font-weight:600; color:#2A3EB1; background:#EEF1FD; padding:3px 10px; border-radius:20px; }
        .lf-body { padding:16px 18px; border-top:1px solid #E4E7EE; background:#F6F7FB; }
        .lf-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:10px; margin-bottom:16px; }
        .lf-info { background:#fff; border:1px solid #E4E7EE; border-radius:8px; padding:8px 12px; font-size:13px; }
        .lf-info b { display:block; font-size:11px; color:#64748B; text-transform:uppercase; margin-bottom:2px; }
        .lf-steps { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:12px; }
        .lf-step { background:#fff; border:1px solid #E4E7EE; border-radius:10px; padding:12px; }
        .lf-step-title { font-weight:700; margin-bottom:8px; }
        .lf-btn-row { display:flex; gap:8px; margin-bottom:8px; }
        .lf-opt { flex:1; padding:7px 10px; border-radius:8px; border:1px solid #CBD5E1; background:#fff; cursor:pointer; font-weight:600; font-size:13px; }
        .lf-opt:disabled { opacity:.6; cursor:not-allowed; }
        .lf-opt.on-yes { background:#E7F7F2; color:#0F9D80; border-color:#0F9D80; }
        .lf-opt.on-no { background:#fee2e2; color:#b91c1c; border-color:#b91c1c; }
        .lf-reason { width:100%; padding:8px 10px; border:1px solid #E4E7EE; border-radius:8px; font-size:13px; }
        .lf-note { font-size:11px; color:#64748B; margin-top:6px; }
        .lf-clear { background:none; border:none; color:#b91c1c; font-size:12px; font-weight:600; cursor:pointer; padding:0 0 6px; }
        .lf-clear:disabled { opacity:.5; cursor:not-allowed; }
        .lf-badge { font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; }
        .lf-badge.pending { background:#fff4d6; color:#8a6100; }
        .lf-badge.done { background:#E7F7F2; color:#0F9D80; }
      `}</style>

      <div className="lf-root">
        <h4 style={{ fontWeight: 700, marginBottom: 4 }}>Loan Followup</h4>
        <p style={{ color: "#64748B", fontSize: 14, marginBottom: 16 }}>
          Customers whose loan process is completed by the telecaller. Update DIC Office, Bank Process and Loan Sanction here.
        </p>

        <div className="lf-tabs">
          <button className={`lf-tab ${tab === "pending" ? "active" : ""}`} onClick={() => setTab("pending")}>
            Pending ({counts.pending})
          </button>
          <button className={`lf-tab ${tab === "completed" ? "active" : ""}`} onClick={() => setTab("completed")}>
            Completed ({counts.completed})
          </button>
        </div>

        <div className="lf-filters">
          <input
            className="lf-search"
            placeholder="Search name or contact no…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="lf-search"
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
          >
            <option value="">All Telecallers</option>
            {staffOptions.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {loadError && <p style={{ color: "#b91c1c" }}>⚠ {loadError}</p>}
        {loading && <p style={{ color: "#64748B" }}>Loading…</p>}
        {!loading && !loadError && visibleList.length === 0 && <p style={{ color: "#64748B" }}>No customers in this tab.</p>}

        {visibleList.map((c) => {
          const isOpen = expandedId === c._id;
          const sanc = c.followup?.loanSanctioned?.value;
          return (
            <div className="lf-card" key={c._id}>
              <div className="lf-head" onClick={() => setExpandedId(isOpen ? null : c._id)}>
                <div>
                  <div className="lf-name">{c.customerName}</div>
                  <div className="lf-sub">{c.contactNo} {c.mailId ? `· ${c.mailId}` : ""}</div>
                </div>
                <span className="lf-staff">👤 {c.staffName || "Unknown"}</span>
                <div className="lf-sub">Handed over: {fmtDate(c.followup?.handedOverAt)}</div>
                <span className={`lf-badge ${tab === "completed" ? "done" : "pending"}`}>
                  {tab === "completed" ? "Sanctioned" : sanc === "NO" ? "Not Sanctioned" : "Pending"}
                </span>
                <span style={{ color: "#64748B" }}>{isOpen ? "▲" : "▼"}</span>
              </div>

              {isOpen && (
                <div className="lf-body">
                  <div className="lf-grid">
                    <div className="lf-info"><b>Business Type</b>{c.businessType || "—"}</div>
                    <div className="lf-info"><b>Business Sub-Type</b>{c.businessSubType || "—"}</div>
                    <div className="lf-info"><b>Scheme</b>{c.scheme || "—"}</div>
                    <div className="lf-info"><b>Loan Value</b>{c.loanValue ? `₹${Number(c.loanValue).toLocaleString("en-IN")}` : "—"}</div>
                    <div className="lf-info"><b>Bank Name</b>{c.bankName || "—"}</div>
                    <div className="lf-info"><b>IFSC Code</b>{c.ifscCode || "—"}</div>
                    <div className="lf-info"><b>Telecaller</b>{c.staffName || "—"}</div>
                    <div className="lf-info"><b>Communication Address</b>{c.communicationAddress || "—"}</div>
                    <div className="lf-info"><b>Unit Address</b>{c.unitAddress || "—"}</div>
                  </div>

                  <div className="lf-steps">
                    <StepBox c={c} step="dicOffice" title="1. DIC Office" />
                    <StepBox c={c} step="bank" title="2. Bank Process" />

                    <div className="lf-step">
                      <div className="lf-step-title">3. Loan Sanctioned</div>
                      <div className="lf-btn-row">
                        <button
                          className={`lf-opt ${sanc === "YES" ? "on-yes" : ""}`}
                          disabled={tab === "completed" || savingKey === `${c._id}-sanction`}
                          onClick={() => saveSanction(c, "YES")}
                        >
                          Yes
                        </button>
                        <button
                          className={`lf-opt ${sanc === "NO" ? "on-no" : ""}`}
                          disabled={tab === "completed" || savingKey === `${c._id}-sanction`}
                          onClick={() => saveSanction(c, "NO")}
                        >
                          No
                        </button>
                      </div>
                      {tab === "pending" && sanc && (
                        <button
                          className="lf-clear"
                          disabled={savingKey === `${c._id}-sanction`}
                          onClick={() => saveSanction(c, "")}
                        >
                          ✕ Clear
                        </button>
                      )}
                      {sanc && (
                        <div className="lf-note">
                          {sanc === "YES" ? "Yes" : "No"} · {fmtDate(c.followup.loanSanctioned.updatedAt)} · {c.followup.loanSanctioned.updatedByName}
                        </div>
                      )}
                      {tab === "pending" && (
                        <div className="lf-note">DIC Office & Bank both Completed aana piragu thaan "Yes" kudukka mudiyum.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </EmployeeLayout>
  );
}