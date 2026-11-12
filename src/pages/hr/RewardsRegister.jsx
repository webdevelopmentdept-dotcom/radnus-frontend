// src/pages/hr/RewardsRegister.jsx  (Phase 4) register, catalogue and stock, budget
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Plus, AlertCircle } from "lucide-react";
import RecognitionTabs from "./RecognitionTabs";

const API = `${import.meta.env.VITE_API_BASE_URL}/api/rewards`;
const C = { text: "#111827", sub: "#6b7280", border: "#e5e7eb", blue: "#2563eb", green: "#047857", red: "#b91c1c", amber: "#b45309" };
const TYPES = ["trophy", "gold_medal", "silver_medal", "bronze_medal", "medal", "certificate", "badge", "gift_voucher"];
const label = (k) => String(k || "").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const errMsg = (e) => e?.response?.data?.message || e?.message || "Something went wrong";

const btn = (kind = "ghost") => ({
  display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
  border: `1px solid ${kind === "primary" ? C.blue : C.border}`, background: kind === "primary" ? C.blue : kind === "danger" ? "#fef2f2" : "#fff",
  color: kind === "primary" ? "#fff" : kind === "danger" ? C.red : C.text,
});
const th = { textAlign: "left", padding: "10px 12px", fontSize: 12, color: C.sub, fontWeight: 600, borderBottom: `1px solid ${C.border}`, background: "#f9fafb" };
const td = { padding: "12px", fontSize: 13, color: C.text, borderBottom: `1px solid ${C.border}`, verticalAlign: "middle" };
const input = { padding: "7px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, boxSizing: "border-box" };

const Pill = ({ children, color, bg }) => <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, color, background: bg, whiteSpace: "nowrap" }}>{children}</span>;
const STATUS = { planned: [C.amber, "#fffbeb"], issued: [C.green, "#dcfce7"], cancelled: [C.sub, "#f3f4f6"] };

function Modal({ title, onClose, children }) {
  return (
    <div onMouseDown={(e) => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "grid", placeItems: "center", zIndex: 70 }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 22, width: 440, maxWidth: "92vw", maxHeight: "90vh", overflowY: "auto" }}>
        <h3 style={{ margin: "0 0 12px" }}>{title}</h3>{children}
      </div>
    </div>
  );
}
const Lbl = ({ t, children }) => <label style={{ display: "block", fontSize: 13, marginTop: 10 }}>{t}<div style={{ marginTop: 4 }}>{children}</div></label>;

