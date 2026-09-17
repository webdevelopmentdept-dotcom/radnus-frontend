// LoanIncentivePayouts.jsx — HR/Admin: approve & pay loan incentives
// Loans become "Eligible for Processing" once the employee marks both
// "Online Loan Application" and "Projection Dispatch" on the Loan Process
// checklist (see LoanProcess.jsx / LoanCustomer.incentive on backend).
// This page is intentionally separate from the KPI-linked Incentive engine
// (IncentivePlan/IncentiveAssignment/IncentiveResult) — it doesn't touch it.
import EmployeeLayout from "../employee/EmployeeLayout";
import { useState, useEffect } from "react";
import { Wallet, CheckCircle2, Clock, IndianRupee, User } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const authHeaders = () => ({
  Authorization: `Bearer ${
    localStorage.getItem("hrToken") ||
    localStorage.getItem("adminToken") ||
    localStorage.getItem("employeeToken") ||
    sessionStorage.getItem("employeeToken") ||
    ""
  }`,
});

// Access-control section (who from Accounts team can approve/pay) is
// HR/Admin only — the Accounts employee who HAS access must not see it.
const isHrOrAdmin = () => window.location.pathname.startsWith("/hr");

const FIXED_INCENTIVE_AMOUNT = 150; // ₹150 per customer, fixed — no manual entry

