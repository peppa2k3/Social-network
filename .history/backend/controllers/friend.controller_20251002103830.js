const Friendship = require("../models/Friendship");
const Notification = require("../models/Notification");
const User = require("../models/User"); // Thay thế bằng đường dẫn đúng tới file model User
const { createAndEmitNotification } = require("../socketIO/socket");
const {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  unfriend,
} = require("./neo4j/Neo4jFriendshipController");
const { createRelationship } = require("./neo4j/neo4jService");
const { createNotification } = require("./notification.controller");

// POST /api/friends/request
// exports.sendFriendRequest = async (req, res) => {
//   try {
//     const requesterId = req.userId; // ID người gửi yêu cầu
//     const { recipientId } = req.body;
//     // Kiểm tra nếu đã có yêu cầu kết bạn
//     const existingRequest = await Friendship.findOne({
//       requester: requesterId,
//       recipient: recipientId,
//     });

//     if (existingRequest) {
//       return res.status(400).json({ message: "Friend request already sent" });
//     }

//     const friendship = new Friendship({
//       requester: requesterId,
//       recipient: recipientId,
//       status: "pending",
//     });

//     await friendship.save();
//     res.status(201).json({ message: "Friend request sent" });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };
//neww api
exports.sendFriendRequest = async (req, res) => {
  try {
    const requesterId = req.userId; // ID người gửi yêu cầu
    const { recipientId } = req.body;

    // Kiểm tra nếu đã có yêu cầu kết bạn
    const existingRequest = await Friendship.findOne({
      requester: requesterId,
      recipient: recipientId,
    });

    if (existingRequest) {
      return res.status(400).json({ message: "Friend request already sent" });
    }
    await sendFriendRequest(requesterId, recipientId); // Gọi hàm gửi yêu cầu kết bạn trong Neo4j
    console.log("tạo lời kết bạn neo4j ok");
    // Tạo yêu cầu kết bạn
    const friendship = new Friendship({
      requester: requesterId,
      recipient: recipientId,
      status: "pending",
    });

    await friendship.save();
    console.log("tạo lời kết bạn monggoo ok");
    // // 👇 Tạo notification cho người nhận
    // const notification = new Notification({
    //   type: "friend_request",
    //   sender: requesterId,
    //   receiver: recipientId,
    //   note: "Bạn có một lời mời kết bạn mới",
    //   linkClick: `/friends/requests`, // 👉 link frontend (tuỳ chỉnh)
    // });
    //await notification.save(); // Lưu notification
    // Tạo notification nếu user like không phải là chủ post mongodb
    //  ["friend_request", "like_post", "comment_post", "friend_post"],
    if (recipientId.toString() !== requesterId.toString()) {
      const requester = await User.findById(requesterId);
      console.log("nhận  từ", requester);
      await createNotification({
        userId: recipientId, // Người nhận noti
        type: "friend_request",
        sender: {
          id: requesterId,
          username: requester.username,
          avatar: requester.avatar || "",
        },
        messageNote: `${requester.username} đã gửi lời mời kết bạn.`,
        linkClick: "/friends",
        // linkClick: `/profile/${requesterId}`,
      });
      // Tạo thông báo cho người tạo bài viết
      const emailOwnerPost = await User.findById(recipientId);
      console.log("socket emailOwnerPost", emailOwnerPost);
      await createAndEmitNotification({
        email: emailOwnerPost.email,
        payload: "sended friend request",
      });
    }

    res.status(201).json({ message: "Friend request sent" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
// POST /api/friends/accept
// exports.acceptFriendRequest = async (req, res) => {
//   try {
//     const { requesterId } = req.body;
//     const recipientId = req.userId;
//     console.log("Accept friedner request");
//     const friendship = await Friendship.findOneAndUpdate(
//       { requester: requesterId, recipient: recipientId, status: "pending" },
//       { status: "accepted" },
//       { new: true }
//     );
//     const neo4jCreateFriendRef = await createRelationship(
//       "User",
//       requesterId,
//       "User",
//       recipientId,
//       "FRIENDS_WITH"
//     );

//     if (!friendship) {
//       return res.status(404).json({ message: "Friend request not found" });
//     }

//     res.status(200).json({ message: "Friend request accepted" });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };
//new eccept
exports.acceptFriendRequest = async (req, res) => {
  try {
    const { requesterId } = req.body;
    const recipientId = req.userId;
    // Tạo quan hệ trong Neo4j
    await acceptFriendRequest(recipientId, requesterId._id); // Gọi hàm chấp nhận lời mời kết bạn trong Neo4j
    console.log("Accept friend request");

    // Cập nhật trạng thái lời mời kết bạn
    const friendship = await Friendship.findOneAndUpdate(
      { requester: requesterId, recipient: recipientId, status: "pending" },
      { status: "accepted" },
      { new: true }
    );

    if (!friendship) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    // const neo4jCreateFriendRef = await createRelationship(
    //   "User",
    //   requesterId,
    //   "User",
    //   recipientId,
    //   "FRIENDS_WITH"
    // );

    // 👇 Tạo notification thông báo cho người gửi
    const notification = new Notification({
      type: "friend_post", // hoặc bạn có thể tạo type riêng: "friend_accept"
      sender: recipientId, // người đã chấp nhận
      receiver: requesterId, // người gửi lời mời
      note: "Lời mời kết bạn của bạn đã được chấp nhận",
      linkClick: `/profile/${recipientId}`, // link đến profile người chấp nhận
    });

    await notification.save();

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
// DELETE /api/friends/reject
exports.rejectFriendRequest = async (req, res) => {
  try {
    const { requesterId } = req.body;
    const recipientId = req.userId;
    await rejectFriendRequest(recipientId, requesterId?._id); // Gọi hàm từ chối lời mời kết bạn trong Neo4j
    const friendship = await Friendship.findOneAndDelete({
      requester: requesterId,
      recipient: recipientId,
      status: "pending",
    });

    if (!friendship) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    res.status(200).json({ message: "Friend request rejected" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// DELETE /api/friends/remove
exports.removeFriend = async (req, res) => {
  try {
    const userId = req.userId;
    const { friendId } = req.body;
    await unfriend(userId, friendId); // Gọi hàm hủy kết bạn trong Neo4j
    const friendship = await Friendship.findOneAndDelete({
      $or: [
        { requester: userId, recipient: friendId, status: "accepted" },
        { requester: friendId, recipient: userId, status: "accepted" },
      ],
    });
    // const neo4jRemoveFriendRel = await neo4jService.deleteRelationship(
    //   "User",
    //   friendId,
    //   "User",
    //   userId,
    //   "FRIENDS_WITH"
    // );
    if (!friendship) {
      return res.status(404).json({ message: "Friendship not found" });
    }

    res.status(200).json({ message: "Friend removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
// GET /api/friends/list
exports.getFriendsList = async (req, res) => {
  try {
    const userId = req.userId; // ID của người dùng hiện tại từ middleware xác thực

    // Tìm kiếm tất cả các mối quan hệ bạn bè có trạng thái 'accepted' với userId
    const friendships = await Friendship.find({
      $or: [
        { requester: userId, status: "accepted" },
        { recipient: userId, status: "accepted" },
      ],
    });

    // Lấy danh sách ID của bạn bè
    const friendIds = friendships.map((friendship) =>
      friendship.requester.toString() === userId.toString()
        ? friendship.recipient
        : friendship.requester
    );

    // Truy vấn để lấy thông tin chi tiết của bạn bè
    const friends = await User.find({ _id: { $in: friendIds } }).select(
      "username email name avatar"
    );

    res.status(200).json(friends);
  } catch (error) {
    console.error("Error fetching friends list:", error); // Log lỗi chi tiết ra console
    res
      .status(500)
      .json({ message: "Server error", error: error.message || error });
  }
};

exports.getSentRequests = async (req, res) => {
  try {
    const userId = req.userId; // Lấy userId từ middleware xác thực

    // Tìm tất cả yêu cầu kết bạn mà user hiện tại đã gửi
    const sentRequests = await Friendship.find({
      recipient: userId,
    })
      .populate("recipient", "username email avatar")
      .populate("requester", "username email avatar"); // Populate thêm thông tin của recipient

    res.status(200).json(sentRequests);
  } catch (error) {
    console.error("Error fetching sent friend requests:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
