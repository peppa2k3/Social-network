const Post = require("../models/Post"); // Mô hình Post
const User = require("../models/User"); // Mô hình User
const moment = require("moment");
const Friendship = require("../models/Friendship"); // Adjust the path as necessary
const {
  createNotification,
  sendNotificationsToFriends,
} = require("./notification.controller");
const {
  createPost,
  likePost,
  unlikePost,
  createComment,
} = require("./neo4j/Neo4jPostController");
const { createAndEmitNotification } = require("../socketIO/socket");

// API Tạo Bài Viết
exports.createPost = async (req, res) => {
  try {
    const { content, location, video, visibility } = req.body;
    const userId = req.userId; // Lấy userId từ middleware xác thực

    // Kiểm tra nếu nội dung bài viết không có
    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    let imageUrl = null;
    let images = [];
    console.log("req.file", req.files);
    if (req.files) {
      // Kiểm tra nếu có file được tải lên
      // imageUrl = req.file.path || ""; // URL trả về từ Cloudinary qua multer
      // images = {
      //   url: imageUrl, // URL của hình ảnh hoặc video
      //   type: req.file.mimetype.startsWith("video") ? "video" : "image", // Kiểm tra loại file
      // };
      images = req.files.map((file) => ({
        url: file.path, // URL Cloudinary nếu dùng CloudinaryStorage
        type: file.mimetype.startsWith("video") ? "video" : "image",
      }));
    }
    // Tạo bài viết mới
    const newPost = new Post({
      userId,
      content,
      location: location || "", // Nếu không có location, để trống
      images: images, // Nếu không có hình ảnh, để mảng rỗng
      video,
      visibility: visibility || "public", // Mặc định là công khai nếu không có giá trị
    });
    //ko luu vao neo4j
    await createPost(newPost);
    // Lưu bài viết vào cơ sở dữ liệu
    await newPost.save();

    // Gửi thông báo cho bạn bè
    // await sendNotificationsToFriends(userId, newPost);

    res.status(201).json(newPost); // Trả về bài viết vừa tạo
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};
// API Sửa Bài Viết
// exports.editPost = async (req, res) => {
//   try {
//     const { postId, content, image, video, visibility } = req.body; // Lấy thông tin từ body yêu cầu
//     const userId = req.userId; // Lấy userId từ middleware xác thực

//     // Kiểm tra xem bài viết có tồn tại không
//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     // Kiểm tra xem người dùng có phải là người tạo bài viết không
//     if (post.userId.toString() !== userId.toString()) {
//       return res
//         .status(403)
//         .json({ message: "You can only edit your own posts" });
//     }
//     let images = [];
//     console.log("req.file", req.files);
//     if (req.files) {
//       // Kiểm tra nếu có file được tải lên
//       // imageUrl = req.file.path || ""; // URL trả về từ Cloudinary qua multer
//       // images = {
//       //   url: imageUrl, // URL của hình ảnh hoặc video
//       //   type: req.file.mimetype.startsWith("video") ? "video" : "image", // Kiểm tra loại file
//       // };
//       images = req.files.map((file) => ({
//         url: file.path, // URL Cloudinary nếu dùng CloudinaryStorage
//         type: file.mimetype.startsWith("video") ? "video" : "image",
//       }));
//     }
//     // Cập nhật bài viết với các trường mới
//     post.content = content || post.content; // Nếu không cung cấp, giữ nguyên giá trị cũ
//     post.video = video || post.video;
//     post.visibility = visibility || post.visibility;

//     let imageUrl = null;
//     if (req.file) {
//       // Kiểm tra nếu có file được tải lên
//       imageUrl = req.file.path; // URL trả về từ Cloudinary qua multer
//     }
//     post.image = imageUrl || post.video;
//     // Cập nhật thời gian sửa đổi
//     post.updatedAt = Date.now();

//     // Lưu bài viết đã sửa vào cơ sở dữ liệu
//     await post.save();

//     res.status(200).json(post); // Trả về bài viết đã sửa
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error", error });
//   }
// };
// API Sửa Bài Viết
exports.editPost = async (req, res) => {
  try {
    const { postId, content, location, video, visibility } = req.body; // Lấy thông tin từ body yêu cầu
    const userId = req.userId; // Lấy userId từ middleware xác thực

    // Kiểm tra xem bài viết có tồn tại không
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Kiểm tra xem người dùng có phải là người tạo bài viết không
    if (post.userId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You can only edit your own posts" });
    }

    // Xử lý images giống như trong createPost
    let images = [];
    console.log("req.files", req.files);
    if (req.files && req.files.length > 0) {
      // Kiểm tra nếu có file được tải lên
      images = req.files.map((file) => ({
        url: file.path, // URL Cloudinary nếu dùng CloudinaryStorage
        type: file.mimetype.startsWith("video") ? "video" : "image",
      }));
    } else {
      // Nếu không có file mới, giữ nguyên images cũ
      images = post.images;
    }

    // Cập nhật bài viết với các trường mới
    post.content = content || post.content; // Nếu không cung cấp, giữ nguyên giá trị cũ
    post.location = location || post.location; // Thêm location như trong createPost
    post.images = images; // Cập nhật images theo cấu trúc mới
    post.video = video || post.video;
    post.visibility = visibility || post.visibility;

    // Cập nhật thời gian sửa đổi
    post.updatedAt = Date.now();

    // Lưu bài viết đã sửa vào cơ sở dữ liệu
    await post.save();

    res.status(200).json(post); // Trả về bài viết đã sửa
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};
//getposstby id
exports.getPostById = async (req, res) => {
  try {
    const postId = req.params.id;

    const post = await Post.findById(postId)
      .populate("userId", "username avatar") // Populate user
      .populate("comments.userId", "username avatar") // Populate user trong comment
      .lean(); // Tối ưu performance nếu không cần document methods

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ message: "Server error" });
  }
};
//pold get post
exports.getUserPosts = async (req, res) => {
  try {
    const userId = req.userId; // Lấy userId từ middleware xác thực

    // Lấy danh sách bạn bè của người dùng
    const friendships = await Friendship.find({
      $or: [
        { requester: userId, status: "accepted" },
        { recipient: userId, status: "accepted" },
      ],
    });

    const friendIds = friendships.map((friendship) =>
      friendship.requester.toString() === userId
        ? friendship.recipient
        : friendship.requester
    );

    // Lấy danh sách bài viết của người dùng với điều kiện visibility
    const posts = await Post.find({
      $or: [
        { userId: userId, visibility: "private" }, // Bài viết riêng tư của người dùng
        { visibility: "public" }, // Bài viết công khai
        { userId: userId, visibility: "friends" }, // Bài viết bạn bè của người dùng
        { userId: { $in: friendIds }, visibility: "friends" }, // Bài viết bạn bè của bạn bè
      ],
    })
      .populate("userId")
      .populate("comments.userId", "avatar username") // Lấy thông tin người đăng bài viết
      .sort({ createdAt: -1 }); // Sắp xếp bài viết theo thời gian (mới nhất trước)

    // Định dạng thời gian "cách đây bao lâu" cho từng bài viết và từng bình luận
    const formattedPosts = posts.map((post) => ({
      ...post.toObject(), // Chuyển đổi tài liệu Mongoose sang đối tượng JS thuần túy
      createdAt: moment(post.createdAt).fromNow(),
      comments: post.comments.map((comment) => ({
        ...comment.toObject(),
        createdAt: moment(comment.createdAt).fromNow(),
      })),
    }));

    res.status(200).json(formattedPosts); // Trả về danh sách bài viết
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};
//new get post
// exports.getUserPosts = async (req, res) => {
//   try {
//     const userId = req.userId;
//     console.log("userId", userId);
//     // Lấy phân trang từ query hoặc dùng mặc định
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 5;
//     const skip = (page - 1) * limit;

//     // Lấy danh sách bạn bè
//     const friendships = await Friendship.find({
//       $or: [
//         { requester: userId, status: "accepted" },
//         { recipient: userId, status: "accepted" },
//       ],
//     });

//     const friendIds = friendships.map((friendship) =>
//       friendship.requester.toString() === userId
//         ? friendship.recipient
//         : friendship.requester
//     );

//     // Điều kiện lọc bài viết theo quyền xem
//     const postFilter = {
//       $or: [
//         { userId: userId, visibility: "private" },
//         { visibility: "public" },
//         { userId: userId, visibility: "friends" },
//         { userId: { $in: friendIds }, visibility: "friends" },
//       ],
//     };

//     // Tổng số bài viết (để client tính tổng trang nếu cần)
//     const totalPosts = await Post.countDocuments(postFilter);

//     // Lấy bài viết phân trang
//     const posts = await Post.find(postFilter)
//       .populate("userId", "username avatar")
//       .populate("comments.userId", "avatar username")
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit);

