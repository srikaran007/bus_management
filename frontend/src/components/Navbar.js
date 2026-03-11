import React from "react";
import { Link, useLocation } from "react-router-dom";

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

  return (
    <nav className="navbar">
      <h2>Bus Management</h2>
      <div className="navbar-links">
        {currentRoleConfig ? (
          <Link to={currentRoleConfig.dashboardPath}>{currentRoleConfig.label}</Link>
        ) : null}
      </div>
    </nav>
  );
}

export default Navbar;
