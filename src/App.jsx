import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import Gallery from "./components/shared/Gallery";
import './index.css';
import './App.css';
/* Shared */
import RadnusNavbar from "./components/shared/RadnusNavbar";
import TopServiceBar from "./components/shared/TopServiceBar";
import RadnusFooter from "./components/shared/RadnusFooter";

/* Public */
import RadnusHome from "./components/RadnusHome";
import RadnusAbout from "./components/RadnusAbout";
import RadnusAcademy from "./components/Services/RadnusAcademy";
import WhiteLabelPage from "./components/Services/WhiteLabelPage";
import ToolsTech from "./components/Services/ToolstTech";
import Accessories from "./components/Services/Accessories";
import Service from "./components/Services/Services";
import Placement from "./components/Services/Placement";
import Timeline from "./components/Services/Timeline";
import Startup from "./components/Services/Startup";
import Career from "./components/Career";
import CareerDetail from "./components/shared/CareerDetail";
import ThankYou from "./ThankYou";
import jobsData from "./components/jobsData";

/* Auth */
import Login from "./pages/auth/Login";
import HrLogin from "./pages/hr/HrLogin";
import AdminLogin from "./pages/admin/AdminLogin";
import PartnerLogin from "./pages/Channel/PartnerLogin";

/* Employee */
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import Employeelogin from "./pages/employee/Employeelogin";
import UploadDocuments from "./pages/employee/UploadDocuments";
import MyPerformance from "./pages/employee/Myperformance";
import SelfAssessment from "./pages/employee/Selfassessment";
// import EmployeeSalaryDashboard from "./pages/employee/EmployeeSalaryDashboard";
import MyPackage from "./pages/employee/Mypackage";
import MyDocuments from "./pages/employee/Mydocuments";
import EmployeeAttendance from "./pages/employee/EmployeeAttendance";
import EmployeeNotifications from "./pages/employee/EmployeeNotifications";
import MyProfile from "./pages/employee/Myprofile";
import FeedbackFill from "./pages/employee/FeedbackFill";
import ImpactBonusEmployee from "./pages/employee/ImpactBonusEmployee";
import WellnessEmployee from "./pages/employee/WellnessEmployee";
import Myclubs from "./pages/employee/Myclubs";
import EmployeeLeadershipTrack from "./pages/employee/EmployeeLeadershipTrack";
import EmployeeRetentionPlan from "./pages/employee/EmployeeRetentionPlan";
import AlumniNetworkEmployee from "./pages/employee/Alumninetworkemployee";
import TrainingRoadmapEmployee from "./pages/employee/Trainingroadmapemployee ";
import EmployeeAppraisal from "./pages/employee/EmployeeAppraisal";
import MyIncentive from "./pages/employee/MyIncentive";
import EmployeePolicies from "./pages/employee/EmployeePolicies";
import EmployeeSOPView from "./pages/employee/Employeesopview";

