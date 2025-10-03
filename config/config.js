require("dotenv").config();

module.exports = {
  development: {
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "air_pollution_tracker",
    host: process.env.DB_HOST || "localhost",
    dialect: "postgres",
    logging: false
  },

  test: {
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "air_pollution_tracker_test",
    host: process.env.DB_HOST || "localhost",
    dialect: "postgres",
    logging: false
  },

  production: {
    username: process.env.DB_USER,       // "pollutiondb_user"
    password: process.env.DB_PASSWORD,   // Render password
    database: process.env.DB_NAME,       // "pollutiondb"
    host: process.env.DB_HOST,           // "dpg-d3fjdfr119vc73dt6780-a"
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};