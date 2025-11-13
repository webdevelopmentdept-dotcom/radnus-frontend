import RadnusAbout from "./components/RadnusAbout";
import RadnusFooter from "./components/shared/RadnusFooter";
import RadnusHome from "./components/RadnusHome";
import RadnusNavbar from "./components/shared/RadnusNavbar";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Career from "./components/Career";
import CareerDetail from "./components/shared/CareerDetail";
import "./App.css";
import WhiteLabelPage from "./components/Services/WhiteLabelPage";
import RadnusAcademy from "./components/Services/RadnusAcademy";
import ToolsTech from "./components/Services/ToolstTech";
import Accessories from "./components/Services/Accessories";
import Service from "./components/Services/Services";
import Placement from "./components/Services/Placement";
import Timeline from "./components/Services/Timeline";
import Startup from "./components/Services/Startup";
import Login from "./components/Login";
import ScrollToTop from "./components/ScrollToTop";
import ThankYou from "./ThankYou";
function App() {
  // ✅ Job data with posted dates
  const jobsData = [
    {
      title: "Business Development Associate / Executive",
      type: "Business Development & Sales",
      duration: "Full-time, Permanent",
      experience: "0-1 Years",
      posted: "2025-10-27",
    },
    {
      title: "System Administrator",
      type: "IT & Infrastructure",
      duration: "Full-time, Permanent",
      experience: "0-1 Years",
      posted: "2025-10-25",
    },
    {
      title: "Digital Marketing Specialist",
      type: "Sales & Marketing",
      duration: "Full-time, Permanent",
      experience: "0-1 Years",
      posted: "2025-10-26",
    },
  ];

  return (
    <>
      <ScrollToTop />
      <RadnusNavbar />
      <Routes>
        <Route path="/" element={<RadnusHome />} />
        <Route path="/about" element={<RadnusAbout />} />
        <Route path="/academy" element={<RadnusAcademy />} />
        <Route path="/thank-you" element={<ThankYou />} />
        <Route path="/whitelabel" element={<WhiteLabelPage />} />{" "}
        <Route path="/careers" element={<Career jobsData={jobsData} />} />
        <Route
          path="/careers/:jobTitle"
          element={<CareerDetail jobsData={jobsData} />}
        />
        <Route path="/tools-tech" element={<ToolsTech />} />
        <Route path="/accessories" element={<Accessories />} />
        <Route path="/service" element={<Service />} />
        <Route path="/placement" element={<Placement />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/startup" element={<Startup />} />
        <Route path="/login" element={<Login />} />
      </Routes>

      <RadnusFooter />
    </>
  );
}

export default App;
