const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema({
//   username: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   avatar: { type: String },
//   dateOfBirth: { type: Date },
//   phone: { type: String }, // Thuộc tính ngày sinh
//   gender: { type: String, enum: ["male", "female", "other"] }, // Thuộc tính giới tính
//   role: { type: String, enum: ["admin", "user"], default: "user" }, // Thuộc tính vai trò (admin/user)
// });
const userSchema = new mongoose.Schema({
  username: { type: String }, // Không required vì Google user có thể không có
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Không required, vì Google user không có password
  avatar: { type: String },
  dateOfBirth: { type: Date },
  phone: { type: String },
  gender: { type: String, enum: ["male", "female", "other"] },
  role: { type: String, enum: ["admin", "user"], default: "user" },
  authType: { type: String, enum: ["local", "google"], default: "local" }, // để phân biệt user Google
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
