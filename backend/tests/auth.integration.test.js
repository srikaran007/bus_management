const request = require("supertest");
const app = require("../app");
const { sequelize } = require("../config/db");
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

describe("Auth API", () => {
  test("admin can register and user can login", async () => {
    const { token: adminToken } = await createUserWithToken({
      name: "Main Admin",
      email: "mainadmin@test.com",
      role: "admin"
    });

    const registerRes = await request(app)
      .post("/api/auth/register")
      .set(authHeader(adminToken))
      .send({
        name: "Admin User",
        email: "admin@test.com",
        password: "Admin@123",
        role: "admin",
        phone: "9876543210"
      });

    expect(registerRes.statusCode).toBe(201);
    expect(registerRes.body.accessToken).toBeTruthy();

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "admin@test.com",
      password: "Admin@123"
    });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.accessToken).toBeTruthy();
    expect(loginRes.body.refreshToken).toBeTruthy();
  });

  test("non-admin cannot register", async () => {
    const { token } = await createUserWithToken({
      role: "staff",
      email: "staff@test.com"
    });

    const response = await request(app)
      .post("/api/auth/register")
      .set(authHeader(token))
      .send({
        name: "No Access",
        email: "noaccess@test.com",
        password: "Pass@123",
        role: "student"
      });

    expect(response.statusCode).toBe(403);
  });
});
