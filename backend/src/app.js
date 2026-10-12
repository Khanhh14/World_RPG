const express = require("express");
const db = require("./config/database");

const app = express();

app.disable("x-powered-by");

// Đọc dữ liệu JSON gửi từ frontend.
app.use(express.json({ limit: "100kb" }));

// Kiểm tra server.
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend Tiny RPG đang hoạt động!",
  });
});

// Kiểm tra kết nối MySQL.
app.get("/api/health", async (req, res) => {
  res.set("Cache-Control", "no-store");

  try {
    await db.execute("SELECT 1");

    res.json({
      success: true,
      server: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error("Lỗi kiểm tra MySQL:", error.code);

    res.status(503).json({
      success: false,
      server: "ok",
      database: "disconnected",
    });
  }
});

// Gắn các routes đăng nhập, nhân vật... tại đây
// sau khi các file routes đã có code.

// Đường dẫn không tồn tại.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API không tồn tại.",
  });
});

// Xử lý lỗi chung.
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Dữ liệu JSON không hợp lệ.",
    });
  }

  if (error.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Dữ liệu gửi lên quá lớn.",
    });
  }

  console.error("Lỗi server:", error);

  res.status(500).json({
    success: false,
    message: "Có lỗi xảy ra trên server.",
  });
});

module.exports = app;