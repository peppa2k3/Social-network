Thư viện

#1

- MUI
  npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
- React Swipeable (để vuốt đổi video)
npm i react-swipeable
-socket and simple peare
npm install socket.io-client simple-peer
<!--  nếu Lỗi "Uncaught ReferenceError: global is not defined" xảy ra khi sử dụng Simple-Peer trong React vì phiên bản Webpack 5 đã loại bỏ global, thêm global vào vite.config

./apiconfig.js
MONGO_URI="mongodb://localhost:27017?authSource=admin"
PORT=3000
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=vie_social_secret_2026
NEO4J_URI=bolt://localhost:7687

# bolt://neo4j:7687

NEO4J_USER=neo4j
NEO4J_PASSWORD=password123
-->
