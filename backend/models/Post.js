const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  // image: { type: String },
  images: [
    {
      url: { type: String },
      type: { type: String, enum: ["image", "video"], default: "image" },
    },
  ],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      comment: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  visibility: {
    type: String,
    enum: ["public", "private", "friends", "group"],
    default: "public",
  },
  location: { type: String, default: "" },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" }, // ID nhóm (nếu là bài đăng trong nhóm),
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Post", postSchema);
// models/Post.js

// const mongoose = require("mongoose");

// const FileSchema = new mongoose.Schema({
//   url: { type: String, required: true },
//   type: { type: String, enum: ["image", "video"], required: true },
// });

// const CoordinateSchema = new mongoose.Schema({
//   lat: { type: Number },
//   lng: { type: Number },
// });

// const EmotionSchema = new mongoose.Schema({
//   label: { type: String },
//   value: { type: String },
//   icon: { type: String },
// });

// const PostSchema = new mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User", // hoặc tùy chỉnh nếu bạn dùng collection tên khác
//     required: true,
//   },
//   content: { type: String, default: "" },
//   // files: [FileSchema],
//   files: [
//     {
//       url: { type: String, required: true },
//       type: { type: String, enum: ["image", "video"], required: true },
//     },
//   ],
//   location: { type: String, default: "" },
//   coordinates: CoordinateSchema,
//   privacy: {
//     type: String,
//     enum: ["public", "private", "friends"],
//     default: "public",
//   },
//   emotion: EmotionSchema,
//   timestamp: { type: Date, default: Date.now },
//   reactions: {
//     like: { type: Number, default: 0 },
//     love: { type: Number, default: 0 },
//     dislike: { type: Number, default: 0 },
//     wow: { type: Number, default: 0 },
//     perfect: { type: Number, default: 0 },
//   },
//   commentsCount: { type: Number, default: 0 },
// });

// module.exports = mongoose.model("Post", PostSchema);
