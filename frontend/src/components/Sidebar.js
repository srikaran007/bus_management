import React from "react";
import { Link, useLocation } from "react-router-dom";

const sidebarLinksByRole = {
  admin: [
    { to: "/admin/dashboard", label: "Dashboard" },
    { to: "/admin/manage-buses", label: "Manage Buses" },
    { to: "/admin/manage-drivers", label: "Manage Drivers" },
    { to: "/admin/manage-routes", label: "Manage Routes" },
    { to: "/admin/student-bus-allocation", label: "Student Bus Allocation" },
    { to: "/admin/bus-entry-exit-monitoring", label: "Bus Entry / Exit Monitoring" },
    {
      to: "/admin/staff-transport-incharge-management",
      label: "Staff / Transport Incharge Mgmt"
    },
    { to: "/admin/reports", label: "Reports" },
    { to: "/admin/driver-smart-scheduler", label: "Driver ML Scheduler" }
  ],
  transport: [
    { to: "/transport/dashboard", label: "Dashboard" },
    { to: "/transport/entry-exit", label: "Entry / Exit" },
    { to: "/transport/bus-status", label: "Bus Status" },
    { to: "/transport/driver-attendance", label: "Driver Attendance" },
    { to: "/transport/driver-smart-scheduler", label: "Driver ML Scheduler" },
    { to: "/transport/bus-incharge-assignment", label: "Bus Incharge Assignment" }
  ],
  driver: [
    { to: "/driver/dashboard", label: "Dashboard" },
    { to: "/driver/profile", label: "Driver Profile" },
    { to: "/driver/attendance", label: "Attendance" },
    { to: "/driver/entry-exit", label: "Entry / Exit" },
    { to: "/driver/assigned-bus", label: "Assigned Bus" },
    { to: "/driver/route-details", label: "Route Details" },
    { to: "/", label: "Logout" }
  ],
  staff: [
    { to: "/staff/dashboard", label: "Dashboard" },
    { to: "/staff/student-bus-list", label: "Students Bus List" },
    { to: "/staff/view-routes", label: "Routes" },
    { to: "/staff/student-attendance", label: "Attendance" },
    { to: "/", label: "Logout" }
  ],
  student: [
    { to: "/student/dashboard", label: "Dashboard" },
    { to: "/student/my-bus", label: "My Bus" },
    { to: "/student/route-details", label: "Route Details" },
    { to: "/student/driver-details", label: "Driver Details" },
    { to: "/student/bus-incharge-details", label: "Bus Incharge Details" }
  ]
};

function Sidebar({ className = "", onNavigate = null }) {
  const { pathname } = useLocation();
  const pathRoot = pathname.split("/")[1];
  const currentRole = pathRoot === "buses" ? "admin" : pathRoot;
  const links = sidebarLinksByRole[currentRole] || [];
  const sidebarClassName = className ? `sidebar ${className}` : "sidebar";

  return (
    <aside className={sidebarClassName}>
      {links.map((link) => (
        <Link key={link.to} to={link.to} onClick={onNavigate}>
          {link.label}
        </Link>
      ))}
    </aside>
  );
}

export default Sidebar;