/* HR */
import HrDashboard from "./pages/hr/HrDashboard";
import HrApplicants from "./pages/hr/HrApplicants";
import HrEmployees from "./pages/hr/HrEmployees";
import KpiTemplates from "./pages/hr/KpiTemplates";
// import HRActivationForm from "./pages/hr/HRActivationForm";
import HRAttendancePage from "./pages/hr/Hrattendancepage";
import HRLeaveRequests from "./pages/hr/Hrleaverequests";
import HrSettings from "./pages/hr/HrSettings";
import HrActiveEmployees from "./pages/hr/Hractiveemployees";
import HrNotifications from "./pages/hr/HrNotifications";
import JobPostings from "./pages/hr/JobPosting";
import OkrDashboard from "./pages/hr/Okrdashboard";
import GradeMaster from "./pages/hr/Grademaster";
import AssignGrade from "./pages/hr/AssignGrade";
import GradeReports from "./pages/hr/GradeReport";
import OkrSetup from "./pages/hr/Okrsetup";
import FeedbackCycleSetup from "./pages/hr/Feedbackcyclesetup";
import VariablePayDashboard from "./pages/hr/VariablePayDashboard";
import FeedbackNominations from "./pages/hr/Feedbacknominations";
import FeedbackSubmissions from "./pages/hr/FeedbackSubmissions";
import HrManagerFeedback from "./pages/hr/Hrmanagerfeedback";
import AwardsDashboard from "./pages/hr/AwardsDashboard";
import FeedbackReports from "./pages/hr/Feedbackreports";
import EsopDashboard from "./pages/hr/EsopDashboard";
import ImpactBonusDashboard from "./pages/hr/ImpactBonusDashboard";
import DepartmentMaster from "./pages/hr/Departmentmaster";
import WellnessHr from "./pages/hr/WellnessHr";
import Corporateclubshr from "./pages/hr/Corporateclubshr";
import RetentionPlan from "./pages/hr/RetentionPlan";
import HrDashboardHome from "./pages/hr/HrDashboardHome";
import HrPending from "./pages/hr/HrPending";
import HrApproved from "./pages/hr/HrApproved";
import HrRejected from "./pages/hr/HrRejected";
import AssignKpi from "./pages/hr/AssignKpi";
import PerformanceReviews from "./pages/hr/PerformanceReviews";
import PerformanceReports from "./pages/hr/Performancereports";
import EngagementCalendar from "./pages/hr/EngagementCalender";
import HrLeadershipTrack from "./pages/hr/HrLeadershipTrack";
import AlumniNetwork from "./pages/hr/AlumniNetwork";
import TrainingRoadmapHR from "./pages/hr/Trainingroadmaphr";
import AppraisalHub from "./pages/hr/AppraisalHub";
import IncentiveAssign from "./pages/hr/IncentiveAssign";
import IncentivePlans from "./pages/hr/IncentivePlans";
import IncentiveResults from "./pages/hr/IncentiveResults";
import PolicyManagement from "./pages/hr/PolicyManagement";
import SOPManagement from "./pages/hr/Sopmanagement";
import PolicyQuizManagementPage from "./pages/hr/PolicyQuizManagementPage";



/* Admin */
import AdminLayout from "./pages/layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ApplicantList from "./pages/admin/ApplicantList";
import PartnerList from "./pages/admin/PartnerList";
import LeadList from "./pages/admin/LeadList";
import AdvanceRecords from "./pages/admin/AdvanceRecords";
import SystemSettings from "./pages/admin/SystemSetting";
import AdminUpdates from "./pages/admin/AdminUpdates";
import CourseManagement from "./pages/admin/CourseManagement";
import ShopOwnerList from "./pages/admin/ShopOwnerList";
import TechnicianList from "./pages/admin/TechnicianList";

/* Channel */
import ChannelDashboard from "./pages/Channel/ChannelDashboard";
import DashboardOverview from "./pages/Channel/DashboardOverview";
import AddLead from "./pages/Channel/AddLead";
import MyLeads from "./pages/Channel/MyLeads";
import Courses from "./pages/Channel/Courses";
import CourseDetail from "./pages/Channel/CourseDetail";
import PartnerProfile from "./pages/Channel/ProfilePartner";

/* Radnus Connect */
import RadnusConnectHome from "./components/radnusconnect/RadnusConnectHome";
import TechnicianForm from "./components/radnusconnect/TechnicianForm";
import ShopOwnerForm from "./components/radnusconnect/ShopOwnerForm";

/* 🔐 EMPLOYEE PROTECTED ROUTE */
const EmployeeProtectedRoute = ({ children }) => {
  const token =
    localStorage.getItem("employeeToken") ||
    sessionStorage.getItem("employeeToken");
  return token ? children : <Navigate to="/employee/login" replace />;
};

