# TaskMaster

Ứng dụng quản lý công việc với kiến trúc microservices, sử dụng React cho frontend và Node.js cho backend.

## Cấu trúc dự án

```
project-root/
├── client/                     # Frontend (React + Vite)
│   ├── src/
│   │   ├── assets/            # Tài nguyên tĩnh
│   │   ├── components/        # Components tái sử dụng
│   │   ├── features/          # Các tính năng
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # API services
│   │   └── utils/             # Tiện ích
│   └── public/                # Files tĩnh
├── server/                     # Backend (Express.js + Node.js)
│   ├── src/
│   │   ├── api/               # API routes
│   │   ├── config/            # Cấu hình
│   │   ├── models/            # Database models
│   │   ├── services/          # Business logic
│   │   └── utils/             # Tiện ích
└── shared/                     # Shared code
```

## Yêu cầu hệ thống

- Node.js >= 18
- Docker và Docker Compose
- MongoDB
- Redis

## Cài đặt

1. Clone repository:
```bash
git clone <repository-url>
cd taskmaster
```

2. Tạo file môi trường:
```bash
cp .env.example .env
```

3. Chạy với Docker:
```bash
docker-compose up
```

Hoặc chạy riêng lẻ:

4. Cài đặt dependencies:
```bash
# Cài đặt dependencies cho client
cd client
npm install

# Cài đặt dependencies cho server
cd ../server
npm install
```

5. Chạy server:
```bash
cd server
npm run dev
```

6. Chạy client:
```bash
cd client
npm run dev
```

## Các tính năng chính

- Xác thực người dùng (JWT)
- Quản lý công việc
- Caching với Redis
- API RESTful
- Giao diện người dùng hiện đại
- Gửi email thông báo
- Upload file
- Rate limiting
- Logging với Winston

## Công nghệ sử dụng

### Frontend
- React 18
- Vite
- Redux Toolkit
- React Router
- Axios
- TailwindCSS

### Backend
- Node.js
- Express.js
- MongoDB
- Redis
- JWT Authentication
- Winston Logger
- Nodemailer

## API Endpoints

### Authentication
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/refresh-token
- POST /api/v1/auth/logout

### Tasks
- GET /api/v1/tasks
- POST /api/v1/tasks
- GET /api/v1/tasks/:id
- PUT /api/v1/tasks/:id
- DELETE /api/v1/tasks/:id

## License

MIT