export default function RewardsRegister() {
  const [tab, setTab] = useState("register");
  const [items, setItems] = useState([]);
  const [reg, setReg] = useState({ issues: [], totals: {} });
  const [sum, setSum] = useState({ awards: [], totals: {}, low_stock: [] });
  const [filters, setFilters] = useState({ award_id: "", status: "", q: "" });
  const [modal, setModal] = useState(null);       // { kind, ... }
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);

  const notify = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const loadItems = useCallback(async () => { try { setItems((await axios.get(`${API}/items`)).data.data); } catch (e) { notify(errMsg(e), "error"); } }, []);
  const loadSum = useCallback(async () => { try { setSum((await axios.get(`${API}/summary`)).data.data); } catch (e) { notify(errMsg(e), "error"); } }, []);
  const loadReg = useCallback(async () => {
    try { setReg((await axios.get(`${API}/register`, { params: filters })).data.data); }
    catch (e) { notify(errMsg(e), "error"); }
  }, [filters]);

  useEffect(() => { loadItems(); loadSum(); }, [loadItems, loadSum]);
  useEffect(() => { loadReg(); }, [loadReg]);
  const refresh = () => { loadItems(); loadSum(); loadReg(); };

  // generic submit for modals
  const submit = async (fn, okMsg) => {
    try { setBusy(true); await fn(); setModal(null); notify(okMsg); refresh(); }
    catch (e) { setModal((m) => ({ ...m, error: errMsg(e) })); }
    finally { setBusy(false); }
  };

  const tabBtn = (k, t) => (
    <button key={k} onClick={() => setTab(k)} style={{ ...btn(), background: tab === k ? "#eff6ff" : "#fff", borderColor: tab === k ? C.blue : C.border, color: tab === k ? C.blue : C.text }}>{t}</button>
  );

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1250 }}>
            <RecognitionTabs group="approvals" />
      {toast && <div role="status" style={{ position: "fixed", top: 20, right: 20, zIndex: 90, padding: "10px 16px", borderRadius: 8, color: "#fff", fontSize: 13, background: toast.type === "error" ? C.red : C.green }}>{toast.msg}</div>}

      <h1 style={{ margin: 0, fontSize: 24 }}>Rewards register</h1>
      <p style={{ margin: "6px 0 16px", color: C.sub, fontSize: 13 }}>Track what each winner receives, stock of trophies and medals, and budget against spend.</p>

      {sum.low_stock.length > 0 && (
        <p style={{ padding: "10px 14px", background: "#fffbeb", color: C.amber, borderRadius: 8, fontSize: 13 }}>
          <AlertCircle size={14} style={{ verticalAlign: -2 }} /> Low stock: {sum.low_stock.map((i) => `${i.name} (${i.stock_on_hand})`).join(", ")}
        </p>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {tabBtn("register", "Register")}{tabBtn("catalogue", "Catalogue and stock")}{tabBtn("budget", "Budget")}
      </div>

      {/* ───────── register ───────── */}
      {tab === "register" && (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
            <select style={input} value={filters.award_id} onChange={(e) => setFilters({ ...filters, award_id: e.target.value })}>
              <option value="">All awards</option>
              {sum.awards.map((a) => <option key={a.award_id} value={a.award_id}>{a.name}</option>)}
            </select>
            <select style={input} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All status</option><option value="planned">Planned</option><option value="issued">Issued</option><option value="cancelled">Cancelled</option>
            </select>
            <input style={input} placeholder="Search winner" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
            <span style={{ marginLeft: "auto", fontSize: 13, color: C.sub, alignSelf: "center" }}>
              Cash to pay: <b style={{ color: C.amber }}>{money(reg.totals.cash_pending)}</b> · Cash given: <b style={{ color: C.green }}>{money(reg.totals.cash_given)}</b>
            </span>
          </div>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflowX: "auto", background: "#fff" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 960 }}>
              <thead><tr><th style={th}>Winner</th><th style={th}>Award</th><th style={th}>Rank</th><th style={th}>Reward</th><th style={th}>Item</th><th style={th}>Cash</th><th style={th}>Status</th><th style={th}>Actions</th></tr></thead>
              <tbody>
                {reg.issues.length === 0 && <tr><td colSpan={8} style={{ ...td, textAlign: "center", color: C.sub, padding: 28 }}>No reward entries yet. Finalize an award, then use "Create reward entries" on its Evaluate screen.</td></tr>}
                {reg.issues.map((i) => (
                  <tr key={i._id}>
                    <td style={td}><b>{i.entity_name}</b><div style={{ color: C.sub, fontSize: 12 }}>{i.employee_code} {i.department && `· ${i.department}`}</div></td>
                    <td style={td}>{i.award_name}</td>
                    <td style={td}>{i.rank}</td>
                    <td style={td}>{label(i.reward_type)}{i.title && <div style={{ color: C.sub, fontSize: 12 }}>{i.title}</div>}{i.points > 0 && <div style={{ fontSize: 12 }}>{i.points} points</div>}</td>
                    <td style={td}>{i.item_name ? `${i.item_name} × ${i.quantity}` : <span style={{ color: C.sub }}>{["cash", "points"].includes(i.reward_type) ? "-" : "No item (stock not tracked)"}</span>}</td>
                    <td style={td}>{i.cash_amount ? money(i.cash_amount) : "-"}{i.payment_ref && <div style={{ fontSize: 11, color: C.sub }}>Ref: {i.payment_ref}</div>}</td>
                    <td style={td}><Pill color={STATUS[i.status][0]} bg={STATUS[i.status][1]}>{label(i.status)}</Pill>{i.cancel_reason && <div style={{ fontSize: 11, color: C.sub, marginTop: 3 }}>{i.cancel_reason}</div>}</td>
                    <td style={td}>
                      {i.status === "planned" && (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button style={btn("primary")} onClick={() => setModal({ kind: "issue", row: i, note: "", ref: "" })}>Mark given</button>
                          {!["cash", "points"].includes(i.reward_type) && <button style={btn()} onClick={() => setModal({ kind: "edit", row: i, item_id: i.item_id || "", quantity: i.quantity })}>Edit</button>}
                          <button style={btn("danger")} onClick={() => setModal({ kind: "cancel", row: i, reason: "" })}>Cancel</button>
                        </div>
                      )}
                      {i.status === "issued" && <span style={{ fontSize: 12, color: C.sub }}>{new Date(i.issued_at).toLocaleDateString("en-IN")} · {i.issued_by}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ───────── catalogue ───────── */}
      {tab === "catalogue" && (
        <>
          <div style={{ marginBottom: 12 }}><button style={btn("primary")} onClick={() => setModal({ kind: "item", name: "", reward_type: "trophy", unit_cost: 0, stock_on_hand: 0, low_stock_at: 5 })}><Plus size={14} /> Add item</button></div>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflowX: "auto", background: "#fff" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
              <thead><tr><th style={th}>Item</th><th style={th}>Type</th><th style={th}>Unit cost</th><th style={th}>In stock</th><th style={th}>Actions</th></tr></thead>
              <tbody>
                {items.length === 0 && <tr><td colSpan={5} style={{ ...td, textAlign: "center", color: C.sub, padding: 28 }}>No items yet. Add trophies, medals and certificates you keep in stock.</td></tr>}
                {items.map((it) => (
                  <tr key={it._id} style={{ opacity: it.active ? 1 : 0.5 }}>
                    <td style={td}><b>{it.name}</b>{!it.active && <> <Pill color={C.sub} bg="#f3f4f6">Inactive</Pill></>}</td>
                    <td style={td}>{label(it.reward_type)}</td>
                    <td style={td}>{money(it.unit_cost)}</td>
                    <td style={td}><b style={{ color: it.stock_on_hand <= it.low_stock_at ? C.red : C.text }}>{it.stock_on_hand}</b>{it.stock_on_hand <= it.low_stock_at && <> <Pill color={C.red} bg="#fef2f2">Low</Pill></>}</td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button style={btn()} onClick={() => setModal({ kind: "restock", row: it, qty: "", note: "" })}>Stock</button>
                        <button style={btn()} onClick={() => setModal({ kind: "itemedit", row: it, name: it.name, unit_cost: it.unit_cost, low_stock_at: it.low_stock_at })}>Edit</button>
                        <button style={btn()} onClick={() => submit(() => axios.put(`${API}/items/${it._id}`, { active: !it.active }), it.active ? "Item deactivated" : "Item activated")}>{it.active ? "Deactivate" : "Activate"}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ───────── budget ───────── */}
      {tab === "budget" && (
        <>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            {[["Total budget", sum.totals.budget, C.text], ["Planned", sum.totals.planned, C.amber], ["Issued", sum.totals.issued, C.green]].map(([l, v, c]) => (
              <div key={l} style={{ flex: "1 1 160px", border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", background: "#fff" }}>
                <div style={{ fontSize: 12, color: C.sub }}>{l}</div><div style={{ fontSize: 24, fontWeight: 800, color: c }}>{money(v)}</div>
              </div>
            ))}
          </div>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflowX: "auto", background: "#fff" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
              <thead><tr><th style={th}>Award</th><th style={th}>Budget</th><th style={th}>Planned</th><th style={th}>Issued</th><th style={th}>Remaining</th></tr></thead>
              <tbody>
                {sum.awards.length === 0 && <tr><td colSpan={5} style={{ ...td, textAlign: "center", color: C.sub, padding: 28 }}>Nothing to show yet.</td></tr>}
                {sum.awards.map((a) => (
                  <tr key={a.award_id}>
                    <td style={td}><b>{a.name}</b></td>
                    <td style={td}>{a.budget ? money(a.budget) : "Not set"}</td>
                    <td style={td}>{money(a.planned_cost)} <span style={{ color: C.sub }}>({a.planned_count})</span></td>
                    <td style={td}>{money(a.issued_cost)} <span style={{ color: C.sub }}>({a.issued_count})</span></td>
                    <td style={{ ...td, color: a.over_budget ? C.red : C.text, fontWeight: 700 }}>{a.remaining === null ? "-" : money(a.remaining)}{a.over_budget && <> <Pill color={C.red} bg="#fef2f2">Over budget</Pill></>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ───────── modals ───────── */}
      {modal && (
        <Modal title={
          { issue: "Mark as given", edit: "Edit reward", cancel: "Cancel reward", item: "Add item", itemedit: "Edit item", restock: `Stock · ${modal.row?.name || ""}` }[modal.kind]
        } onClose={() => setModal(null)}>
          {modal.row && modal.kind !== "restock" && modal.kind !== "itemedit" && <p style={{ margin: 0, fontSize: 13, color: C.sub }}>{modal.row.entity_name} · {label(modal.row.reward_type)}</p>}

          {modal.kind === "issue" && <>
            {modal.row.item_id && <p style={{ fontSize: 12, color: C.sub }}>{modal.row.quantity} × {modal.row.item_name} will be taken out of stock.</p>}
            {modal.row.cash_amount > 0 && <Lbl t={`Payment reference for ${money(modal.row.cash_amount)} (optional)`}><input style={{ ...input, width: "100%" }} value={modal.ref} onChange={(e) => setModal({ ...modal, ref: e.target.value })} /></Lbl>}
            <Lbl t="Note (optional)"><input style={{ ...input, width: "100%" }} value={modal.note} onChange={(e) => setModal({ ...modal, note: e.target.value })} /></Lbl>
          </>}

          {modal.kind === "edit" && <>
            <Lbl t="Item from catalogue">
              <select style={{ ...input, width: "100%" }} value={modal.item_id} onChange={(e) => setModal({ ...modal, item_id: e.target.value })}>
                <option value="">No item (do not track stock)</option>
                {items.filter((i) => i.active && i.reward_type === modal.row.reward_type).map((i) => <option key={i._id} value={i._id}>{i.name} (stock {i.stock_on_hand})</option>)}
              </select>
            </Lbl>
            <Lbl t="Quantity"><input type="number" min="1" style={{ ...input, width: 100 }} value={modal.quantity} onChange={(e) => setModal({ ...modal, quantity: e.target.value })} /></Lbl>
          </>}

          {modal.kind === "cancel" && <Lbl t="Reason (required)"><textarea rows={3} style={{ ...input, width: "100%" }} value={modal.reason} onChange={(e) => setModal({ ...modal, reason: e.target.value })} /></Lbl>}

          {(modal.kind === "item" || modal.kind === "itemedit") && <>
            <Lbl t="Name"><input style={{ ...input, width: "100%" }} value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} /></Lbl>
            {modal.kind === "item" && <Lbl t="Type"><select style={{ ...input, width: "100%" }} value={modal.reward_type} onChange={(e) => setModal({ ...modal, reward_type: e.target.value })}>{TYPES.map((t) => <option key={t} value={t}>{label(t)}</option>)}</select></Lbl>}
            <Lbl t="Cost per piece (₹)"><input type="number" min="0" style={{ ...input, width: 140 }} value={modal.unit_cost} onChange={(e) => setModal({ ...modal, unit_cost: e.target.value })} /></Lbl>
            {modal.kind === "item" && <Lbl t="Opening stock"><input type="number" min="0" style={{ ...input, width: 140 }} value={modal.stock_on_hand} onChange={(e) => setModal({ ...modal, stock_on_hand: e.target.value })} /></Lbl>}
            <Lbl t="Warn me when stock falls to"><input type="number" min="0" style={{ ...input, width: 140 }} value={modal.low_stock_at} onChange={(e) => setModal({ ...modal, low_stock_at: e.target.value })} /></Lbl>
          </>}

          {modal.kind === "restock" && <>
            <p style={{ fontSize: 13, color: C.sub, margin: 0 }}>Currently in stock: <b>{modal.row.stock_on_hand}</b></p>
            <Lbl t="Add (use a minus number to reduce)"><input type="number" style={{ ...input, width: 140 }} value={modal.qty} onChange={(e) => setModal({ ...modal, qty: e.target.value })} /></Lbl>
            <Lbl t="Note (required when reducing)"><input style={{ ...input, width: "100%" }} value={modal.note} onChange={(e) => setModal({ ...modal, note: e.target.value })} /></Lbl>
          </>}

          {modal.error && <p style={{ color: C.red, fontSize: 13, margin: "10px 0 0" }}>{modal.error}</p>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <button style={btn()} onClick={() => setModal(null)}>Close</button>
            <button style={btn("primary")} disabled={busy} onClick={() => {
              const m = modal;
              if (m.kind === "issue") return submit(() => axios.post(`${API}/issues/${m.row._id}/issue`, { note: m.note, payment_ref: m.ref }), "Marked as given");
              if (m.kind === "edit") return submit(() => axios.put(`${API}/issues/${m.row._id}`, { item_id: m.item_id || null, quantity: m.quantity }), "Reward updated");
              if (m.kind === "cancel") return submit(() => axios.post(`${API}/issues/${m.row._id}/cancel`, { reason: m.reason }), "Reward cancelled");
              if (m.kind === "item") return submit(() => axios.post(`${API}/items`, { name: m.name, reward_type: m.reward_type, unit_cost: m.unit_cost, stock_on_hand: m.stock_on_hand, low_stock_at: m.low_stock_at }), "Item added");
              if (m.kind === "itemedit") return submit(() => axios.put(`${API}/items/${m.row._id}`, { name: m.name, unit_cost: m.unit_cost, low_stock_at: m.low_stock_at }), "Item updated");
              if (m.kind === "restock") return submit(() => axios.post(`${API}/items/${m.row._id}/restock`, { qty: m.qty, note: m.note }), "Stock updated");
            }}>Save</button>
          </div>
        </Modal>
      )}
    </div>
  );
}