function App() {
  const location = useLocation();

  const hideHeaderFooter =
    (location.pathname.startsWith("/admin") &&
      location.pathname !== "/admin/login") ||
    (location.pathname.startsWith("/hr") &&
      location.pathname !== "/hr/login") ||
    (location.pathname.startsWith("/employee") &&
      location.pathname !== "/employee/login") ||
    (location.pathname.toLowerCase().startsWith("/channel") &&
      location.pathname.toLowerCase() !== "/channel/login") ||
    location.pathname.startsWith("/radnus-connect/technician") ||
    location.pathname.startsWith("/radnus-connect/shop-owner");

  return (
    <>
      <ScrollToTop />
      {!hideHeaderFooter && <RadnusNavbar />}

      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<RadnusHome />} />
        <Route path="/about" element={<RadnusAbout />} />
        <Route path="/academy" element={<RadnusAcademy />} />
        <Route path="/thank-you" element={<ThankYou />} />
        <Route path="/whitelabel" element={<WhiteLabelPage />} />
        <Route path="/careers" element={<Career jobsData={jobsData} />} />
        <Route path="/careers/:jobTitle" element={<CareerDetail />} />
        <Route path="/tools-tech" element={<ToolsTech />} />
        <Route path="/accessories" element={<Accessories />} />
        <Route path="/service" element={<Service />} />
        <Route path="/placement" element={<Placement />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/startup" element={<Startup />} />
        <Route path="/gallery" element={<Gallery />} />
        {/* AUTH */}
        <Route path="/login" element={<Login />} />
        <Route path="/employee/login" element={<Employeelogin />} />
        <Route path="/hr/login" element={<HrLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/channel/login" element={<PartnerLogin />} />
        <Route
          path="/employee/upload-docs"
          element={
            <EmployeeProtectedRoute>
              <UploadDocuments />
            </EmployeeProtectedRoute>
          }
        />
        {/* ✅ EMPLOYEE DASHBOARD */}
        <Route
          path="/employee/dashboard"
          element={
            <EmployeeProtectedRoute>
              <EmployeeDashboard />
            </EmployeeProtectedRoute>
          }
        />

        <Route path="/employee/performance" element={<MyPerformance />} />
        <Route path="/employee/self-assessment" element={<SelfAssessment />} />
        {/* <Route path="/employee/my-salary" element={<EmployeeSalaryDashboard />} /> */}
        <Route path="/employee/my-salary" element={<MyPackage />} />
        <Route path="/employee/my-documents" element={<MyDocuments />} />
        <Route path="/employee/attendance" element={<EmployeeAttendance />} />
        <Route path="/employee/notifications" element={<EmployeeNotifications />} />
        <Route path="/employee/profile" element={<MyProfile />} />
        <Route path="/employee/360-feedback" element={<FeedbackFill />} />
        <Route path="/employee/dashboard/impact-bonus" element={<ImpactBonusEmployee />} />
        <Route path="/employee/wellness" element={<WellnessEmployee />} />
        <Route path="/employee/clubs" element={<Myclubs />} />
        <Route path="/employee/leadership-track" element={<EmployeeLeadershipTrack />} />
        <Route path="/employee/retention" element={<EmployeeRetentionPlan />} />
        <Route path="/employee/alumni-network" element={<AlumniNetworkEmployee />} />
        <Route path="/employee/training" element={<TrainingRoadmapEmployee />} />
        <Route path="/employee/appraisal" element={<EmployeeAppraisal />} />
        <Route path="/employee/my-incentive" element={<MyIncentive />} />
        <Route path="/employee/policies" element={<EmployeePolicies />} />
        <Route path="/employee/sops" element={<EmployeeSOPView />} />
 
        {/* <Route path="/hr/dashboard" element={<HrDashboard />}>
          <Route index element={<HrDashboardHome />} />
          <Route path="applicants" element={<HrApplicants />} />
          <Route path="employees" element={<HrEmployees />} />
          <Route path="hr-pending" element={<HrPending />} />
          <Route path="hr-approved" element={<HrApproved />} />
          <Route path="hr-reject" element={<HrRejected />} />
          <Route path="settings" element={<HrSettings />} />
         <Route path="active-employees" element={<HrActiveEmployees />} />
          <Route path="/hr/dashboard/attendance/daily" element={<HRAttendancePage />} />
          <Route path="/hr/dashboard/attendance/monthly" element={<HRAttendancePage />} />
          <Route path="/hr/dashboard/leave/requests" element={<HRLeaveRequests />} /> */}

        <Route path="/hr/dashboard" element={<HrDashboard />}>

          <Route index element={<HrDashboardHome />} />

          <Route path="applicants" element={<HrApplicants />} />
          <Route path="job-postings" element={<JobPostings />} />
          <Route path="employees" element={<HrEmployees />} />

          <Route path="hr-pending" element={<HrPending />} />
          <Route path="hr-approved" element={<HrApproved />} />
          <Route path="hr-reject" element={<HrRejected />} />

          <Route path="active-employees" element={<HrActiveEmployees />} />

          <Route path="attendance/daily" element={<HRAttendancePage />} />
          <Route path="attendance/monthly" element={<HRAttendancePage />} />

          <Route path="leave/requests" element={<HRLeaveRequests />} />

          <Route path="masters/departments" element={<DepartmentMaster />} />

          <Route path="/hr/dashboard/wellness" element={<WellnessHr />} />
          <Route path="/hr/dashboard/clubs" element={<Corporateclubshr />} />

          <Route path="retention-plan" element={<RetentionPlan role="hr" />} />

          <Route path="masters/sop" element={<SOPManagement />} />
          <Route path="policies/quiz" element={<PolicyQuizManagementPage />} />


          <Route path="feedback/setup" element={<FeedbackCycleSetup />} />
          <Route path="feedback/nominations" element={<FeedbackNominations />} />
          <Route path="feedback/submissions" element={<FeedbackSubmissions />} />
          <Route path="feedback/manager-feedback" element={<HrManagerFeedback />} />
          <Route path="/hr/dashboard/feedback/reports" element={<FeedbackReports />} />

          <Route path="performance/kpi-templates" element={<KpiTemplates />} />
          <Route path="performance/assign-kpi" element={<AssignKpi />} />
          <Route path="performance/reviews" element={<PerformanceReviews />} />
          <Route path="performance/reports" element={<PerformanceReports />} />
          <Route path="performance/okr-dashboard" element={<OkrDashboard />} />
          <Route path="performance/okr-setup" element={<OkrSetup />} />
          <Route path="performance/variable-pay" element={<VariablePayDashboard />} />
          <Route path="performance/esop" element={<EsopDashboard />} />

          <Route path="incentives/plans" element={<IncentivePlans />} />
          <Route path="incentives/assign" element={<IncentiveAssign />} />
          <Route path="incentives/results" element={<IncentiveResults />} />

          <Route path="/hr/dashboard/appraisal" element={<AppraisalHub />} />

          <Route path="grading/grade-master" element={<GradeMaster />} />
          <Route path="grading/assign-grade" element={<AssignGrade />} />
          <Route path="grading/grade-reports" element={<GradeReports />} />

          <Route path="settings" element={<HrSettings />} />
          <Route path="notifications" element={<HrNotifications />} />

          <Route path="recognition/awards" element={<AwardsDashboard />} />
          <Route path="recognition/impact-bonus" element={<ImpactBonusDashboard />} />
          <Route path="recognition/engagement-calendar" element={<EngagementCalendar />} />

          <Route path="leadership-track" element={<HrLeadershipTrack />} />
          <Route path="alumni-network" element={<AlumniNetwork />} />

          <Route path="/hr/dashboard/training" element={<TrainingRoadmapHR />} />


          <Route path="performance/kpi-templates" element={<KpiTemplates />} />
          <Route path="performance/assign-kpi" element={<AssignKpi />} />
          <Route path="performance/reviews" element={<PerformanceReviews />} />
          <Route path="performance/reports" element={<PerformanceReports />} />

          <Route path="policies" element={<PolicyManagement />} />

        </Route>
        {/* ADMIN */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="applicants" element={<ApplicantList />} />
          <Route path="partners" element={<PartnerList />} />
          <Route path="leads" element={<LeadList />} />
          <Route path="advance-records" element={<AdvanceRecords />} />
          <Route path="courses" element={<CourseManagement />} />
          <Route path="settings" element={<SystemSettings />} />
          <Route path="updates" element={<AdminUpdates />} />
          <Route
            path="radnus-connect/shop-owners"
            element={<ShopOwnerList />}
          />
          <Route
            path="radnus-connect/technicians"
            element={<TechnicianList />}
          />
        </Route>

        {/* CHANNEL */}
        <Route path="/channel" element={<ChannelDashboard />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardOverview />} />
          <Route path="add-lead" element={<AddLead />} />
          <Route path="leads" element={<MyLeads />} />
          <Route path="courses" element={<Courses />} />
          <Route path="course/:id" element={<CourseDetail />} />
          <Route path="profile" element={<PartnerProfile />} />
        </Route>

        {/* RADNUS CONNECT */}
        <Route path="/radnus-connect" element={<RadnusConnectHome />} />
        <Route path="/radnus-connect/technician" element={<TechnicianForm />} />
        <Route path="/radnus-connect/shop-owner" element={<ShopOwnerForm />} />
      </Routes>

      {!hideHeaderFooter && <RadnusFooter />}
    </>
  );
}

export default App;
