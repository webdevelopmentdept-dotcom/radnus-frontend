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
function App() {
  // ✅ Job data with posted dates
  const jobsData = [
    {
      title: "Graphic Designer",
      type: "Design & Creative",
      duration: "Full-Time",
      salary: "₹25,000 – ₹35,000 / month",
      experience: "1–3 Years",
      posted: "2023-10-01",
    },
    {
      title: "Digital Marketing Executive",
      type: "Sales & Marketing",
      duration: "Full-Time",
      salary: "₹20,000 – ₹30,000 / month",
      experience: "1–3 Years",
      posted: "2024-02-12",
    },
    {
      title: "Customer Support Executive",
      type: "Customer Support / Telecalling",
      duration: "Full-Time",
      salary: "₹18,000 – ₹25,000 / month",
      experience: "Fresher",
      posted: "2024-06-01",
    },
    {
      title: "Software Developer",
      type: "Software & Web Development",
      duration: "Internship",
      salary: "₹10,000 / month",
      experience: "Fresher",
      posted: "2024-09-10",
    },
    {
      title: "Digital Marketing Intern",
      type: "Sales & Marketing",
      duration: "Internship",
      salary: "₹10,000 / month",
      experience: "Fresher",
      posted: "2024-08-01",
    },
    {
      title: "HR Executive",
      type: "Human Resources",
      duration: "Full-Time",
      salary: "₹25,000 – ₹40,000 / month",
      experience: "1–3 Years",
      posted: "2023-05-15",
    },
    {
      title: "Business Development Associate",
      type: "Business Development",
      duration: "Full-Time",
      salary: "₹20,000 – ₹35,000 / month",
      experience: "1–3 Years",
      posted: "2022-09-20",
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