//     const formattedPosts = posts.map((post) => ({
//       ...post.toObject(),
//       createdAt: moment(post.createdAt).fromNow(),
//       comments: post.comments.map((comment) => ({
//         ...comment.toObject(),
//         createdAt: moment(comment.createdAt).fromNow(),
//       })),
//     }));

//     res.status(200).json({
//       posts: formattedPosts,
//       page,
//       limit,
//       totalPosts,
//       totalPages: Math.ceil(totalPosts / limit),
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error", error });
//   }
// };
// API Like Bài Viết
exports.likePost = async (req, res) => {
  try {
    const { postId } = req.body; // Lấy postId từ yêu cầu
    const userId = req.userId; // Lấy userId từ middleware xác thực

    // Kiểm tra xem bài viết có tồn tại không
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Kiểm tra xem người dùng đã like bài viết chưa
    if (post.likes.includes(userId)) {
      return res.status(400).json({ message: "You already liked this post" });
    }
    // Gọi hàm likePost từ neo4jServices
    await likePost(userId, postId);
    // Thêm like vào bài viết
    post.likes.push(userId);
    await post.save();

    // Tạo thông báo cho người tạo bài viết
    //const user = await User.findById(userId).select("username"); // Lấy trường 'name' của người dùng

    // Tạo notification nếu user like không phải là chủ post mongodb
    if (post.userId._id.toString() !== userId.toString()) {
      const liker = await User.findById(userId).select("username avatar");

      await createNotification({
        userId: post.userId._id, // Người nhận noti
        type: "like_post",
        sender: {
          id: liker._id,
          username: liker.username,
          avatar: liker.avatar,
        },
        messageNote: `${liker.username} đã thích bài viết của bạn.`,
        linkClick: `/post/${post._id}`,
        postId,
      });
    }
    //reltiome notifi likeposst
    const emailOwnerPost = await User.findById(post.userId);
    await createAndEmitNotification({
      email: emailOwnerPost.email,
      payload: "liked post",
    });
    res.status(201).json({ message: "Post liked successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};
// API Bỏ Thích Bài Viết
exports.unlikePost = async (req, res) => {
  try {
    const { postId } = req.body; // Lấy postId từ body yêu cầu
    const userId = req.userId; // Lấy userId từ middleware xác thực

    // Kiểm tra xem bài viết có tồn tại không
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Kiểm tra xem người dùng đã thích bài viết hay chưa
    if (!post.likes.includes(userId)) {
      return res.status(400).json({ message: "You have not liked this post" });
    }

    // Loại bỏ người dùng khỏi mảng likes
    post.likes = post.likes.filter(
      (like) => like.toString() !== userId.toString()
    );

    await unlikePost(userId, postId); // Gọi hàm unlikePost từ neo4jServices
    // Lưu bài viết sau khi bỏ thích
    await post.save();

    res.status(200).json({ message: "Post unliked successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};
// API Bình Luận Bài Viết
exports.commentPost = async (req, res) => {
  try {
    const { postId, comment } = req.body; // Lấy postId và nội dung comment từ body yêu cầu
    const userId = req.userId; // Lấy userId từ middleware xác thực

    // Kiểm tra xem bài viết có tồn tại không
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Tạo bình luận mới
    const newComment = {
      userId,
      comment,
      createdAt: new Date(),
    };

    // Thêm bình luận vào bài viết
    post.comments.push(newComment);
    await post.save(); // Lưu bài viết với bình luận mới
    // Lấy comment vừa thêm (cuối mảng)
    const createdComment = post.comments[post.comments.length - 1];
    // Gọi hàm createComment từ neo4jServices
    await createComment(userId, postId, createdComment);
    // Tạo thông báo cho người tạo bài viết
    const emailOwnerPost = await User.findById(post.userId);
    //  console.log(emailOwnerPost);
    // Tạo notification nếu user like không phải là chủ post mongodb  enum: ["friend_request", "like_post", "comment_post", "friend_post"],
    if (post.userId._id.toString() !== userId.toString()) {
      const liker = await User.findById(userId).select("username avatar");

      await createNotification({
        userId: post.userId._id, // Người nhận noti
        type: "comment_post",
        sender: {
          id: liker._id,
          username: liker.username,
          avatar: liker.avatar,
        },
        messageNote: `${liker.username} đã bình luận bài viết của bạn.`,
        linkClick: `/post/${post._id}`,
        postId,
      });
    }
    await createAndEmitNotification({
      email: emailOwnerPost.email,
      payload: "commented post",
    });
    // Tạo thông báo cho người tạo bài viết
    // const user = await User.findById(userId).select("username"); // Lấy trường 'name' của người dùng
    // if (post.userId._id.toString() !== userId.toString()) {
    //   await createNotification({
    //     userId: post.userId._id,
    //     type: "comment",
    //     message: `${user.userName} đã bình luận bài viết của bạn.`,
    //     postId,
    //   });
    // }

    const formattedComment = {
      ...newComment,
      createdAt: moment(newComment.createdAt).fromNow(),
    };

    res.status(201).json(formattedComment); // Trả về bình luận với thời gian "cách đây bao lâu"
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// API Xóa Bình Luận
exports.deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.body; // Lấy postId và commentId từ body yêu cầu
    const userId = req.userId; // Lấy userId từ middleware xác thực

    // Kiểm tra xem bài viết có tồn tại không
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Kiểm tra xem bình luận có tồn tại không
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Kiểm tra xem người dùng có phải là người tạo bình luận không
    if (comment.userId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You can only delete your own comments" });
    }

    // Xóa bình luận khỏi bài viết
    post.comments.pull(commentId);

    // Lưu bài viết sau khi xóa bình luận
    await post.save();

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// API Sửa Bình Luận
exports.editComment = async (req, res) => {
  try {
    const { postId, commentId, comment } = req.body; // Lấy thông tin từ body yêu cầu
    const userId = req.userId; // Lấy userId từ middleware xác thực

    // Kiểm tra xem bài viết có tồn tại không
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Kiểm tra xem bình luận có tồn tại không
    const existingComment = post.comments.id(commentId);
    if (!existingComment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Kiểm tra xem người dùng có phải là người tạo bình luận không
    if (existingComment.userId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You can only edit your own comments" });
    }

    // Cập nhật nội dung bình luận
    existingComment.comment = comment || existingComment.comment;
    existingComment.updatedAt = Date.now();

    // Lưu bài viết sau khi sửa bình luận
    await post.save();

    res.status(200).json(existingComment); // Trả về bình luận đã sửa
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};