const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function LoanIncentivePayouts() {
  const [tab, setTab] = useState("pending"); // "pending" | "paid"

  const [pendingLoans, setPendingLoans] = useState([]);
  const [paidLoans, setPaidLoans] = useState([]);
  const [pendingLoaded, setPendingLoaded] = useState(false);
  const [paidLoaded, setPaidLoaded] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [approvingId, setApprovingId] = useState(null); // _id of loan currently being approved

  // ── Loan Incentive Payout access (Accounts team, single fixed person) ──
  // HR/Admin only — not shown to the Accounts employee who has access.
  const showAccessControl = isHrOrAdmin();
  const [accEmployees, setAccEmployees] = useState([]);
  const [accLoading, setAccLoading] = useState(false);
  const [accSavingId, setAccSavingId] = useState(null);

  const loadAccountsEmployees = async () => {
    setAccLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/loan-process/incentives/access/accounts-employees`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) setAccEmployees(data.data || []);
    } catch (err) {
      console.error("LOAD ACCOUNTS EMPLOYEES ERROR", err);
    } finally {
      setAccLoading(false);
    }
  };

  const toggleLoanIncentiveAccess = async (emp) => {
    const nextValue = !emp.canApproveLoanIncentive;

    // optimistic update — only one Accounts person can hold this at a time
    setAccEmployees((prev) =>
      prev.map((e) => ({
        ...e,
        canApproveLoanIncentive: e._id === emp._id ? nextValue : false,
      }))
    );
    setAccSavingId(emp._id);

    try {
      const res = await fetch(`${API_BASE}/api/loan-process/incentives/access/${emp._id}`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextValue }),
      });
      const data = await res.json();
      if (!data.success) loadAccountsEmployees(); // re-sync on failure
    } catch (err) {
      console.error("TOGGLE LOAN INCENTIVE ACCESS ERROR", err);
      loadAccountsEmployees();
    } finally {
      setAccSavingId(null);
    }
  };

  const loadPending = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/loan-process/incentives/pending`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setPendingLoans(data.customers || []);
      } else {
        setError(data.message || "Failed to load pending incentives");
      }
    } catch (err) {
      setError("Server error while loading pending incentives");
    } finally {
      setPendingLoaded(true);
    }
  };

  const loadPaid = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/loan-process/incentives/paid`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setPaidLoans(data.customers || []);
      } else {
        setError(data.message || "Failed to load paid incentives");
      }
    } catch (err) {
      setError("Server error while loading paid incentives");
    } finally {
      setPaidLoaded(true);
    }
  };

  // Load pending on first mount; load paid lazily the first time that tab opens.
  useEffect(() => {
  setLoading(true);
  Promise.all([loadPending(), loadPaid()]).finally(() => setLoading(false));
  if (showAccessControl) loadAccountsEmployees();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  const approveAndPay = async (loan) => {
    if (!window.confirm(`Pay ₹${FIXED_INCENTIVE_AMOUNT} incentive to ${loan.staffName} for ${loan.customerName}'s loan?`)) {
      return;
    }
    setApprovingId(loan._id);
    try {
      const res = await fetch(
        `${API_BASE}/api/loan-process/${loan._id}/incentive/approve`,
        {
          method: "POST",
          headers: { ...authHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ amount: FIXED_INCENTIVE_AMOUNT, remark: "" }),
        }
      );
      const data = await res.json();
      if (data.success) {
        // Move the loan from Pending list into Paid list immediately.
        setPendingLoans((prev) => prev.filter((l) => l._id !== loan._id));
        setPaidLoans((prev) => [data.customer, ...prev]);
        setPaidLoaded(true);
      } else {
        alert(data.message || "Failed to approve incentive");
      }
    } catch (err) {
      alert("Server error while approving incentive");
    } finally {
      setApprovingId(null);
    }
  };

  const loans = tab === "pending" ? pendingLoans : paidLoans;
  const showEmpty =
    !loading &&
    !error &&
    loans.length === 0 &&
    (tab === "pending" ? pendingLoaded : paidLoaded);

  const page = (
    <div style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <Wallet size={22} />
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Loan incentive payouts</h2>
      </div>
      <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 20 }}>
        Loans where the employee has completed both "Online Loan Application" and
        "Projection Dispatch". Click "Approve & pay" to release the fixed ₹{FIXED_INCENTIVE_AMOUNT} incentive.
      </p>

      {showAccessControl && (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 22,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>
            Loan Incentive Payout Access (Account team)
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
            Only Account-team employees show here. Turn access ON for the one person who should
            approve &amp; pay loan incentives — "Loan Incentive" shows up in their dashboard.
            Turning ON for someone new automatically turns it OFF for the previous person.
          </div>

          {accLoading && <div style={{ fontSize: 12, color: "#6b7280" }}>Loading…</div>}
          {!accLoading && accEmployees.length === 0 && (
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              No Account-team employees found (department must contain "Account").
            </div>
          )}
          {!accLoading && accEmployees.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {accEmployees.map((emp) => (
                <div
                  key={emp._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "6px 0",
                    borderTop: "1px solid #f3f4f6",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{emp.name}</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>{emp.email}</div>
                  </div>
                  <button
                    onClick={() => toggleLoanIncentiveAccess(emp)}
                    disabled={accSavingId === emp._id}
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 30,
                      border: "none",
                      position: "relative",
                      flexShrink: 0,
                      cursor: accSavingId === emp._id ? "not-allowed" : "pointer",
                      background: emp.canApproveLoanIncentive ? "#0F9D80" : "#CBD5E1",
                      opacity: accSavingId === emp._id ? 0.6 : 1,
                    }}
                    aria-label={`Toggle Loan Incentive Payout access for ${emp.name}`}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: 3,
                        left: emp.canApproveLoanIncentive ? 23 : 3,
                        width: 18,
                        height: 18,
                        background: "#fff",
                        borderRadius: "50%",
                        transition: "left 0.2s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                      }}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          borderBottom: "1px solid #e5e7eb",
          marginBottom: 18,
        }}
      >
        {[
          { key: "pending", label: "Pending", count: pendingLoans.length },
          { key: "paid", label: "Paid", count: paidLoans.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              color: tab === t.key ? "#111827" : "#6b7280",
              borderBottom: tab === t.key ? "2px solid #111827" : "2px solid transparent",
              marginBottom: -1,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {t.label}
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                background: tab === t.key ? "#111827" : "#e5e7eb",
                color: tab === t.key ? "#fff" : "#6b7280",
                borderRadius: 999,
                padding: "1px 7px",
              }}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {loading && <p style={{ color: "#6b7280" }}>Loading…</p>}
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      {showEmpty && (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 32,
            textAlign: "center",
            color: "#6b7280",
          }}
        >
          <CheckCircle2 size={28} style={{ marginBottom: 8 }} />
          <div>
            {tab === "pending"
              ? "No loans pending incentive approval right now."
              : "No incentives paid out yet."}
          </div>
        </div>
      )}

      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {loans.map((loan) =>
            tab === "pending" ? (
              <div
                key={loan._id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{loan.customerName}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                    By {loan.staffName} · Loan value ₹{loan.loanValue?.toLocaleString?.() || 0}
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>
  App No: {loan.checklistRemarks?.applicationProcess || "—"} · Slip No: {loan.checklistRemarks?.courier || "—"}
</div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      color: "#8a6100",
                      background: "#fff4d6",
                      padding: "2px 8px",
                      borderRadius: 999,
                      marginTop: 6,
                    }}
                  >
                    <Clock size={12} /> Eligible for processing
                  </div>
                </div>
                <button
                  onClick={() => approveAndPay(loan)}
                  disabled={approvingId === loan._id}
                  style={{
                    background: approvingId === loan._id ? "#9ca3af" : "#111827",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: approvingId === loan._id ? "not-allowed" : "pointer",
                  }}
                >
                  {approvingId === loan._id ? "Processing…" : "Approve & pay"}
                </button>
              </div>
            ) : (
              <div
                key={loan._id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{loan.customerName}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                    By {loan.staffName} · Loan value ₹{loan.loanValue?.toLocaleString?.() || 0}
                  </div>
                  {loan.incentive?.paidRemark && (
                    <div style={{ fontSize: 12, color: "#374151", marginTop: 4, fontStyle: "italic" }}>
                      "{loan.incentive.paidRemark}"
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      color: "#6b7280",
                      marginTop: 6,
                    }}
                  >
                    <User size={12} />
                    Paid by {loan.incentive?.paidByName || "—"} on {formatDate(loan.incentive?.paidAt)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontWeight: 700,
                      fontSize: 15,
                      color: "#166534",
                    }}
                  >
                    <IndianRupee size={14} />
                    {loan.incentive?.amount?.toLocaleString?.() || 0}
                  </div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      color: "#166534",
                      background: "#dcfce7",
                      padding: "2px 8px",
                      borderRadius: 999,
                      marginTop: 6,
                    }}
                  >
                    <CheckCircle2 size={12} /> Paid
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );

  return isHrOrAdmin() ? page : <EmployeeLayout>{page}</EmployeeLayout>;
}