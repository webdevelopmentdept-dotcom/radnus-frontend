import { useEffect, useState } from "react";
import axios from "axios";
import {
  CheckCircle, Clock, ChevronDown, ChevronUp,
  Send, AlertCircle, Plus, Trash2, Calendar, TrendingUp, Download,
  ClipboardList, BookOpen, Star, BarChart2, Wand2, BookMarked,
  Inbox, Target, MessageSquare, FileText, Hourglass, XCircle,
  AlertTriangle, ThumbsUp, Trophy, Award, GraduationCap, Layers,
  CheckSquare, Activity, Info, Lock, User, Edit3, RefreshCw
} from "lucide-react";
import EmployeeLayout from "./EmployeeLayout";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const today = new Date().toISOString().split("T")[0];

// ── owner_role helpers ──────────────────────────────────────────
const isLockedByRole = (item) => {
  const role = item.owner_role || "self";
  return role !== "self";
};

const getRoleLockInfo = (role) => {
  const map = {
    manager: { label: "Manager",       color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", icon: "👔" },
    md:      { label: "MD / Director", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", icon: "🏢" },
    hr:      { label: "HR",            color: "#d97706", bg: "#fffbeb", border: "#fde68a", icon: "🧾" },
  };
  return map[role] || map.hr;
};
// ───────────────────────────────────────────────────────────────

export default function SelfAssessment() {
  const [assignment, setAssignment]   = useState(null);
  const [existing, setExisting]       = useState(null);
  const [form, setForm]               = useState({ items: [], overall_comment: "" });
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [toast, setToast]             = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);
  const [activeTab, setActiveTab]     = useState("assessment");

  const [logs, setLogs]               = useState([]);
  const [logTotals, setLogTotals]     = useState({});
  const [programLogTotals, setProgramLogTotals] = useState({});
  const [logForm, setLogForm]         = useState({ kpi_item_id: "", value: "", note: "", log_date: today });
  const [programValues, setProgramValues] = useState({});
  const [savingLog, setSavingLog]     = useState(false);
  const [deletingLog, setDeletingLog] = useState(null);
  const [assessmentProgramValues, setAssessmentProgramValues] = useState({});
  const [employee, setEmployee]       = useState(null);

  const [completedReviews, setCompletedReviews] = useState([]);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const employeeId = localStorage.getItem("employeeId");

  const HR_FINALIZED_STATUSES = ["reviewed", "finalized", "completed", "hr_reviewed", "approved"];
  const isHRReviewed =
    HR_FINALIZED_STATUSES.includes(existing?.status) ||
    existing?.isLocked === true ||
    existing?.hr_finalized === true ||
    (existing?.final_score !== undefined && existing?.final_score !== null) ||
    completedReviews.some(r =>
      r.assignment_id === assignment?._id ||
      r._id === existing?._id
    );

  useEffect(() => { fetchData(); }, []);

  // const fetchData = async () => {
  //   try {
  //     const empRes = await axios.get(`${API_BASE}/api/employee/me/${employeeId}`);
  //     setEmployee(empRes.data);

  //     const assignRes = await axios.get(`${API_BASE}/api/kpi-assignments/${employeeId}`);
  //     // const assignRes = await axios.get(`${API_BASE}/api/kpi-assignments/pending/${employeeId}`);

  //     if (assignRes.data.success && assignRes.data.data) {
  //       const assign = assignRes.data.data;
  //       setAssignment(assign);
  //       const kpiItems = assign.template_id?.kpi_items || [];

  //       // ── CHANGE 1: owner_role include பண்றோம் ──
  //       const initItems = kpiItems.map(item => ({
  //         kpi_item_id:      item._id,
  //         kpi_name:         item.kpi_name,
  //         target:           item.target,
  //         unit:             item.unit,
  //         weight:           item.weight || 0,
  //         is_admission_kpi: item.is_admission_kpi || false,
  //         program_targets:  item.program_targets || [],
  //         owner_role:       item.owner_role || "self",   // ← NEW
  //         self_value:       "",
  //         self_comment:     ""
  //       }));

  //       const existingRes = await axios.get(`${API_BASE}/api/self-assessment/by-assignment/${assign._id}`);
  //       if (existingRes.data.success && existingRes.data.data) {
  //         const prev = existingRes.data.data;
  //         setExisting(prev);
  //         setSubmitted(true);

  //         const isFinalized = HR_FINALIZED_STATUSES.includes(prev.status) ||
  //           prev.isLocked === true ||
  //           prev.hr_finalized === true ||
  //           (prev.final_score !== undefined && prev.final_score !== null);

  //         if (isFinalized) setActiveTab("completed");

  //         const filledItems = initItems.map(item => {
  //           const prevItem = prev.items.find(p => p.kpi_item_id === item.kpi_item_id);
  //           return prevItem
  //             ? {
  //                 ...item,
  //                 weight:           item.weight,
  //                 is_admission_kpi: item.is_admission_kpi,
  //                 program_targets:  item.program_targets,
  //                 owner_role:       item.owner_role,     // ← keep owner_role
  //                 self_value:       prevItem.self_value,
  //                 self_comment:     prevItem.self_comment || ""
  //               }
  //             : item;
  //         });
  //         setForm({ items: filledItems, overall_comment: prev.overall_comment || "" });
  //       } else {
  //         setForm({ items: initItems, overall_comment: "" });
  //       }

  //       await fetchLogs(assign._id);
  //     }

  //     await fetchCompletedReviews();
  //   } catch (err) {
  //     console.error(err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };


  const fetchData = async () => {
  try {
    const empRes = await axios.get(`${API_BASE}/api/employee/me/${employeeId}`);
    setEmployee(empRes.data);

    const assignRes = await axios.get(`${API_BASE}/api/kpi-assignments/${employeeId}`);

    if (assignRes.data.success && assignRes.data.data) {
      const assign = assignRes.data.data;
      setAssignment(assign);

      // ✅ FIX: Use month_version_id.kpi_items if available
      const kpiItems = assign.month_version_id?.kpi_items 
        ? assign.month_version_id.kpi_items 
        : assign.template_id?.kpi_items || [];

      console.log("=== DEBUG ===");
      console.log("Assignment period:", assign.period);
      console.log("Month version:", assign.month_version_id?.month);
      console.log("KPI items source:", assign.month_version_id?.kpi_items ? "month_version" : "template_default");
      console.log("KPI items:", kpiItems);

      const initItems = kpiItems.map(item => ({
        kpi_item_id:      item._id || item.kpi_item_id,
        kpi_name:         item.kpi_name,
        target:           item.target,
        unit:             item.unit,
        weight:           item.weight || 0,
        is_admission_kpi: item.is_admission_kpi || false,
        program_targets:  item.program_targets || [],
        owner_role:       item.owner_role || "self",
        self_value:       "",
        self_comment:     ""
      }));

      const existingRes = await axios.get(`${API_BASE}/api/self-assessment/by-assignment/${assign._id}`);
      if (existingRes.data.success && existingRes.data.data) {
        const prev = existingRes.data.data;
        setExisting(prev);
        setSubmitted(true);

        const isFinalized = HR_FINALIZED_STATUSES.includes(prev.status) ||
          prev.isLocked === true ||
          prev.hr_finalized === true ||
          (prev.final_score !== undefined && prev.final_score !== null);

        if (isFinalized) setActiveTab("completed");

        const filledItems = initItems.map(item => {
          const prevItem = prev.items.find(p => p.kpi_item_id === item.kpi_item_id);
          return prevItem
            ? {
                ...item,
                self_value:   prevItem.self_value,
                self_comment: prevItem.self_comment || ""
              }
            : item;
        });
        setForm({ items: filledItems, overall_comment: prev.overall_comment || "" });
      } else {
        setForm({ items: initItems, overall_comment: "" });
      }

      await fetchLogs(assign._id);
    }

    await fetchCompletedReviews();
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};


  const fetchCompletedReviews = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/self-assessment/completed/${employeeId}`);
      if (res.data.success) setCompletedReviews(res.data.data || []);
    } catch (err) {
      console.error("Completed reviews fetch error:", err);
    }
  };

  const fetchLogs = async (assignmentId) => {
    try {
      const [logsRes, totalsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/daily-logs/${employeeId}/${assignmentId}`),
        axios.get(`${API_BASE}/api/daily-logs/totals/${employeeId}/${assignmentId}`)
      ]);
      if (logsRes.data.success) {
        setLogs(logsRes.data.data);
        buildProgramTotals(logsRes.data.data || []);
      }
      if (totalsRes.data.success) setLogTotals(totalsRes.data.data);
    } catch (err) { console.error(err); }
  };

  const buildProgramTotals = (allLogs) => {
    const totals = {};
    allLogs.forEach(log => {
      if (log.program_values && Object.keys(log.program_values).length > 0) {
        if (!totals[log.kpi_item_id]) totals[log.kpi_item_id] = {};
        Object.entries(log.program_values).forEach(([progId, val]) => {
          totals[log.kpi_item_id][progId] = (totals[log.kpi_item_id][progId] || 0) + (Number(val) || 0);
        });
      }
    });
    setProgramLogTotals(totals);
  };

  const selectedLogKpi = form.items.find(i => i.kpi_item_id === logForm.kpi_item_id);
  const isAdmissionLogKpi = selectedLogKpi?.is_admission_kpi || false;
  const programValuesTotal = Object.values(programValues).reduce((s, v) => s + (Number(v) || 0), 0);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const autoFillFromLogs = () => {
    if (!Object.keys(logTotals).length) return showToast("No daily logs found to auto-fill", "error");

    const newAssessmentProgVals = {};
    form.items.forEach(item => {
      if (item.is_admission_kpi && item.program_targets?.length > 0) {
        const progTotals = programLogTotals[item.kpi_item_id] || {};
        if (Object.keys(progTotals).length > 0) {
          newAssessmentProgVals[item.kpi_item_id] = {};
          item.program_targets.forEach(pt => {
            newAssessmentProgVals[item.kpi_item_id][pt.program_id] = progTotals[pt.program_id] || 0;
          });
        }
      }
    });
    setAssessmentProgramValues(newAssessmentProgVals);

    setForm(f => ({
      ...f,
      items: f.items.map(item => ({
        ...item,
        // ── CHANGE: locked items auto-fill பண்ணாதே ──
        self_value: isLockedByRole(item)
          ? item.self_value
          : logTotals[item.kpi_item_id] !== undefined
            ? String(logTotals[item.kpi_item_id])
            : item.self_value
      }))
    }));

    setActiveTab("assessment");
    showToast("Self assessment auto-filled from your daily logs!");
  };

  // ── EXCEL DOWNLOAD ──
  const downloadLogsAsExcel = () => {
    if (!logs.length) return showToast("No logs to download", "error");

    import("xlsx").then(XLSX => {
      const rows = [];
      const sortedLogs = [...logs].sort((a, b) => b.log_date.localeCompare(a.log_date));

      sortedLogs.forEach(log => {
        const kpiItem = form.items.find(i => i.kpi_item_id === log.kpi_item_id);
        const hasPrograms = log.program_values && Object.keys(log.program_values).length > 0;

        if (hasPrograms) {
          Object.entries(log.program_values).forEach(([progId, val]) => {
            const prog = kpiItem?.program_targets?.find(p => p.program_id === progId);
            rows.push({
              "Date":     log.log_date,
              "KPI Name": log.kpi_name,
              "Program":  prog?.program_name || progId,
              "Value":    val,
              "Unit":     log.unit,
              "Note":     log.note || ""
            });
          });
          rows.push({
            "Date":     log.log_date,
            "KPI Name": log.kpi_name,
            "Program":  "-- TOTAL --",
            "Value":    log.value,
            "Unit":     log.unit,
            "Note":     log.note || ""
          });
        } else {
          rows.push({
            "Date":     log.log_date,
            "KPI Name": log.kpi_name,
            "Program":  "-",
            "Value":    log.value,
            "Unit":     log.unit,
            "Note":     log.note || ""
          });
        }
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [{ wch: 14 }, { wch: 28 }, { wch: 22 }, { wch: 10 }, { wch: 10 }, { wch: 35 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Daily Logs");
      const fileName = `DailyLogs_${assignment?.period || "export"}_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      showToast("Excel downloaded!");
    }).catch(() => {
      showToast("xlsx package not found. Run: npm install xlsx", "error");
    });
  };

  const handleAddLog = async () => {
    if (!logForm.kpi_item_id) return showToast("Select KPI", "error");
    if (isAdmissionLogKpi) {
      if (programValuesTotal === 0) return showToast("Enter value for at least one program", "error");
    } else {
      if (!logForm.value) return showToast("Enter a value", "error");
    }

    setSavingLog(true);
    try {
      const kpiItem = form.items.find(i => i.kpi_item_id === logForm.kpi_item_id);
      const payload = {
        employee_id:    employeeId,
        assignment_id:  assignment._id,
        kpi_item_id:    logForm.kpi_item_id,
        kpi_name:       kpiItem?.kpi_name || "",
        unit:           kpiItem?.unit || "",
        value:          isAdmissionLogKpi ? programValuesTotal : parseFloat(logForm.value),
        note:           logForm.note,
        log_date:       logForm.log_date,
        period:         assignment.period,
        program_values: isAdmissionLogKpi
          ? Object.fromEntries(
              Object.entries(programValues)
                .filter(([_, v]) => v !== "" && Number(v) > 0)
                .map(([k, v]) => [k, Number(v)])
            )
          : {}
      };
      const res = await axios.post(`${API_BASE}/api/daily-logs`, payload);
      if (res.data.success) {
        showToast("Progress logged!");
        setLogForm({ kpi_item_id: "", value: "", note: "", log_date: today });
        setProgramValues({});
        await fetchLogs(assignment._id);
      }
    } catch (err) {
      showToast("Failed to save log", "error");
    } finally {
      setSavingLog(false);
    }
  };

  const handleDeleteLog = async (id) => {
    setDeletingLog(id);
    try {
      await axios.delete(`${API_BASE}/api/daily-logs/${id}`);
      showToast("Log deleted");
      await fetchLogs(assignment._id);
    } catch {
      showToast("Delete failed", "error");
    } finally {
      setDeletingLog(null);
    }
  };

  const handleItemChange = (idx, field, value) => {
    setForm(f => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...f, items };
    });
  };

  const getProgress = (item) => {
    if (!item.self_value || !item.target) return 0;
    return Math.min(Math.round((parseFloat(item.self_value) / item.target) * 100), 150);
  };

  const getProgressColor = (pct) => {
    if (pct >= 100) return "#16a34a";
    if (pct >= 75)  return "#2563eb";
    if (pct >= 50)  return "#d97706";
    return "#dc2626";
  };

  // ── CHANGE: locked KPI-கள் submit validation-ல் skip பண்ணு ──
  const isFormValid = () =>
    form.items.every(item =>
      isLockedByRole(item) || (item.self_value !== "" && item.self_value !== null)
    );

  const calcOverallScore = () => {
    if (!form.items.length) return 0;
    let total = 0;
    const totalWeight = form.items.reduce((s, i) => s + (i.weight || 0), 0);
    const equalWeight = 100 / form.items.length;
    form.items.forEach(item => {
      const pct = Math.min((parseFloat(item.self_value) / item.target) * 100, 100);
      const w = totalWeight === 0 ? equalWeight : (item.weight || 0);
      total += (isNaN(pct) ? 0 : pct) * (w / 100);
    });
    return Math.round(total);
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return showToast("Please fill all your KPI values", "error");
    setSaving(true);
    try {
      const payload = {
        employee_id:   employeeId,
        assignment_id: assignment._id,
        period:        assignment.period,
        items: form.items.map(i => ({
          kpi_item_id:      i.kpi_item_id,
          kpi_name:         i.kpi_name,
          target:           i.target,
          unit:             i.unit,
          weight:           i.weight,
          is_admission_kpi: i.is_admission_kpi,
          program_targets:  i.program_targets,
          owner_role:       i.owner_role,
          self_value:       parseFloat(i.self_value) || 0,
          self_comment:     i.self_comment
        })),
        overall_comment: form.overall_comment
      };
      const res = await axios.post(`${API_BASE}/api/self-assessment`, payload);
      if (res.data.success) {
        showToast(res.data.updated ? "Assessment updated!" : "Self assessment submitted!");
        setSubmitted(true);
        setExisting(res.data.data);
      } else {
        showToast(res.data.message || "Submission failed", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Server error", "error");
    } finally {
      setSaving(false);
    }
  };

  const getRatingLabel = (score) => {
    if (score >= 90) return { label: "Outstanding",          color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", Icon: Trophy };
    if (score >= 75) return { label: "Exceeds Expectations", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", Icon: Award };
    if (score >= 60) return { label: "Meets Expectations",   color: "#d97706", bg: "#fffbeb", border: "#fde68a", Icon: ThumbsUp };
    if (score >= 45) return { label: "Needs Improvement",    color: "#ea580c", bg: "#fff7ed", border: "#fed7aa", Icon: AlertTriangle };
    return             { label: "Unsatisfactory",            color: "#dc2626", bg: "#fef2f2", border: "#fecaca", Icon: XCircle };
  };

  const overallScore = calcOverallScore();

  const logsByDate = logs.reduce((acc, log) => {
    if (!acc[log.log_date]) acc[log.log_date] = [];
    acc[log.log_date].push(log);
    return acc;
  }, {});

  const formatMonthLabel = (monthKey) => {
    const [y, m] = monthKey.split("-");
    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
    return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  };

  const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 };
  const inputStyle = { width: "100%", padding: "9px 11px", border: "1px solid #d1d5db", borderRadius: 7, fontSize: 13, color: "#1a1a2e", background: "#fff", boxSizing: "border-box", outline: "none" };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "4px solid #e5e7eb", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }}/>
        <p style={{ color: "#6b7280", fontSize: 14 }}>Loading...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  return (
    <EmployeeLayout>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .sa-tab-strip { display: flex; gap: 4px; background: #fff; border-radius: 10px; padding: 4px; border: 1px solid #e5e7eb; margin-bottom: 20px; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; width: 100%; box-sizing: border-box; }
        .sa-tab-strip::-webkit-scrollbar { display: none; }
        .sa-tab-btn { flex: 1 1 0; min-width: 0; padding: 8px 6px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 5px; }
        .sa-title-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; gap: 8px; width: 100%; box-sizing: border-box; }
        .sa-badge { display: inline-flex; align-items: center; gap: 6px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 6px 10px; flex-shrink: 0; white-space: nowrap; align-self: flex-start; }
        @media (max-width: 400px) { .kpi-card-header { flex-wrap: wrap; gap: 6px; } .kpi-right-val { width: 100%; text-align: left !important; flex-direction: row !important; gap: 8px; align-items: center; } }
        .sa-info-banner { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 12px 14px; margin-bottom: 16px; display: flex; gap: 10px; align-items: flex-start; width: 100%; box-sizing: border-box; overflow: hidden; }
        .sa-info-banner p { margin: 0; font-size: 13px; color: #1e40af; line-height: 1.5; word-break: break-word; overflow-wrap: anywhere; min-width: 0; }
        @media (max-width: 480px) { .review-card-header { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; } .review-score-right { text-align: left !important; } }
        @media (max-width: 360px) { .log-item-name { white-space: normal !important; word-break: break-word; } }
        .sa-badge--hr { background: #eff6ff !important; border-color: #bfdbfe !important; }
        .adm-prog-pill { font-size: 10px; background: #f0f9ff; color: #0369a1; padding: 1px 8px; border-radius: 99px; border: 1px solid #bae6fd; font-weight: 700; white-space: nowrap; }
        .adm-kpi-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 99px; font-size: 10px; font-weight: 700; color: #0369a1; }
        .prog-chip-input { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 12px; background: #fff; border: 1.5px solid #bae6fd; border-radius: 9px; margin-bottom: 8px; transition: border-color 0.15s; }
        .prog-chip-input:focus-within { border-color: #0369a1; }
        .dl-btn:hover { background: #15803d !important; }
        .role-lock-banner { display: flex; align-items: center; gap: 12px; border-radius: 10px; padding: 14px 16px; margin-bottom: 16px; }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{ background: "#fff", padding: "14px 20px", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ClipboardList size={18} color="#2563eb" />
          <span style={{ fontWeight: 700, color: "#2563eb", fontSize: 15 }}>Self Assessment</span>
          <div style={{ marginLeft: "auto", width: 40, height: 40, borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 }}>
            {employee?.name?.charAt(0) || "E"}
          </div>
        </div>
      </header>

      <div style={{ padding: isMobile ? "14px" : "28px 32px", background: "#f4f6fb", minHeight: "100vh", overflowX: "hidden", boxSizing: "border-box", width: "100%" }}>

        {/* TOAST */}
        {toast && (
          <div style={{ position: "fixed", top: 16, right: 14, left: 14, zIndex: 9999, background: toast.type === "error" ? "#ff4d4f" : "#52c41a", color: "#fff", padding: "12px 16px", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", fontWeight: 500, fontSize: 14, textAlign: "center" }}>
            {toast.msg}
          </div>
        )}

        {!assignment ? (
          <div style={{ background: "#fff", borderRadius: 16, padding: "60px 20px", textAlign: "center", border: "1px solid #e5e7eb" }}>
            <ClipboardList size={52} color="#d1d5db" style={{ marginBottom: 12 }} />
            <h3 style={{ color: "#1f2937", marginBottom: 8 }}>No KPIs Assigned Yet</h3>
            <p style={{ color: "#6b7280", fontSize: 14 }}>Your HR team hasn't assigned KPIs to you yet.</p>
          </div>
        ) : (
          <>
            {/* ── Title Row ── */}
            <div className="sa-title-row">
              <div style={{ minWidth: 0, flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: isMobile ? 16 : 22, fontWeight: 800, color: "#1a1a2e" }}>My Work Tracker</h2>
                <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 11, wordBreak: "break-word" }}>
                  {assignment.period} · {assignment.template_id?.role} · {assignment.template_id?.department}
                </p>
              </div>
              {submitted && (
                <div className={`sa-badge${isHRReviewed ? " sa-badge--hr" : ""}`}>
                  <CheckCircle size={13} color={isHRReviewed ? "#2563eb" : "#16a34a"}/>
                  <span style={{ fontSize: 11, fontWeight: 600, color: isHRReviewed ? "#2563eb" : "#16a34a" }}>
                    {isHRReviewed ? "HR Reviewed" : "Submitted"}
                  </span>
                </div>
              )}
            </div>

            {/* ── TABS ── */}
            <div className="sa-tab-strip">
              {[
                { id: "dailylog",   label: `Log (${logs.length})`,            Icon: Calendar },
                { id: "assessment", label: "Assessment",                        Icon: ClipboardList },
                { id: "completed",  label: `Done (${completedReviews.length})`, Icon: CheckSquare }
              ].map(tab => (
                <button key={tab.id} className="sa-tab-btn" onClick={() => setActiveTab(tab.id)}
                  style={{ background: activeTab === tab.id ? "#2563eb" : "transparent", color: activeTab === tab.id ? "#fff" : "#6b7280" }}>
                  <tab.Icon size={13} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ═══════════════════════════════════
                DAILY LOG TAB
            ═══════════════════════════════════ */}
            {activeTab === "dailylog" && (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 320px", gap: 16, width: "100%", boxSizing: "border-box" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ background: "#fff", borderRadius: 14, padding: isMobile ? 14 : 24, border: "1px solid #e5e7eb", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <Edit3 size={16} color="#2563eb" />
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1a1a2e" }}>Log Today's Progress</h3>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={labelStyle}>Select KPI *</label>
                        {/* ── CHANGE 5: non-self KPI-கள் disabled ── */}
                        <select value={logForm.kpi_item_id}
                          onChange={e => { setLogForm(f => ({ ...f, kpi_item_id: e.target.value, value: "" })); setProgramValues({}); }}
                          style={inputStyle}>
                          <option value="">-- Choose KPI --</option>
                          {form.items.map(item => {
                            const locked = isLockedByRole(item);
                            const roleMap = { manager: "Manager", md: "MD/Director", hr: "HR" };
                            return (
                              <option
                                key={item.kpi_item_id}
                                value={item.kpi_item_id}
                                disabled={locked}
                                style={{ color: locked ? "#9ca3af" : "#1a1a2e" }}
                              >
                                {locked ? "🔒 " : ""}
                                {item.kpi_name}
                                {item.is_admission_kpi ? " [Admission]" : ""}
                                {locked
                                  ? ` — filled by ${roleMap[item.owner_role] || "Others"}`
                                  : ` (target: ${item.target} ${item.unit})`
                                }
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Date *</label>
                        <input type="date" value={logForm.log_date} onChange={e => setLogForm(f => ({ ...f, log_date: e.target.value }))} style={inputStyle}/>
                      </div>
                    </div>

                    {/* Admission KPI — Program-wise entry */}
                    {isAdmissionLogKpi && selectedLogKpi?.program_targets?.length > 0 ? (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <GraduationCap size={14} color="#0369a1" />
                            <label style={{ ...labelStyle, marginBottom: 0 }}>Program-wise Admissions *</label>
                          </div>
                          {programValuesTotal > 0 && (
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#0369a1", background: "#e0f2fe", padding: "3px 10px", borderRadius: 99 }}>
                              Total: {programValuesTotal}
                            </span>
                          )}
                        </div>
                        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: 12 }}>
                          {selectedLogKpi.program_targets.map((pt) => (
                            <div key={pt.program_id} className="prog-chip-input">
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{pt.program_name}</p>
                                <p style={{ margin: "1px 0 0", fontSize: 10, color: "#6b7280" }}>Target: {pt.target} admissions</p>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                <input
                                  type="number" min="0"
                                  value={programValues[pt.program_id] ?? ""}
                                  onChange={e => setProgramValues(prev => ({ ...prev, [pt.program_id]: e.target.value }))}
                                  placeholder="0"
                                  style={{ width: 70, padding: "7px 10px", border: "1.5px solid #bae6fd", borderRadius: 7, fontSize: 14, fontWeight: 700, color: "#0369a1", textAlign: "center", outline: "none", background: "#fff" }}
                                />
                                <span style={{ fontSize: 11, color: "#6b7280" }}>admits</span>
                              </div>
                            </div>
                          ))}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#0369a1", borderRadius: 8, marginTop: 4 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <Target size={14} color="#fff" />
                              <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Total Today</span>
                            </div>
                            <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "monospace" }}>{programValuesTotal}</span>
                          </div>
                        </div>
                        <div style={{ marginTop: 12 }}>
                          <label style={labelStyle}>Note (Optional)</label>
                          <input type="text" value={logForm.note} onChange={e => setLogForm(f => ({ ...f, note: e.target.value }))} placeholder="Additional notes..." style={inputStyle}/>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 2fr", gap: 12, marginBottom: 14 }}>
                        <div>
                          <label style={labelStyle}>
                            Value * {logForm.kpi_item_id && <span style={{ color: "#9ca3af", fontWeight: 400 }}>({form.items.find(i => i.kpi_item_id === logForm.kpi_item_id)?.unit})</span>}
                          </label>
                          <input type="number" value={logForm.value} onChange={e => setLogForm(f => ({ ...f, value: e.target.value }))} placeholder="e.g. 5" min="0" style={inputStyle}/>
                        </div>
                        <div>
                          <label style={labelStyle}>Note (Optional)</label>
                          <input type="text" value={logForm.note} onChange={e => setLogForm(f => ({ ...f, note: e.target.value }))} placeholder="What did you do today?" style={inputStyle}/>
                        </div>
                      </div>
                    )}

                    <button onClick={handleAddLog} disabled={savingLog}
                      style={{ background: savingLog ? "#93c5fd" : "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: savingLog ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, width: isMobile ? "100%" : "auto", justifyContent: "center" }}>
                      <Plus size={16}/> {savingLog ? "Saving..." : "Add Log Entry"}
                    </button>
                  </div>

                  {/* Log History */}
                  <div style={{ background: "#fff", borderRadius: 14, padding: isMobile ? 14 : 24, border: "1px solid #e5e7eb" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <BookMarked size={16} color="#2563eb" />
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1a1a2e" }}>Log History</h3>
                      </div>
                      {logs.length > 0 && (
                        <button className="dl-btn" onClick={downloadLogsAsExcel}
                          style={{ display: "flex", alignItems: "center", gap: 6, background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, padding: isMobile ? "7px 10px" : "7px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "background 0.2s", whiteSpace: "nowrap" }}>
                          <Download size={14}/>
                          {!isMobile && " Download Excel"}
                        </button>
                      )}
                    </div>

                    {logs.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
                        <Inbox size={48} color="#d1d5db" style={{ marginBottom: 8 }} />
                        <p>No logs yet. Start logging your daily progress!</p>
                      </div>
                    ) : (
                      Object.keys(logsByDate).sort((a, b) => b.localeCompare(a)).map(date => (
                        <div key={date} style={{ marginBottom: 16 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <Calendar size={13} color="#6b7280"/>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              {new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                            </span>
                          </div>
                          {logsByDate[date].map((log) => (
                            <div key={log._id} style={{ padding: "9px 12px", background: "#f8fafc", borderRadius: 8, marginBottom: 6, border: "1px solid #e5e7eb" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 9, flex: 1, minWidth: 0 }}>
                                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#2563eb", fontSize: 12, flexShrink: 0 }}>{log.value}</div>
                                  <div style={{ minWidth: 0 }}>
                                    <p className="log-item-name" style={{ margin: 0, fontWeight: 600, fontSize: 13, color: "#1f2937", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {log.kpi_name} — {log.value} {log.unit}
                                    </p>
                                    {log.note && <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{log.note}</p>}
                                  </div>
                                </div>
                                <button onClick={() => handleDeleteLog(log._id)} disabled={deletingLog === log._id} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0 }}>
                                  <Trash2 size={14} color={deletingLog === log._id ? "#d1d5db" : "#ef4444"}/>
                                </button>
                              </div>
                              {log.program_values && Object.keys(log.program_values).length > 0 && (
                                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed #e0f2fe", display: "flex", flexWrap: "wrap", gap: 6 }}>
                                  {Object.entries(log.program_values).map(([progId, val]) => {
                                    const kpiItem = form.items.find(i => i.kpi_item_id === log.kpi_item_id);
                                    const prog = kpiItem?.program_targets?.find(p => p.program_id === progId);
                                    return (
                                      <span key={progId} style={{ fontSize: 11, background: "#e0f2fe", color: "#0369a1", padding: "2px 9px", borderRadius: 99, fontWeight: 700, border: "1px solid #bae6fd" }}>
                                        {prog?.program_name || progId}: {val}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Sidebar */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ background: "#fff", borderRadius: 14, padding: 18, border: "1px solid #e5e7eb" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <BarChart2 size={15} color="#2563eb" />
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>Running Totals</p>
                    </div>
                    {form.items.map((item, i) => {
                      const total = logTotals[item.kpi_item_id] || 0;
                      const pct = Math.min(Math.round((total / item.target) * 100), 100);
                      const color = pct >= 100 ? "#16a34a" : pct >= 75 ? "#2563eb" : pct >= 50 ? "#d97706" : "#dc2626";
                      const progTotals = programLogTotals[item.kpi_item_id] || {};
                      return (
                        <div key={i} style={{ marginBottom: 18, paddingBottom: 18, borderBottom: i < form.items.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, gap: 8 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.kpi_name}</span>
                                {item.is_admission_kpi && <span className="adm-kpi-badge"><GraduationCap size={9} />Admission</span>}
                                {isLockedByRole(item) && <Lock size={10} color="#9ca3af" />}
                              </div>
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color, flexShrink: 0 }}>{total}/{item.target} {item.unit}</span>
                          </div>
                          <div style={{ background: "#f3f4f6", borderRadius: 99, height: 8, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.5s" }}/>
                          </div>
                          <p style={{ margin: "4px 0 0", fontSize: 11, color, fontWeight: 600, textAlign: "right" }}>{pct}%</p>

                          {item.is_admission_kpi && item.program_targets?.length > 0 && (
                            <div style={{ marginTop: 10 }}>
                              {item.program_targets.map((pt, pi) => {
                                const ptTotal = progTotals[pt.program_id] || 0;
                                const ptPct = pt.target > 0 ? Math.min(Math.round((ptTotal / pt.target) * 100), 100) : 0;
                                const ptColor = ptPct >= 100 ? "#16a34a" : ptPct >= 75 ? "#2563eb" : ptPct >= 50 ? "#d97706" : "#dc2626";
                                return (
                                  <div key={pi} style={{ marginBottom: 8 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                      <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{pt.program_name}</span>
                                      <span style={{ fontSize: 11, fontWeight: 700, color: ptColor }}>{ptTotal}/{pt.target}</span>
                                    </div>
                                    <div style={{ background: "#f3f4f6", borderRadius: 99, height: 5, overflow: "hidden" }}>
                                      <div style={{ width: `${ptPct}%`, height: "100%", background: ptColor, borderRadius: 99, transition: "width 0.5s" }}/>
                                    </div>
                                  </div>
                                );
                              })}
                              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: color + "15", borderRadius: 7, marginTop: 4 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                  <Target size={12} color={color} />
                                  <span style={{ fontSize: 11, fontWeight: 700, color }}>Total Logged</span>
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 800, color }}>{total} / {item.target}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 14, padding: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <Wand2 size={15} color="#1e40af" />
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#1e40af" }}>Auto-fill Assessment</p>
                    </div>
                    <p style={{ margin: "0 0 12px", fontSize: 13, color: "#3b82f6", lineHeight: 1.5 }}>Fill your self assessment automatically using the totals from your daily logs.</p>
                    <button onClick={autoFillFromLogs} style={{ width: "100%", padding: "10px 0", border: "none", borderRadius: 8, background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <TrendingUp size={16}/> Auto-fill from Logs
                    </button>
                  </div>

                  <div style={{ background: "#fff", borderRadius: 14, padding: 16, border: "1px solid #e5e7eb" }}>
                    <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 13, color: "#1a1a2e" }}>Period Details</p>
                    {[
                      { label: "Period",     value: assignment.period },
                      { label: "Total Logs", value: logs.length },
                      { label: "Today",      value: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" }) }
                    ].map((d, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 2 ? "1px solid #f3f4f6" : "none", fontSize: 13 }}>
                        <span style={{ color: "#6b7280" }}>{d.label}</span>
                        <span style={{ fontWeight: 600, color: "#1f2937" }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════
                SELF ASSESSMENT TAB
            ═══════════════════════════════════ */}
            {activeTab === "assessment" && (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 300px", gap: 16, width: "100%", boxSizing: "border-box" }}>
                <div style={{ minWidth: 0 }}>
                  <div className="sa-info-banner">
                    <AlertCircle size={17} color="#2563eb" style={{ marginTop: 2, flexShrink: 0 }}/>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p>
                        {isHRReviewed
                          ? "HR has finalized your review. Your assessment is now locked. Check the Completed tab to see your final score."
                          : <>Rate yourself honestly for each KPI. {logs.length > 0 && "Your daily logs are available — click Auto-fill to use them!"}{submitted && " You can update and resubmit before HR finalizes the review."}</>
                        }
                      </p>
                      {!isHRReviewed && logs.length > 0 && (
                        <button onClick={autoFillFromLogs} style={{ marginTop: 8, background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <TrendingUp size={13}/> Auto-fill from Daily Logs
                        </button>
                      )}
                    </div>
                  </div>

                  {form.items.map((item, idx) => {
                    const pct = getProgress(item);
                    const color = getProgressColor(pct);
                    const isOpen = expandedItem === idx;
                    const logTotal = logTotals[item.kpi_item_id];
                    const locked = isLockedByRole(item);
                    const lockInfo = locked ? getRoleLockInfo(item.owner_role) : null;

                    return (
                      <div key={idx} style={{
                        background: "#fff",
                        borderRadius: 12,
                        marginBottom: 12,
                        border: `1px solid ${locked ? (lockInfo?.border || "#fde68a") : item.is_admission_kpi ? "#bae6fd" : item.self_value !== "" ? "#e5e7eb" : "#fde68a"}`,
                        overflow: "hidden",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
                      }}>

                        {/* Card Header */}
                        <div className="kpi-card-header"
                          onClick={() => setExpandedItem(isOpen ? null : idx)}
                          style={{
                            padding: "14px",
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            background: locked
                              ? (lockInfo?.bg || "#fffbeb")
                              : isOpen ? "#f8fafc"
                              : item.is_admission_kpi ? "#f0f9ff" : "#fff"
                          }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: 1, minWidth: 0 }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: 8,
                              background: locked ? (lockInfo?.color + "18") : item.self_value !== "" ? "#f0fdf4" : "#fffbeb",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              flexShrink: 0, marginTop: 2
                            }}>
                              {locked
                                ? <Lock size={16} color={lockInfo?.color} />
                                : item.self_value !== ""
                                  ? <CheckCircle size={18} color="#16a34a" />
                                  : <Hourglass size={18} color="#d97706" />
                              }
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#1f2937" }}>{item.kpi_name}</p>
                                {item.is_admission_kpi && (
                                  <span className="adm-kpi-badge"><GraduationCap size={9} /> Admission</span>
                                )}
                                {/* ── Role badge on card ── */}
                                {locked && (
                                  <span style={{
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                    padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700,
                                    background: lockInfo.bg, color: lockInfo.color,
                                    border: `1px solid ${lockInfo.border}`
                                  }}>
                                    <Lock size={8} /> {lockInfo.icon} {lockInfo.label} fills this
                                  </span>
                                )}
                              </div>
                              <p style={{ margin: 0, fontSize: 12, color: "#6b7280", lineHeight: 1.4 }}>
                                Target: {item.target} {item.unit} · Wt: {item.weight}%
                                {logTotal !== undefined && <span style={{ color: "#2563eb", marginLeft: 6 }}>· Logged: {logTotal}</span>}
                              </p>
                              {item.is_admission_kpi && item.program_targets?.length > 0 && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 5 }}>
                                  {item.program_targets.map((pt, pi) => (
                                    <span key={pi} className="adm-prog-pill">{pt.program_name}: {pt.target}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="kpi-right-val" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 8 }}>
                            {!locked && item.self_value !== "" && (
                              <div style={{ textAlign: "right" }}>
                                <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color }}>{pct}%</p>
                                <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>{item.self_value}/{item.target}</p>
                              </div>
                            )}
                            {isOpen ? <ChevronUp size={16} color="#9ca3af"/> : <ChevronDown size={16} color="#9ca3af"/>}
                          </div>
                        </div>

                        {!locked && item.self_value !== "" && (
                          <div style={{ padding: "0 14px 4px" }}>
                            <div style={{ background: "#f3f4f6", borderRadius: 99, height: 5, overflow: "hidden" }}>
                              <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.5s ease" }}/>
                            </div>
                          </div>
                        )}

                        {/* ── Expanded content ── */}
                        {isOpen && (
                          <div style={{ padding: "14px", borderTop: "1px solid #f3f4f6" }}>

                            {/* ── CHANGE 3: Role Lock Banner ── */}
                            {locked && (
                              <div className="role-lock-banner" style={{
                                background: lockInfo.bg,
                                border: `1.5px solid ${lockInfo.border}`
                              }}>
                                <div style={{
                                  width: 44, height: 44, borderRadius: 10,
                                  background: lockInfo.color + "18",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  flexShrink: 0
                                }}>
                                  <Lock size={22} color={lockInfo.color} />
                                </div>
                                <div>
                                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: lockInfo.color }}>
                                    {lockInfo.icon} {lockInfo.label} fills this KPI
                                  </p>
                                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>
                                    You cannot enter a value for this KPI. {lockInfo.label} will fill and finalize this value on their dashboard.
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* ── HR reviewed: show program breakdown (read-only) ── */}
                            {isHRReviewed && item.is_admission_kpi && item.program_targets?.length > 0 && (
                              <div style={{ padding: "12px 14px", borderTop: "1px solid #e0f2fe", background: "#f8fbff" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                                  <GraduationCap size={13} color="#0369a1" />
                                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#0369a1" }}>Program-wise Target Breakdown</p>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8 }}>
                                  {item.program_targets.map((pt, pi) => (
                                    <div key={pi} style={{ background: "#fff", border: "1px solid #bae6fd", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                                      <p style={{ margin: "0 0 4px", fontSize: 10, color: "#6b7280", fontWeight: 600, lineHeight: 1.3 }}>{pt.program_name}</p>
                                      <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0369a1", fontFamily: "monospace", lineHeight: 1 }}>{pt.target}</p>
                                      <p style={{ margin: "2px 0 0", fontSize: 9, color: "#9ca3af" }}>target</p>
                                    </div>
                                  ))}
                                </div>
                                <div style={{ marginTop: 8, padding: "7px 12px", background: "#0369a1", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <Target size={13} color="#fff" />
                                    <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Total</span>
                                  </div>
                                  <span style={{ fontSize: 15, fontWeight: 800, color: "#fff", fontFamily: "monospace" }}>{item.target}</span>
                                </div>
                              </div>
                            )}

                            {/* ── Editable section — only for non-locked, non-HR-reviewed ── */}
                            {!locked && !isHRReviewed && (
                              <>
                                {item.is_admission_kpi && item.program_targets?.length > 0 && (
                                  <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: 14, marginBottom: 14 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                                      <GraduationCap size={13} color="#0369a1" />
                                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0369a1" }}>
                                        Program-wise Target Breakdown
                                        <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 400, color: "#6b7280" }}>Set by HR/Manager</span>
                                      </p>
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8, marginBottom: 10 }}>
                                      {item.program_targets.map((pt, pi) => (
                                        <div key={pi} style={{ background: "#fff", border: "1px solid #bae6fd", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                                          <p style={{ margin: "0 0 4px", fontSize: 10, color: "#6b7280", fontWeight: 600, lineHeight: 1.3 }}>{pt.program_name}</p>
                                          <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0369a1", fontFamily: "monospace", lineHeight: 1 }}>{pt.target}</p>
                                          <p style={{ margin: "2px 0 0", fontSize: 9, color: "#9ca3af" }}>admissions</p>
                                        </div>
                                      ))}
                                    </div>
                                    <div style={{ padding: "8px 12px", background: "#0369a1", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <Target size={13} color="#fff" />
                                        <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Total Target</span>
                                      </div>
                                      <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", fontFamily: "monospace" }}>{item.target}</span>
                                    </div>
                                  </div>
                                )}

                                <div style={{ marginBottom: 12 }}>
                                  <label style={labelStyle}>
                                    {item.is_admission_kpi ? "Your Total Admissions *" : "Your Achievement *"}
                                  </label>

                                  {item.is_admission_kpi && item.program_targets?.length > 0 ? (
                                    <div>
                                      <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                                          <GraduationCap size={12} color="#0369a1" />
                                          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#0369a1" }}>
                                            Program-wise Entry
                                            <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 400, color: "#6b7280" }}>(auto-sums to total)</span>
                                          </p>
                                        </div>
                                        {item.program_targets.map((pt) => {
                                          const currentProgVals = assessmentProgramValues[item.kpi_item_id] || {};
                                          return (
                                            <div key={pt.program_id} className="prog-chip-input">
                                              <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{pt.program_name}</p>
                                                <p style={{ margin: "1px 0 0", fontSize: 10, color: "#6b7280" }}>Target: {pt.target} admissions</p>
                                              </div>
                                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                                {/* ── CHANGE 4: admission program input disabled if locked ── */}
                                                <input
                                                  type="number" min="0"
                                                  value={currentProgVals[pt.program_id] ?? ""}
                                                  disabled={locked}
                                                  onChange={e => {
                                                    if (locked) return;
                                                    const newVals = {
                                                      ...(assessmentProgramValues[item.kpi_item_id] || {}),
                                                      [pt.program_id]: e.target.value
                                                    };
                                                    setAssessmentProgramValues(prev => ({ ...prev, [item.kpi_item_id]: newVals }));
                                                    const sum = Object.values(newVals).reduce((s, v) => s + (Number(v) || 0), 0);
                                                    handleItemChange(idx, "self_value", String(sum));
                                                  }}
                                                  placeholder="0"
                                                  style={{
                                                    width: 70, padding: "7px 10px",
                                                    border: `1.5px solid ${locked ? "#e5e7eb" : "#bae6fd"}`,
                                                    borderRadius: 7, fontSize: 14, fontWeight: 700,
                                                    color: locked ? "#9ca3af" : "#0369a1",
                                                    textAlign: "center", outline: "none",
                                                    background: locked ? "#f3f4f6" : "#fff",
                                                    cursor: locked ? "not-allowed" : "text"
                                                  }}
                                                />
                                                <span style={{ fontSize: 11, color: "#6b7280" }}>admits</span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#0369a1", borderRadius: 8, marginTop: 4 }}>
                                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <Target size={13} color="#fff" />
                                            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Auto Total</span>
                                          </div>
                                          <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "monospace" }}>
                                            {Object.values(assessmentProgramValues[item.kpi_item_id] || {}).reduce((s, v) => s + (Number(v) || 0), 0)}
                                          </span>
                                        </div>
                                      </div>

                                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                        <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Or enter total directly:</span>
                                        {/* ── CHANGE 4: direct total input disabled if locked ── */}
                                        <input
                                          type="number" min="0"
                                          value={item.self_value}
                                          disabled={locked}
                                          onChange={e => !locked && handleItemChange(idx, "self_value", e.target.value)}
                                          placeholder={`e.g. ${item.target}`}
                                          style={{
                                            ...inputStyle, maxWidth: 120,
                                            background: locked ? "#f3f4f6" : "#fff",
                                            cursor: locked ? "not-allowed" : "text",
                                            color: locked ? "#9ca3af" : "#1a1a2e"
                                          }}
                                        />
                                        <span style={{ fontSize: 13, color: "#6b7280" }}>{item.unit}</span>
                                        {!locked && logTotal !== undefined && (
                                          <button onClick={() => handleItemChange(idx, "self_value", String(logTotal))}
                                            style={{ fontSize: 12, color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontWeight: 600 }}>
                                            Use log total ({logTotal})
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                      {/* ── CHANGE 4: regular input disabled if locked ── */}
                                      <input
                                        type="number"
                                        value={item.self_value}
                                        disabled={locked}
                                        onChange={e => !locked && handleItemChange(idx, "self_value", e.target.value)}
                                        placeholder={`e.g. ${item.target}`}
                                        min="0"
                                        style={{
                                          ...inputStyle,
                                          maxWidth: isMobile ? "100%" : 160,
                                          background: locked ? "#f3f4f6" : "#fff",
                                          cursor: locked ? "not-allowed" : "text",
                                          color: locked ? "#9ca3af" : "#1a1a2e"
                                        }}
                                      />
                                      <span style={{ fontSize: 13, color: "#6b7280" }}>{item.unit}</span>
                                      {!locked && logTotal !== undefined && (
                                        <button onClick={() => handleItemChange(idx, "self_value", String(logTotal))}
                                          style={{ fontSize: 12, color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontWeight: 600 }}>
                                          Use log total ({logTotal})
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {!locked && item.self_value !== "" && (
                                  <div style={{ background: `${color}15`, borderRadius: 8, padding: "8px 12px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                      {pct >= 100 ? <Trophy size={14} color={color} />
                                        : pct >= 75 ? <ThumbsUp size={14} color={color} />
                                        : pct >= 50 ? <AlertTriangle size={14} color={color} />
                                        : <XCircle size={14} color={color} />}
                                      <span style={{ fontSize: 13, color, fontWeight: 600 }}>
                                        {pct >= 100 ? "Target exceeded!" : pct >= 75 ? "Good progress!" : pct >= 50 ? "Needs more effort" : "Below target"}
                                      </span>
                                    </div>
                                    <span style={{ fontSize: 14, fontWeight: 800, color }}>{pct}%</span>
                                  </div>
                                )}

                                <div>
                                  <label style={labelStyle}>Comment (Optional)</label>
                                  <textarea
                                    value={item.self_comment}
                                    onChange={e => handleItemChange(idx, "self_comment", e.target.value)}
                                    placeholder={item.is_admission_kpi ? "Describe your admissions achievement across programs..." : "Explain your achievement..."}
                                    rows={3}
                                    style={{ ...inputStyle, resize: "vertical" }}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div style={{ background: "#fff", borderRadius: 12, padding: 14, border: "1px solid #e5e7eb", marginBottom: 16 }}>
                    <label style={{ ...labelStyle, fontSize: 14 }}>Overall Comment for this Period</label>
                    <textarea
                      value={form.overall_comment}
                      onChange={e => !isHRReviewed && setForm(f => ({ ...f, overall_comment: e.target.value }))}
                      placeholder="Summarize your overall performance..."
                      rows={4}
                      readOnly={isHRReviewed}
                      style={{ ...inputStyle, resize: "vertical", background: isHRReviewed ? "#f9fafb" : "#fff", color: isHRReviewed ? "#6b7280" : "#1a1a2e", cursor: isHRReviewed ? "not-allowed" : "text" }}
                    />
                  </div>

                  {isHRReviewed ? (
                    <div style={{ width: "100%", padding: "16px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", textAlign: "center", boxSizing: "border-box" }}>
                      <Lock size={22} color="#16a34a" style={{ marginBottom: 6 }}/>
                      <p style={{ margin: 0, fontWeight: 700, color: "#16a34a", fontSize: 14 }}>HR Review Completed — Assessment Locked</p>
                      <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 12 }}>Your assessment has been finalized. Check the Completed tab.</p>
                    </div>
                  ) : (
                    <>
                      <button onClick={handleSubmit} disabled={saving || !isFormValid()}
                        style={{ width: "100%", padding: "14px 0", border: "none", borderRadius: 10, background: saving || !isFormValid() ? "#93c5fd" : "#2563eb", color: "#fff", fontWeight: 700, fontSize: 15, cursor: saving || !isFormValid() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxSizing: "border-box" }}>
                        {saving ? <RefreshCw size={18} /> : <Send size={18}/>}
                        {saving ? "Submitting..." : submitted ? "Update & Resubmit" : "Submit Self Assessment"}
                      </button>
                      {!isFormValid() && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8 }}>
                          <AlertTriangle size={13} color="#f59e0b" />
                          <p style={{ margin: 0, fontSize: 12, color: "#f59e0b" }}>Please fill in all your KPI values before submitting</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* RIGHT sidebar */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ background: "#fff", borderRadius: 14, padding: 18, border: "1px solid #e5e7eb", textAlign: "center" }}>
                    <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>Your Self Score</p>
                    <div style={{ fontSize: isMobile ? 44 : 52, fontWeight: 900, color: getRatingLabel(overallScore).color, lineHeight: 1 }}>{overallScore}%</div>
                    <p style={{ margin: "8px 0 10px", fontSize: 13, fontWeight: 700, color: getRatingLabel(overallScore).color }}>{getRatingLabel(overallScore).label}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>Based on your self-reported values</p>
                  </div>

                  <div style={{ background: "#fff", borderRadius: 14, padding: 18, border: "1px solid #e5e7eb" }}>
                    <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>Completion Status</p>
                    {form.items.map((item, i) => {
                      const locked = isLockedByRole(item);
                      const lockInfo = locked ? getRoleLockInfo(item.owner_role) : null;
                      return (
                        <div key={i} style={{ padding: "7px 0", borderBottom: i < form.items.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 13, color: "#374151", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.kpi_name}</span>
                                {item.is_admission_kpi && <GraduationCap size={11} color="#0369a1" />}
                              </div>
                            </div>
                            <span style={{ fontSize: 13, flexShrink: 0 }}>
                              {locked ? (
                                <span style={{ color: lockInfo.color, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                                  <Lock size={11} color={lockInfo.color} /> {lockInfo.label}
                                </span>
                              ) : item.self_value !== "" ? (
                                <span style={{ color: "#16a34a", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                                  <CheckCircle size={13} color="#16a34a" /> {item.self_value} {item.unit}
                                </span>
                              ) : (
                                <span style={{ color: "#f59e0b", fontWeight: 600 }}>Pending</span>
                              )}
                            </span>
                          </div>
                          {item.is_admission_kpi && item.program_targets?.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 4 }}>
                              {item.program_targets.map((pt, pi) => (
                                <span key={pi} style={{ fontSize: 9, background: "#f0f9ff", color: "#0369a1", padding: "1px 6px", borderRadius: 99, border: "1px solid #bae6fd", fontWeight: 600 }}>
                                  {pt.program_name}: {pt.target}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div style={{ marginTop: 10, padding: "8px 10px", background: "#f8fafc", borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "#6b7280" }}>Filled (by you)</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#2563eb" }}>
                        {form.items.filter(i => !isLockedByRole(i) && i.self_value !== "").length} / {form.items.filter(i => !isLockedByRole(i)).length}
                      </span>
                    </div>
                  </div>

                  <div style={{ background: isHRReviewed ? "#eff6ff" : submitted ? "#f0fdf4" : "#fffbeb", border: `1px solid ${isHRReviewed ? "#bfdbfe" : submitted ? "#bbf7d0" : "#fde68a"}`, borderRadius: 14, padding: 14 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                      {isHRReviewed ? <Lock size={16} color="#2563eb"/> : submitted ? <CheckCircle size={16} color="#16a34a"/> : <Clock size={16} color="#d97706"/>}
                      <span style={{ fontWeight: 700, fontSize: 13, color: isHRReviewed ? "#2563eb" : submitted ? "#16a34a" : "#d97706" }}>
                        {isHRReviewed ? "HR Review Completed" : submitted ? "Assessment Submitted" : "Not Yet Submitted"}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>
                      {isHRReviewed ? "Your score has been finalized. Check the Completed tab."
                        : submitted ? `Submitted for ${assignment.period}. HR will review and finalize your score.`
                        : "Fill all your KPI values and submit."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════
                COMPLETED TAB
            ═══════════════════════════════════ */}
            {activeTab === "completed" && (
              <div>
                {completedReviews.length === 0 ? (
                  <div style={{ background: "#fff", borderRadius: 16, padding: "60px 20px", textAlign: "center", border: "1px solid #e5e7eb" }}>
                    <Inbox size={52} color="#d1d5db" style={{ marginBottom: 12 }} />
                    <h3 style={{ color: "#1f2937", marginBottom: 8 }}>No Completed Reviews Yet</h3>
                    <p style={{ color: "#6b7280", fontSize: 14 }}>HR hasn't finalized any of your assessments yet.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {completedReviews.map((review, ri) => {
                      const finalScore = review.final_score ?? review.self_score ?? 0;
                      const rating = getRatingLabel(finalScore);
                      const RatingIcon = rating.Icon;
                      const monthlyLogs = review.monthly_logs || [];

                      return (
                        <div key={ri} style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>

                          <div className="review-card-header"
                            style={{ padding: isMobile ? "14px" : "20px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center", background: rating.bg, gap: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{ width: 44, height: 44, borderRadius: 12, background: rating.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <RatingIcon size={24} color={rating.color} />
                              </div>
                              <div>
                                <p style={{ margin: 0, fontWeight: 800, fontSize: isMobile ? 15 : 17, color: "#1a1a2e" }}>{review.period}</p>
                                <p style={{ margin: "3px 0 0", fontSize: 12, color: "#6b7280" }}>
                                  Reviewed on {review.reviewed_at ? new Date(review.reviewed_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                                </p>
                              </div>
                            </div>
                            <div className="review-score-right" style={{ textAlign: "right", flexShrink: 0 }}>
                              <div style={{ fontSize: isMobile ? 30 : 40, fontWeight: 900, color: rating.color, lineHeight: 1 }}>{finalScore}%</div>
                              <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 5, background: "#fff", border: `1.5px solid ${rating.border}`, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700, color: rating.color }}>
                                <RatingIcon size={12} color={rating.color} />
                                {rating.label}
                              </div>
                            </div>
                          </div>

                          <div style={{ padding: isMobile ? "14px" : "20px 24px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                              <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                                  <BarChart2 size={14} color="#374151" />
                                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#374151" }}>Score Comparison</p>
                                </div>
                                <div style={{ display: "flex", gap: 10 }}>
                                  <div style={{ flex: 1, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px", textAlign: "center" }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 4 }}>
                                      <User size={10} color="#3b82f6" />
                                      <p style={{ margin: 0, fontSize: 10, color: "#3b82f6", fontWeight: 700, letterSpacing: "0.5px" }}>YOUR SELF SCORE</p>
                                    </div>
                                    <p style={{ margin: 0, fontSize: isMobile ? 20 : 26, fontWeight: 900, color: "#2563eb" }}>{review.self_score ?? "—"}%</p>
                                  </div>
                                  <div style={{ flex: 1, background: rating.bg, border: `1px solid ${rating.border}`, borderRadius: 8, padding: "10px", textAlign: "center" }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 4 }}>
                                      <CheckCircle size={10} color={rating.color} />
                                      <p style={{ margin: 0, fontSize: 10, color: rating.color, fontWeight: 700, letterSpacing: "0.5px" }}>HR FINAL SCORE</p>
                                    </div>
                                    <p style={{ margin: 0, fontSize: isMobile ? 20 : 26, fontWeight: 900, color: rating.color }}>{finalScore}%</p>
                                  </div>
                                </div>
                              </div>

                              <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                                  <Target size={14} color="#374151" />
                                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#374151" }}>KPI Breakdown</p>
                                </div>
                                {(review.items || []).map((item, ii) => {
                                  const hrVal = item.hr_value ?? item.self_value;
                                  const hrPct = item.target ? Math.min(Math.round((hrVal / item.target) * 100), 100) : 0;
                                  const c = getProgressColor(hrPct);
                                  return (
                                    <div key={ii} style={{ marginBottom: 14, paddingBottom: ii < (review.items.length - 1) ? 14 : 0, borderBottom: ii < (review.items.length - 1) ? "1px solid #e5e7eb" : "none" }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, gap: 8 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0, flexWrap: "wrap" }}>
                                          <span style={{ fontSize: 13, fontWeight: 600, color: "#1f2937" }}>{item.kpi_name}</span>
                                          {item.is_admission_kpi && <span className="adm-kpi-badge"><GraduationCap size={9} /> Admission</span>}
                                        </div>
                                        <span style={{ fontSize: 11, color: "#6b7280", flexShrink: 0 }}>Wt: {item.weight}%</span>
                                      </div>
                                      <div style={{ display: "flex", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                                        <span style={{ fontSize: 12, color: "#6b7280" }}>Target: <b style={{ color: "#374151" }}>{item.target} {item.unit}</b></span>
                                        <span style={{ fontSize: 12, color: "#6b7280" }}>Self: <b style={{ color: "#2563eb" }}>{item.self_value} {item.unit}</b></span>
                                        {item.hr_value !== undefined && <span style={{ fontSize: 12, color: "#6b7280" }}>HR: <b style={{ color: c }}>{item.hr_value} {item.unit}</b></span>}
                                      </div>

                                      {item.is_admission_kpi && item.program_targets?.length > 0 && (
                                        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                                          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                                            <GraduationCap size={11} color="#0369a1" />
                                            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#0369a1" }}>Program-wise Targets</p>
                                          </div>
                                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 6 }}>
                                            {item.program_targets.map((pt, pi) => (
                                              <div key={pi} style={{ background: "#fff", border: "1px solid #bae6fd", borderRadius: 6, padding: "6px 8px", textAlign: "center" }}>
                                                <p style={{ margin: "0 0 2px", fontSize: 10, color: "#6b7280", fontWeight: 600, lineHeight: 1.2 }}>{pt.program_name}</p>
                                                <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0369a1", fontFamily: "monospace" }}>{pt.target}</p>
                                              </div>
                                            ))}
                                          </div>
                                          <div style={{ marginTop: 6, padding: "5px 10px", background: "#0369a1", borderRadius: 6, display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>Total</span>
                                            <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", fontFamily: "monospace" }}>{item.target}</span>
                                          </div>
                                        </div>
                                      )}

                                      <div style={{ background: "#e5e7eb", borderRadius: 99, height: 6, overflow: "hidden" }}>
                                        <div style={{ width: `${hrPct}%`, height: "100%", background: c, borderRadius: 99 }}/>
                                      </div>
                                      <p style={{ margin: "3px 0 0", fontSize: 11, color: c, fontWeight: 700, textAlign: "right" }}>{hrPct}%</p>
                                      {item.self_comment && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>"{item.self_comment}"</p>}
                                    </div>
                                  );
                                })}
                              </div>

                              {monthlyLogs.length > 0 && (
                                <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                                    <Calendar size={14} color="#374151" />
                                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#374151" }}>Month-wise Log Summary</p>
                                  </div>
                                  {monthlyLogs.map((monthData) => (
                                    <div key={monthData.month} style={{ marginBottom: 12 }}>
                                      <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "#374151" }}>{formatMonthLabel(monthData.month)}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                              <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                                  <MessageSquare size={14} color="#374151" />
                                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#374151" }}>HR Manager Comments</p>
                                </div>
                                {review.hr_overall_comment ? (
                                  <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderLeft: "3px solid #2563eb", borderRadius: 8, padding: "10px 12px" }}>
                                    <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.7, fontStyle: "italic", wordBreak: "break-word" }}>"{review.hr_overall_comment}"</p>
                                  </div>
                                ) : (
                                  <p style={{ margin: 0, fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>No comments from HR.</p>
                                )}
                              </div>
                              {review.overall_comment && (
                                <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                                    <FileText size={14} color="#374151" />
                                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#374151" }}>Your Overall Comment</p>
                                  </div>
                                  <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderLeft: "3px solid #16a34a", borderRadius: 8, padding: "10px 12px" }}>
                                    <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.7, wordBreak: "break-word" }}>{review.overall_comment}</p>
                                  </div>
                                </div>
                              )}
                              <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                                  <Info size={14} color="#374151" />
                                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#374151" }}>Review Details</p>
                                </div>
                                {[
                                  { label: "Period",       value: review.period },
                                  { label: "Department",   value: review.department || "—" },
                                  { label: "Role",         value: review.role || "—" },
                                  { label: "Submitted On", value: review.submitted_at ? new Date(review.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—" },
                                  { label: "Reviewed On",  value: review.reviewed_at  ? new Date(review.reviewed_at).toLocaleDateString("en-IN",  { day: "numeric", month: "short", year: "numeric" }) : "—" },
                                  { label: "Reviewed By",  value: review.reviewed_by_name || "HR Team" },
                                ].map((d, i, arr) => (
                                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < arr.length - 1 ? "1px solid #e5e7eb" : "none", fontSize: 13, gap: 8 }}>
                                    <span style={{ color: "#6b7280", flexShrink: 0 }}>{d.label}</span>
                                    <span style={{ fontWeight: 600, color: "#1f2937", textAlign: "right", wordBreak: "break-word" }}>{d.value}</span>
                                  </div>
                                ))}
                              </div>
                              <div style={{ background: rating.bg, border: `1px solid ${rating.border}`, borderRadius: 10, padding: 14, textAlign: "center" }}>
                                <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                                  <div style={{ width: 48, height: 48, borderRadius: 12, background: rating.color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <RatingIcon size={26} color={rating.color} />
                                  </div>
                                </div>
                                <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: rating.color }}>{rating.label}</p>
                                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>Final HR Rating · {review.period}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </EmployeeLayout>
  );
}