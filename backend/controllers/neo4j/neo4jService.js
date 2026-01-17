const neo4j = require("neo4j-driver");
const dotenv = require("dotenv");
dotenv.config();
//key
const NEO4J_URI =
  process.env.NEO4J_URI || "neo4j+s://cbda0561.databases.neo4j.io";

const NEO4J_USER = process.env.NEO4J_USER ;

const NEO4J_PASSWORD =
  process.env.NEO4J_PASSWORD ;

// Singleton pattern cho driver

let driver;

function getDriver() {
  if (!driver) {
    driver = neo4j.driver(
      NEO4J_URI,
      neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
      {
        maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
        disableLosslessIntegers: true,
      }
    );
  }
  return driver;
}

// Helper function để quản lý session
async function executeQuery(query, params = {}) {
  const session = getDriver().session();
  try {
    const result = await session.run(query, params);
    return result;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  } finally {
    await session.close();
  }
}
//téttt

// ========== ANALYTICS ==========

// Thống kê user
async function getUserStats(userId) {
  const query = `
    MATCH (u:User {id: $userId})
    OPTIONAL MATCH (u)-[:FRIENDS_WITH]-(friend)
    OPTIONAL MATCH (u)-[:FOLLOWS]->(following)
    OPTIONAL MATCH (u)<-[:FOLLOWS]-(follower)
    OPTIONAL MATCH (u)-[:POSTED]->(post)
    OPTIONAL MATCH (post)<-[:LIKED]-(liker)
    OPTIONAL MATCH (post)<-[:COMMENT_ON]-(comment)
    
    RETURN u.username as username,
           COUNT(DISTINCT friend) as friendsCount,
           COUNT(DISTINCT following) as followingCount,
           COUNT(DISTINCT follower) as followersCount,
           COUNT(DISTINCT post) as postsCount,
           COUNT(DISTINCT liker) as totalLikes,
           COUNT(DISTINCT comment) as totalComments
  `;

  const result = await executeQuery(query, { userId });
  return result.records[0]
    ? {
        username: result.records[0].get("username"),
        friendsCount: result.records[0].get("friendsCount"),
        followingCount: result.records[0].get("followingCount"),
        followersCount: result.records[0].get("followersCount"),
        postsCount: result.records[0].get("postsCount"),
        totalLikes: result.records[0].get("totalLikes"),
        totalComments: result.records[0].get("totalComments"),
      }
    : null;
}

// ========== SEARCH ==========

// Tìm kiếm user
async function searchUsers(searchTerm, limit = 10) {
  const query = `
    MATCH (u:User)
    WHERE u.username CONTAINS $searchTerm 
       OR u.fullName CONTAINS $searchTerm
       OR u.email CONTAINS $searchTerm
    RETURN u.id as id,
           u.username as username,
           u.fullName as fullName,
           u.avatar as avatar,
           u.followerCount as followerCount
    ORDER BY u.followerCount DESC
    LIMIT $limit
  `;

  const result = await executeQuery(query, { searchTerm, limit });
  return result.records.map((record) => ({
    id: record.get("id"),
    username: record.get("username"),
    fullName: record.get("fullName"),
    avatar: record.get("avatar"),
    followerCount: record.get("followerCount"),
  }));
}

// Tìm kiếm bài viết
async function searchPosts(searchTerm, limit = 20) {
  const query = `
    MATCH (u:User)-[:POSTED]->(p:Post)
    WHERE p.content CONTAINS $searchTerm
      AND p.privacy = 'public'
    RETURN p.id as postId,
           p.content as content,
           p.createdAt as createdAt,
           p.likeCount as likeCount,
           p.commentCount as commentCount,
           u.id as authorId,
           u.username as authorUsername,
           u.fullName as authorFullName,
           u.avatar as authorAvatar
    ORDER BY p.createdAt DESC
    LIMIT $limit
  `;

  const result = await executeQuery(query, { searchTerm, limit });
  return result.records.map((record) => ({
    postId: record.get("postId"),
    content: record.get("content"),
    createdAt: record.get("createdAt"),
    likeCount: record.get("likeCount"),
    commentCount: record.get("commentCount"),
    author: {
      id: record.get("authorId"),
      username: record.get("authorUsername"),
      fullName: record.get("authorFullName"),
      avatar: record.get("authorAvatar"),
    },
  }));
}

// ========== CLEANUP ==========

// Đóng kết nối
async function closeConnection() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

// Graceful shutdown
process.on("SIGINT", closeConnection);
process.on("SIGTERM", closeConnection);
module.exports = {
  // // Search
  searchUsers,
  searchPosts,

  // Utilities
  closeConnection,
  executeQuery, // Export for custom queries
};
