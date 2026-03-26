import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { getCurrentUser } from "../services/sessionService";

function DashboardLayout() {
  const { pathname } = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const routeRoot = pathname.split("/")[1];
  const expectedRole = routeRoot === "buses" ? "admin" : routeRoot;
  const protectedRoles = ["admin", "transport", "staff", "driver", "student"];

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  if (protectedRoles.includes(expectedRole)) {
    const user = getCurrentUser();
    const token = localStorage.getItem("accessToken");
    const hasValidToken = Boolean(token && token !== "undefined" && token !== "null");

    if (!hasValidToken || !user || user.role !== expectedRole) {
      return <Navigate to={`/auth/${expectedRole}`} replace />;
    }
  }

  const user = getCurrentUser();
  const institution = user?.role === "admin" ? "All Institutions" : user?.institution || "Institution Not Set";

  return (
    <div className="app-shell">
      <Navbar />
      <div className="layout-body">
        <button
          type="button"
          className="mobile-sidebar-toggle"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
          aria-expanded={isSidebarOpen}
        >
          {isSidebarOpen ? "Close Menu" : "Open Menu"}
        </button>
        <Sidebar className={isSidebarOpen ? "sidebar-open" : ""} onNavigate={() => setIsSidebarOpen(false)} />
        {isSidebarOpen ? (
          <button
            type="button"
            className="sidebar-overlay"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close menu overlay"
          />
        ) : null}
        <main className="layout-content">
          <section className="institution-banner">
            <p>
              <strong>Institution:</strong> {institution}
            </p>
          </section>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;

