import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const todayIST = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
const addDays = (d, n) => new Date(new Date(d + "T00:00:00Z").getTime() + n * 86400000).toISOString().slice(0, 10);
const weekday = (d) => new Date(d + "T00:00:00Z").toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" });
const REVIEW = { accepted: "success", rework: "warning", pending: "secondary" };

// onOpenDate(date) kuduthaa "Open this day" button antha naal-ku poga help pannum
export default function EmployeeWorkHistory({ onOpenDate }) {
    const [days, setDays] = useState(7);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [open, setOpen] = useState(null);

    const load = async () => {
        setLoading(true);
        setErr("");
        try {
            const to = todayIST();
            const from = addDays(to, -(days - 1));
            const r = await axios.get(`${API_BASE}/api/work/my/history`, { params: { from, to } });
            setRows(r.data.data || []);
        } catch (e) {
            setErr(e?.response?.data?.message || e.message);
        }
        setLoading(false);
    };
    useEffect(() => { load(); /* eslint-disable-next-line */ }, [days]);

    return (
        <div>
            <div className="d-flex gap-2 align-items-center mb-3 flex-wrap">
                <span className="fw-semibold">History</span>
                {[7, 14, 30].map((n) => (
                    <button key={n} className={`btn btn-sm ${days === n ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => setDays(n)}>Last {n} days</button>
                ))}
                <button className="btn btn-sm btn-outline-secondary" onClick={load}>Refresh</button>
            </div>

            {err && <div className="alert alert-danger py-2">{err}</div>}
            {loading && <div className="text-muted small">Loading...</div>}
            {!loading && !rows.length && !err && (
                <div className="text-muted text-center py-4 border rounded bg-white">Intha kaalathula edhuvum illa</div>
            )}

            {rows.length > 0 && (
                <div className="table-responsive border rounded bg-white">
                    <table className="table table-sm align-middle mb-0">
                        <thead>
                            <tr>
                                <th>Date</th><th>Mode</th><th>Tasks</th><th>Done</th>
                                <th>Plan</th><th>EOD</th><th>Score</th><th>Review</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <>
                                    <tr key={r.date} style={{ cursor: "pointer" }}
                                        onClick={() => setOpen(open === r.date ? null : r.date)}>
                                        <td>{r.date} <small className="text-muted">{weekday(r.date)}</small></td>
                                        <td>{r.work_mode ? r.work_mode.toUpperCase() : "—"}</td>
                                        <td>{r.total}{r.cancelled > 0 && <small className="text-muted"> (+{r.cancelled} closed)</small>}</td>
                                        <td>{r.done}</td>
                                        <td>{r.plan ? "✔" : "—"}</td>
                                        <td>
                                            {r.eod ? "✔" : "—"}
                                            {r.eod && r.eod_late && <span className="badge bg-danger ms-1">Late</span>}
                                        </td>
                                        <td>{r.score != null ? `${r.score}%` : "—"}</td>
                                        <td>
                                            {r.eod
                                                ? <span className={`badge bg-${REVIEW[r.review_status] || "secondary"}`}>{r.review_status}</span>
                                                : "—"}
                                        </td>
                                    </tr>
                                    {open === r.date && (
                                        <tr key={r.date + "-d"}>
                                            <td colSpan={8} className="bg-light">
                                                <div className="small">
                                                    <div>Completed {r.done} · Partial {r.partial} · Pending {r.pending} · Closed {r.cancelled}</div>
                                                    {r.summary && <div className="mt-1">💬 {r.summary}</div>}
                                                    {r.review_note && (
                                                        <div className="mt-1">
                                                            Review ({r.review_status}) by {r.reviewer_name || "HR"}: {r.review_note}
                                                        </div>
                                                    )}
                                                    {onOpenDate && (
                                                        <button className="btn btn-sm btn-outline-primary mt-2"
                                                            onClick={() => onOpenDate(r.date)}>Open this day</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}