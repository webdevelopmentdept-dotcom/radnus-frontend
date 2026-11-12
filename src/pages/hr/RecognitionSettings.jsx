import { useState, useEffect } from "react";
import axios from "axios";
import RecognitionTabs from "./RecognitionTabs";

const API = `${import.meta.env.VITE_API_BASE_URL}/api/recognition-config`;
const C = { text: "#111827", sub: "#6b7280", border: "#e5e7eb", blue: "#2563eb", green: "#047857", red: "#b91c1c" };
const ROWS = [["spot", "Spot award"], ["monthly_star", "Monthly Star award"], ["innovation", "Innovation Champion"]];
const errMsg = (e) => e?.response?.data?.message || e?.message || "Something went wrong";
const input = { padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 14, width: 110, boxSizing: "border-box" };

export default function RecognitionSettings() {
  const [form, setForm] = useState(null);
  const [canEdit, setCanEdit] = useState(false);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    axios.get(API).then((r) => {
      const d = r.data.data;
      setForm({ spot: d.legacy_points.spot, monthly_star: d.legacy_points.monthly_star, innovation: d.legacy_points.innovation, cap: d.cap_points, by: d.updated_by_name });
      setCanEdit(r.data.can_edit);
    }).catch((e) => setMsg({ text: errMsg(e), type: "error" }));
  }, []);

  const save = async () => {
    try {
      setBusy(true);
      await axios.put(API, { legacy_points: { spot: form.spot, monthly_star: form.monthly_star, innovation: form.innovation }, cap_points: form.cap });
      setMsg({ text: "Saved. New appraisals and 'Refresh recognition' will use these values.", type: "ok" });
    } catch (e) { setMsg({ text: errMsg(e), type: "error" }); }
    finally { setBusy(false); }
  };

  if (!form) return <p style={{ padding: 32, color: msg ? C.red : C.sub }}>{msg ? msg.text : "Loading..."}</p>;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div style={{ padding: "28px 32px", maxWidth: 720 }}>
            <RecognitionTabs group="schemes" />
      <h1 style={{ margin: 0, fontSize: 24 }}>Recognition settings</h1>
      <p style={{ margin: "6px 0 20px", color: C.sub, fontSize: 13 }}>Points that feed the Recognition part of the appraisal score.</p>

      {!canEdit && <p style={{ padding: "10px 14px", background: "#fffbeb", color: "#b45309", borderRadius: 8, fontSize: 13 }}>Only the MD or admin can change these. You can view them.</p>}

      <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, background: "#fff" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>Points per Awards Hub award</h3>
        {ROWS.map(([k, l]) => (
          <label key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, fontSize: 14 }}>
            {l}<input type="number" min="0" max="100" style={input} disabled={!canEdit} value={form[k]} onChange={set(k)} />
          </label>
        ))}
        <hr style={{ border: 0, borderTop: `1px solid ${C.border}`, margin: "16px 0" }} />
        <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 }}>
          <span>Maximum recognition points in one appraisal<div style={{ fontSize: 12, color: C.sub }}>0 means no limit</div></span>
          <input type="number" min="0" max="500" style={input} disabled={!canEdit} value={form.cap} onChange={set("cap")} />
        </label>
        <p style={{ fontSize: 12, color: C.sub, margin: "14px 0 0" }}>
          Points for the new award programme are set on each award (Award Configuration, appraisal section). Awards that use the innovation score never add appraisal points, because innovation is already counted here.
        </p>
        {msg && <p style={{ color: msg.type === "error" ? C.red : C.green, fontSize: 13, margin: "12px 0 0" }}>{msg.text}</p>}
        {canEdit && <button onClick={save} disabled={busy} style={{ marginTop: 16, padding: "9px 18px", background: C.blue, color: "#fff", border: 0, borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Save</button>}
        {form.by && <p style={{ fontSize: 11, color: C.sub, margin: "12px 0 0" }}>Last changed by {form.by}</p>}
      </div>
    </div>
  );
}