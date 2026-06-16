import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChartAverageIcon, Download04Icon } from "@hugeicons/core-free-icons";
import ExcelJS from "exceljs";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const inputStyle = {
  width: "100%", padding: "9px 12px", border: "1px solid #d1d5db",
  borderRadius: 8, fontSize: 13, color: "#1a1a2e", background: "#fff",
  boxSizing: "border-box", outline: "none",
};
const labelStyle = {
  display: "block", fontSize: 12, fontWeight: 700,
  color: "#374151", marginBottom: 6,
};

// ── Generate "Month Year" options (last 12 months) ─────────────────────────
function getPeriodOptions() {
  const months = ["January","February","March","April","May","June","July",
                  "August","September","October","November","December"];
  const now = new Date();
  const opts = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push(`${months[d.getMonth()]} ${d.getFullYear()}`);
  }
  return opts;
}

// ── Format date "2026-06-15" → "15 Jun" ───────────────────────────────────
function formatDateLabel(dateStr) {
  const d = new Date(dateStr);
  const months = ["Jan","Feb","Mar","Apr","May","Jun",
                  "Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

// ── Achi% color (used for both the on-screen table and the Excel export) ──
function achiColor(pct) {
  if (pct >= 90) return { bg: "#dcfce7", color: "#15803d" };
  if (pct >= 50) return { bg: "#fef9c3", color: "#92400e" };
  return { bg: "#fee2e2", color: "#dc2626" };
}

// ARGB versions of the same three buckets, for exceljs fills/fonts
function achiFillARGB(pct) {
  if (pct >= 90) return "FFDCFCE7";
  if (pct >= 50) return "FFFEF9C3";
  return "FFFEE2E2";
}
function achiFontARGB(pct) {
  if (pct >= 90) return "FF15803D";
  if (pct >= 50) return "FF92400E";
  return "FFDC2626";
}

const THIN_BORDER = { style: "thin", color: { argb: "FFE5E7EB" } };
const CELL_BORDER = { top: THIN_BORDER, left: THIN_BORDER, bottom: THIN_BORDER, right: THIN_BORDER };

export default function DepartmentScoreboard() {
  const [departments, setDepartments] = useState([]);
  const [department, setDepartment]   = useState("");
  const [period, setPeriod]           = useState("");
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  const periodOptions = useMemo(() => getPeriodOptions(), []);

  // ── Fetch departments ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/departments`);
        const list = res.data?.data || res.data || [];
        const names = list.map(d => d.name || d.department || d).filter(Boolean);
        setDepartments(names);
        if (names.length) setDepartment(names[0]);
      } catch {
        setDepartments([]);
      }
    };
    fetchDepts();
    setPeriod(getPeriodOptions()[0]);
  }, []);

  // ── Fetch scoreboard ───────────────────────────────────────────────────
  useEffect(() => {
    if (!department || !period) return;
    fetchScoreboard();
  }, [department, period]);

  const fetchScoreboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/api/department-scoreboard`, {
        params: { department, period },
      });
      setData(res.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load scoreboard");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // ── Export Excel — per-employee kpi_columns, with achi% colors ─────────
  const handleExport = async () => {
    if (!data?.employees?.length) return;

    const { dates, employees, total } = data;
    const totalKpiCols = total?.kpi_columns || [];

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Scoreboard");

    // ── Header row ──
    const header = ["SL.NO", "STAFF NAME", "KPI", "TARGET", "COLLECTED", "ACHI%"];
    dates.forEach(dt => header.push(formatDateLabel(dt)));
    const headerRow = sheet.addRow(header);
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: "FF374151" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = CELL_BORDER;
    });
    headerRow.height = 20;

    let r = 2; // row 1 is the header

    // ── Per-employee rows ──
    employees.forEach((emp, empIdx) => {
      const empCols = emp.kpi_columns || [];
      const startRow = r;
      const zebraFill = empIdx % 2 !== 0 ? "FFFAFAFA" : null;

      empCols.forEach((col, kpiIdx) => {
        const m = emp.metrics[col.kpi_item_id] || { target: 0, collected: 0, achi: 0 };
        const rowValues = [
          kpiIdx === 0 ? empIdx + 1 : "",
          kpiIdx === 0 ? emp.name : "",
          col.kpi_name,
          m.target,
          m.collected,
          `${m.achi}%`,
        ];
        dates.forEach(dt => rowValues.push(emp.daily[dt]?.[col.kpi_item_id] ?? 0));

        const row = sheet.addRow(rowValues);
        row.eachCell(cell => {
          cell.border = CELL_BORDER;
          cell.alignment = { horizontal: "center", vertical: "middle" };
          if (zebraFill) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: zebraFill } };
        });

        // STAFF NAME bold + KPI name in indigo, matching the on-screen table
        row.getCell(2).font = { bold: true, color: { argb: "FF1A1A2E" } };
        row.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
        row.getCell(3).font = { bold: true, color: { argb: "FF4F46E5" } };
        row.getCell(3).alignment = { horizontal: "left", vertical: "middle" };

        // ACHI% cell — colored by bucket
        const achiCell = row.getCell(6);
        achiCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: achiFillARGB(m.achi) } };
        achiCell.font = { bold: true, color: { argb: achiFontARGB(m.achi) } };

        r++;
      });

      if (empCols.length > 1) {
        sheet.mergeCells(startRow, 1, startRow + empCols.length - 1, 1); // SL.NO
        sheet.mergeCells(startRow, 2, startRow + empCols.length - 1, 2); // STAFF NAME
      }
    });

    // ── TOTAL block ──
    const totalStartRow = r;
    totalKpiCols.forEach((col, kpiIdx) => {
      const m = total.metrics[col.kpi_item_id] || { target: 0, collected: 0, achi: 0 };
      const rowValues = [
        "",
        kpiIdx === 0 ? "TOTAL" : "",
        col.kpi_name,
        m.target,
        m.collected,
        `${m.achi}%`,
      ];
      dates.forEach(dt => rowValues.push(total.daily[dt]?.[col.kpi_item_id] ?? 0));

      const row = sheet.addRow(rowValues);
      row.eachCell(cell => {
        cell.border = CELL_BORDER;
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.font = { bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0FDF4" } };
      });
      row.getCell(2).font = { bold: true, color: { argb: "FF15803D" } };
      row.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
      row.getCell(3).font = { bold: true, color: { argb: "FF15803D" } };
      row.getCell(3).alignment = { horizontal: "left", vertical: "middle" };

      const achiCell = row.getCell(6);
      achiCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: achiFillARGB(m.achi) } };
      achiCell.font = { bold: true, color: { argb: achiFontARGB(m.achi) } };

      r++;
    });
    if (totalKpiCols.length > 1) {
      sheet.mergeCells(totalStartRow, 2, totalStartRow + totalKpiCols.length - 1, 2);
    }

    // ── Column widths & freeze header ──
    sheet.columns = [
      { width: 7 }, { width: 18 }, { width: 24 }, { width: 12 }, { width: 12 }, { width: 9 },
      ...dates.map(() => ({ width: 9 })),
    ];
    sheet.views = [{ state: "frozen", ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${department}_Scoreboard_${period}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Has any renderable data? ───────────────────────────────────────────
  const hasData = data?.employees?.length > 0;

  return (
    <div style={{ padding: "28px 32px", fontFamily: "'Segoe UI',sans-serif", minHeight: "100vh", background: "#f4f6fb" }}>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a2e", display: "flex", alignItems: "center", gap: 10 }}>
            <HugeiconsIcon icon={ChartAverageIcon} size={24} color="#1d4ed8" strokeWidth={1.8} />
            Department Scoreboard
          </h2>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
            KPI performance scoreboard for selected department & period
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={!hasData}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
            background: !hasData ? "#a5b4fc" : "#16a34a",
            color: "#fff", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 14,
            cursor: !hasData ? "not-allowed" : "pointer",
          }}
        >
          <HugeiconsIcon icon={Download04Icon} size={16} color="#fff" strokeWidth={2} />
          Export Excel
        </button>
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "20px 24px", marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
          <div>
            <label style={labelStyle}>Department</label>
            <select value={department} onChange={e => setDepartment(e.target.value)} style={inputStyle}>
              {departments.length === 0 && <option value="">No departments found</option>}
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Period</label>
            <select value={period} onChange={e => setPeriod(e.target.value)} style={inputStyle}>
              {periodOptions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Scoreboard Table */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#1a1a2e" }}>
            {department ? `${department} Scoreboard — ${period}` : "Select a department"}
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
            <div style={{ width: 32, height: 32, border: "4px solid #e5e7eb", borderTopColor: "#1d4ed8", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            Loading...
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: 60, color: "#dc2626" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
            <p style={{ fontWeight: 600 }}>{error}</p>
          </div>
        ) : !hasData ? (
          <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📊</div>
            <p style={{ fontWeight: 600 }}>No data found for {department} — {period}</p>
            <p style={{ fontSize: 13, marginTop: 6 }}>
              Make sure KPI assignments & daily logs exist for this department/period.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, whiteSpace: "nowrap" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={thStyle}>SL.NO</th>
                  <th style={{ ...thStyle, textAlign: "left" }}>STAFF NAME</th>
                  <th style={{ ...thStyle, textAlign: "left" }}>KPI</th>
                  <th style={thStyle}>TARGET</th>
                  <th style={thStyle}>COLLECTED</th>
                  <th style={thStyle}>ACHI%</th>
                  {data.dates.map(dt => (
                    <th key={dt} style={{ ...thStyle, background: "#f0fdf4", color: "#15803d" }}>
                      {formatDateLabel(dt)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* ── Per-employee rows — only their own KPIs ── */}
                {data.employees.map((emp, empIdx) => {
                  const empCols = emp.kpi_columns || [];
                  return empCols.map((col, kpiIdx) => {
                    const m  = emp.metrics[col.kpi_item_id] || { target: 0, collected: 0, achi: 0 };
                    const ac = achiColor(m.achi);
                    const isFirst = kpiIdx === 0;
                    const isLast  = kpiIdx === empCols.length - 1;
                    return (
                      <tr
                        key={`${emp.employee_id || empIdx}-${col.kpi_item_id}`}
                        style={{
                          background:   empIdx % 2 === 0 ? "#fff" : "#fafafa",
                          borderBottom: isLast ? "2px solid #e0e7ff" : "1px solid #f3f4f6",
                        }}
                      >
                        {isFirst && (
                          <td rowSpan={empCols.length} style={tdStyle}>{empIdx + 1}</td>
                        )}
                        {isFirst && (
                          <td rowSpan={empCols.length} style={{ ...tdStyle, textAlign: "left", fontWeight: 700, color: "#1a1a2e" }}>
                            {emp.name}
                          </td>
                        )}
                        <td style={{ ...tdStyle, textAlign: "left", fontWeight: 600, color: "#4f46e5" }}>
                          {col.kpi_name}
                        </td>
                        <td style={tdStyle}>{m.target.toLocaleString("en-IN")}</td>
                        <td style={tdStyle}>{m.collected.toLocaleString("en-IN")}</td>
                        <td style={{ ...tdStyle, background: ac.bg, color: ac.color, fontWeight: 700 }}>
                          {m.achi}%
                        </td>
                        {data.dates.map(dt => (
                          <td key={dt} style={tdStyle}>
                            {emp.daily[dt]?.[col.kpi_item_id] || 0}
                          </td>
                        ))}
                      </tr>
                    );
                  });
                })}

                {/* ── TOTAL row — dept-wide union from backend ── */}
                {(data.total?.kpi_columns || []).map((col, kpiIdx) => {
                  const totalCols = data.total.kpi_columns;
                  const m  = data.total.metrics[col.kpi_item_id] || { target: 0, collected: 0, achi: 0 };
                  const ac = achiColor(m.achi);
                  const isFirst = kpiIdx === 0;
                  return (
                    <tr
                      key={`total-${col.kpi_item_id}`}
                      style={{
                        background: "#f0fdf4",
                        borderTop:  isFirst ? "2px solid #86efac" : "none",
                      }}
                    >
                      {isFirst && (
                        <td rowSpan={totalCols.length} style={tdStyle} />
                      )}
                      {isFirst && (
                        <td rowSpan={totalCols.length} style={{ ...tdStyle, textAlign: "left", fontWeight: 800, color: "#15803d" }}>
                          TOTAL
                        </td>
                      )}
                      <td style={{ ...tdStyle, textAlign: "left", fontWeight: 700, color: "#15803d" }}>
                        {col.kpi_name}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 800 }}>
                        {m.target.toLocaleString("en-IN")}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 800 }}>
                        {m.collected.toLocaleString("en-IN")}
                      </td>
                      <td style={{ ...tdStyle, background: ac.bg, color: ac.color, fontWeight: 800 }}>
                        {m.achi}%
                      </td>
                      {data.dates.map(dt => (
                        <td key={dt} style={{ ...tdStyle, fontWeight: 800 }}>
                          {data.total.daily[dt]?.[col.kpi_item_id] || 0}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const thStyle = {
  padding: "10px 12px", textAlign: "center", fontWeight: 700, color: "#374151",
  borderBottom: "2px solid #e5e7eb", borderLeft: "1px solid #e5e7eb", fontSize: 12,
};
const tdStyle = {
  padding: "10px 12px", textAlign: "center", color: "#374151",
  borderLeft: "1px solid #f3f4f6", fontSize: 12, verticalAlign: "middle",
};