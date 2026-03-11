import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";

import Login from "../modules/auth/Login";
import AdminLogin from "../modules/auth/AdminLogin";
import StaffLogin from "../modules/auth/StaffLogin";
import TransportLogin from "../modules/auth/TransportLogin";
import DriverLogin from "../modules/auth/DriverLogin";
import StudentLogin from "../modules/auth/StudentLogin";

import AdminDashboard from "../modules/admin/AdminDashboard";
import ManageBuses from "../modules/admin/ManageBuses";
import ManageDrivers from "../modules/admin/ManageDrivers";
import ManageRoutes from "../modules/admin/ManageRoutes";
import Reports from "../modules/admin/Reports";
import StudentBusAllocation from "../modules/admin/StudentBusAllocation";
import BusEntryExitMonitoring from "../modules/admin/BusEntryExitMonitoring";
import StaffTransportInchargeManagement from "../modules/admin/StaffTransportInchargeManagement";

import TransportDashboard from "../modules/transportincharge/TransportinchargeDashboard";
import EntryExit from "../modules/transportincharge/EntryExit";
import BusStatus from "../modules/transportincharge/BusStatus";
import DriverAttendance from "../modules/transportincharge/DriverAttendance";

import StaffDashboard from "../modules/staff/StaffDashboard";
import ViewRoutes from "../modules/staff/ViewRoutes";
import StudentBusList from "../modules/staff/StudentBusList";
import StudentAttendance from "../modules/staff/StudentAttendance";

import StudentDashboard from "../modules/student/StudentDashboard";
import MyBus from "../modules/student/MyBus";
import RouteDetails from "../modules/student/RouteDetails";
import DriverDetails from "../modules/student/DriverDetails";
import BusInchargeDetails from "../modules/student/BusInchargeDetails";

import BusList from "../modules/buses/BusList";
import AddBus from "../modules/buses/AddBus";
import EditBus from "../modules/buses/EditBus";

import DriverDashboard from "../modules/drivers/DriverDashboard";
import DriverProfile from "../modules/drivers/DriverProfile";
import DriverAttendanceSelf from "../modules/drivers/DriverAttendance";
import BusEntryExit from "../modules/drivers/BusEntryExit";
import AssignedBus from "../modules/drivers/AssignedBus";
import DriverRouteDetails from "../modules/drivers/RouteDetails";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/auth/admin" element={<AdminLogin />} />
      <Route path="/auth/staff" element={<StaffLogin />} />
      <Route path="/auth/transport" element={<TransportLogin />} />
      <Route path="/auth/driver" element={<DriverLogin />} />
      <Route path="/auth/student" element={<StudentLogin />} />

      <Route element={<DashboardLayout />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/manage-buses" element={<ManageBuses />} />
        <Route path="/admin/manage-drivers" element={<ManageDrivers />} />
        <Route path="/admin/manage-routes" element={<ManageRoutes />} />
        <Route path="/admin/student-bus-allocation" element={<StudentBusAllocation />} />
        <Route path="/admin/bus-entry-exit-monitoring" element={<BusEntryExitMonitoring />} />
        <Route
          path="/admin/staff-transport-incharge-management"
          element={<StaffTransportInchargeManagement />}
        />
        <Route path="/admin/reports" element={<Reports />} />

        <Route path="/transport/dashboard" element={<TransportDashboard />} />
        <Route path="/transport/entry-exit" element={<EntryExit />} />
        <Route path="/transport/bus-status" element={<BusStatus />} />
        <Route path="/transport/driver-attendance" element={<DriverAttendance />} />

        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        <Route path="/staff/view-routes" element={<ViewRoutes />} />
        <Route path="/staff/student-bus-list" element={<StudentBusList />} />
        <Route path="/staff/student-attendance" element={<StudentAttendance />} />

        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/my-bus" element={<MyBus />} />
        <Route path="/student/route-details" element={<RouteDetails />} />
        <Route path="/student/driver-details" element={<DriverDetails />} />
        <Route path="/student/bus-incharge-details" element={<BusInchargeDetails />} />

        <Route path="/driver/dashboard" element={<DriverDashboard />} />
        <Route path="/driver/profile" element={<DriverProfile />} />
        <Route path="/driver/attendance" element={<DriverAttendanceSelf />} />
        <Route path="/driver/entry-exit" element={<BusEntryExit />} />
        <Route path="/driver/assigned-bus" element={<AssignedBus />} />
        <Route path="/driver/route-details" element={<DriverRouteDetails />} />

        <Route path="/buses/list" element={<BusList />} />
        <Route path="/buses/add" element={<AddBus />} />
        <Route path="/admin/add-bus" element={<AddBus />} />
        <Route path="/buses/edit" element={<EditBus />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
