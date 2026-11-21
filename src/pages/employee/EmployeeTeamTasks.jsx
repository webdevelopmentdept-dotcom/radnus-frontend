import { useState } from "react";
import EmployeeLayout from "./EmployeeLayout";
import HrWorkTasks from "../hr/HrWorkTasks";
import HrWorkReports from "../hr/HrWorkReports";

const STYLES = `
.tt-switch{padding:22px 32px 0}
.tt-seg{display:inline-flex;background:#e8ebf1;border-radius:10px;padding:3px;gap:2px}
.tt-seg button{appearance:none;border:0;background:transparent;padding:8px 18px;font-size:13.5px;font-weight:600;color:#5b6677;border-radius:8px;cursor:pointer;white-space:nowrap}
.tt-seg button:hover:not(.is-on){color:#18212f}
.tt-seg button.is-on{background:#fff;color:#18212f;box-shadow:0 1px 2px rgba(16,24,40,.14)}
.tt-body .wt,.tt-body .wr{padding-top:18px}
@media (max-width:991.98px){.tt-switch{padding:18px 20px 0}}
@media (max-width:767.98px){
  .tt-switch{padding:14px 12px 0}
  .tt-seg{display:flex;width:100%}
  .tt-seg button{flex:1;padding:10px 6px}
  .tt-body .wt,.tt-body .wr{padding-top:14px}
}
`;

export default function EmployeeTeamTasks() {
  const [tab, setTab] = useState("tasks");

  return (
    <EmployeeLayout>
      <style>{STYLES}</style>
      <div className="tt-switch">
        <div className="tt-seg" role="tablist">
          <button role="tab" className={tab === "tasks" ? "is-on" : ""} onClick={() => setTab("tasks")}>
            Tasks & Review
          </button>
          <button role="tab" className={tab === "reports" ? "is-on" : ""} onClick={() => setTab("reports")}>
            Team Reports
          </button>
        </div>
      </div>
      <div className="tt-body">
        {tab === "tasks" ? <HrWorkTasks role="tl" /> : <HrWorkReports />}
      </div>
    </EmployeeLayout>
  );
}