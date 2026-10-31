import React, { useState, useEffect } from "react";
import { API, adminHeaders, ADM_CSS, fmtMoney } from "../admission/admissionShared";

// Register No (copied onto NEW applications only) + Fee master
export default function AdminAdmissionSettings() {
  const [registerNo, setRegisterNo] = useState("");
  const [savedNo, setSavedNo] = useState("");
  const [courses, setCourses] = useState([]);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState("");
  const [newC, setNewC] = useState({ name: "", category: "REGULAR", feeWithout: "", feeWith: "" });

  const flash = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg({ type: "", text: "" }), 4000); };
  const jsonHeaders = () => ({ "Content-Type": "application/json", ...adminHeaders() });

  const load = async () => {
    try {
      const [s, c] = await Promise.all([
        fetch(`${API}/api/admin-admission/settings`, { headers: adminHeaders() }).then((r) => r.json()),
        fetch(`${API}/api/admin-admission/courses`, { headers: adminHeaders() }).then((r) => r.json()),
      ]);
      if (s.success) { setRegisterNo(s.data.registerNo); setSavedNo(s.data.registerNo); }
      if (c.success) setCourses(c.data);
    } catch (e) { flash("error", "Failed to load settings"); }
  };
  useEffect(() => { load(); }, []);

  const saveRegister = async () => {
    setBusy("reg");
    try {
      const res = await fetch(`${API}/api/admin-admission/settings`, { method: "PUT", headers: jsonHeaders(), body: JSON.stringify({ registerNo }) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setSavedNo(json.data.registerNo);
      flash("ok", "Register No updated. It applies to NEW applications only.");
    } catch (e) { flash("error", e.message); } finally { setBusy(""); }
  };

  const edit = (id, k, v) => setCourses((p) => p.map((c) => (c._id === id ? { ...c, [k]: v } : c)));

  const saveCourse = async (c) => {
    setBusy(c._id);
    try {
      const res = await fetch(`${API}/api/admin-admission/courses/${c._id}`, {
        method: "PUT", headers: jsonHeaders(),
        body: JSON.stringify({ name: c.name, feeWithout: c.feeWithout, feeWith: c.feeWith ?? "", active: c.active }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      flash("ok", `${c.name} saved. New fee applies to new applications only.`);
    } catch (e) { flash("error", e.message); } finally { setBusy(""); }
  };

  const addCourse = async () => {
    if (!newC.name.trim() || newC.feeWithout === "") return flash("error", "Name and fee are required");
    setBusy("new");
    try {
      const res = await fetch(`${API}/api/admin-admission/courses`, { method: "POST", headers: jsonHeaders(), body: JSON.stringify(newC) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setNewC({ name: "", category: "REGULAR", feeWithout: "", feeWith: "" });
      flash("ok", "Course added");
      load();
    } catch (e) { flash("error", e.message); } finally { setBusy(""); }
  };

  return (
    <div className="adm-root">
      <style>{ADM_CSS}</style>
      <h4 style={{ fontWeight: 700, marginBottom: 4 }}>Admission — Settings</h4>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20 }}>Register No and course fees.</p>
      {msg.text && <div className={`adm-alert ${msg.type === "ok" ? "ok" : "error"}`}>{msg.text}</div>}

      <div className="adm-card">
        <h6>Register No (printed on every application)</h6>
        <div className="adm-actions">
          <div className="adm-field" style={{ minWidth: 320 }}><input value={registerNo} onChange={(e) => setRegisterNo(e.target.value)} /></div>
          <button className="adm-btn primary" onClick={saveRegister} disabled={busy === "reg" || registerNo.trim() === savedNo}>
            {busy === "reg" ? "Saving…" : "Update"}
          </button>
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
          Applications already created keep their old Register No. Only new ones use the updated number.
        </div>
      </div>

      <div className="adm-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="adm-table-wrap">
        <table className="adm-table" style={{ margin: 0, minWidth: 760 }}>
          <thead>
            <tr><th>Course / Scheme</th><th>Type</th><th>Fee (without acc.)</th><th>Fee (with acc.)</th><th>Active</th><th /></tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c._id}>
                <td><div className="adm-field"><input value={c.name} onChange={(e) => edit(c._id, "name", e.target.value)} /></div></td>
                <td><span className={`adm-badge ${c.category === "SCHEME" ? "partial" : "done"}`}>{c.category === "SCHEME" ? "Govt Scheme" : "Regular"}</span></td>
                <td><div className="adm-field"><input inputMode="numeric" value={c.feeWithout} onChange={(e) => edit(c._id, "feeWithout", e.target.value.replace(/\D/g, ""))} /></div></td>
                <td><div className="adm-field"><input inputMode="numeric" placeholder="n/a" value={c.feeWith ?? ""} onChange={(e) => edit(c._id, "feeWith", e.target.value.replace(/\D/g, ""))} /></div></td>
                <td><input type="checkbox" checked={!!c.active} onChange={(e) => edit(c._id, "active", e.target.checked)} /></td>
                <td style={{ textAlign: "right" }}>
                  <button className="adm-btn sm primary" onClick={() => saveCourse(c)} disabled={busy === c._id}>{busy === c._id ? "Saving…" : "Save"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <div className="adm-card">
        <h6>Add course / scheme</h6>
        <div className="adm-grid addrow">
          <div className="adm-field"><label>Name</label><input value={newC.name} onChange={(e) => setNewC({ ...newC, name: e.target.value })} /></div>
          <div className="adm-field"><label>Type</label>
            <select value={newC.category} onChange={(e) => setNewC({ ...newC, category: e.target.value })}>
              <option value="REGULAR">Regular</option><option value="SCHEME">Govt Scheme</option>
            </select>
          </div>
          <div className="adm-field"><label>Fee (without)</label><input inputMode="numeric" value={newC.feeWithout} onChange={(e) => setNewC({ ...newC, feeWithout: e.target.value.replace(/\D/g, "") })} /></div>
          <div className="adm-field"><label>Fee (with) — optional</label><input inputMode="numeric" value={newC.feeWith} onChange={(e) => setNewC({ ...newC, feeWith: e.target.value.replace(/\D/g, "") })} /></div>
          <button className="adm-btn primary" onClick={addCourse} disabled={busy === "new"}>{busy === "new" ? "Adding…" : "Add"}</button>
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}>
          Changing a fee only affects NEW applications; existing students keep the fee they were created with. Current: {courses.length} items{courses[0] ? `, e.g. ${courses[0].name} ${fmtMoney(courses[0].feeWithout)}` : ""}.
        </div>
      </div>
    </div>
  );
}