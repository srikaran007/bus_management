import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { getCurrentUser } from "../services/sessionService";

function DashboardLayout() {
  const { pathname } = useLocation();
  const routeRoot = pathname.split("/")[1];
  const expectedRole = routeRoot === "buses" ? "admin" : routeRoot;
  const protectedRoles = ["admin", "transport", "staff", "driver", "student"];

  if (protectedRoles.includes(expectedRole)) {
    const user = getCurrentUser();
    const token = localStorage.getItem("accessToken");
    const hasValidToken = Boolean(token && token !== "undefined" && token !== "null");

    if (!hasValidToken || !user || user.role !== expectedRole) {
      return <Navigate to={`/auth/${expectedRole}`} replace />;
    }
  }

  return (
    <div>
      <Navbar />
      <div className="layout-body">
        <Sidebar />
        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
