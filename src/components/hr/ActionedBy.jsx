import React, { useEffect, useState } from "react";
import { getLastAction } from "../../utils/lastActions";

// order matters: REAPPROVE before APPROVE, DEACTIVATE before ACTIVATE
const LABELS = [
  [/REAPPROVE/, "Re-approved"], [/APPROVE/, "Approved"], [/REJECT/, "Rejected"],
  [/RELIEVE/, "Relieved"], [/FIRE/, "Terminated"], [/DEACTIVATE/, "Access deactivated"],
  [/REACTIVATE/, "Reactivated"], [/ACTIVATE/, "Activated"], [/MOVE_TO_PENDING/, "Moved to pending"],
  [/PAID/, "Paid"], [/SCREEN/, "Screened"], [/ALLOCATE/, "Allocated"], [/FINAL/, "Finalized"],
  [/UNPUBLISH/, "Unpublished"], [/PUBLISH/, "Published"], [/CANCEL/, "Cancelled"],
  [/UNLOCK/, "Unlocked"], [/LOCK/, "Locked"],
  [/DELETE/, "Deleted"], [/STATUS/, "Status changed"], [/CREATE/, "Created"], [/UPDATE|SAVE/, "Updated"],
];

const ROLE = { hr: "HR", md: "MD", admin: "Admin", tester: "Test" };

const labelFor = (action = "") => (LABELS.find(([re]) => re.test(action)) || [null, "Updated"])[1];
export default function ActionedBy({ id, match = "", version = "", style, compact = false }) {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    let alive = true;
    setInfo(null);
    if (!id) return undefined;
    const run = async (retry) => {
      const v = await getLastAction(id, match, { fresh: !retry });
      if (!alive) return;
      if (v) setInfo(v);
      else if (retry) setTimeout(() => alive && run(false), 1500); // log is written just after the response
    };
    run(true);
    return () => { alive = false; };
  }, [id, match, version]);

  if (!info) return null;
  const full = `${labelFor(info.action)} by ${info.name}${ROLE[info.role] ? ` (${ROLE[info.role]})` : ""}${info.at ? ` · ${new Date(info.at).toLocaleString()}` : ""}`;
  return (
    <div
      title={full}
      style={{ fontSize: 12, color: "#475569", fontWeight: 600, marginTop: 4, ...style }}
    >
      {compact ? `${labelFor(info.action)} by ${info.name}` : full}
    </div>
  );
}