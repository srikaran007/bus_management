const request = require("supertest");
const app = require("../app");
const { sequelize } = require("../config/db");
const Student = require("../models/Student");
const { createUserWithToken, authHeader } = require("./testHelpers");

beforeAll(async () => {
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

afterEach(async () => {
  await sequelize.truncate({ cascade: true, restartIdentity: true });
});

describe("Module APIs", () => {
  test("bus endpoints support RBAC + pagination", async () => {
    const { token: adminToken } = await createUserWithToken({ role: "admin", email: "busadmin@test.com" });
    const { token: staffToken } = await createUserWithToken({ role: "staff", email: "busstaff@test.com" });

    const createRes = await request(app)
      .post("/api/buses")
      .set(authHeader(adminToken))
      .send({
        busNumber: "TN-45-BM-501",
        busName: "Campus Prime",
        capacity: 50,
        routeName: "North Loop",
        status: "Active"
      });
    expect(createRes.statusCode).toBe(201);

    const forbiddenCreate = await request(app)
      .post("/api/buses")
      .set(authHeader(staffToken))
      .send({
        busNumber: "TN-45-BM-502",
        busName: "Campus Next",
        capacity: 48
      });
    expect(forbiddenCreate.statusCode).toBe(403);

    const listRes = await request(app)
      .get("/api/buses?page=1&limit=5&search=TN-45-BM")
      .set(authHeader(adminToken));
    expect(listRes.statusCode).toBe(200);
    expect(Array.isArray(listRes.body.items)).toBe(true);
    expect(listRes.body.pagination.total).toBeGreaterThanOrEqual(1);
  });

  test("driver endpoints support RBAC + pagination", async () => {
    const { token: adminToken } = await createUserWithToken({ role: "admin", email: "driveradmin@test.com" });
    const { token: studentToken } = await createUserWithToken({ role: "student", email: "driverstudent@test.com" });

    const createRes = await request(app)
      .post("/api/drivers")
      .set(authHeader(adminToken))
      .send({
        driverName: "Ravi",
        driverId: "DRV-501",
        phone: "9876543210",
        licenseNumber: "LIC-501",
        status: "Active"
      });
    expect(createRes.statusCode).toBe(201);

    const forbidden = await request(app)
      .post("/api/drivers")
      .set(authHeader(studentToken))
      .send({
        driverName: "No Access",
        driverId: "DRV-999",
        phone: "9999999999",
        licenseNumber: "LIC-999"
      });
    expect(forbidden.statusCode).toBe(403);

    const listRes = await request(app)
      .get("/api/drivers?page=1&limit=5&search=DRV")
      .set(authHeader(adminToken));
    expect(listRes.statusCode).toBe(200);
    expect(Array.isArray(listRes.body.items)).toBe(true);
    expect(listRes.body.pagination.page).toBe(1);
  });

  test("route endpoints support CRUD + pagination", async () => {
    const { token: adminToken } = await createUserWithToken({ role: "admin", email: "routeadmin@test.com" });
    const { token: staffToken } = await createUserWithToken({ role: "staff", email: "routestaff@test.com" });

    const createRes = await request(app)
      .post("/api/routes")
      .set(authHeader(adminToken))
      .send({
        routeId: "R-100",
        routeName: "College Loop",
        startingPoint: "Theni",
        endingPoint: "College",
        stops: ["Theni", "Andipatti", "College"]
      });
    expect(createRes.statusCode).toBe(201);

    const forbiddenDelete = await request(app)
      .delete(`/api/routes/${createRes.body.id}`)
      .set(authHeader(staffToken));
    expect(forbiddenDelete.statusCode).toBe(403);

    const listRes = await request(app)
      .get("/api/routes?search=College&sort=routeName")
      .set(authHeader(adminToken));
    expect(listRes.statusCode).toBe(200);
    expect(Array.isArray(listRes.body.items)).toBe(true);
  });

  test("student endpoints enforce role access", async () => {
    const { user: adminUser } = await createUserWithToken({ role: "admin", email: "studentadmin@test.com" });
    const { user: staffUser, token: staffToken } = await createUserWithToken({ role: "staff", email: "studentstaff@test.com" });
    const { user: studentUser, token: studentToken } = await createUserWithToken({ role: "student", email: "std1@test.com" });
    const { user: anotherStudentUser } = await createUserWithToken({ role: "student", email: "std2@test.com" });

    expect(adminUser).toBeTruthy();
    expect(staffUser).toBeTruthy();

    const createRes = await request(app)
      .post("/api/students")
      .set(authHeader(staffToken))
      .send({
        studentName: "Karan",
        registerNumber: "REG-1001",
        department: "CSE",
        busNumber: "TN-45-BM-501",
        routeName: "North Loop",
        boardingPoint: "Theni Stop",
        user: String(studentUser.id)
      });
    expect(createRes.statusCode).toBe(201);

    const studentDoc = createRes.body;

    const studentListForbidden = await request(app).get("/api/students").set(authHeader(studentToken));
    expect(studentListForbidden.statusCode).toBe(403);

    const ownRecord = await request(app).get(`/api/students/${studentDoc.id}`).set(authHeader(studentToken));
    expect(ownRecord.statusCode).toBe(200);

    const myProfile = await request(app).get("/api/students/me").set(authHeader(studentToken));
    expect(myProfile.statusCode).toBe(200);

    await Student.create({
      studentName: "Other Student",
      registerNumber: "REG-2001",
      user: anotherStudentUser.id
    });
    const allStudents = await Student.findAll({ order: [["createdAt", "ASC"]] });
    const otherStudent = allStudents.find((entry) => String(entry.user) === String(anotherStudentUser.id));

    const othersRecord = await request(app).get(`/api/students/${otherStudent.id}`).set(authHeader(studentToken));
    expect(othersRecord.statusCode).toBe(403);
  });

  test("attendance and entry-exit enforce driver/staff workflow", async () => {
    const { token: driverToken } = await createUserWithToken({ role: "driver", email: "driveratt@test.com" });
    const { token: staffToken } = await createUserWithToken({ role: "staff", email: "staffatt@test.com" });
    const { token: transportToken } = await createUserWithToken({ role: "transport", email: "transportatt@test.com" });

    const driverAttendance = await request(app)
      .post("/api/attendance")
      .set(authHeader(driverToken))
      .send({
        date: new Date().toISOString(),
        attendanceType: "Morning",
        subjectType: "Driver",
        subjectId: "DRV-100",
        status: "Present"
      });
    expect(driverAttendance.statusCode).toBe(201);

    const invalidStaffPayload = await request(app)
      .post("/api/attendance")
      .set(authHeader(staffToken))
      .send({
        date: new Date().toISOString(),
        attendanceType: "Morning",
        subjectType: "Driver",
        subjectId: "DRV-100",
        status: "Present"
      });
    expect(invalidStaffPayload.statusCode).toBe(403);

    const validStaffAttendance = await request(app)
      .post("/api/attendance")
      .set(authHeader(staffToken))
      .send({
        date: new Date().toISOString(),
        attendanceType: "Evening",
        subjectType: "Student",
        subjectId: "REG-1001",
        status: "Present"
      });
    expect(validStaffAttendance.statusCode).toBe(201);

    const transportCannotMark = await request(app)
      .post("/api/attendance")
      .set(authHeader(transportToken))
      .send({
        date: new Date().toISOString(),
        attendanceType: "Morning",
        subjectType: "Student",
        subjectId: "REG-1001",
        status: "Present"
      });
    expect(transportCannotMark.statusCode).toBe(403);

    const entryLog = await request(app)
      .post("/api/attendance/entry-exit")
      .set(authHeader(driverToken))
      .send({
        busNumber: "TN45BM101",
        driverName: "Ravi",
        route: "Route 1",
        entryTime: new Date().toISOString()
      });
    expect(entryLog.statusCode).toBe(201);

    const transportCannotCreateEntry = await request(app)
      .post("/api/attendance/entry-exit")
      .set(authHeader(transportToken))
      .send({
        busNumber: "TN45BM101",
        driverName: "Ravi",
        route: "Route 1",
        entryTime: new Date().toISOString()
      });
    expect(transportCannotCreateEntry.statusCode).toBe(403);

    const listLogs = await request(app)
      .get("/api/attendance/entry-exit?page=1&limit=5")
      .set(authHeader(transportToken));
    expect(listLogs.statusCode).toBe(200);
    expect(Array.isArray(listLogs.body.items)).toBe(true);
  });

  test("audit logs endpoint is restricted and returns data", async () => {
    const { token: adminToken } = await createUserWithToken({ role: "admin", email: "auditadmin@test.com" });
    const { token: staffToken } = await createUserWithToken({ role: "staff", email: "auditstaff@test.com" });

    await request(app).get("/api/buses").set(authHeader(adminToken));

    const forbidden = await request(app).get("/api/audit").set(authHeader(staffToken));
    expect(forbidden.statusCode).toBe(403);

    const logs = await request(app).get("/api/audit?page=1&limit=10").set(authHeader(adminToken));
    expect(logs.statusCode).toBe(200);
    expect(Array.isArray(logs.body.items)).toBe(true);
  });
});
