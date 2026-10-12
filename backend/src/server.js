const path = require("node:path");

// Đọc backend/.env trước khi nạp app và database.
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const app = require("./app");
const db = require("./config/database");

const PORT = Number(process.env.PORT || 3001);
const HOST = process.env.HOST || "127.0.0.1";

let server;
let shuttingDown = false;

async function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  // Tránh chờ vô thời hạn khi có kết nối chưa đóng.
  const timeout = setTimeout(() => {
    process.exit(1);
  }, 10000);
  timeout.unref();

  try {
    if (server?.listening) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }

    await db.end();
    process.exitCode = exitCode;
  } catch (error) {
    console.error("Lỗi khi đóng server:", error.message);
    process.exitCode = 1;
  } finally {
    clearTimeout(timeout);
  }
}

async function startServer() {
  try {
    if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
      throw new Error("PORT phải là số nguyên từ 1 đến 65535.");
    }

    // Chỉ mở server khi kết nối MySQL thành công.
    await db.execute("SELECT 1");
    console.log("Kết nối MySQL thành công!");

    server = app.listen(PORT, HOST);

    server.once("listening", () => {
      console.log(`Backend đang chạy: http://${HOST}:${PORT}`);
      console.log(`Kiểm tra MySQL: http://${HOST}:${PORT}/api/health`);
      console.log("Nhấn Ctrl + C để dừng.");
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Cổng ${PORT} đang được sử dụng.`);
      } else {
        console.error("Không thể mở server:", error.message);
      }

      void shutdown(1);
    });
  } catch (error) {
    console.error(
      "Khởi động backend thất bại:",
      error.code || "",
      error.message
    );

    await shutdown(1);
  }
}

process.on("SIGINT", () => {
  console.log("\nĐang dừng backend...");
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});

void startServer();