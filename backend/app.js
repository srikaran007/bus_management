const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");

const swaggerSpec = require("./config/swagger");
const authRoutes = require("./routes/authRoutes");
const busRoutes = require("./routes/busRoutes");
const driverRoutes = require("./routes/driverRoutes");
const studentRoutes = require("./routes/studentRoutes");
const routeRoutes = require("./routes/routeRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const auditRoutes = require("./routes/auditRoutes");
const mlRoutes = require("./routes/mlRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { attachRequestId } = require("./middleware/requestContextMiddleware");
const { auditLogger } = require("./middleware/auditMiddleware");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS origin not allowed"));
    }
  })
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false
  })
);
app.use(express.json());
app.use(attachRequestId);
app.use(auditLogger);

app.get("/", (_req, res) => {
  res.json({ message: "Bus Management Backend Running" });
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/auth", authRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/ml", mlRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
