import React from "react";
import { Link, useLocation } from "react-router-dom";
import { getCurrentUser } from "../services/sessionService";

const roleConfig = {
  admin: { label: "Admin", dashboardPath: "/admin/dashboard" },
  transport: { label: "Transport", dashboardPath: "/transport/dashboard" },
  driver: { label: "Driver", dashboardPath: "/driver/dashboard" },
  staff: { label: "Staff", dashboardPath: "/staff/dashboard" },
  student: { label: "Student", dashboardPath: "/student/dashboard" },
};

function Navbar() {
  const { pathname } = useLocation();
  const currentRole = pathname.split("/")[1];
  const currentRoleConfig = roleConfig[currentRole];
  const user = getCurrentUser();
  const institution = user?.institution || "Institution Not Set";

  return (
    <nav className="navbar">
      <div className="navbar-title-wrap">
        <h2>Bus Management</h2>
        <p className="navbar-institution">{institution}</p>
      </div>
      <div className="navbar-links navbar-meta-links">
        {currentRoleConfig ? (
          <Link to={currentRoleConfig.dashboardPath}>{currentRoleConfig.label}</Link>
        ) : null}
      </div>
    </nav>
  );
}

export default Navbar;
