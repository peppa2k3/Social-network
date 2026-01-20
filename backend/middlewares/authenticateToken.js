const jwt = require("jsonwebtoken");

// Middleware để xác thực người dùng từ token
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res
      .status(403)
      .json({ message: "Access denied, no token provided" });
  }

  // Loại bỏ tiền tố 'Bearer ' trong token
  const tokenWithoutBearer = token.startsWith("Bearer ")
    ? token.slice(7)
    : token;

  // Xử lý token - lấy token từ header
  jwt.verify(
    tokenWithoutBearer,
    process.env.JWT_SECRET || "social_secret_2026",
    async (err, decoded) => {
      if (err) {
        return res
          .status(401)
          .json({ message: "Invalid or expired token", tokenWithoutBearer });
      }

      // Token hợp lệ, gán userId vào request
      req.userId = decoded.id; // Lưu userId từ decoded token vào req

      next(); // Chuyển tiếp đến route handler
    },
  );
};

module.exports = authenticateToken;
