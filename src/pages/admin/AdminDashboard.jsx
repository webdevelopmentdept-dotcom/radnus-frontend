import React, { useEffect, useState } from "react";
import CourseGraph from "./CoursePieChart";
import MonthlyLeadBarChart from "./LeadBarChart";

export default function AdminDashboard() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const [applicants, setApplicants] = useState([]);
  const [partners, setPartners] = useState(0);
  const [leads, setLeads] = useState(0);
  const [monthlyLeads, setMonthlyLeads] = useState([]);

  const [courseData, setCourseData] = useState([
    { course: "SEMP", count: 0 },
    { course: "Hybrid", count: 0 },
    { course: "LASP", count: 0 },
  ]);

  // Monthly Leads Function
  const getMonthlyLeads = (list) => {
    const months = Array(12).fill(0);
    list.forEach((lead) => {
      if (!lead.date) return;
      const date = new Date(lead.date);
      const m = date.getMonth();
      if (!isNaN(m)) months[m]++;
    });
    return months;
  };

  useEffect(() => {
    fetchCounts();
  }, []);

 const fetchCounts = async () => {
  try {
    // Applicants
    const appRes = await fetch(`${API_BASE}/api/applicants`);
    const appData = await appRes.json();
    const applicantList = appData?.applicants || [];
    setApplicants(applicantList);

    // Partners
    const partnerRes = await fetch(`${API_BASE}/api/partners/all`);
    const partnerData = await partnerRes.json();
    setPartners(Array.isArray(partnerData) ? partnerData.length : 0);

    // ✅ Leads (FIXED)
    const leadRes = await fetch(`${API_BASE}/api/lead`);
    const leadData = await leadRes.json();
    const leadList = leadData?.leads || [];

    setLeads(leadList.length);

    // ✅ Monthly leads (FIXED)
    const monthly = getMonthlyLeads(leadList);
    setMonthlyLeads(monthly);

    // Course distribution
    const courseCounts = { SEMP: 0, Hybrid: 0, LASP: 0 };
    applicantList.forEach((a) => {
      const c = a.course?.toLowerCase() || "";
      if (c.includes("lasp")) courseCounts.LASP++;
      else if (c.includes("hybrid")) courseCounts.Hybrid++;
      else if (c.includes("semp")) courseCounts.SEMP++;
    });

    setCourseData([
      { course: "SEMP", count: courseCounts.SEMP },
      { course: "Hybrid", count: courseCounts.Hybrid },
      { course: "LASP", count: courseCounts.LASP },
    ]);
  } catch (error) {
    console.log("Dashboard Error:", error);
  }
};


  return (
    <div className="container mt-4 pb-5">

      {/* Header */}
      <div
  className="p-4 mb-5 rounded-4 d-flex justify-content-between align-items-center shadow-lg"
  style={{
    background: "linear-gradient(135deg, #ffffff 40%, #5A2EF9 40%)",
    border: "1px solid #eee",
    position: "relative",
    overflow: "hidden"
  }}
>

  {/* Left Content */}
  <div className="d-flex align-items-center">
    <div
      style={{
        width: "60px",
        height: "60px",
        borderRadius: "14px",
        background: "#5A2EF9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginRight: "14px",
        boxShadow: "0 4px 10px rgba(90,46,249,0.4)"
      }}
    >
      <img
        src="https://img.icons8.com/fluency/48/combo-chart.png"
        style={{ width: "34px" }}
      />
    </div>

    <div>
      <h2 className="fw-bold m-0 text-dark">Admin Dashboard</h2>
      <p className="m-0 text-secondary">Premium Analytics Panel</p>
    </div>
  </div>

  {/* Button */}
  <button
    className="btn fw-bold px-4 text-white"
    style={{
      background: "#5A2EF9",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(90,46,249,0.5)"
    }}
    onClick={() => fetchCounts()}
  >
    🔄 Refresh
  </button>
</div>


      {/* Stats Section */}
     <div className='row g-4 mb-4'>

  <div className='col-lg-4 col-md-6'>
    <div className='p-4 text-center rounded-4 position-relative'
      style={{
        background:"#FFF6ED",
        boxShadow:"0 6px 18px rgba(0,0,0,0.08)"
    }}>
      <img src="https://img.icons8.com/color/48/student-male.png"
        style={{position:"absolute", top:"-12px", right:"-12px"}} />
      <h6 className='text-muted'>Total Applicants</h6>
      <h1 className='fw-bold text-danger'>{applicants.length}</h1>
    </div>
  </div>

  <div className='col-lg-4 col-md-6'>
    <div className='p-4 text-center rounded-4 position-relative'
      style={{
        background:"#EBF5FF",
        boxShadow:"0 6px 18px rgba(0,0,0,0.08)"
    }}>
      <img src="https://img.icons8.com/color/48/groups.png"
        style={{position:"absolute", top:"-12px", right:"-12px"}} />
      <h6 className='text-muted'>Channel Partners</h6>
      <h1 className='fw-bold text-primary'>{partners}</h1>
    </div>
  </div>

  <div className='col-lg-4 col-md-6'>
    <div className='p-4 text-center rounded-4 position-relative'
      style={{
        background:"#FFEAF3",
        boxShadow:"0 6px 18px rgba(0,0,0,0.08)"
    }}>
      <img src="https://img.icons8.com/color/48/clock--v1.png"
        style={{position:"absolute", top:"-12px", right:"-12px"}} />
      <h6 className='text-muted'>Total Leads</h6>
      <h1 className='fw-bold text-warning'>{leads}</h1>
    </div>
  </div>

</div>

{/* Charts Section */}
<div className="row g-4">

  {/* Left - Pie chart */}
  <div className="col-lg-4 col-md-12">
    <div
      className="card shadow-lg border-0 rounded-4 p-4"
      style={{ height: "auto" }}    // auto height!
    >
      <h4 className="fw-bold text-secondary mb-3">Course Distribution</h4>

      <div style={{ width: "100%", height: "230px" }}>   {/* only chart controlled */}
        <CourseGraph data={courseData} />
      </div>
    </div>
  </div>

  {/* Right - Bar chart */}
  <div className="col-lg-8 col-md-12">
    <div
      className="card shadow-lg border-0 rounded-4 p-4"
      style={{ height: "auto" }}    // auto height!
    >
      <h4 className="fw-bold text-secondary mb-3">Monthly Lead Improvement</h4>

      <div style={{ width: "100%", height: "230px" }}>   {/* only chart controlled */}
        <MonthlyLeadBarChart data={monthlyLeads} />
      </div>
    </div>
  </div>
</div>



    </div>
  );
}
