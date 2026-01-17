const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
//add 8-4
const { AccessToken } = require("livekit-server-sdk");
const apiKey = "devkey";
const apiSecret = "devsecret";

const mongoose = require("mongoose");
const { setupSocket } = require("./socketIO/socket");
//Import routes
const userRoutes = require("./routes/user.route");
const friendRoutes = require("./routes/friend.route");
const postRoutes = require("./routes/post.route");
const groupRoutes = require("./routes/group.route");
const chatRoutes = require("./routes/userMessage.route");
const notificationRoutes = require("./routes/notification.route");
const adminRoutes = require("./routes/admin.route");
const chatbotRoutes = require("./routes/chatbot.route");
const locationRoutes = require("./routes/location.route");
const groupMessageRoute = require("./routes/groupMessage.route");
const googleAuthRoute = require("./routes/googleAuth.route");
const neo4jRecommendRoutes = require("./routes/neo4jRecommend.route");

dotenv.config();
const app = express();
const server = http.createServer(app);

//Cors config
const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true, // Cho phép cookie
};
app.use(cors(corsOptions));
// Kết nối tới MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("MongoDB connection error:", error));

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;

app.use(express.json()); // Xử lý dữ liệu JSON từ raw
app.use(express.urlencoded({ extended: true })); // Xử lý dữ liệu từ form-data

// Routes cơ bản
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
app.use("/api/users", userRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/recommnend", neo4jRecommendRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/groupmessage", groupMessageRoute);
app.use("/api/google", googleAuthRoute);
// Socket.io event handling
app.get("/getToken", (req, res) => {
  const { identity, room } = req.query;

  const at = new AccessToken(apiKey, apiSecret, {
    identity,
  });

  at.addGrant({ roomJoin: true, room });

  res.json({ token: at.toJwt() });
});
// Initialize socket.io
setupSocket(server);
// Khởi động server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
