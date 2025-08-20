# 🌐 Hướng Dẫn Chạy Website Du Lịch

Dự án bao gồm 3 phần chính:

- **Frontend** (React)
- **Backend** (Node.js / Express)
- **Recommend System** (Flask + MongoDB + Machine Learning)

## 📰 Tính Năng Newsfeed

![Ảnh tổng quan](./images/Newsfeed.png)

---

## 🖥️ Frontend (React)

### 📌 Bước 1: Di chuyển vào thư mục `frontend`

```bash
cd frontend
```

### Bước 2: Cài đặt thư viện

```bash
npm install
``` 
### Bước 3: Chạy ứng dụng
```bash
npm run dev
```

Ứng dụng sẽ chạy tại địa chỉ: http://localhost:5173

## 🔧 Backend (Node.js + Express)

### Bước 1: Di chuyển vào thư mục backend
```bash
cd backend
```


### Bước 2: Cài đặt thư viện
```bash
npm install
```
Chuẩn bị MongoDB tạo database name my-social-network
![alt text](image.png)

### Bước 3: Chạy server
```bash
npm run dev
```
Server backend mặc định chạy tại: http://localhost:4000 (tùy theo cấu hình)

## 🤖 Hệ Thống Gợi Ý (Flask + MongoDB)

### Bước 1: Di chuyển vào thư mục hệ thống gợi ý
```bash
cd ./Recommend
```
### Bước 2: Cài đặt thư viện Python
```bash
pip install flask pymongo scikit-learn flask-cors
```
### Bước 3: Chạy ứng dụng Flask
```bash
python app.py
```
# Flask app sẽ chạy tại: http://localhost:5001 (tùy theo cài đặt trong app3.py)

⚠️ Yêu Cầu Hệ Thống
Node.js >= 16.x

Python >= 3.8

MongoDB đang chạy local hoặc trên cloud (ví dụ MongoDB Atlas)

Các port mặc định chưa bị ứng dụng khác chiếm dụng
