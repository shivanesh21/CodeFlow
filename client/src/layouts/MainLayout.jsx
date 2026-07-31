import Navbar from "../components/Navbar/Navbar";
import Sidebar from "../components/Sidebar/Sidebar";
import "./MainLayout.css";

function MainLayout({ children }) {
  return (
    <div className="main-layout">
      <Navbar />

      <div className="layout-body">
        <Sidebar />

        <main className="layout-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;