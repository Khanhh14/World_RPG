const mysql = require("mysql2");
const path = require("node:path");

// Luôn đọc backend/.env, không phụ thuộc nơi chạy terminal.
require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const db = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "tiny_rpg",

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,

  charset: "utf8mb4",
  supportBigNumbers: true,
  bigNumberStrings: true,
}).promise();

// Chỉ kiểm tra khi chạy trực tiếp file database.js.
async function testConnection() {
  try {
    const connection = await db.getConnection();

    try {
      await connection.ping();
      console.log("Kết nối MySQL thành công!");
      console.log("Database:", process.env.DB_NAME || "tiny_rpg");
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Kết nối MySQL thất bại:", error.code);
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    // Đóng pool khi kết thúc bài kiểm tra.
    await db.end();
  }
}

if (require.main === module) {
  testConnection();
}

module.exports = db;