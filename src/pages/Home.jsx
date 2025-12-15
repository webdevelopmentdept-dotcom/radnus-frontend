// src/pages/Home.jsx
import RadnusNavbar from "../components/shared/RadnusNavbar";
import RadnusAbout from "../components/RadnusAbout";
import RadnusFooter from "../components/shared/RadnusFooter";
import RadnusHome from "../components/RadnusHome";

function Home() {
  return (
    <>
    <RadnusNavbar/>
    <RadnusHome/>
    <RadnusAbout/>
    <RadnusFooter/>
      {/* Add more sections later: Services, About, Footer */}
    </>
  );
}

export default Home;
