const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Bus Management API",
      version: "1.0.0",
      description: "Backend API for Bus Management System"
    },
    servers: [{ url: "http://localhost:5000" }]
  },
  apis: ["./routes/*.js"]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
