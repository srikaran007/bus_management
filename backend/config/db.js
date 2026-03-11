const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || "bus_management",
  process.env.MYSQL_USER || "root",
  process.env.MYSQL_PASSWORD || "",
  {
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    dialect: "mysql",
    logging: false
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();

    if (String(process.env.DB_SYNC || "true").toLowerCase() === "true") {
      await sequelize.sync();
      console.log("Tables synced");
    }

    console.log("MySQL connected");
  } catch (error) {
    console.error("MySQL connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
